CREATE TABLE practice_document_versions (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,enrollment_id BIGINT NOT NULL,document_kind VARCHAR(4) NOT NULL,
 document_id BIGINT NOT NULL,revision_number INT NOT NULL,actor_id BIGINT NOT NULL,created_at DATETIME(6) NOT NULL,
 event VARCHAR(40) NOT NULL,document_status VARCHAR(40) NOT NULL,snapshot_json LONGTEXT NOT NULL,
 snapshot_hash VARCHAR(64) NOT NULL,pdf LONGBLOB,pdf_hash VARCHAR(64),
 CONSTRAINT uk_practice_document_version UNIQUE(document_kind,document_id,revision_number),
 CONSTRAINT fk_document_version_enrollment FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
 CONSTRAINT fk_document_version_actor FOREIGN KEY(actor_id) REFERENCES accounts(id),
 INDEX ix_document_versions_enrollment(enrollment_id,document_kind)
);
ALTER TABLE activity_plans ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE practice_reports ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE final_reports ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE completed_activity_records ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE activity_evaluations ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE practice_follow_up_reports ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0;
