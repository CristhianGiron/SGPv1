-- Add the surrogate key only when Hibernate has not created it already.
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE institution_education_levels ADD COLUMN id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST',
    'SELECT 1') FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'institution_education_levels' AND column_name = 'id');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
