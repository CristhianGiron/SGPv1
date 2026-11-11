CREATE TABLE practice_deadlines (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,enrollment_id BIGINT NOT NULL,document_kind VARCHAR(4) NOT NULL,stage VARCHAR(32) NOT NULL,
 due_at DATETIME(6) NOT NULL,reminder_hours INT NOT NULL,reason VARCHAR(2000) NOT NULL,updated_by BIGINT NOT NULL,updated_at DATETIME(6) NOT NULL,revision BIGINT NOT NULL,
 CONSTRAINT uk_practice_deadline UNIQUE(enrollment_id,document_kind,stage),
 CONSTRAINT fk_deadline_enrollment FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
 CONSTRAINT fk_deadline_updater FOREIGN KEY(updated_by) REFERENCES accounts(id)
);
CREATE TABLE practice_deadline_notices (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,deadline_id BIGINT NOT NULL,deadline_revision BIGINT NOT NULL,recipient_id BIGINT NOT NULL,phase VARCHAR(16) NOT NULL,sent_at DATETIME(6) NOT NULL,
 CONSTRAINT uk_deadline_notice UNIQUE(deadline_id,deadline_revision,recipient_id,phase),
 CONSTRAINT fk_deadline_notice FOREIGN KEY(deadline_id) REFERENCES practice_deadlines(id),
 CONSTRAINT fk_deadline_recipient FOREIGN KEY(recipient_id) REFERENCES accounts(id)
);
