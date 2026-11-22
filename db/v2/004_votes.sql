-- V2-only votes and identity mapping for a future V1 -> V2 cutover.
-- Do not import old votes here: a separate audited migration needs a frozen ID map.
ALTER TABLE v2.budgets
  ADD COLUMN IF NOT EXISTS legacy_budget_id uuid UNIQUE;

-- Refresh the view's exposed columns after adding legacy_budget_id / published_at.
CREATE OR REPLACE VIEW v2.latest_budgets AS
SELECT * FROM v2.budgets
WHERE version='latest' AND publication_status='published';

CREATE TABLE IF NOT EXISTS v2.votes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  budget_id uuid NOT NULL REFERENCES v2.budgets(id) ON DELETE RESTRICT,
  voter_hash text NOT NULL CHECK (voter_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(budget_id,voter_hash)
);
CREATE INDEX IF NOT EXISTS v2_votes_budget_idx ON v2.votes(budget_id);

-- For migration use explicit audited mappings of public.budgets.id -> v2.budgets.id.
-- Example *after* verified mapping, on isolated QA only:
-- INSERT INTO v2.votes(budget_id,voter_hash,created_at)
-- SELECT b.id, v.voter_hash,v.created_at FROM public.votes v
-- JOIN v2.budgets b ON b.legacy_budget_id=v.budget_id
-- ON CONFLICT(budget_id,voter_hash) DO NOTHING;
