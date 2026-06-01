CREATE TABLE item_field_values (
    id         UUID      PRIMARY KEY,
    item_id    UUID      NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    field_id   UUID      NOT NULL REFERENCES category_fields(id) ON DELETE CASCADE,
    value      TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_item_field UNIQUE (item_id, field_id)
);