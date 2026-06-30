-- ═══════════════════════════════════════════════════
--        SmartStudy — CREATE TABLE Queries
-- ═══════════════════════════════════════════════════


-- ─────────────────────────────────────────────────
--  1. USERS
-- ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    full_name           VARCHAR(100)    NOT NULL,
    email               VARCHAR(100)    NOT NULL UNIQUE,
    password            VARCHAR(255)    NOT NULL,
    role                ENUM('ADMIN', 'PROF', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    plan                ENUM('FREE', 'PREMIUM')          NOT NULL DEFAULT 'FREE',
    strip_customer_id   VARCHAR(100)    NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ─────────────────────────────────────────────────
--  2. SESSIONS
-- ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255)    NOT NULL,
    join_code   VARCHAR(6)      NOT NULL UNIQUE,
    prof_id     BIGINT          NOT NULL,
    status      ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    created_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_session_prof FOREIGN KEY (prof_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);


-- ─────────────────────────────────────────────────
--  3. SESSION_STUDENTS
-- ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_students (
    session_id  BIGINT  NOT NULL,
    student_id  BIGINT  NOT NULL,

    PRIMARY KEY (session_id, student_id),

    CONSTRAINT fk_ss_session FOREIGN KEY (session_id)
        REFERENCES sessions(id) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_ss_student FOREIGN KEY (student_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);


-- ─────────────────────────────────────────────────
--  4. EXECUTION_RESULTS
-- ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS execution_results (
    id                  BIGINT      AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT      NOT NULL,
    language            VARCHAR(50) NOT NULL,
    code                TEXT        NOT NULL,
    output              TEXT        NULL,
    error               TEXT        NULL,
    execution_time_ms   BIGINT      NULL,
    status              ENUM('SUCCESS', 'ERROR', 'TIMEOUT') NOT NULL DEFAULT 'ERROR',
    created_at          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_er_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);



CREATE TABLE IF NOT EXISTS quizzes (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255)    NOT NULL,
    description TEXT            NULL,
    prof_id     BIGINT          NOT NULL,
    session_id  BIGINT          NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_quiz_prof    FOREIGN KEY (prof_id)    REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_quiz_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS questions (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    quiz_id     BIGINT          NOT NULL,
    content     TEXT            NOT NULL,
    type        ENUM('MCQ', 'TRUE_FALSE', 'OPEN') NOT NULL DEFAULT 'MCQ',
    points      INT             NOT NULL DEFAULT 1,
    position    INT             NOT NULL DEFAULT 0,

    CONSTRAINT fk_question_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answers (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT          NOT NULL,
    content     VARCHAR(500)    NOT NULL,
    is_correct  BOOLEAN         NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    quiz_id     BIGINT          NOT NULL,
    student_id  BIGINT          NOT NULL,
    score       DECIMAL(5,2)    NULL,
    started_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME        NULL,
    status      ENUM('IN_PROGRESS', 'COMPLETED', 'ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT fk_attempt_quiz    FOREIGN KEY (quiz_id)    REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_student FOREIGN KEY (student_id) REFERENCES users(id)   ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_answers (
    id              BIGINT  AUTO_INCREMENT PRIMARY KEY,
    attempt_id      BIGINT  NOT NULL,
    question_id     BIGINT  NOT NULL,
    answer_id       BIGINT  NULL,
    open_answer     TEXT    NULL,
    is_correct      BOOLEAN NULL,

    CONSTRAINT fk_sa_attempt  FOREIGN KEY (attempt_id)  REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_question FOREIGN KEY (question_id) REFERENCES questions(id)     ON DELETE CASCADE,
    CONSTRAINT fk_sa_answer   FOREIGN KEY (answer_id)   REFERENCES answers(id)       ON DELETE SET NULL
);





CREATE TABLE IF NOT EXISTS pdf_summaries (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT          NOT NULL,
    file_name   VARCHAR(255)    NOT NULL,
    page_count  INT             NOT NULL DEFAULT 0,
    summary     TEXT            NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pdf_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS notifications (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT          NOT NULL,
    type        ENUM('SESSION_OPEN', 'SESSION_CLOSED', 'QUIZ_AVAILABLE', 'RESULT_READY') NOT NULL,
    message     VARCHAR(500)    NOT NULL,
    is_read     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────
--  5. INDEXES
-- ─────────────────────────────────────────────────

CREATE INDEX idx_users_email              ON users(email);
CREATE INDEX idx_users_role               ON users(role);
CREATE INDEX idx_sessions_join_code       ON sessions(join_code);
CREATE INDEX idx_sessions_prof_id         ON sessions(prof_id);
CREATE INDEX idx_sessions_status          ON sessions(status);
CREATE INDEX idx_session_students_session ON session_students(session_id);
CREATE INDEX idx_session_students_student ON session_students(student_id);
CREATE INDEX idx_execution_results_user   ON execution_results(user_id);
CREATE INDEX idx_execution_results_status ON execution_results(status);
CREATE INDEX idx_execution_results_lang   ON execution_results(language);