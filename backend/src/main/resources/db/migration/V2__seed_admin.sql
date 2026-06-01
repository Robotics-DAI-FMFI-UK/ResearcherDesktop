INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin',
    '$2y$10$PEuR0tT48e6mvcXgBp/nbeAA8yUzy.e/txgo31C4V8aHaH0ibWtLi',
    'ADMIN',
    NOW(),
    NOW()
);