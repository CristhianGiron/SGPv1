CREATE TABLE workspace_drafts (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    scope VARCHAR(200) NOT NULL,
    content LONGTEXT NULL,
    revision BIGINT NOT NULL,
    saved_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_workspace_drafts_owner_scope UNIQUE (owner_id, scope),
    CONSTRAINT fk_workspace_drafts_owner FOREIGN KEY (owner_id) REFERENCES accounts(id)
);
