-- ============================================================
--  V5__add_missing_tables.sql
--
--  Ajoute les tables absentes de V1–V4 :
--    • execution_results  (précédemment créée par ddl-auto=update)
--    • pdf_summaries      (résultats des résumés Groq)
--    • notifications      (système de notifications utilisateur)
--
--  Toutes les instructions utilisent IF NOT EXISTS pour rester
--  idempotentes sur les bases de données déjà partiellement
--  peuplées par Hibernate.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  1. EXECUTION_RESULTS
--     Historique des exécutions de code par utilisateur.
--     Référencée par ExecutionResult.java
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS execution_results (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    user_id             BIGINT          NOT NULL,
    language            VARCHAR(50)     NOT NULL,
    code                TEXT            NOT NULL,
    output              TEXT            NULL,
    error               TEXT            NULL,
    execution_time_ms   BIGINT          NULL,
    status              ENUM('SUCCESS', 'ERROR', 'TIMEOUT') NOT NULL DEFAULT 'ERROR',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_er_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_execution_results_user
    ON execution_results (user_id);

CREATE INDEX IF NOT EXISTS idx_execution_results_status
    ON execution_results (status);

CREATE INDEX IF NOT EXISTS idx_execution_results_lang
    ON execution_results (language);

CREATE INDEX IF NOT EXISTS idx_execution_results_created
    ON execution_results (created_at);


-- ─────────────────────────────────────────────────────────────
--  2. PDF_SUMMARIES
--     Résumés générés par l'IA Groq pour chaque PDF soumis.
--     Permet d'afficher l'historique des résumés par utilisateur.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pdf_summaries (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    user_id     BIGINT          NOT NULL,
    file_name   VARCHAR(255)    NOT NULL,
    page_count  INT             NOT NULL DEFAULT 0,
    summary     TEXT            NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_pdf_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pdf_summaries_user
    ON pdf_summaries (user_id);

CREATE INDEX IF NOT EXISTS idx_pdf_summaries_created
    ON pdf_summaries (created_at);


-- ─────────────────────────────────────────────────────────────
--  3. NOTIFICATIONS
--     Notifications système envoyées aux utilisateurs.
--     Types : SESSION_OPEN, SESSION_CLOSED, QUIZ_AVAILABLE,
--             RESULT_READY
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    user_id     BIGINT          NOT NULL,
    type        ENUM(
                    'SESSION_OPEN',
                    'SESSION_CLOSED',
                    'QUIZ_AVAILABLE',
                    'RESULT_READY'
                )               NOT NULL,
    message     VARCHAR(500)    NOT NULL,
    is_read     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_notif_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
    ON notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created
    ON notifications (created_at);
