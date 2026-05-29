-- Removes the old free-text approval field from practice documents.
-- Review comments such as approval_feedback remain because they are feedback sections.

SET @sql = (
    SELECT IF(
        COUNT(*) = 1,
        'ALTER TABLE activity_plans DROP COLUMN approval',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
        AND table_name = 'activity_plans'
        AND column_name = 'approval'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 1,
        'ALTER TABLE practice_reports DROP COLUMN approval',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
        AND table_name = 'practice_reports'
        AND column_name = 'approval'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 1,
        'ALTER TABLE final_reports DROP COLUMN approval',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
        AND table_name = 'final_reports'
        AND column_name = 'approval'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
