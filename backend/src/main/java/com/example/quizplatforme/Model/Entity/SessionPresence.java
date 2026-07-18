package com.example.quizplatforme.Model.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Présence d'un étudiant dans une session live, mise à jour à chaque heartbeat
 * envoyé par le client (voir {@code POST /api/sessions/{id}/heartbeat}).
 *
 * <p>Une seule ligne par (session, student). Le professeur considère l'étudiant
 * "en ligne" si {@code lastSeenAt} est récent, "parti" sinon — voir
 * {@code SessionServiceImpl.PRESENCE_ONLINE_THRESHOLD_SECONDS}.
 */
@Entity
@Table(name = "session_presence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionPresence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "last_seen_at", nullable = false)
    private LocalDateTime lastSeenAt;
}
