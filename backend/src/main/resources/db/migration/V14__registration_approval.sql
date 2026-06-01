ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';

CREATE TABLE registration_tokens (
    id         UUID         PRIMARY KEY,
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
