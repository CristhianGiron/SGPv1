CREATE TABLE practice_audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    enrollment_id BIGINT NULL,
    actor_id BIGINT NULL,
    action VARCHAR(80) NOT NULL,
    previous_status VARCHAR(80) NULL,
    new_status VARCHAR(80) NULL,
    previous_archived BOOLEAN NULL,
    new_archived BOOLEAN NULL,
    details VARCHAR(1000) NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_practice_audit_logs_enrollment
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
    CONSTRAINT fk_practice_audit_logs_actor
        FOREIGN KEY (actor_id) REFERENCES accounts(id)
);
