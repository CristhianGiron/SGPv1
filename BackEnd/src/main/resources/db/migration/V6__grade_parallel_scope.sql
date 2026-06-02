CREATE TABLE grade_parallels (
    id BIGINT NOT NULL AUTO_INCREMENT,
    letter VARCHAR(1) NOT NULL,
    name VARCHAR(255) NOT NULL,
    grade_id BIGINT NOT NULL,
    active BIT NOT NULL DEFAULT 1,
    deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_grade_parallel_letter UNIQUE (grade_id, letter),
    CONSTRAINT fk_grade_parallels_grade FOREIGN KEY (grade_id) REFERENCES grades (id)
);

ALTER TABLE subjects
    ADD COLUMN grade_parallel_id BIGINT NULL;

ALTER TABLE subjects
    ADD CONSTRAINT fk_subjects_grade_parallel
        FOREIGN KEY (grade_parallel_id)
        REFERENCES grade_parallels (id);

ALTER TABLE accounts
    ADD COLUMN grade_id BIGINT NULL,
    ADD COLUMN grade_parallel_id BIGINT NULL;

ALTER TABLE accounts
    ADD CONSTRAINT fk_accounts_grade
        FOREIGN KEY (grade_id)
        REFERENCES grades (id);

ALTER TABLE accounts
    ADD CONSTRAINT fk_accounts_grade_parallel
        FOREIGN KEY (grade_parallel_id)
        REFERENCES grade_parallels (id);
