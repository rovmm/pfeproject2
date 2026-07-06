package com.example.quizplatforme.Model.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Historique de codage d'un étudiant pour une session (nombre de modifications,
 * horodatages, et snapshots périodiques du code — sérialisés en JSON).
 *
 * <p>Une seule ligne par (session, student) — re-sauvegardée à chaque appel de
 * {@code POST /api/sessions/{sessionId}/history/save}. Uniquement créée quand
 * {@code Session.recordCodingHistory == true}.
 */
@Entity
@Table(name = "coding_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "edit_count", nullable = false)
    @Builder.Default
    private int editCount = 0;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    /** Liste de snapshots {@code {code, timestamp, language}} sérialisée en JSON. */
    @Column(columnDefinition = "json")
    private String snapshots;
}
