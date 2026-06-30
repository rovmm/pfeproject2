package com.example.quizplatforme.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception levée lorsqu'un utilisateur authentifié tente d'accéder à une ressource
 * qui ne lui appartient pas ou pour laquelle il n'a pas les droits suffisants.
 * Produit une réponse HTTP 403 avec un message en français.
 *
 * Différence avec {@link org.springframework.security.access.AccessDeniedException} :
 *   - AccessDeniedException → interceptée par Spring Security (rôle manquant au niveau filtre)
 *   - ForbiddenException → levée manuellement dans un service (règle métier, ex : modifier
 *     la session d'un autre professeur)
 *
 * Exemple d'utilisation :
 * <pre>
 *   if (!session.getProf().getId().equals(currentUserId)) {
 *       throw new ForbiddenException(
 *           "Vous n'êtes pas autorisé à modifier cette session."
 *       );
 *   }
 * </pre>
 */
public class ForbiddenException extends ApiException {

    /**
     * @param message message d'erreur affiché dans la réponse JSON (en français).
     */
    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
