CREATE TABLE research_items (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    date           DATE,
    image_path     VARCHAR(500),
    file_path      VARCHAR(500),
    category_id    UUID         NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    owner_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at     TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT now(),
    search_vector  TSVECTOR     GENERATED ALWAYS AS (
        to_tsvector('english',
            COALESCE(title, '') || ' ' || COALESCE(description, ''))
    ) STORED
);

CREATE TABLE research_item_relations (
    id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    source_item_id UUID      NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    target_item_id UUID      NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_item_relation UNIQUE (source_item_id, target_item_id),
    CONSTRAINT chk_no_self_link CHECK  (source_item_id != target_item_id)
);

