-- Table principale des sessions
CREATE TABLE sessions (
                          id         BIGINT AUTO_INCREMENT PRIMARY KEY,
                          title      VARCHAR(255)                        NOT NULL,
                          join_code  VARCHAR(6)                          NOT NULL UNIQUE,
                          prof_id    BIGINT                              NOT NULL,
                          status     ENUM('OPEN', 'CLOSED')              NOT NULL DEFAULT 'OPEN',
                          created_at DATETIME(6)                         NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                          updated_at DATETIME(6)                         NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

                          CONSTRAINT fk_session_prof FOREIGN KEY (prof_id) REFERENCES users(id)
                              ON DELETE CASCADE
                              ON UPDATE CASCADE
);

-- Table de jointure many-to-many session ↔ student
CREATE TABLE session_students (
                                  session_id BIGINT NOT NULL,
                                  student_id BIGINT NOT NULL,

                                  PRIMARY KEY (session_id, student_id),

                                  CONSTRAINT fk_ss_session FOREIGN KEY (session_id) REFERENCES sessions(id)
                                      ON DELETE CASCADE
                                      ON UPDATE CASCADE,

                                  CONSTRAINT fk_ss_student FOREIGN KEY (student_id) REFERENCES users(id)
                                      ON DELETE CASCADE
                                      ON UPDATE CASCADE
);

-- Index pour accélérer les recherches par code et par prof
CREATE INDEX idx_sessions_join_code ON sessions(join_code);
CREATE INDEX idx_sessions_prof_id   ON sessions(prof_id);