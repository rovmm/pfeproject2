-- ============================================================
--  V7__add_session_exercise_fields.sql
--
--  1. Ajoute les champs d'exercice sur la table sessions
--     (language, exercise_prompt, filiere)
--
--  2. Crée la table student_submissions
--     (une soumission unique par étudiant par session — UPSERT)
--
--  Note : exercise_prompt est TEXT NULL car MySQL interdit
--  DEFAULT sur les colonnes TEXT/BLOB. La valeur par défaut
--  vide est gérée côté application (Builder.Default = "").
-- ============================================================

-- ─────────────────────────────────────────────────────────────
--  1. SESSIONS — nouveaux champs
-- ─────────────────────────────────────────────────────────────

ALTER TABLE sessions
    ADD COLUMN language         VARCHAR(50)  NOT NULL DEFAULT 'python' AFTER status,
    ADD COLUMN exercise_prompt  TEXT         NULL                       AFTER language,
    ADD COLUMN filiere          VARCHAR(255) NULL                       AFTER exercise_prompt;

-- ─────────────────────────────────────────────────────────────
--  2. STUDENT_SUBMISSIONS
--     Une seule ligne par (student_id, session_id).
--     Réutilisée à chaque re-soumission (UPSERT côté service).
-- ─────────────────────────────────────────────────────────────

CREATE TABLE student_submissions (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    session_id        BIGINT       NOT NULL,
    student_id        BIGINT       NOT NULL,
    code              TEXT         NOT NULL,
    stdout            TEXT         NULL,
    stderr            TEXT         NULL,
    exit_code         INT          NOT NULL DEFAULT -1,
    execution_time_ms BIGINT       NOT NULL DEFAULT 0,
    status            VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    submitted_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_student_session (student_id, session_id),

    CONSTRAINT fk_sub_session
        FOREIGN KEY (session_id) REFERENCES sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_sub_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_submissions_session   ON student_submissions (session_id);
CREATE INDEX idx_submissions_student   ON student_submissions (student_id);
CREATE INDEX idx_submissions_submitted ON student_submissions (submitted_at);
