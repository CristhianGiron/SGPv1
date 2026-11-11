ALTER TABLE final_reports
    ADD COLUMN letterhead_image_id BIGINT NULL,
    ADD COLUMN completed_practice_minutes INT NULL,
    ADD COLUMN report_date DATE NULL,
    ADD CONSTRAINT uk_final_report_letterhead UNIQUE (letterhead_image_id),
    ADD CONSTRAINT fk_final_report_letterhead FOREIGN KEY (letterhead_image_id) REFERENCES entity_images(id);

ALTER TABLE careers ADD COLUMN degree_title VARCHAR(180) NULL;
