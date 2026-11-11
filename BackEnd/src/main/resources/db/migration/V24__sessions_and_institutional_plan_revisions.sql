-- Explicit session revocation and rotation; hashes only, never plaintext refresh tokens.
ALTER TABLE accounts ADD COLUMN auth_version BIGINT NOT NULL DEFAULT 0;
CREATE TABLE auth_sessions (
 id VARCHAR(36) NOT NULL PRIMARY KEY,
 account_id BIGINT NOT NULL,
 refresh_hash VARCHAR(64) NOT NULL,
 created_at DATETIME(6) NOT NULL,
 expires_at DATETIME(6) NOT NULL,
 revoked_at DATETIME(6) NULL,
 CONSTRAINT fk_auth_session_account FOREIGN KEY(account_id) REFERENCES accounts(id),
 INDEX ix_auth_session_account(account_id,revoked_at)
);
CREATE TABLE didactic_plan_revisions (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 plan_id BIGINT NOT NULL,
 revision_number INT NOT NULL,
 returned_by BIGINT NOT NULL,
 returned_at DATETIME(6) NOT NULL,
 reason VARCHAR(2000) NOT NULL,
 snapshot_json LONGTEXT NOT NULL,
 uploaded_pdf LONGBLOB,
 uploaded_pdf_filename VARCHAR(255),
 uploaded_pdf_content_type VARCHAR(255),
 CONSTRAINT uk_didactic_plan_revision UNIQUE(plan_id,revision_number),
 CONSTRAINT fk_didactic_revision_plan FOREIGN KEY(plan_id) REFERENCES didactic_plans(id),
 CONSTRAINT fk_didactic_revision_actor FOREIGN KEY(returned_by) REFERENCES accounts(id)
);
