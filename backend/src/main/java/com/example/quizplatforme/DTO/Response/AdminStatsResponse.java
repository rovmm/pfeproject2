package com.example.quizplatforme.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Statistiques globales de la plateforme renvoyées par GET /api/admin/stats.
 * Réservé aux administrateurs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {

    /** Nombre total de comptes utilisateurs enregistrés. */
    private long totalUsers;

    /** Nombre total de sessions créées (tous statuts confondus). */
    private long totalSessions;

    /** Nombre total d'exécutions de code enregistrées. */
    private long totalExecutions;

    /** Nombre total de résumés PDF générés. */
    private long totalPdfSummaries;
}
