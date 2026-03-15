-- Row Level Security Policies for Dhanam
-- Enforces tenant isolation at the database level.
-- The API sets current_setting('app.current_user_id') per-request via:
--   SET LOCAL app.current_user_id = '<user-uuid>';
-- When not set, no rows are visible (fail-safe).

-- ============================================================
-- Enable RLS on space-scoped tables
-- ============================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_assets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Enable RLS on user-scoped and document tables
-- ============================================================
ALTER TABLE provider_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Space-scoped policies (via user_spaces join)
-- ============================================================

-- Accounts: users can only access accounts in their spaces
CREATE POLICY accounts_space_isolation ON accounts
  USING (space_id IN (
    SELECT space_id FROM user_spaces WHERE user_id = current_setting('app.current_user_id', true)
  ));

-- Transactions: users can only access transactions in their space's accounts
CREATE POLICY transactions_space_isolation ON transactions
  USING (account_id IN (
    SELECT a.id FROM accounts a
    JOIN user_spaces us ON us.space_id = a.space_id
    WHERE us.user_id = current_setting('app.current_user_id', true)
  ));

-- Budgets: users can only access budgets in their spaces
CREATE POLICY budgets_space_isolation ON budgets
  USING (space_id IN (
    SELECT space_id FROM user_spaces WHERE user_id = current_setting('app.current_user_id', true)
  ));

-- Categories: users can only access categories in their space's budgets
CREATE POLICY categories_space_isolation ON categories
  USING (budget_id IN (
    SELECT b.id FROM budgets b
    JOIN user_spaces us ON us.space_id = b.space_id
    WHERE us.user_id = current_setting('app.current_user_id', true)
  ));

-- Transaction rules: users can only access rules in their spaces
CREATE POLICY rules_space_isolation ON transaction_rules
  USING (space_id IN (
    SELECT space_id FROM user_spaces WHERE user_id = current_setting('app.current_user_id', true)
  ));

-- Goals: users can only access goals in their spaces
CREATE POLICY goals_space_isolation ON goals
  USING (space_id IN (
    SELECT space_id FROM user_spaces WHERE user_id = current_setting('app.current_user_id', true)
  ));

-- Manual assets: users can only access manual assets in their spaces
CREATE POLICY manual_assets_space_isolation ON manual_assets
  USING (space_id IN (
    SELECT space_id FROM user_spaces WHERE user_id = current_setting('app.current_user_id', true)
  ));

-- Documents: users can only access documents in their spaces
CREATE POLICY documents_space_isolation ON documents
  USING (space_id IN (
    SELECT space_id FROM user_spaces WHERE user_id = current_setting('app.current_user_id', true)
  ));

-- ============================================================
-- User-scoped policies (direct userId match)
-- ============================================================

-- Provider connections: users can only access their own connections
CREATE POLICY provider_connections_user_isolation ON provider_connections
  USING (user_id = current_setting('app.current_user_id', true));
