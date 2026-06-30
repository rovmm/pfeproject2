package com.example.quizplatforme.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception levée lorsqu'une ressource demandée est introuvable en base de données.
 * Produit une réponse HTTP 404 avec un message en français.
 *
 * Deux constructeurs disponibles :
 *   - Message libre : {@code new ResourceNotFoundException("Le quiz demandé est introuvable.")}
 *   - Message structuré : {@code new ResourceNotFoundException("Quiz", "id", 42)}
 *     → "La ressource 'Quiz' avec id = '42' est introuvable."
 */
public class ResourceNotFoundException extends ApiException {

    /**
     * @param message message d'erreur libre, affiché directement dans la réponse JSON.
     */
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }

    /**
     * @param resourceName nom de la ressource (ex : "Quiz", "Session", "Utilisateur")
     * @param fieldName    nom du champ de recherche (ex : "id", "email", "code")
     * @param fieldValue   valeur recherchée (ex : 42, "user@example.com", "ABC123")
     */
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(
            String.format(
                "La ressource '%s' avec %s = '%s' est introuvable.",
                resourceName, fieldName, fieldValue
            ),
            HttpStatus.NOT_FOUND
        );
    }
}
