ALTER TABLE categories ADD COLUMN icon VARCHAR(50) NOT NULL DEFAULT 'folder';

UPDATE categories SET icon = 'book-open'    WHERE name = 'Publications'  AND is_predefined = true;
UPDATE categories SET icon = 'presentation' WHERE name = 'Presentations' AND is_predefined = true;
UPDATE categories SET icon = 'bookmark'     WHERE name = 'Books'         AND is_predefined = true;
UPDATE categories SET icon = 'users'        WHERE name = 'Conferences'   AND is_predefined = true;
UPDATE categories SET icon = 'notebook-pen' WHERE name = 'Notes'         AND is_predefined = true;
UPDATE categories SET icon = 'calendar'     WHERE name = 'Calendar'      AND is_predefined = true;
UPDATE categories SET icon = 'rss'          WHERE name = 'Posts'         AND is_predefined = true;
