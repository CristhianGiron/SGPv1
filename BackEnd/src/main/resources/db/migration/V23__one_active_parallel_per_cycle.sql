-- Nullable slot retains withdrawn roster history without occupying an active cycle.
ALTER TABLE course_student_memberships ADD COLUMN active_cycle_id BIGINT NULL;
UPDATE course_student_memberships m JOIN courses c ON c.id=m.course_id
LEFT JOIN subjects s ON s.id=c.subject_id
SET m.active_cycle_id=COALESCE(c.academic_cycle_id,s.academic_cycle_id)
WHERE m.active=1;
-- Conflicting legacy rosters must be reconciled by academic staff before migrating.
-- Never silently choose a parallel or erase an existing practice/history.
ALTER TABLE course_student_memberships ADD CONSTRAINT uk_student_active_cycle UNIQUE (student_id,active_cycle_id);
ALTER TABLE course_student_memberships ADD CONSTRAINT fk_membership_active_cycle FOREIGN KEY (active_cycle_id) REFERENCES academic_cycles(id);
