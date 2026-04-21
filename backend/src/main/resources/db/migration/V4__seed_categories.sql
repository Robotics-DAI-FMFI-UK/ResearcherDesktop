INSERT INTO categories (id, name, is_predefined, owner_id, created_at, updated_at)
SELECT p.id::UUID, p.name, TRUE, u.id, now(), now()
FROM (VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Publications'),
    ('b0000000-0000-0000-0000-000000000002', 'Presentations'),
    ('b0000000-0000-0000-0000-000000000003', 'Books'),
    ('b0000000-0000-0000-0000-000000000004', 'Conferences'),
    ('b0000000-0000-0000-0000-000000000005', 'Notes'),
    ('b0000000-0000-0000-0000-000000000006', 'Calendar'),
    ('b0000000-0000-0000-0000-000000000007', 'Posts')
) AS p(id, name)
CROSS JOIN (SELECT id FROM users WHERE username = 'admin') AS u;
