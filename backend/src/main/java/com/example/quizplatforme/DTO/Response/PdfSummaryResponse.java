package com.example.quizplatforme.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de réponse pour l'historique des résumés PDF.
 *
 * <p>Projeté depuis {@link com.example.quizplatforme.Model.Entity.PdfSummary} en excluant :
 * <ul>
 *   <li>La relation {@code User} (LAZY, données sensibles)</li>
 *   <li>{@code originalText} — potentiellement très volumineux (jusqu'à 60 000 caractères)</li>
 *   <li>{@code pageCount} — détail technique non nécessaire côté client</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfSummaryResponse {

    private Long id;

    /** Nom du fichier PDF soumis. */
    private String fileName;

    /** Résumé généré par l'IA Grok. */
    private String summary;

    /** Horodatage de génération du résumé. */
    private LocalDateTime createdAt;
}
