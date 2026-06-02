ALTER TABLE courses
    ADD COLUMN academic_cycle_id BIGINT NULL;

ALTER TABLE courses
    ADD CONSTRAINT fk_courses_academic_cycle
        FOREIGN KEY (academic_cycle_id)
        REFERENCES academic_cycles (id);

ALTER TABLE subjects
    ADD COLUMN course_id BIGINT NULL;

ALTER TABLE subjects
    ADD CONSTRAINT fk_subjects_course
        FOREIGN KEY (course_id)
        REFERENCES courses (id);
