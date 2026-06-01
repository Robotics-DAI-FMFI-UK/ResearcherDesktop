CREATE TABLE item_files (
    id         UUID         PRIMARY KEY,
    item_id    UUID         NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    file_path  VARCHAR(500) NOT NULL,
    file_name  VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);