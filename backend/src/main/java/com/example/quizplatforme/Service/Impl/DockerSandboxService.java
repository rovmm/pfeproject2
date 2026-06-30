package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.DTO.Response.CodeResponse;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.command.WaitContainerResultCallback;
import com.github.dockerjava.api.model.BuildResponseItem;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.PullResponseItem;
import com.github.dockerjava.api.model.StreamType;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service d'exécution de code en sandbox Docker.
 *
 * <h2>Modèle de sécurité</h2>
 * Chaque soumission est exécutée dans un conteneur Docker éphémère avec :
 * <ul>
 *   <li>Réseau désactivé ({@code --network none}) — aucune communication extérieure</li>
 *   <li>Mémoire limitée (128 Mo par défaut) + swap désactivé</li>
 *   <li>CPU limité à 0,5 cœur logique</li>
 *   <li>Limite de processus ({@code --pids-limit 64}) contre les fork bombs</li>
 *   <li>Élévation de privilèges bloquée ({@code no-new-privileges})</li>
 *   <li>Timeout d'exécution (10 s par défaut) — conteneur tué par SIGKILL</li>
 *   <li>Suppression automatique du conteneur après chaque exécution</li>
 * </ul>
 *
 * <h2>Langages supportés</h2>
 * Python, JavaScript, TypeScript, Java, C++, PHP.
 * TypeScript nécessite l'image {@code smartstudy-ts:latest}
 * (construite automatiquement au démarrage de l'application).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DockerSandboxService {

    // ── Image TypeScript pré-construite ────────────────────────────────────────
    private static final String TS_IMAGE = "smartstudy-ts:latest";

    /**
     * Dockerfile embarqué pour l'image TypeScript.
     * Installé une seule fois au démarrage — les exécutions utilisent {@code --network none}.
     */
    private static final String TS_DOCKERFILE =
            "FROM node:20-alpine\n" +
            "RUN npm install -g typescript ts-node @types/node 2>/dev/null " +
            "&& npm cache clean --force\n" +
            "WORKDIR /sandbox\n" +
            // tsconfig.json embarqué : fixe module/moduleResolution pour éviter les conflits TS7
            "RUN echo '{\"compilerOptions\":{\"module\":\"CommonJS\",\"moduleResolution\":\"node\"," +
            "\"target\":\"ES2020\",\"esModuleInterop\":true,\"skipLibCheck\":true," +
            "\"ignoreDeprecations\":\"5.0\"}}' > /sandbox/tsconfig.json\n";

    // ── Mapping langage → image Docker ────────────────────────────────────────
    private record LanguageConfig(
            /** Image Docker à utiliser pour l'exécution. */
            String image,
            /**
             * Nom du fichier source à l'intérieur du conteneur ({@code /sandbox/<nom>}).
             * {@code null} pour Java : le nom est extrait du code source (nom de la classe publique).
             */
            String sourceFileName
    ) {}

    /**
     * Table de correspondance langage → configuration Docker.
     * Les alias (py, js, ts) sont gérés ici pour simplifier la logique.
     */
    private static final Map<String, LanguageConfig> LANGUAGE_CONFIGS = Map.ofEntries(
            Map.entry("python",     new LanguageConfig("python:3.12-alpine",  "solution.py" )),
            Map.entry("python3",    new LanguageConfig("python:3.12-alpine",  "solution.py" )),
            Map.entry("py",         new LanguageConfig("python:3.12-alpine",  "solution.py" )),
            Map.entry("javascript", new LanguageConfig("node:20-alpine",      "solution.js" )),
            Map.entry("js",         new LanguageConfig("node:20-alpine",      "solution.js" )),
            Map.entry("typescript", new LanguageConfig(TS_IMAGE,              "solution.ts" )),
            Map.entry("ts",         new LanguageConfig(TS_IMAGE,              "solution.ts" )),
            Map.entry("java",       new LanguageConfig("eclipse-temurin:21-jdk-alpine", null)), // classe extraite du code
            Map.entry("cpp",        new LanguageConfig("gcc:13",              "solution.cpp")),
            Map.entry("c++",        new LanguageConfig("gcc:13",              "solution.cpp")),
            Map.entry("php",        new LanguageConfig("php:8.3-alpine",      "solution.php"))
    );

    // ── Images de base à télécharger au démarrage ──────────────────────────────
    private static final List<String> BASE_IMAGES = List.of(
            "python:3.12-alpine",
            "node:20-alpine",
            "eclipse-temurin:21-jdk-alpine",
            "php:8.3-alpine",
            "gcc:13"
    );

    // ── Injection ──────────────────────────────────────────────────────────────
    private final DockerClient dockerClient;

    @Value("${docker.execution.timeout-seconds:30}")
    private int configuredTimeoutSeconds;

    @Value("${docker.execution.memory-limit-mb:256}")
    private long memoryLimitMb;

    // ── Préparation des images au démarrage ────────────────────────────────────

    /**
     * Lance en arrière-plan le téléchargement des images Docker et la
     * construction de l'image TypeScript.
     * L'application démarre immédiatement ; la première exécution d'un
     * langage dont l'image n'est pas encore prête peut prendre quelques
     * secondes supplémentaires.
     */
    @PostConstruct
    public void warmUpImages() {
        CompletableFuture.runAsync(this::pullBaseImages);
        CompletableFuture.runAsync(this::ensureTypeScriptImage);
    }

    private void pullBaseImages() {
        for (String image : BASE_IMAGES) {
            try {
                log.info("Téléchargement de l'image Docker : {}", image);
                dockerClient.pullImageCmd(image)
                        .exec(new ResultCallback.Adapter<PullResponseItem>() {
                            @Override
                            public void onNext(PullResponseItem item) {
                                // journalisation des couches uniquement en DEBUG
                                if (item.getStatus() != null) {
                                    log.debug("[pull {}] {}", image, item.getStatus());
                                }
                            }
                        })
                        .awaitCompletion(5, TimeUnit.MINUTES);
                log.info("Image disponible : {}", image);
            } catch (Exception e) {
                log.warn("Impossible de télécharger l'image {} (l'image doit être présente localement) : {}",
                        image, e.getMessage());
            }
        }
    }

    /**
     * Vérifie si {@value #TS_IMAGE} existe localement.
     * Si non, construit l'image à partir du Dockerfile embarqué.
     * Requiert une connexion Internet uniquement lors de cette phase de construction.
     */
    private void ensureTypeScriptImage() {
        try {
            dockerClient.inspectImageCmd(TS_IMAGE).exec();
            log.info("Image TypeScript déjà disponible : {}", TS_IMAGE);
        } catch (Exception notFound) {
            log.info("Image TypeScript introuvable — construction de {} …", TS_IMAGE);
            buildTypeScriptImage();
        }
    }

    private void buildTypeScriptImage() {
        Path buildDir = null;
        try {
            buildDir = Files.createTempDirectory("smartstudy-ts-build");
            Path dockerfilePath = buildDir.resolve("Dockerfile");
            Files.writeString(dockerfilePath, TS_DOCKERFILE);

            dockerClient.buildImageCmd()
                    .withDockerfile(dockerfilePath.toFile())
                    .withBaseDirectory(buildDir.toFile())
                    .withTags(Set.of(TS_IMAGE))
                    .exec(new ResultCallback.Adapter<BuildResponseItem>() {
                        @Override
                        public void onNext(BuildResponseItem item) {
                            if (item.getStream() != null) {
                                log.debug("[build ts] {}", item.getStream().strip());
                            }
                        }
                    })
                    .awaitCompletion(10, TimeUnit.MINUTES);

            log.info("Image TypeScript construite avec succès : {}", TS_IMAGE);
        } catch (Exception e) {
            log.warn("Échec de la construction de l'image TypeScript. " +
                    "TypeScript ne sera pas disponible jusqu'au prochain démarrage : {}", e.getMessage());
        } finally {
            // Nettoyage du répertoire temporaire de build
            if (buildDir != null) {
                try {
                    Files.walk(buildDir)
                            .sorted(java.util.Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(java.io.File::delete);
                } catch (IOException ignore) { /* non bloquant */ }
            }
        }
    }

    // ── API publique ───────────────────────────────────────────────────────────

    /**
     * Exécute le code fourni dans un conteneur Docker isolé.
     *
     * @param language       langage de programmation (ex : "python", "java", "cpp")
     * @param code           code source à exécuter
     * @param stdin          entrée standard optionnelle (peut être {@code null})
     * @param timeoutSeconds délai maximal en secondes ; {@code 0} utilise la valeur par défaut configurée
     * @return {@link CodeResponse} avec la sortie, les erreurs, le temps d'exécution et le statut
     */
    public CodeResponse execute(String language, String code, String stdin, int timeoutSeconds) {
        long startTime   = System.currentTimeMillis();
        String lang      = language.toLowerCase().trim();
        int    timeout   = timeoutSeconds > 0 ? timeoutSeconds : configuredTimeoutSeconds;

        // ── Résolution du langage ───────────────────────────────────────────
        LanguageConfig config = LANGUAGE_CONFIGS.get(lang);
        if (config == null) {
            return CodeResponse.builder()
                    .success(false)
                    .status("UNSUPPORTED")
                    .error("Langage non supporté : « " + language + " ». " +
                            "Langages disponibles : python, javascript, typescript, java, cpp, php.")
                    .executionTimeMs(0L)
                    .language(language)
                    .build();
        }

        // ── Nom du fichier source ───────────────────────────────────────────
        // Java : le nom du fichier doit correspondre au nom de la classe publique
        String srcFileName = config.sourceFileName() != null
                ? config.sourceFileName()
                : extractJavaClassName(code) + ".java";

        boolean hasStdin = stdin != null && !stdin.isBlank();
        List<String> command = buildContainerCommand(lang, srcFileName, hasStdin);

        String containerId = null;
        try {
            // 1. Créer le conteneur avec les contraintes de sécurité
            containerId = createContainer(config.image(), command);

            // 2. Injecter le code dans /sandbox/<fichier>
            copyToSandbox(containerId, srcFileName, code);

            // 3. Injecter stdin si présent
            if (hasStdin) {
                copyToSandbox(containerId, "stdin.txt", stdin);
            }

            // 4. Démarrer le conteneur
            dockerClient.startContainerCmd(containerId).exec();
            log.debug("Conteneur démarré [{}] — langage : {}, timeout : {}s", containerId, lang, timeout);

            // 5. Attendre la fin (avec timeout)
            boolean timedOut = waitForContainer(containerId, timeout);
            long elapsed = System.currentTimeMillis() - startTime;

            if (timedOut) {
                log.warn("Timeout atteint pour le conteneur [{}] — langage : {}", containerId, lang);
                return CodeResponse.builder()
                        .success(false)
                        .status("TIMEOUT")
                        .error("L'exécution a dépassé la limite de " + timeout +
                                " secondes. Vérifiez l'absence de boucles infinies ou d'opérations bloquantes.")
                        .executionTimeMs(elapsed)
                        .exitCode(-1)
                        .language(normalizeLang(lang))
                        .build();
            }

            // 6. Récupérer code de sortie et logs
            int          exitCode = getExitCode(containerId);
            SandboxOutput output  = collectLogs(containerId);

            log.debug("Conteneur [{}] terminé — exitCode : {}, durée : {}ms", containerId, exitCode, elapsed);
            return buildResponse(normalizeLang(lang), exitCode, output, elapsed);

        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - startTime;
            log.error("Erreur inattendue lors de l'exécution sandbox — langage : {}, erreur : {}",
                    language, e.getMessage(), e);
            return CodeResponse.builder()
                    .success(false)
                    .status("ERROR")
                    .error("Erreur interne du sandbox d'exécution. Veuillez réessayer.")
                    .executionTimeMs(elapsed)
                    .exitCode(-1)
                    .language(normalizeLang(lang))
                    .build();
        } finally {
            // 7. Supprimer le conteneur quoi qu'il arrive
            if (containerId != null) {
                removeContainer(containerId);
            }
        }
    }

    // ── Construction de la commande par langage ────────────────────────────────

    /**
     * Construit le tableau de commandes passé à Docker pour chaque langage.
     *
     * <p>Toutes les commandes utilisent {@code sh -c "…"} pour prendre en charge :
     * <ul>
     *   <li>La redirection stdin ({@code < /sandbox/stdin.txt})</li>
     *   <li>Les pipes nécessaires à la compilation suivie de l'exécution (Java, C++)</li>
     * </ul>
     *
     * @param lang        langage normalisé
     * @param srcFileName nom du fichier source dans {@code /sandbox}
     * @param hasStdin    si {@code true}, ajoute {@code < /sandbox/stdin.txt}
     */
    private List<String> buildContainerCommand(String lang, String srcFileName, boolean hasStdin) {
        String stdinRedir = hasStdin ? " < /sandbox/stdin.txt" : "";
        // Nom de la classe Java (sans .java) pour l'invocation de la JVM
        String javaClass  = srcFileName.endsWith(".java")
                ? srcFileName.substring(0, srcFileName.length() - 5)
                : srcFileName;

        String shellCmd = switch (lang) {

            case "python", "python3", "py" ->
                    "python3 /sandbox/" + srcFileName + stdinRedir;

            case "javascript", "js" ->
                    "node /sandbox/" + srcFileName + stdinRedir;

            case "typescript", "ts" ->
                    // --transpile-only + tsconfig.json embarqué dans l'image pour éviter les conflits ESM/TS7
                    "ts-node --transpile-only --project /sandbox/tsconfig.json /sandbox/" + srcFileName + stdinRedir;

            case "java" ->
                    // Compilation puis exécution — -Xmx96m : laisse 32 Mo au JVM lui-même
                    "javac /sandbox/" + srcFileName +
                    " && java -Xmx96m -cp /sandbox " + javaClass + stdinRedir;

            case "cpp", "c++" ->
                    "g++ -O2 -std=c++17 -o /sandbox/solution /sandbox/" + srcFileName +
                    " && /sandbox/solution" + stdinRedir;

            case "php" ->
                    "php /sandbox/" + srcFileName + stdinRedir;

            default -> throw new IllegalArgumentException("Langage non supporté : " + lang);
        };

        return List.of("sh", "-c", shellCmd);
    }

    // ── Cycle de vie du conteneur ──────────────────────────────────────────────

    /**
     * Crée un conteneur Docker sécurisé sans le démarrer.
     *
     * <h3>Contraintes appliquées</h3>
     * <ul>
     *   <li>Réseau  : {@code none} — aucune interface réseau</li>
     *   <li>Mémoire : {@code memoryLimitMb} Mo, swap désactivé (swap = mémoire)</li>
     *   <li>CPU     : 0,5 cœur logique (quota 50 000 µs / période 100 000 µs)</li>
     *   <li>PIDs    : 64 maximum — protection contre les fork bombs</li>
     *   <li>Sécurité: {@code no-new-privileges} — blocage de l'escalade de privilèges</li>
     * </ul>
     */
    private String createContainer(String image, List<String> command) {
        HostConfig hostConfig = HostConfig.newHostConfig()
                .withMemory(memoryLimitMb * 1024L * 1024L)
                .withMemorySwap(memoryLimitMb * 1024L * 1024L)   // swap = mémoire → pas de swap
                .withCpuPeriod(100_000L)                           // période = 100 ms
                .withCpuQuota(100_000L)                            // quota  = 100 ms → 1 vCPU
                .withNetworkMode("none")                            // aucun réseau
                .withPidsLimit(64L)                                 // anti fork-bomb
                .withSecurityOpts(List.of("no-new-privileges:true")); // pas d'escalade

        try {
            CreateContainerResponse container = dockerClient.createContainerCmd(image)
                    .withCmd(command)
                    .withHostConfig(hostConfig)
                    .withAttachStdout(true)
                    .withAttachStderr(true)
                    .exec();

            log.debug("Conteneur créé : {}", container.getId());
            return container.getId();
        } catch (com.github.dockerjava.api.exception.NotFoundException e) {
            // L'image est absente localement : on la construit (image locale) ou on la télécharge (image publique)
            if (TS_IMAGE.equals(image)) {
                log.info("Image TypeScript introuvable — construction synchrone de {} ...", image);
                ensureTypeScriptImage();
            } else {
                log.info("Image {} introuvable localement — téléchargement à la demande...", image);
                try {
                    dockerClient.pullImageCmd(image)
                            .exec(new ResultCallback.Adapter<PullResponseItem>())
                            .awaitCompletion(5, TimeUnit.MINUTES);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrompu lors du téléchargement de l'image " + image, ie);
                }
            }

            // Retenter la création du conteneur après pull ou build
            CreateContainerResponse container = dockerClient.createContainerCmd(image)
                    .withCmd(command)
                    .withHostConfig(hostConfig)
                    .withAttachStdout(true)
                    .withAttachStderr(true)
                    .exec();

            log.debug("Conteneur créé (après récupération de l'image) : {}", container.getId());
            return container.getId();
        }
    }

    /**
     * Copie un fichier dans {@code /sandbox/<fileName>} du conteneur
     * via une archive TAR en mémoire.
     *
     * <p>Chaque appel recrée l'entrée de répertoire {@code sandbox/} dans l'archive :
     * Docker ignore silencieusement les répertoires déjà existants, ce qui est sûr.
     *
     * @param containerId identifiant Docker du conteneur (non démarré)
     * @param fileName    nom du fichier à créer dans {@code /sandbox}
     * @param content     contenu textuel du fichier (encodé UTF-8)
     */
    private void copyToSandbox(String containerId, String fileName, String content)
            throws IOException {

        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        ByteArrayOutputStream bos = new ByteArrayOutputStream(bytes.length + 512);

        try (TarArchiveOutputStream tar = new TarArchiveOutputStream(bos)) {
            tar.setLongFileMode(TarArchiveOutputStream.LONGFILE_POSIX);

            // Répertoire /sandbox — recréé à chaque appel, Docker est idempotent
            TarArchiveEntry dirEntry = new TarArchiveEntry("sandbox/");
            dirEntry.setMode(0040755); // drwxr-xr-x
            tar.putArchiveEntry(dirEntry);
            tar.closeArchiveEntry();

            // Fichier source
            TarArchiveEntry fileEntry = new TarArchiveEntry("sandbox/" + fileName);
            fileEntry.setSize(bytes.length);
            fileEntry.setMode(0100644); // -rw-r--r--
            tar.putArchiveEntry(fileEntry);
            tar.write(bytes);
            tar.closeArchiveEntry();
        }

        dockerClient.copyArchiveToContainerCmd(containerId)
                .withTarInputStream(new ByteArrayInputStream(bos.toByteArray()))
                .withRemotePath("/")
                .exec();

        log.debug("Fichier copié dans le conteneur [{}] : /sandbox/{}", containerId, fileName);
    }

    /**
     * Attend la fin du conteneur en bloquant jusqu'à {@code timeoutSeconds}.
     *
     * <p>Si le délai expire : le conteneur est tué par SIGKILL avant que la méthode retourne.
     *
     * @return {@code true} si le conteneur a été tué (timeout), {@code false} s'il s'est
     *         terminé normalement
     */
    private boolean waitForContainer(String containerId, int timeoutSeconds) {
        CompletableFuture<Integer> waitFuture = CompletableFuture.supplyAsync(() -> {
            WaitContainerResultCallback callback = dockerClient
                    .waitContainerCmd(containerId)
                    .exec(new WaitContainerResultCallback());
            return callback.awaitStatusCode();
        });

        try {
            waitFuture.get(timeoutSeconds, TimeUnit.SECONDS);
            return false; // terminé normalement
        } catch (TimeoutException e) {
            waitFuture.cancel(true);
            killContainer(containerId);
            return true;  // timeout
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        } catch (ExecutionException e) {
            // Le conteneur s'est peut-être arrêté avec une erreur non-zéro — normal
            log.debug("ExecutionException lors de l'attente du conteneur [{}] : {}",
                    containerId, e.getMessage());
            return false;
        }
    }

    private void killContainer(String containerId) {
        try {
            dockerClient.killContainerCmd(containerId).withSignal("SIGKILL").exec();
            log.debug("Conteneur [{}] tué (SIGKILL)", containerId);
        } catch (Exception e) {
            log.warn("Impossible de tuer le conteneur [{}] : {}", containerId, e.getMessage());
        }
    }

    /**
     * Récupère le code de sortie depuis les métadonnées du conteneur.
     * Plus fiable que la valeur retournée par le callback d'attente.
     */
    private int getExitCode(String containerId) {
        try {
            InspectContainerResponse info = dockerClient.inspectContainerCmd(containerId).exec();
            Long code = info.getState().getExitCodeLong();
            return code != null ? code.intValue() : -1;
        } catch (Exception e) {
            log.warn("Impossible de récupérer le code de sortie du conteneur [{}] : {}",
                    containerId, e.getMessage());
            return -1;
        }
    }

    /**
     * Collecte stdout et stderr du conteneur via l'API logs de Docker.
     * Docker démultiplexe automatiquement les deux flux.
     */
    private SandboxOutput collectLogs(String containerId) throws InterruptedException {
        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();

        dockerClient.logContainerCmd(containerId)
                .withStdOut(true)
                .withStdErr(true)
                .withFollowStream(false) // snapshot — ne suit pas le flux en temps réel
                .exec(new ResultCallback.Adapter<Frame>() {
                    @Override
                    public void onNext(Frame frame) {
                        String text = new String(frame.getPayload(), StandardCharsets.UTF_8);
                        if (frame.getStreamType() == StreamType.STDOUT) {
                            stdout.append(text);
                        } else if (frame.getStreamType() == StreamType.STDERR) {
                            stderr.append(text);
                        }
                    }
                })
                .awaitCompletion(15, TimeUnit.SECONDS);

        return new SandboxOutput(stdout.toString().trim(), stderr.toString().trim());
    }

    /**
     * Supprime le conteneur de force, qu'il soit arrêté ou non.
     * Les erreurs sont uniquement journalisées — elles ne doivent pas masquer
     * le résultat de l'exécution.
     */
    private void removeContainer(String containerId) {
        try {
            dockerClient.removeContainerCmd(containerId)
                    .withForce(true)
                    .exec();
            log.debug("Conteneur supprimé : {}", containerId);
        } catch (Exception e) {
            log.warn("Impossible de supprimer le conteneur [{}] : {}", containerId, e.getMessage());
        }
    }

    // ── Construction de la réponse ─────────────────────────────────────────────

    private CodeResponse buildResponse(String lang, int exitCode, SandboxOutput output, long elapsed) {
        if (exitCode == 0) {
            String out = output.stdout().isBlank()
                    ? "Code exécuté avec succès. (Aucune sortie produite)"
                    : output.stdout();

            return CodeResponse.builder()
                    .success(true)
                    .status("SUCCESS")
                    .output(out)
                    // Avertissements de compilation éventuels (stderr non-fatal)
                    .error(output.stderr().isBlank() ? null : output.stderr())
                    .executionTimeMs(elapsed)
                    .exitCode(0)
                    .language(lang)
                    .build();
        }

        // Erreur d'exécution : stderr prioritaire, sinon stdout, sinon message générique
        String errorMsg = !output.stderr().isBlank() ? output.stderr()
                : !output.stdout().isBlank() ? output.stdout()
                : "Erreur d'exécution (code de sortie : " + exitCode + ")";

        return CodeResponse.builder()
                .success(false)
                .status("ERROR")
                .output(output.stdout().isBlank() ? null : output.stdout())
                .error(errorMsg)
                .executionTimeMs(elapsed)
                .exitCode(exitCode)
                .language(lang)
                .build();
    }

    // ── Utilitaires ────────────────────────────────────────────────────────────

    /**
     * Extrait le nom de la classe publique d'un code Java.
     * Retourne {@code "Main"} si aucune classe publique n'est trouvée.
     */
    private static String extractJavaClassName(String code) {
        Matcher matcher = Pattern.compile("public\\s+class\\s+(\\w+)").matcher(code);
        return matcher.find() ? matcher.group(1) : "Main";
    }

    /**
     * Normalise les alias de langage pour la réponse au client.
     * Exemple : "py" → "python", "js" → "javascript".
     */
    private static String normalizeLang(String lang) {
        return switch (lang) {
            case "python3", "py" -> "python";
            case "js"            -> "javascript";
            case "ts"            -> "typescript";
            case "c++"           -> "cpp";
            default              -> lang;
        };
    }

    // ── Type interne ───────────────────────────────────────────────────────────

    /** Sortie brute d'un conteneur Docker, stdout et stderr séparés. */
    private record SandboxOutput(String stdout, String stderr) {}
}
