-- A parallel is an academic roster. It may offer multiple independent practices.
CREATE TABLE practice_offerings (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    name VARCHAR(160) NOT NULL,
    capacity INT NOT NULL,
    start_date DATETIME(6), end_date DATETIME(6),
    enrollment_open BIT NOT NULL DEFAULT 1,
    created_by BIGINT, created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_offering_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_offering_creator FOREIGN KEY (created_by) REFERENCES accounts(id)
);
INSERT INTO practice_offerings (course_id,name,capacity,start_date,end_date,enrollment_open,created_by,created_at)
SELECT id,LEFT(name,160),COALESCE(capacity,1),start_date,end_date,NOT locked,created_by,COALESCE(created_at,CURRENT_TIMESTAMP(6)) FROM courses;
ALTER TABLE enrollments ADD COLUMN practice_id BIGINT;
UPDATE enrollments e JOIN practice_offerings p ON p.course_id=e.course_id SET e.practice_id=p.id;
ALTER TABLE enrollments ADD CONSTRAINT fk_enrollment_practice FOREIGN KEY (practice_id) REFERENCES practice_offerings(id);
-- An explicit account index keeps the account FK indexed when replacing the old unique key.
CREATE INDEX ix_enrollment_account ON enrollments(account_id);
ALTER TABLE enrollments DROP INDEX UKkkch1icel0mkpyirl2bmf2ash;
ALTER TABLE enrollments ADD CONSTRAINT uk_student_practice UNIQUE (account_id,practice_id);
