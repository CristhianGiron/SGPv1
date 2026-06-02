ALTER TABLE practice_photos
    ADD COLUMN public_token VARCHAR(36);

UPDATE practice_photos
SET public_token = UUID()
WHERE public_token IS NULL;

CREATE UNIQUE INDEX uk_practice_photos_public_token
    ON practice_photos (public_token);
