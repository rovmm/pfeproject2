package com.example.quizplatforme.controller;

import com.example.quizplatforme.DTO.Request.CodeRequest;
import com.example.quizplatforme.DTO.Response.CodeResponse;
import com.example.quizplatforme.Service.CodeExecutionService;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.okhttp.OkDockerHttpClient;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/code")
public class CodeExecutionController {

    private final CodeExecutionService codeExecutionService;

    public CodeExecutionController(CodeExecutionService codeExecutionService) {
        this.codeExecutionService = codeExecutionService;
    }

    @PostMapping("/execute")
    public ResponseEntity<CodeResponse> execute(@Valid @RequestBody CodeRequest request) {
        CodeResponse response = codeExecutionService.execute(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Configuration du client Docker Engine.
     *
     * Connexion via le socket Unix local ({@code /var/run/docker.sock}).
     * Le bean {@link DockerClient} est partagé entre tous les composants :
     * il est thread-safe et gère un pool de connexions HTTP en interne.
     *
     * <p>La création du bean ne valide PAS la disponibilité du démon Docker ;
     * les erreurs de connexion se manifestent lors des premiers appels API
     * (dans {@link com.example.quizplatforme.Service.Impl.DockerSandboxService}).
     *
     * <p>{@code destroyMethod = "close"} garantit la libération propre du pool
     * de connexions HTTP à l'arrêt de l'application.
     */
    @Configuration
    public static class DockerConfig {

        private static final Logger log = LoggerFactory.getLogger(DockerConfig.class);

        @Value("${docker.socket.path:/var/run/docker.sock}")
        private String socketPath;

        /**
         * Crée et expose le {@link DockerClient} unique de l'application.
         *
         * <ul>
         *   <li>{@code connectionTimeout} : 30 s — délai de connexion au daemon</li>
         *   <li>{@code responseTimeout}   : 10 min — couvre les pulls d'images longs</li>
         *   <li>{@code maxConnections}    : 50 — évite la saturation du socket</li>
         * </ul>
         */
        @Bean(destroyMethod = "close")
        public DockerClient dockerClient() {
            String dockerHost = "unix://" + socketPath;
            log.info("Initialisation du client Docker — socket : {}", dockerHost);

            DefaultDockerClientConfig config = DefaultDockerClientConfig
                    .createDefaultConfigBuilder()
                    .withDockerHost(dockerHost)
                    .build();

            OkDockerHttpClient httpClient = new OkDockerHttpClient.Builder()
                    .dockerHost(config.getDockerHost())
                    .sslConfig(config.getSSLConfig())
                    .connectTimeout(30_000)
                    .readTimeout(600_000)
                    .build();

            return DockerClientImpl.getInstance(config, httpClient);
        }
    }
}