CREATE TABLE category_fields (
    id            UUID         PRIMARY KEY,
    category_id   UUID         NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    field_type    VARCHAR(20)  NOT NULL,
    options       TEXT,
    sort_order    INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);