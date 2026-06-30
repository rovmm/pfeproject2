package com.example.quizplatforme.Repository;

/**
 * @deprecated Remplacée par {@link PdfSummaryRepository}.
 *
 * <p>Cette interface était associée à {@code PdfSummaryLog} (entité désactivée).
 * Elle ne doit plus être injectée. Elle n'étend plus {@code JpaRepository} :
 * Spring Data JPA ne crée donc aucun proxy pour elle.
 *
 * <p><strong>Peut être supprimée à la prochaine révision.</strong>
 */
@Deprecated(since = "2.0", forRemoval = true)
public interface PdfSummaryLogRepository {
    // Interface désactivée — aucune méthode ni extension JpaRepository.
}
