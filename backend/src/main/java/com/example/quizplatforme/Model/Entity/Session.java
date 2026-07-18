package com.example.quizplatforme.Model.Entity;

import com.example.quizplatforme.Model.Enum.SessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "join_code", unique = true, nullable = false, length = 6)
    private String joinCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prof_id", nullable = false)
    private User prof;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "session_students",
            joinColumns = @JoinColumn(name = "session_id"),
            inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    @Builder.Default
    private Set<User> students = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.OPEN;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String language = "python";

    @Column(name = "exercise_prompt", columnDefinition = "TEXT")
    @Builder.Default
    private String exercisePrompt = "";

    @Column(length = 255)
    private String filiere;

    @Column(name = "session_type", nullable = false, length = 20)
    @Builder.Default
    private String sessionType = "CODE";

    @Column(name = "allow_ai", nullable = false)
    @Builder.Default
    private boolean allowAI = true;

    @Column(name = "disable_copy_paste", nullable = false)
    @Builder.Default
    private boolean disableCopyPaste = false;

    @Column(name = "warn_on_tab_switch", nullable = false)
    @Builder.Default
    private boolean warnOnTabSwitch = false;

    @Column(name = "auto_save", nullable = false)
    @Builder.Default
    private boolean autoSave = true;

    @Column(name = "time_limit_minutes", nullable = false)
    @Builder.Default
    private int timeLimitMinutes = 0;

    @Column(name = "record_coding_history", nullable = false)
    @Builder.Default
    private boolean recordCodingHistory = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}