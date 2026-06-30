-- ============================================================
--  V6__add_pdf_summary_original_text.sql
--
--  Ajoute la colonne original_text à pdf_summaries.
--  Elle stocke le texte extrait du PDF (avant troncature pour l'IA),
--  plafonné à ~60 000 caractères par la couche service pour tenir
--  dans un champ TEXT MySQL (limite : 65 535 octets).
--
--  NULL autorisé : compatibilité avec les lignes existantes et
--  les éventuels PDF dont le texte n'a pas pu être extrait.
-- ============================================================

ALTER TABLE pdf_summaries
    ADD COLUMN original_text TEXT NULL
        COMMENT 'Texte brut extrait du PDF (plafonné à 60 000 caractères)';
