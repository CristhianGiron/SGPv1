-- Student-created practice forms, assigned to the institutional tutor or
-- institution director, with tabulable answers and open-question interpretation.

CREATE TABLE IF NOT EXISTS student_practice_forms (
    deleted BIT NOT NULL,
    answered_at DATETIME(6),
    created_at DATETIME(6),
    deleted_at DATETIME(6),
    educational_institution_id BIGINT,
    enrollment_id BIGINT NOT NULL,
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    target_account_id BIGINT NOT NULL,
    updated_at DATETIME(6),
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    status ENUM ('ANSWERED','DRAFT','SENT') NOT NULL,
    target_role ENUM ('INSTITUTION_DIRECTOR','INSTITUTIONAL_TUTOR','STUDENT_SELF') NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_student_practice_forms_student (student_id),
    INDEX idx_student_practice_forms_target (target_account_id),
    INDEX idx_student_practice_forms_enrollment (enrollment_id),
    CONSTRAINT fk_spf_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments (id),
    CONSTRAINT fk_spf_student FOREIGN KEY (student_id) REFERENCES accounts (id),
    CONSTRAINT fk_spf_target FOREIGN KEY (target_account_id) REFERENCES accounts (id),
    CONSTRAINT fk_spf_institution FOREIGN KEY (educational_institution_id) REFERENCES institutions (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_practice_form_questions (
    required BIT NOT NULL,
    question_order INT NOT NULL,
    scale_max INT,
    scale_min INT,
    form_id BIGINT NOT NULL,
    id BIGINT NOT NULL AUTO_INCREMENT,
    prompt VARCHAR(1000) NOT NULL,
    student_interpretation LONGTEXT,
    type ENUM ('MULTIPLE_CHOICE','NUMBER','OPEN_TEXT','SCALE','SINGLE_CHOICE','YES_NO') NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_spf_questions_form (form_id),
    CONSTRAINT fk_spf_questions_form FOREIGN KEY (form_id) REFERENCES student_practice_forms (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_practice_form_options (
    option_order INT NOT NULL,
    id BIGINT NOT NULL AUTO_INCREMENT,
    question_id BIGINT NOT NULL,
    label VARCHAR(300) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_spf_options_question (question_id),
    CONSTRAINT fk_spf_options_question FOREIGN KEY (question_id) REFERENCES student_practice_form_questions (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_practice_form_responses (
    form_id BIGINT NOT NULL,
    id BIGINT NOT NULL AUTO_INCREMENT,
    respondent_id BIGINT NOT NULL,
    submitted_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_spf_responses_form (form_id),
    INDEX idx_spf_responses_respondent (respondent_id),
    CONSTRAINT fk_spf_responses_form FOREIGN KEY (form_id) REFERENCES student_practice_forms (id),
    CONSTRAINT fk_spf_responses_respondent FOREIGN KEY (respondent_id) REFERENCES accounts (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_practice_form_answers (
    boolean_answer BIT,
    number_answer DECIMAL(19,4),
    id BIGINT NOT NULL AUTO_INCREMENT,
    question_id BIGINT NOT NULL,
    response_id BIGINT NOT NULL,
    text_answer LONGTEXT,
    PRIMARY KEY (id),
    INDEX idx_spf_answers_response (response_id),
    INDEX idx_spf_answers_question (question_id),
    CONSTRAINT fk_spf_answers_response FOREIGN KEY (response_id) REFERENCES student_practice_form_responses (id),
    CONSTRAINT fk_spf_answers_question FOREIGN KEY (question_id) REFERENCES student_practice_form_questions (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_practice_form_answer_options (
    answer_id BIGINT NOT NULL,
    selected_option VARCHAR(300),
    INDEX idx_spf_answer_options_answer (answer_id),
    CONSTRAINT fk_spf_answer_options_answer FOREIGN KEY (answer_id) REFERENCES student_practice_form_answers (id)
) ENGINE=InnoDB;
