-- V2__add_roles.sql (contenu corrigé)
ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL;
ALTER TABLE users MODIFY COLUMN plan VARCHAR(50) NOT NULL;