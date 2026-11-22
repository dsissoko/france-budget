-- Bootstrap V2 autonome : uniquement DDL et aucune lecture du schéma public.
-- À exécuter après 001_schema.sql, 003_citizen_crud.sql et 004_votes.sql.
ALTER TABLE v2.reference_posts
  ADD COLUMN IF NOT EXISTS canonical text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 999,
  ADD COLUMN IF NOT EXISTS revenue_impact_category text,
  ADD COLUMN IF NOT EXISTS source_year integer;

CREATE TABLE IF NOT EXISTS v2.reference_parameters (
  reference_year integer PRIMARY KEY,
  reference_version text NOT NULL,
  baseline_rate_per_index numeric NOT NULL,
  budget_year integer NOT NULL,
  application_year integer NOT NULL,
  horizon_year integer NOT NULL,
  balance_threshold numeric NOT NULL,
  change_threshold numeric NOT NULL,
  momentum_threshold numeric NOT NULL
);

ALTER TABLE v2.budgets
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order integer,
  ADD COLUMN IF NOT EXISTS maturity_status text,
  ADD COLUMN IF NOT EXISTS confirmation_organization text,
  ADD COLUMN IF NOT EXISTS confirmation_evidence_url text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

CREATE OR REPLACE VIEW v2.latest_budgets AS
SELECT * FROM v2.budgets WHERE version='latest' AND publication_status='published';
