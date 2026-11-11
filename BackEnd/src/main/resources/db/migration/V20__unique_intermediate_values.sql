-- Preserve the earliest row when repeated intermediate values exist.
DELETE t1 FROM institution_education_levels t1 INNER JOIN institution_education_levels t2
    ON t1.institution_id = t2.institution_id AND t1.education_level = t2.education_level AND t1.id > t2.id;
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE institution_education_levels ADD CONSTRAINT uq_institution_education_levels_institution_level UNIQUE (institution_id, education_level)',
    'SELECT 1') FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'institution_education_levels' AND index_name = 'uq_institution_education_levels_institution_level');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
DELETE t1 FROM student_practice_form_answer_options t1 INNER JOIN student_practice_form_answer_options t2
    ON t1.answer_id = t2.answer_id AND t1.selected_option = t2.selected_option AND t1.id > t2.id;
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE student_practice_form_answer_options ADD CONSTRAINT uq_student_practice_answer_options_answer_option UNIQUE (answer_id, selected_option)',
    'SELECT 1') FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'student_practice_form_answer_options' AND index_name = 'uq_student_practice_answer_options_answer_option');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
