package com.example.quizplatforme.Model;

import com.example.quizplatforme.Model.Entity.Session;
import com.example.quizplatforme.Model.Entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Résultat d'une exécution de code utilisateur.
 *
 * <h3>Timestamp de création</h3>
 * {@code createdAt} est géré par Hibernate via {@link CreationTimestamp} :
 * la valeur est injectée automatiquement juste avant l'INSERT, garantissant
 * que l'horodatage reflète l'instant réel d'écriture en base et non la
 * construction de l'objet Java (comportement de l'ancien {@code @Builder.Default}).
 *
 * <h3>Chargement paresseux de l'utilisateur</h3>
 * {@code user} est en {@code LAZY} : ne jamais sérialiser cette entité
 * directement vers JSON. Utiliser {@link com.example.quizplatforme.DTO.Response.ExecutionResultResponse}
 * pour toutes les réponses REST.
 */
@Entity
@Table(name = "execution_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResult {

    public enum ExecutionStatus {
        SUCCESS, ERROR, TIMEOUT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Propriétaire de l'exécution.
     * LAZY — ne pas accéder en dehors d'une session Hibernate ouverte.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Session à laquelle cette exécution est rattachée, ou {@code null} si l'exécution
     * a été lancée hors session (éditeur de code autonome via {@code /api/code/execute}).
     * Permet à {@code GET /api/ai/analyze/{executionId}} de faire respecter le flag
     * {@code allowAI} de la session.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private Session session;

    @Column(nullable = false)
    private String language;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String code;

    /** Sortie standard (stdout) du programme exécuté. */
    @Column(columnDefinition = "TEXT")
    private String output;

    /** Sortie d'erreur (stderr) du programme exécuté. */
    @Column(columnDefinition = "TEXT")
    private String error;

    private Long executionTimeMs;

    @Enumerated(EnumType.STRING)
    private ExecutionStatus status;

    /**
     * Horodatage de l'enregistrement en base.
     *
     * <p>{@link CreationTimestamp} demande à Hibernate d'alimenter ce champ
     * juste avant l'INSERT — la valeur est donc cohérente avec la contrainte
     * {@code NOT NULL DEFAULT CURRENT_TIMESTAMP} de la colonne SQL.
     * {@code updatable = false} empêche toute modification accidentelle.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
