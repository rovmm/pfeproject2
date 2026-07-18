-- ============================================================
--  V9__add_session_security_flags.sql
--
--  1. Adds security/behavior flags to sessions:
--     allow_ai, disable_copy_paste, warn_on_tab_switch,
--     auto_save, time_limit_minutes, record_coding_history
--
--  2. Links execution_results to an (optional) session, so the
--     AI-analyze endpoint can enforce the session's allow_ai flag
--     even for standalone /api/code/execute runs made from inside
--     a session's code editor.
--
--  Note: V8 is already used by V8__add_quiz_tables.sql, so this
--  migration is numbered V9 (the feature request's "V8" name was
--  based on a stale count).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
--  1. SESSIONS — security/behavior flags
-- ─────────────────────────────────────────────────────────────

ALTER TABLE sessions
    ADD COLUMN allow_ai              BOOLEAN NOT NULL DEFAULT TRUE  AFTER session_type,
    ADD COLUMN disable_copy_paste    BOOLEAN NOT NULL DEFAULT FALSE AFTER allow_ai,
    ADD COLUMN warn_on_tab_switch    BOOLEAN NOT NULL DEFAULT FALSE AFTER disable_copy_paste,
    ADD COLUMN auto_save             BOOLEAN NOT NULL DEFAULT TRUE  AFTER warn_on_tab_switch,
    ADD COLUMN time_limit_minutes    INT     NOT NULL DEFAULT 0     AFTER auto_save,
    ADD COLUMN record_coding_history BOOLEAN NOT NULL DEFAULT FALSE AFTER time_limit_minutes;

-- ─────────────────────────────────────────────────────────────
--  2. EXECUTION_RESULTS — optional link to a session
-- ─────────────────────────────────────────────────────────────

ALTER TABLE execution_results
    ADD COLUMN session_id BIGINT NULL AFTER user_id;

ALTER TABLE execution_results
    ADD CONSTRAINT fk_execution_results_session
        FOREIGN KEY (session_id) REFERENCES sessions(id)
        ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_execution_results_session ON execution_results (session_id);
