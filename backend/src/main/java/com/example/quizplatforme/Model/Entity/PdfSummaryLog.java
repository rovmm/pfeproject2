package com.example.quizplatforme.Model.Entity;

/**
 * @deprecated Remplacée par {@link PdfSummary}.
 *
 * <p>Cette classe était destinée à tracer les résumés PDF via une table
 * {@code pdf_summary_logs} distincte. Elle a été abandonnée avant que la
 * migration correspondante ne soit créée.
 *
 * <p>La table {@code pdf_summaries} (entité {@link PdfSummary}) remplit
 * désormais ce rôle de manière complète.
 *
 * <p><strong>Peut être supprimée à la prochaine révision.</strong>
 * Elle ne porte plus {@code @Entity} — Hibernate n'essaie donc plus de
 * valider ou de mapper cette classe, ce qui évite un
 * {@code SchemaManagementException} au démarrage.
 */
@Deprecated(since = "2.0", forRemoval = true)
public class PdfSummaryLog {
    // Classe désactivée — aucun champ ni annotation JPA.
}
