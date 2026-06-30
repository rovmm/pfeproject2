package com.example.quizplatforme.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de réponse pour l'historique d'exécution de code.
 *
 * <p>Projeté depuis {@link com.example.quizplatforme.Model.ExecutionResult} en évitant :
 * <ul>
 *   <li>La relation {@code User} (lazy) — aucune sérialisation de l'utilisateur</li>
 *   <li>Le hash BCrypt du mot de passe et les données sensibles</li>
 *   <li>Le code complet — tronqué à 200 caractères pour limiter la taille des réponses</li>
 * </ul>
 *
 * <p>{@code stdout} ↔ {@code ExecutionResult.output}<br>
 * {@code stderr}  ↔ {@code ExecutionResult.error}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResultResponse {

    private Long id;

    /** Langage de programmation utilisé (ex. : "python", "java"). */
    private String language;

    /**
     * Extrait du code soumis, limité aux 200 premiers caractères.
     * Suffisant pour identifier la soumission sans surcharger la réponse.
     */
    private String code;

    /** Sortie standard produite par le programme. */
    private String stdout;

    /** Sortie d'erreur produite par le programme ou le compilateur. */
    private String stderr;

    /**
     * Code de sortie du processus.
     * Dérivé du statut d'exécution : {@code SUCCESS → 0}, {@code ERROR/TIMEOUT → -1}.
     */
    private int exitCode;

    /** Durée d'exécution en millisecondes (null si non mesurée). */
    private Long executionTimeMs;

    /** Horodatage de l'enregistrement en base de données. */
    private LocalDateTime createdAt;
}
