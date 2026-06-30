package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.DTO.Request.CodeRequest;
import com.example.quizplatforme.DTO.Response.CodeResponse;

/**
 * @deprecated Remplacée par {@link DockerSandboxService}.
 *
 * <p>L'exécution directe de Python via {@code ProcessBuilder} est une
 * <strong>faille de sécurité critique</strong> : elle donne accès à l'ensemble
 * du système de fichiers et des capacités réseau du serveur de production.
 *
 * <p>Cette classe est conservée uniquement pour référence historique.
 * Elle ne porte plus {@code @Component} et n'est donc plus instanciée par Spring.
 * Elle peut être supprimée à la prochaine révision du code.
 *
 * @see DockerSandboxService
 */
@Deprecated(since = "2.0", forRemoval = true)
public class PythonExecutionStrategy {

    /** @deprecated Utiliser {@link DockerSandboxService#execute} à la place. */
    @Deprecated(since = "2.0", forRemoval = true)
    public CodeResponse execute(CodeRequest request) {
        throw new UnsupportedOperationException(
                "PythonExecutionStrategy est désactivée. Utiliser DockerSandboxService.");
    }
}
