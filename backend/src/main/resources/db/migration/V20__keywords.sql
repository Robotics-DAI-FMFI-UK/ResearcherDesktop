CREATE TABLE keywords (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE item_keywords (
    item_id UUID NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, keyword_id)
);
