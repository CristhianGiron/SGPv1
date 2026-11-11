-- Academic roster: one student may belong to several parallels independently of practice status.
CREATE TABLE course_student_memberships (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    active BIT NOT NULL DEFAULT 1,
    assigned_by BIGINT NULL,
    assigned_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT uq_course_student_membership UNIQUE (course_id, student_id),
    CONSTRAINT fk_membership_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_membership_student FOREIGN KEY (student_id) REFERENCES accounts(id),
    CONSTRAINT fk_membership_assigner FOREIGN KEY (assigned_by) REFERENCES accounts(id)
);
-- Preserve established relationships only; never infer membership from cycle alone.
INSERT INTO course_student_memberships (course_id, student_id, active, assigned_at, updated_at)
SELECT DISTINCT e.course_id, e.account_id, 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM enrollments e
WHERE e.course_id IS NOT NULL AND e.account_id IS NOT NULL
  AND e.status IN ('PENDING', 'APPROVED', 'COMPLETED');
