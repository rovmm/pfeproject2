-- ============================================================
--  V11__session_presence.sql
--
--  Tracks per-student presence in a live session via a periodic
--  heartbeat sent from the student's client. A student is
--  considered "online" if last_seen_at is recent (see
--  SessionServiceImpl.PRESENCE_ONLINE_THRESHOLD_SECONDS);
--  otherwise the professor's live view shows them as "left".
--  One row per (session, student) — updated on each heartbeat.
-- ============================================================

CREATE TABLE session_presence (
    id            BIGINT   NOT NULL AUTO_INCREMENT,
    session_id    BIGINT   NOT NULL,
    student_id    BIGINT   NOT NULL,
    joined_at     DATETIME NOT NULL,
    last_seen_at  DATETIME NOT NULL,

    PRIMARY KEY (id),

    UNIQUE KEY unique_presence (session_id, student_id),

    CONSTRAINT fk_session_presence_session
        FOREIGN KEY (session_id) REFERENCES sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_session_presence_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_session_presence_session ON session_presence (session_id);
