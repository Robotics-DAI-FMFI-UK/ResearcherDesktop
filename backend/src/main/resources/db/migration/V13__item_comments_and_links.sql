CREATE TABLE item_comments (
    id         UUID      PRIMARY KEY,
    item_id    UUID      NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    text       TEXT      NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE item_links (
    id          UUID         PRIMARY KEY,
    item_id     UUID         NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    url         TEXT         NOT NULL,
    description VARCHAR(500),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
