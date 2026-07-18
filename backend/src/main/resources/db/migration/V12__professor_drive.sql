CREATE TABLE drive_folders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  prof_id BIGINT NOT NULL,
  parent_id BIGINT DEFAULT NULL,
  visibility VARCHAR(50) NOT NULL DEFAULT 'PRIVATE',
  visible_from DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (prof_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES drive_folders(id) ON DELETE CASCADE
);

CREATE TABLE drive_files (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  folder_id BIGINT NOT NULL,
  prof_id BIGINT NOT NULL,
  visibility VARCHAR(50) NOT NULL DEFAULT 'PRIVATE',
  visible_from DATETIME DEFAULT NULL,
  allow_download BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES drive_folders(id) ON DELETE CASCADE,
  FOREIGN KEY (prof_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_drive_folders_prof_id ON drive_folders(prof_id);
CREATE INDEX idx_drive_folders_parent_id ON drive_folders(parent_id);
CREATE INDEX idx_drive_files_folder_id ON drive_files(folder_id);
CREATE INDEX idx_drive_files_prof_id ON drive_files(prof_id);
