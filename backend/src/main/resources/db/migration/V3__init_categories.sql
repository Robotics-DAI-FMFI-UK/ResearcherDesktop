CREATE TABLE categories (
    id            UUID         PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    description   TEXT,
    is_predefined BOOLEAN      NOT NULL DEFAULT FALSE,
    owner_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);
