CREATE TABLE entity_images (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    content_type VARCHAR(40) NOT NULL,
    data LONGBLOB NOT NULL
);
ALTER TABLE courses ADD COLUMN cover_image_id BIGINT NULL;
ALTER TABLE institutions ADD COLUMN logo_image_id BIGINT NULL;
ALTER TABLE courses ADD CONSTRAINT uk_course_cover_image UNIQUE (cover_image_id);
ALTER TABLE institutions ADD CONSTRAINT uk_institution_logo_image UNIQUE (logo_image_id);
ALTER TABLE courses ADD CONSTRAINT fk_course_cover_image FOREIGN KEY (cover_image_id) REFERENCES entity_images(id);
ALTER TABLE institutions ADD CONSTRAINT fk_institution_logo_image FOREIGN KEY (logo_image_id) REFERENCES entity_images(id);
