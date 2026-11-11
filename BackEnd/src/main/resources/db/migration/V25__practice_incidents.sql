ALTER TABLE enrollments ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE enrollments MODIFY COLUMN status ENUM('PENDING','APPROVED','REJECTED','COMPLETED','SUSPENDED','WITHDRAWN');
CREATE TABLE practice_incidents (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,enrollment_id BIGINT NOT NULL,
 type VARCHAR(40) NOT NULL,status VARCHAR(24) NOT NULL,title VARCHAR(160) NOT NULL,description VARCHAR(4000) NOT NULL,
 created_by BIGINT NOT NULL,responsible_id BIGINT,created_at DATETIME(6) NOT NULL,updated_at DATETIME(6) NOT NULL,
 CONSTRAINT fk_incident_enrollment FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
 CONSTRAINT fk_incident_creator FOREIGN KEY(created_by) REFERENCES accounts(id),
 CONSTRAINT fk_incident_responsible FOREIGN KEY(responsible_id) REFERENCES accounts(id),
 INDEX ix_incident_enrollment(enrollment_id,status)
);
CREATE TABLE practice_incident_events (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,incident_id BIGINT NOT NULL,actor_id BIGINT NOT NULL,
 previous_status VARCHAR(24),new_status VARCHAR(24) NOT NULL,reason VARCHAR(2000) NOT NULL,effects VARCHAR(1000),created_at DATETIME(6) NOT NULL,
 CONSTRAINT fk_incident_event FOREIGN KEY(incident_id) REFERENCES practice_incidents(id),
 CONSTRAINT fk_incident_event_actor FOREIGN KEY(actor_id) REFERENCES accounts(id)
);
