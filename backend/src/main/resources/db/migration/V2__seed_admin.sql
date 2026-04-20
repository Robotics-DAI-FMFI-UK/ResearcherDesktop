INSERT INTO users (username, password_hash, role, created_at, updated_at)
VALUES (
    'admin',
    '$2y$10$PEuR0tT48e6mvcXgBp/nbeAA8yUzy.e/txgo31C4V8aHaH0ibWtLi',
    'ADMIN',
    NOW(),
    NOW()
);