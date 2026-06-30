package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.DTO.Request.CodeRequest;
import com.example.quizplatforme.DTO.Response.CodeResponse;

/**
 * @deprecated Remplacée par {@link DockerSandboxService}.
 *
 * <p>L'exécution directe de Node.js via {@code ProcessBuilder} est une
 * <strong>faille de sécurité critique</strong> : un code malveillant peut
 * accéder au système de fichiers serveur, exécuter des commandes arbitraires
 * ou établir des connexions réseau.
 *
 * <p>Cette classe ne porte plus {@code @Component} — elle n'est plus
 * instanciée par Spring. Elle peut être supprimée à la prochaine révision.
 *
 * @see DockerSandboxService
 */
@Deprecated(since = "2.0", forRemoval = true)
public class JavaScriptExecutionStrategy {

    /** @deprecated Utiliser {@link DockerSandboxService#execute} à la place. */
    @Deprecated(since = "2.0", forRemoval = true)
    public CodeResponse execute(CodeRequest request) {
        throw new UnsupportedOperationException(
                "JavaScriptExecutionStrategy est désactivée. Utiliser DockerSandboxService.");
    }
}
