package com.example.quizplatforme.Service.Util;

import com.example.quizplatforme.DTO.Response.CodeResponse;

import java.util.List;

/**
 * Utilitaire d'exécution de processus système.
 *
 * @deprecated Cette classe exécute du code utilisateur directement sur le serveur
 *             via {@code ProcessBuilder}, sans aucun isolement de sécurité.
 *             Elle est remplacée par
 *             {@link com.example.quizplatforme.Service.Impl.DockerSandboxService},
 *             qui isole chaque exécution dans un conteneur Docker éphémère.
 *
 * <p><strong>Ne pas réutiliser</strong> pour de nouvelles fonctionnalités.
 *             Cette classe sera supprimée dans une prochaine version.
 *
 * @see com.example.quizplatforme.Service.Impl.DockerSandboxService
 */
@Deprecated(since = "2.0", forRemoval = true)
public class ProcessRunner {

    private ProcessRunner() {
        // Classe utilitaire — ne pas instancier
    }

    /**
     * @deprecated Utiliser
     *             {@link com.example.quizplatforme.Service.Impl.DockerSandboxService#execute}
     *             à la place.
     */
    @Deprecated(since = "2.0", forRemoval = true)
    public static CodeResponse run(List<String> command, String workdir, String stdin) {
        throw new UnsupportedOperationException(
                "ProcessRunner.run() est désactivé pour des raisons de sécurité. " +
                "Utiliser DockerSandboxService.execute().");
    }
}
