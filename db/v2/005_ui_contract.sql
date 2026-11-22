-- V2 canonical UI reference. Snapshot V1 published reference once on QA; no V1 runtime fallback.
ALTER TABLE v2.reference_posts
  ADD COLUMN IF NOT EXISTS canonical text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 999,
  ADD COLUMN IF NOT EXISTS revenue_impact_category text,
  ADD COLUMN IF NOT EXISTS source_year integer;

UPDATE v2.reference_posts t
SET canonical=s.canonical,description=s.description,sort_order=s.sort_order
FROM public.reference_categories s
WHERE t.reference_year=s.reference_year
  AND t.side=s.side AND t.category_id=s.id;

UPDATE v2.reference_posts t
SET canonical=s.canonical,description=s.description,sort_order=s.sort_order,
    revenue_impact_category=s.revenue_impact_category,source_year=s.source_year
FROM public.reference_off_budget s
WHERE t.side='offBudget' AND t.reference_year=2025 AND t.category_id=s.id;

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
INSERT INTO v2.reference_parameters (
 reference_year,reference_version,baseline_rate_per_index,budget_year,
 application_year,horizon_year,balance_threshold,change_threshold,momentum_threshold)
SELECT 2025,rv.id::text,
  max(mp.numeric_value) FILTER(WHERE mp.parameter_key='baselineRatePerIndex'),
  (max(mp.numeric_value) FILTER(WHERE mp.parameter_key='budgetYear'))::integer,
  (max(mp.numeric_value) FILTER(WHERE mp.parameter_key='applicationYear'))::integer,
  (max(mp.numeric_value) FILTER(WHERE mp.parameter_key='horizonYear'))::integer,
  max(mp.numeric_value) FILTER(WHERE mp.parameter_key='balanceThreshold'),
  max(mp.numeric_value) FILTER(WHERE mp.parameter_key='changeThreshold'),
  max(mp.numeric_value) FILTER(WHERE mp.parameter_key='momentumThreshold')
FROM public.reference_versions rv
JOIN public.model_parameters mp ON mp.reference_version_id=rv.id
WHERE rv.reference_year=2025 AND rv.status='active' AND mp.model_id='mechanical-v1'
GROUP BY rv.id,rv.published_at ORDER BY rv.published_at DESC LIMIT 1
ON CONFLICT(reference_year) DO NOTHING;

ALTER TABLE v2.budgets
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order integer,
  ADD COLUMN IF NOT EXISTS maturity_status text,
  ADD COLUMN IF NOT EXISTS confirmation_organization text,
  ADD COLUMN IF NOT EXISTS confirmation_evidence_url text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- QA presentation snapshot for source programmes only; do not import citizen test budgets.
UPDATE v2.budgets t
SET featured=s.featured,
    featured_order=s.featured_order,
    maturity_status=s.maturity_status,
    confirmation_organization=s.confirmation_organization,
    confirmation_evidence_url=s.confirmation_evidence_url,
    confirmed_at=s.confirmed_at
FROM public.budgets s
WHERE t.origin='party' AND s.origin='party'
  AND t.party_code=s.party_code
  AND (t.source_year IS NOT DISTINCT FROM
       NULLIF(regexp_replace(t.budget_key,'^.*-([0-9]{4})$','\\1'),'')::integer)
  AND s.visibility='public';

UPDATE v2.budgets
SET featured=true,featured_order=1,maturity_status='non_verifie'
WHERE budget_key='nopasaran-2025' AND origin='citizen';
