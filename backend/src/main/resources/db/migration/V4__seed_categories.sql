INSERT INTO categories (name, is_predefined, owner_id, created_at, updated_at)
SELECT p.name, TRUE, u.id, now(), now()
FROM (VALUES
    ('Publications'),
    ('Presentations'),
    ('Books'),
    ('Conferences'),
    ('Notes'),
    ('Calendar'),
    ('Posts')
) AS p(name)
CROSS JOIN (SELECT id FROM users WHERE username = 'admin') AS u;
