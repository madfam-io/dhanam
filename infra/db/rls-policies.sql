-- Row Level Security Policies for Dhanam
-- Apply after schema migration. Requires superuser or table owner.
-- These policies enforce tenant isolation at the database level.

-- Enable RLS on space-scoped tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access accounts in their spaces
CREATE POLICY accounts_space_isolation ON accounts
  USING (space_id IN (
    SELECT space_id FROM user_spaces WHERE user_id = current_setting('app.current_user_id', true)
  ));

-- Policy: Users can only access transactions in their space's accounts
CREATE POLICY transactions_space_isolation ON transactions
  USING (account_id IN (
    SELECT a.id FROM accounts a
    JOIN user_spaces us ON us.space_id = a.space_id
    WHERE us.user_id = current_setting('app.current_user_id', true)
  ));

-- Policy: Users can only access budgets in their spaces
CREATE POLICY budgets_space_isolation ON budgets
  USING (space_id IN (
    SELECT space_id FROM user_spaces WHERE user_id = current_setting('app.current_user_id', true)
  ));

-- Policy: Users can only access categories in their space's budgets
CREATE POLICY categories_space_isolation ON categories
  USING (budget_id IN (
    SELECT b.id FROM budgets b
    JOIN user_spaces us ON us.space_id = b.space_id
    WHERE us.user_id = current_setting('app.current_user_id', true)
  ));

-- Policy: Users can only access transaction rules in their spaces
CREATE POLICY rules_space_isolation ON transaction_rules
  USING (space_id IN (
    SELECT space_id FROM user_spaces WHERE user_id = current_setting('app.current_user_id', true)
  ));

-- Policy: Users can only access goals in their spaces
CREATE POLICY goals_space_isolation ON goals
  USING (space_id IN (
    SELECT space_id FROM user_spaces WHERE user_id = current_setting('app.current_user_id', true)
  ));

-- Policy: Users can only access manual assets in their spaces
CREATE POLICY manual_assets_space_isolation ON manual_assets
  USING (space_id IN (
    SELECT space_id FROM user_spaces WHERE user_id = current_setting('app.current_user_id', true)
  ));

-- Bypass policy for the application service role (used by Prisma)
-- The app sets current_setting('app.current_user_id') per-request
-- When not set, no rows are visible (fail-safe)

-- NOTE: RLS policies use current_setting('app.current_user_id', true)
-- The API must SET this per-request via Prisma $executeRaw:
--   SET LOCAL app.current_user_id = '<user-uuid>';
-- This is done in the request middleware.
