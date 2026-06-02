ALTER TABLE accounts
    ADD COLUMN career_id BIGINT NULL;

ALTER TABLE accounts
    ADD CONSTRAINT fk_accounts_career
        FOREIGN KEY (career_id)
        REFERENCES careers (id);
