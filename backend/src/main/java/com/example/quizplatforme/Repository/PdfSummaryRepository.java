package com.example.quizplatforme.Repository;

import com.example.quizplatforme.Model.Entity.PdfSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Accès à la table {@code pdf_summaries}.
 *
 * <p>La méthode de requête dérivée {@link #findByUserIdOrderByCreatedAtDesc}
 * retourne les résumés d'un utilisateur, du plus récent au plus ancien,
 * sans charger la relation {@code User} (projection par ID).
 */
@Repository
public interface PdfSummaryRepository extends JpaRepository<PdfSummary, Long> {

    /**
     * Historique des résumés PDF d'un utilisateur, ordre anti-chronologique.
     *
     * @param userId identifiant de l'utilisateur propriétaire
     * @return liste triée par {@code created_at DESC}, vide si aucun résumé
     */
    List<PdfSummary> findByUserIdOrderByCreatedAtDesc(Long userId);
}
