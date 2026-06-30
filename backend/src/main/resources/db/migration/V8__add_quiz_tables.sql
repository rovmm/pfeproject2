-- ============================================================
--  V8__add_quiz_tables.sql
--
--  Drops the old Hibernate-generated quiz tables (wrong schema)
--  and recreates them per spec.  Also adds session_type to sessions.
-- ============================================================

-- ── 1. Drop old tables (FK-safe order) ───────────────────────
DROP TABLE IF EXISTS student_answers;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;

-- ── 2. sessions — add session_type ───────────────────────────
ALTER TABLE sessions
    ADD COLUMN session_type VARCHAR(20) NOT NULL DEFAULT 'CODE' AFTER filiere;

-- ── 3. quizzes ────────────────────────────────────────────────
CREATE TABLE quizzes (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    session_id          BIGINT       NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT         NULL,
    time_limit_minutes  INT          NOT NULL DEFAULT 0,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_quiz_session (session_id),

    CONSTRAINT fk_quiz_session
        FOREIGN KEY (session_id) REFERENCES sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── 4. questions ──────────────────────────────────────────────
CREATE TABLE questions (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    quiz_id         BIGINT       NOT NULL,
    question_text   TEXT         NOT NULL,
    option_a        VARCHAR(500) NOT NULL,
    option_b        VARCHAR(500) NOT NULL,
    option_c        VARCHAR(500) NOT NULL,
    option_d        VARCHAR(500) NOT NULL,
    correct_option  CHAR(1)      NOT NULL,
    position        INT          NOT NULL DEFAULT 0,

    PRIMARY KEY (id),

    CONSTRAINT fk_question_quiz
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_questions_quiz     ON questions (quiz_id);
CREATE INDEX idx_questions_position ON questions (quiz_id, position);

-- ── 5. quiz_attempts ──────────────────────────────────────────
CREATE TABLE quiz_attempts (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    quiz_id          BIGINT         NOT NULL,
    student_id       BIGINT         NOT NULL,
    score            INT            NOT NULL DEFAULT 0,
    total_questions  INT            NOT NULL DEFAULT 0,
    percentage       DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
    completed_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_attempt (quiz_id, student_id),

    CONSTRAINT fk_attempt_quiz
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_attempt_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_attempts_quiz    ON quiz_attempts (quiz_id);
CREATE INDEX idx_attempts_student ON quiz_attempts (student_id);

-- ── 6. student_answers ────────────────────────────────────────
CREATE TABLE student_answers (
    id               BIGINT  NOT NULL AUTO_INCREMENT,
    attempt_id       BIGINT  NOT NULL,
    question_id      BIGINT  NOT NULL,
    selected_option  CHAR(1) NOT NULL,
    is_correct       BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (id),

    CONSTRAINT fk_answer_attempt
        FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_answer_question
        FOREIGN KEY (question_id) REFERENCES questions(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_answers_attempt  ON student_answers (attempt_id);
CREATE INDEX idx_answers_question ON student_answers (question_id);
