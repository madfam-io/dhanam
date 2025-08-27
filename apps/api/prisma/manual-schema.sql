-- Manual schema creation to bypass Prisma permission issues
-- Run this directly in PostgreSQL

-- Ensure we're using the correct database
\c dhanam;

-- Grant all permissions
GRANT ALL PRIVILEGES ON DATABASE dhanam TO dhanam;
GRANT ALL ON SCHEMA public TO dhanam;
ALTER SCHEMA public OWNER TO dhanam;

-- Create a simple test table to verify permissions
CREATE TABLE IF NOT EXISTS test_permissions (
    id SERIAL PRIMARY KEY,
    test VARCHAR(255)
);

-- Insert test data
INSERT INTO test_permissions (test) VALUES ('Database permissions working!');

-- Verify
SELECT * FROM test_permissions;