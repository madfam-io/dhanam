-- Demo Data Seeding (SQL version to bypass Prisma bug)
\c dhanam;

-- Insert Guest User
INSERT INTO users (id, email, password_hash, name, locale, timezone, email_verified, onboarding_completed, onboarding_completed_at, is_active, created_at, updated_at)
VALUES 
('guest-user-id', 'guest@dhanam.demo', 'GUEST_NO_PASSWORD', 'Guest User', 'es', 'America/Mexico_City', true, true, NOW(), true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert Individual User (Maria)
INSERT INTO users (id, email, password_hash, name, locale, timezone, email_verified, onboarding_completed, onboarding_completed_at, is_active, created_at, updated_at)
VALUES 
('maria-user-id', 'maria@demo.com', '$argon2id$v=19$m=65536,t=3,p=4$demo_hash', 'Maria González', 'es', 'America/Mexico_City', true, true, NOW() - INTERVAL '30 days', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert Business User (Carlos)
INSERT INTO users (id, email, password_hash, name, locale, timezone, email_verified, onboarding_completed, onboarding_completed_at, is_active, totp_enabled, created_at, updated_at)
VALUES 
('carlos-user-id', 'carlos@business.com', '$argon2id$v=19$m=65536,t=3,p=4$demo_hash', 'Carlos Mendoza', 'es', 'America/Mexico_City', true, true, NOW() - INTERVAL '90 days', true, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert Enterprise User (Patricia)
INSERT INTO users (id, email, password_hash, name, locale, timezone, email_verified, onboarding_completed, onboarding_completed_at, is_active, totp_enabled, created_at, updated_at)
VALUES 
('patricia-user-id', 'admin@enterprise.com', '$argon2id$v=19$m=65536,t=3,p=4$demo_hash', 'Patricia Ruiz', 'en', 'America/Mexico_City', true, true, NOW() - INTERVAL '180 days', true, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert Platform Admin
INSERT INTO users (id, email, password_hash, name, locale, timezone, email_verified, onboarding_completed, is_active, is_admin, totp_enabled, created_at, updated_at)
VALUES 
('admin-user-id', 'admin@dhanam.app', '$argon2id$v=19$m=65536,t=3,p=4$admin_hash', 'Admin', 'en', 'America/Mexico_City', true, true, true, true, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert User Preferences
INSERT INTO user_preferences (id, user_id, dashboard_layout, default_currency, show_balances, esg_score_visibility, created_at, updated_at)
VALUES 
('guest-prefs-id', 'guest-user-id', 'demo', 'MXN', true, true, NOW(), NOW()),
('maria-prefs-id', 'maria-user-id', 'standard', 'MXN', true, true, NOW(), NOW()),
('carlos-prefs-id', 'carlos-user-id', 'standard', 'MXN', true, true, NOW(), NOW()),
('patricia-prefs-id', 'patricia-user-id', 'standard', 'USD', true, true, NOW(), NOW()),
('admin-prefs-id', 'admin-user-id', 'standard', 'USD', true, false, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Insert Spaces
INSERT INTO spaces (id, name, type, currency, timezone, created_at, updated_at)
VALUES 
('guest-space-id', 'Demo Personal Finance', 'personal', 'MXN', 'America/Mexico_City', NOW(), NOW()),
('maria-space-id', 'Personal', 'personal', 'MXN', 'America/Mexico_City', NOW(), NOW()),
('carlos-personal-id', 'Personal', 'personal', 'MXN', 'America/Mexico_City', NOW(), NOW()),
('carlos-business-id', 'Tacos El Patrón', 'business', 'MXN', 'America/Mexico_City', NOW(), NOW()),
('enterprise-space-id', 'TechCorp México', 'business', 'USD', 'America/Mexico_City', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert User-Space relationships
INSERT INTO user_spaces (id, user_id, space_id, role, created_at)
VALUES 
('guest-space-rel', 'guest-user-id', 'guest-space-id', 'viewer', NOW()),
('maria-space-rel', 'maria-user-id', 'maria-space-id', 'owner', NOW()),
('carlos-personal-rel', 'carlos-user-id', 'carlos-personal-id', 'owner', NOW()),
('carlos-business-rel', 'carlos-user-id', 'carlos-business-id', 'owner', NOW()),
('patricia-enterprise-rel', 'patricia-user-id', 'enterprise-space-id', 'owner', NOW())
ON CONFLICT (user_id, space_id) DO NOTHING;

-- Insert Accounts
INSERT INTO accounts (id, space_id, provider, provider_account_id, name, type, subtype, currency, balance, last_synced_at, created_at, updated_at)
VALUES 
-- Guest accounts
('guest-checking', 'guest-space-id', 'manual', 'guest-checking', 'BBVA Checking', 'checking', 'checking', 'MXN', 45320.50, NOW(), NOW(), NOW()),
('guest-savings', 'guest-space-id', 'manual', 'guest-savings', 'Santander Savings', 'savings', 'savings', 'MXN', 125000.00, NOW(), NOW(), NOW()),
('guest-credit', 'guest-space-id', 'manual', 'guest-credit', 'Banamex Credit Card', 'credit', 'credit_card', 'MXN', -8500.00, NOW(), NOW(), NOW()),

-- Maria accounts  
('maria-checking', 'maria-space-id', 'belvo', 'maria-bbva-checking', 'BBVA Nómina', 'checking', 'checking', 'MXN', 28750.30, NOW(), NOW(), NOW()),
('maria-savings', 'maria-space-id', 'belvo', 'maria-nu-savings', 'Nu Cuenta', 'savings', 'savings', 'MXN', 45000.00, NOW(), NOW(), NOW()),
('maria-crypto', 'maria-space-id', 'bitso', 'maria-bitso', 'Bitso Wallet', 'crypto', 'exchange', 'MXN', 15000.00, NOW(), NOW(), NOW()),

-- Carlos business accounts
('carlos-business-checking', 'carlos-business-id', 'belvo', 'business-main', 'BBVA Business', 'checking', 'business_checking', 'MXN', 285000.00, NOW(), NOW(), NOW()),
('carlos-business-savings', 'carlos-business-id', 'manual', 'business-savings', 'Banorte Business Savings', 'savings', 'business_savings', 'MXN', 520000.00, NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Budgets
INSERT INTO budgets (id, space_id, name, period, amount, currency, start_date, end_date, is_active, created_at, updated_at)
VALUES 
('guest-budget', 'guest-space-id', 'Monthly Budget', 'monthly', 65000.00, 'MXN', DATE_TRUNC('month', NOW()), DATE_TRUNC('month', NOW() + INTERVAL '1 month') - INTERVAL '1 day', true, NOW(), NOW()),
('maria-budget', 'maria-space-id', 'Monthly Budget', 'monthly', 65000.00, 'MXN', DATE_TRUNC('month', NOW()), DATE_TRUNC('month', NOW() + INTERVAL '1 month') - INTERVAL '1 day', true, NOW(), NOW()),
('carlos-business-budget', 'carlos-business-id', 'Q1 2024 Budget', 'quarterly', 1500000.00, 'MXN', '2024-01-01', '2024-03-31', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Categories
INSERT INTO categories (id, budget_id, name, budget_amount, color, icon, created_at, updated_at)
VALUES 
-- Guest categories
('guest-rent', 'guest-budget', 'Rent', 15000.00, '#FF6B6B', '🏠', NOW(), NOW()),
('guest-groceries', 'guest-budget', 'Groceries', 6000.00, '#4ECDC4', '🛒', NOW(), NOW()),
('guest-transport', 'guest-budget', 'Transportation', 3000.00, '#45B7D1', '🚗', NOW(), NOW()),
('guest-entertainment', 'guest-budget', 'Entertainment', 4000.00, '#96CEB4', '🎬', NOW(), NOW()),
('guest-savings', 'guest-budget', 'Savings', 15000.00, '#FECA57', '💰', NOW(), NOW()),

-- Maria categories (same structure)
('maria-rent', 'maria-budget', 'Rent', 15000.00, '#FF6B6B', '🏠', NOW(), NOW()),
('maria-groceries', 'maria-budget', 'Groceries', 6000.00, '#4ECDC4', '🛒', NOW(), NOW()),
('maria-transport', 'maria-budget', 'Transportation', 3000.00, '#45B7D1', '🚗', NOW(), NOW()),
('maria-entertainment', 'maria-budget', 'Entertainment', 4000.00, '#96CEB4', '🎬', NOW(), NOW()),

-- Carlos business categories
('carlos-payroll', 'carlos-business-budget', 'Payroll', 450000.00, '#FF6B6B', '👥', NOW(), NOW()),
('carlos-inventory', 'carlos-business-budget', 'Inventory', 300000.00, '#4ECDC4', '📦', NOW(), NOW()),
('carlos-rent-biz', 'carlos-business-budget', 'Rent', 105000.00, '#45B7D1', '🏢', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Transactions
INSERT INTO transactions (id, account_id, space_id, category_id, amount, currency, description, merchant_name, date, pending, created_at, updated_at)
VALUES 
-- Guest transactions
('guest-tx-1', 'guest-checking', 'guest-space-id', 'guest-groceries', -150.00, 'MXN', 'Oxxo', 'Oxxo', NOW() - INTERVAL '1 day', false, NOW(), NOW()),
('guest-tx-2', 'guest-checking', 'guest-space-id', 'guest-transport', -120.00, 'MXN', 'Uber', 'Uber', NOW() - INTERVAL '2 days', false, NOW(), NOW()),
('guest-tx-3', 'guest-checking', 'guest-space-id', 'guest-entertainment', -169.00, 'MXN', 'Netflix', 'Netflix', NOW() - INTERVAL '3 days', false, NOW(), NOW()),
('guest-tx-4', 'guest-checking', 'guest-space-id', NULL, 35000.00, 'MXN', 'Salary Deposit', 'Company Payroll', NOW() - INTERVAL '5 days', false, NOW(), NOW()),
('guest-tx-5', 'guest-checking', 'guest-space-id', 'guest-groceries', -2300.00, 'MXN', 'Soriana', 'Soriana', NOW() - INTERVAL '7 days', false, NOW(), NOW()),

-- Maria transactions  
('maria-tx-1', 'maria-checking', 'maria-space-id', 'maria-groceries', -250.00, 'MXN', 'Oxxo', 'Oxxo', NOW() - INTERVAL '1 day', false, NOW(), NOW()),
('maria-tx-2', 'maria-checking', 'maria-space-id', 'maria-transport', -300.00, 'MXN', 'Gas Station', 'Pemex', NOW() - INTERVAL '3 days', false, NOW(), NOW()),
('maria-tx-3', 'maria-checking', 'maria-space-id', NULL, 45000.00, 'MXN', 'Salary', 'Tech Company', NOW() - INTERVAL '15 days', false, NOW(), NOW()),

-- Carlos business transactions
('carlos-tx-1', 'carlos-business-checking', 'carlos-business-id', 'carlos-payroll', -75000.00, 'MXN', 'Employee Salaries', 'Payroll System', NOW() - INTERVAL '1 day', false, NOW(), NOW()),
('carlos-tx-2', 'carlos-business-checking', 'carlos-business-id', 'carlos-inventory', -25000.00, 'MXN', 'Food Supplies', 'Wholesale Market', NOW() - INTERVAL '3 days', false, NOW(), NOW()),
('carlos-tx-3', 'carlos-business-checking', 'carlos-business-id', NULL, 185000.00, 'MXN', 'Daily Sales', 'POS System', NOW() - INTERVAL '1 day', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Feature Flags
INSERT INTO feature_flags (id, name, enabled, description, rollout, created_at, updated_at)
VALUES 
('flag-guest-access', 'guest_access', true, 'Enable guest access to demo', 100, NOW(), NOW()),
('flag-esg-scoring', 'esg_scoring', true, 'ESG scoring for crypto assets', 100, NOW(), NOW()),
('flag-ai-categorization', 'ai_categorization', true, 'AI-powered transaction categorization', 50, NOW(), NOW()),
('flag-mobile-biometric', 'mobile_biometric', true, 'Biometric auth on mobile', 100, NOW(), NOW()),
('flag-dark-mode', 'dark_mode', true, 'Dark mode theme', 100, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET enabled = EXCLUDED.enabled, rollout = EXCLUDED.rollout;

-- Insert Sample Rules
INSERT INTO rules (id, category_id, type, value, is_active, created_at)
VALUES 
('rule-oxxo', 'guest-groceries', 'keyword', 'oxxo', true, NOW()),
('rule-uber', 'guest-transport', 'keyword', 'uber', true, NOW()),
('rule-netflix', 'guest-entertainment', 'keyword', 'netflix', true, NOW()),
('rule-maria-oxxo', 'maria-groceries', 'keyword', 'oxxo', true, NOW()),
('rule-maria-uber', 'maria-transport', 'keyword', 'uber', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Valuation Snapshots (30 days)
INSERT INTO valuation_snapshots (id, space_id, date, total_value, currency, breakdown, created_at)
SELECT 
    gen_random_uuid(),
    'guest-space-id',
    (NOW() - INTERVAL '30 days')::date + (generate_series * INTERVAL '1 day'),
    161820.50 + (RANDOM() * 10000 - 5000), -- Base value with +/- variation
    'MXN',
    jsonb_build_object(
        'checking', 45320.50,
        'savings', 125000.00,
        'credit', -8500.00
    ),
    NOW()
FROM generate_series(0, 29) AS generate_series
ON CONFLICT (space_id, date) DO NOTHING;

-- Success message
SELECT 'Demo data seeded successfully!' as status, 
       (SELECT COUNT(*) FROM users) as users_count,
       (SELECT COUNT(*) FROM spaces) as spaces_count,
       (SELECT COUNT(*) FROM accounts) as accounts_count,
       (SELECT COUNT(*) FROM transactions) as transactions_count;