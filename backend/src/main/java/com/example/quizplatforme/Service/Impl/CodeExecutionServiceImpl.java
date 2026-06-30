package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.DTO.Request.CodeRequest;
import com.example.quizplatforme.DTO.Response.CodeResponse;
import com.example.quizplatforme.Model.ExecutionResult;
import com.example.quizplatforme.Model.Entity.User;
import com.example.quizplatforme.Repository.ExecutionResultRepository;
import com.example.quizplatforme.Repository.UserRepository;
import com.example.quizplatforme.Service.CodeExecutionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrateur de l'exécution de code utilisateur.
 *
 * <p>Délègue intégralement l'exécution à {@link DockerSandboxService},
 * qui isole chaque soumission dans un conteneur Docker éphémère sans réseau.
 * Ce service ne fait que :
 * <ol>
 *   <li>Identifier l'utilisateur courant via le contexte de sécurité</li>
 *   <li>Appeler le sandbox Docker</li>
 *   <li>Persister le résultat en base (historique d'exécution)</li>
 * </ol>
 *
 * <p><b>Sécurité</b> : toute exécution directe de processus sur le serveur
 * est supprimée. Les anciennes stratégies ({@code PythonExecutionStrategy},
 * {@code javaExecutionStrategy}, {@code JavaScriptExecutionStrategy}) sont
 * marquées {@link Deprecated} et ne sont plus utilisées.
 */
@Service
@RequiredArgsConstructor
public class CodeExecutionServiceImpl implements CodeExecutionService {

    private static final Logger log = LoggerFactory.getLogger(CodeExecutionServiceImpl.class);

    private final DockerSandboxService dockerSandboxService;
    private final ExecutionResultRepository executionResultRepository;
    private final UserRepository userRepository;


    // ── API publique ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CodeResponse execute(CodeRequest request) {
        String userEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur introuvable : " + userEmail));

        String language = request.getLanguage().toLowerCase().trim();
        log.info("Exécution sandbox — langage : {}, utilisateur : {}", language, userEmail);

        // Délégation au sandbox Docker sécurisé
        CodeResponse response = dockerSandboxService.execute(
                language,
                request.getCode(),
                request.getStdin(),
                0
        );

        // Persistance de l'historique (non bloquant sur erreur)
        persistExecutionResult(user, request, response);

        return response;
    }

    // ── Persistance ────────────────────────────────────────────────────────────

    /**
     * Sauvegarde le résultat en base pour l'historique utilisateur.
     * Les erreurs de persistance sont uniquement journalisées — elles ne
     * doivent pas faire échouer la réponse à l'utilisateur.
     */
    private void persistExecutionResult(User user, CodeRequest request, CodeResponse response) {
        try {
            ExecutionResult.ExecutionStatus status = switch (response.getStatus()) {
                case "SUCCESS" -> ExecutionResult.ExecutionStatus.SUCCESS;
                case "TIMEOUT" -> ExecutionResult.ExecutionStatus.TIMEOUT;
                default        -> ExecutionResult.ExecutionStatus.ERROR;
            };

            ExecutionResult result = ExecutionResult.builder()
                    .user(user)
                    .language(request.getLanguage())
                    .code(request.getCode())
                    .output(response.getOutput())
                    .error(response.getError())
                    .executionTimeMs(response.getExecutionTimeMs())
                    .status(status)
                    .build();

            executionResultRepository.save(result);
            log.debug("Résultat d'exécution persisté — utilisateur : {}, statut : {}",
                    user.getEmail(), status);
        } catch (Exception e) {
            log.error("Impossible de persister le résultat d'exécution pour l'utilisateur {} : {}",
                    user.getEmail(), e.getMessage());
        }
    }
}
