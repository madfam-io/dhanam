-- Enable pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index on transaction description for fuzzy search
CREATE INDEX IF NOT EXISTS idx_txn_description_trgm
  ON transactions USING GIN (description gin_trgm_ops);

-- GIN trigram index on transaction merchant for fuzzy search
CREATE INDEX IF NOT EXISTS idx_txn_merchant_trgm
  ON transactions USING GIN (merchant gin_trgm_ops);
