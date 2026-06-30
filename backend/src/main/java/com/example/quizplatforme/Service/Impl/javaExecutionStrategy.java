package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.DTO.Request.CodeRequest;
import com.example.quizplatforme.DTO.Response.CodeResponse;

/**
 * @deprecated Remplacée par {@link DockerSandboxService}.
 *
 * <p>La compilation et l'exécution Java directement sur le serveur via
 * {@code ProcessBuilder} expose le serveur à l'exécution de code arbitraire :
 * un attaquant peut exécuter des commandes système, lire des fichiers de
 * configuration (clés secrètes, .env) ou établir des connexions sortantes.
 *
 * <p>Cette classe ne porte plus {@code @Component} — elle n'est plus
 * instanciée par Spring. Elle peut être supprimée à la prochaine révision.
 *
 * @see DockerSandboxService
 */
@Deprecated(since = "2.0", forRemoval = true)
public class javaExecutionStrategy {

    /** @deprecated Utiliser {@link DockerSandboxService#execute} à la place. */
    @Deprecated(since = "2.0", forRemoval = true)
    public CodeResponse execute(CodeRequest request) {
        throw new UnsupportedOperationException(
                "javaExecutionStrategy est désactivée. Utiliser DockerSandboxService.");
    }
}
