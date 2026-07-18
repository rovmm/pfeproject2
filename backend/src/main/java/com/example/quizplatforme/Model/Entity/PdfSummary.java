package com.example.quizplatforme.Model.Entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Résumé PDF généré par l'IA Grok pour un utilisateur.
 *
 * <p>Mappe la table {@code pdf_summaries} (créée dans V5, colonne {@code original_text}
 * ajoutée dans V6). Chaque ligne correspond à un appel réussi à
 * {@code POST /api/pdf/summarize}.
 *
 * <h3>Champs stockés</h3>
 * <ul>
 *   <li>{@code originalText} — texte brut extrait du PDF, plafonné à 60 000 caractères</li>
 *   <li>{@code summary}      — résumé généré par Grok</li>
 *   <li>{@code pageCount}    — nombre de pages du fichier source</li>
 * </ul>
 *
 * <h3>Intégrité référentielle</h3>
 * {@code ON DELETE CASCADE} côté SQL : la suppression d'un utilisateur
 * entraîne la suppression de tous ses résumés.
 */
@Entity
@Table(name = "pdf_summaries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Propriétaire du résumé.
     * Relation LAZY — ne jamais sérialiser cette entité directement en JSON.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;

    /** Nombre de pages du fichier PDF source. */
    @Column(name = "page_count", nullable = false)
    private int pageCount;

    /**
     * Texte brut extrait du PDF.
     * Plafonné à 60 000 caractères dans la couche service pour rester
     * dans la limite du type MySQL {@code TEXT} (65 535 octets).
     */
    @Column(name = "original_text", columnDefinition = "TEXT")
    private String originalText;

    /** Résumé généré par l'IA Grok (jamais null après un résumé réussi). */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String summary;

    /**
     * Horodatage d'insertion en base.
     * Géré par Hibernate via {@link CreationTimestamp} — ne jamais alimenter manuellement.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
