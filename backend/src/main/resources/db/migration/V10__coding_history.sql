-- ============================================================
--  V10__coding_history.sql
--
--  Per-student coding-session history (edit count, timing, and
--  periodic code snapshots), recorded only when a session has
--  record_coding_history = TRUE.
--  One row per (session, student) — re-saved on each save call.
-- ============================================================

CREATE TABLE coding_history (
    id            BIGINT   NOT NULL AUTO_INCREMENT,
    session_id    BIGINT   NOT NULL,
    student_id    BIGINT   NOT NULL,
    edit_count    INT      NOT NULL DEFAULT 0,
    started_at    DATETIME NOT NULL,
    submitted_at  DATETIME NULL,
    snapshots     JSON     NULL,

    PRIMARY KEY (id),

    UNIQUE KEY unique_history (session_id, student_id),

    CONSTRAINT fk_coding_history_session
        FOREIGN KEY (session_id) REFERENCES sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_coding_history_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_coding_history_session ON coding_history (session_id);
CREATE INDEX idx_coding_history_student ON coding_history (student_id);
