ALTER TABLE member_profiles ADD COLUMN phone TEXT;

ALTER TABLE member_import_rows ADD COLUMN phone TEXT;

ALTER TABLE member_import_batches ADD COLUMN source_file_blob BLOB;
