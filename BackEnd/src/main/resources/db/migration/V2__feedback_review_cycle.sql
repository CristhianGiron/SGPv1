-- Adds review-cycle tracking and append-only feedback history.
-- The statements are guarded so this migration can be applied safely to
-- existing databases where Hibernate may already have created the columns.

CREATE TABLE IF NOT EXISTS feedback_history_entries (
    id BIGINT NOT NULL AUTO_INCREMENT,
    document_type VARCHAR(80) NOT NULL,
    document_id BIGINT NOT NULL,
    section_key VARCHAR(120) NOT NULL,
    entry_id BIGINT NOT NULL DEFAULT 0,
    review_cycle INT NOT NULL DEFAULT 0,
    author_id BIGINT NULL,
    author_role VARCHAR(120),
    message LONGTEXT,
    created_at DATETIME,
    updated_at DATETIME,
    PRIMARY KEY (id),
    INDEX idx_feedback_history_document (document_type, document_id),
    INDEX idx_feedback_history_author (author_id),
    CONSTRAINT fk_feedback_history_author FOREIGN KEY (author_id) REFERENCES accounts (id)
);

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE activity_plans ADD COLUMN review_cycle INT NOT NULL DEFAULT 0',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
        AND table_name = 'activity_plans'
        AND column_name = 'review_cycle'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE practice_reports ADD COLUMN review_cycle INT NOT NULL DEFAULT 0',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
        AND table_name = 'practice_reports'
        AND column_name = 'review_cycle'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE final_reports ADD COLUMN review_cycle INT NOT NULL DEFAULT 0',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
        AND table_name = 'final_reports'
        AND column_name = 'review_cycle'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE completed_activity_records ADD COLUMN review_cycle INT NOT NULL DEFAULT 0',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
        AND table_name = 'completed_activity_records'
        AND column_name = 'review_cycle'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE feedback_comments ADD COLUMN review_cycle INT NOT NULL DEFAULT 0',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
        AND table_name = 'feedback_comments'
        AND column_name = 'review_cycle'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
