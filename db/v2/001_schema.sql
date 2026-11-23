-- Backend V2 isolated: no writes to the V1 public schema.
CREATE SCHEMA IF NOT EXISTS v2;

CREATE TABLE IF NOT EXISTS v2.reference_posts (
  reference_year integer NOT NULL,
  side text NOT NULL CHECK (side IN ('revenues','expenses','offBudget')),
  category_id text NOT NULL,
  label text NOT NULL,
  reference_amount_bn numeric(18,3) NOT NULL,
  PRIMARY KEY(reference_year,side,category_id)
);

CREATE TABLE IF NOT EXISTS v2.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_key text NOT NULL CHECK (length(trim(budget_key)) > 0),
  version text NOT NULL CHECK (length(trim(version)) > 0),
  origin text NOT NULL CHECK (origin IN ('citizen','party','educational')),
  party_code text,
  author text,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text NOT NULL DEFAULT '',
  reference_year integer NOT NULL,
  source_year integer,
  budget_mode text NOT NULL CHECK (budget_mode IN ('PARTIAL','AGGREGATE')),
  documentary jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(documentary)='object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(budget_key,version),
  UNIQUE(id,reference_year)
);
CREATE INDEX IF NOT EXISTS v2_budgets_latest_idx ON v2.budgets(budget_key) WHERE version='latest';

CREATE TABLE IF NOT EXISTS v2.budget_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES v2.budgets(id) ON DELETE CASCADE,
  proposal_key text NOT NULL CHECK (length(trim(proposal_key)) > 0),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text NOT NULL DEFAULT '',
  UNIQUE(budget_id,proposal_key),
  UNIQUE(id,budget_id)
);

-- A source measure is an extracted commitment, distinct from its consolidated proposal.
-- Citizen-authored proposals need not have source measures.
CREATE TABLE IF NOT EXISTS v2.budget_measures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL,
  proposal_id uuid NOT NULL,
  measure_key text NOT NULL CHECK (length(trim(measure_key)) > 0),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text NOT NULL DEFAULT '',
  claimed_amount_bn numeric(18,3),
  source_url text,
  source_year integer,
  direction text,
  amount_unit text,
  source_section text,
  source_status text,
  source_origin text,
  source_excerpt text,
  notes text,
  UNIQUE(budget_id,measure_key),
  FOREIGN KEY(proposal_id,budget_id) REFERENCES v2.budget_proposals(id,budget_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS v2_measure_budget_idx ON v2.budget_measures(budget_id);
CREATE INDEX IF NOT EXISTS v2_measure_proposal_idx ON v2.budget_measures(proposal_id);

CREATE TABLE IF NOT EXISTS v2.budget_impacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL,
  proposal_id uuid NOT NULL,
  reference_year integer NOT NULL,
  side text NOT NULL CHECK (side IN ('revenues','expenses','offBudget')),
  category_id text NOT NULL,
  delta_amount_bn numeric(18,3) NOT NULL CHECK (delta_amount_bn <> 0),
  FOREIGN KEY(proposal_id,budget_id) REFERENCES v2.budget_proposals(id,budget_id) ON DELETE CASCADE,
  FOREIGN KEY(budget_id,reference_year) REFERENCES v2.budgets(id,reference_year),
  FOREIGN KEY(reference_year,side,category_id) REFERENCES v2.reference_posts(reference_year,side,category_id),
  UNIQUE(budget_id,side,category_id),
  UNIQUE(proposal_id,side,category_id)
);
CREATE INDEX IF NOT EXISTS v2_proposal_budget_idx ON v2.budget_proposals(budget_id);
CREATE INDEX IF NOT EXISTS v2_impact_budget_idx ON v2.budget_impacts(budget_id);

-- Atomic import of the four canonical CSVs. Citizens can submit proposals without measures.
CREATE OR REPLACE FUNCTION v2.import_budget(payload jsonb) RETURNS uuid
LANGUAGE plpgsql SET search_path = v2, pg_temp AS $$
DECLARE
  b jsonb := payload->'budget';
  ps jsonb := payload->'proposals';
  ms jsonb := coalesce(payload->'measures','[]'::jsonb);
  impacts jsonb := payload->'impacts';
  budget_uuid uuid;
  p jsonb;
  m jsonb;
  i jsonb;
  proposal_uuid uuid;
  yr integer;
BEGIN
  IF jsonb_typeof(b)<>'object' OR jsonb_typeof(ps)<>'array'
    OR jsonb_typeof(ms)<>'array' OR jsonb_typeof(impacts)<>'array'
    THEN RAISE EXCEPTION 'invalid_csv_payload'; END IF;
  IF NULLIF(b->>'budget_key','') IS NULL OR NULLIF(b->>'version','') IS NULL
    THEN RAISE EXCEPTION 'missing_budget_key_or_version'; END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(ps)) <>
     (SELECT count(DISTINCT x->>'proposal_key') FROM jsonb_array_elements(ps) x)
    THEN RAISE EXCEPTION 'duplicate_proposal_key'; END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(ms)) <>
     (SELECT count(DISTINCT x->>'measure_key') FROM jsonb_array_elements(ms) x)
    THEN RAISE EXCEPTION 'duplicate_measure_key'; END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(impacts)) <>
     (SELECT count(DISTINCT concat_ws(':',x->>'side',x->>'category_id')) FROM jsonb_array_elements(impacts) x)
    THEN RAISE EXCEPTION 'duplicate_budget_post'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(ms) x
    WHERE x->>'budget_key' IS DISTINCT FROM b->>'budget_key'
      OR NULLIF(x->>'measure_key','') IS NULL
      OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(ps) y
        WHERE y->>'proposal_key'=x->>'proposal_key'))
    THEN RAISE EXCEPTION 'orphan_or_invalid_measure'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(impacts) x
    WHERE x->>'budget_key' IS DISTINCT FROM b->>'budget_key'
      OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(ps) y
        WHERE y->>'proposal_key'=x->>'proposal_key'))
    THEN RAISE EXCEPTION 'orphan_impact'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(b->>'budget_key'),hashtext(b->>'version'));
  yr := (b->>'reference_year')::integer;
  INSERT INTO v2.budgets(budget_key,version,origin,party_code,author,title,description,reference_year,source_year,budget_mode,documentary)
  VALUES(b->>'budget_key',b->>'version',b->>'origin',NULLIF(b->>'party_code',''),
    NULLIF(b->>'author',''),b->>'title',coalesce(b->>'description',''),yr,
    NULLIF(b->>'source_year','')::integer,coalesce(NULLIF(b->>'budget_mode',''),'PARTIAL'),
    coalesce(b->'documentary','{}'::jsonb))
  ON CONFLICT(budget_key,version) DO UPDATE SET
    origin=excluded.origin,party_code=excluded.party_code,author=excluded.author,
    title=excluded.title,description=excluded.description,reference_year=excluded.reference_year,
    source_year=excluded.source_year,budget_mode=excluded.budget_mode,
    documentary=excluded.documentary,updated_at=now()
  RETURNING id INTO budget_uuid;
  FOR p IN SELECT value FROM jsonb_array_elements(ps) LOOP
    IF p->>'budget_key' IS DISTINCT FROM b->>'budget_key' OR NULLIF(p->>'proposal_key','') IS NULL
      THEN RAISE EXCEPTION 'invalid_proposal_budget_reference'; END IF;
    INSERT INTO v2.budget_proposals(budget_id,proposal_key,title,description)
    VALUES(budget_uuid,p->>'proposal_key',p->>'title',coalesce(p->>'description',''))
    ON CONFLICT(budget_id,proposal_key) DO UPDATE SET
      title=excluded.title,description=excluded.description;
  END LOOP;
  -- Clear obsolete measures and impacts before obsolete proposals (FK order).
  DELETE FROM v2.budget_measures old WHERE old.budget_id=budget_uuid
    AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(ms) x WHERE x->>'measure_key'=old.measure_key);
  DELETE FROM v2.budget_impacts old WHERE old.budget_id=budget_uuid
    AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(impacts) x
      WHERE x->>'side'=old.side AND x->>'category_id'=old.category_id);
  DELETE FROM v2.budget_proposals old WHERE old.budget_id=budget_uuid
    AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(ps) x WHERE x->>'proposal_key'=old.proposal_key);
  FOR m IN SELECT value FROM jsonb_array_elements(ms) LOOP
    SELECT id INTO proposal_uuid FROM v2.budget_proposals
      WHERE budget_id=budget_uuid AND proposal_key=m->>'proposal_key';
    IF proposal_uuid IS NULL THEN RAISE EXCEPTION 'unknown_proposal_in_measure'; END IF;
    INSERT INTO v2.budget_measures(budget_id,proposal_id,measure_key,title,description,claimed_amount_bn,
      source_url,source_year,direction,amount_unit,source_section,source_status,source_origin,source_excerpt,notes)
    VALUES(budget_uuid,proposal_uuid,m->>'measure_key',m->>'title',coalesce(m->>'description',''),
      NULLIF(m->>'claimed_amount_bn','')::numeric,NULLIF(m->>'source_url',''),
      NULLIF(m->>'source_year','')::integer,NULLIF(m->>'direction',''),NULLIF(m->>'amount_unit',''),
      NULLIF(m->>'source_section',''),NULLIF(m->>'source_status',''),NULLIF(m->>'source_origin',''),
      NULLIF(m->>'source_excerpt',''),NULLIF(m->>'notes',''))
    ON CONFLICT(budget_id,measure_key) DO UPDATE SET
      proposal_id=excluded.proposal_id,title=excluded.title,description=excluded.description,
      claimed_amount_bn=excluded.claimed_amount_bn,source_url=excluded.source_url,
      source_year=excluded.source_year,direction=excluded.direction,amount_unit=excluded.amount_unit,
      source_section=excluded.source_section,source_status=excluded.source_status,
      source_origin=excluded.source_origin,source_excerpt=excluded.source_excerpt,notes=excluded.notes;
  END LOOP;
  FOR i IN SELECT value FROM jsonb_array_elements(impacts) LOOP
    SELECT id INTO proposal_uuid FROM v2.budget_proposals
      WHERE budget_id=budget_uuid AND proposal_key=i->>'proposal_key';
    IF proposal_uuid IS NULL THEN RAISE EXCEPTION 'unknown_proposal_in_impact'; END IF;
    INSERT INTO v2.budget_impacts(budget_id,proposal_id,reference_year,side,category_id,delta_amount_bn)
    VALUES(budget_uuid,proposal_uuid,yr,i->>'side',i->>'category_id',(i->>'delta_amount_bn')::numeric)
    ON CONFLICT(budget_id,side,category_id) DO UPDATE SET
      proposal_id=excluded.proposal_id,delta_amount_bn=excluded.delta_amount_bn,
      reference_year=excluded.reference_year;
  END LOOP;
  RETURN budget_uuid;
END $$;

-- Read contract: by default only latest is exposed to clients.
CREATE OR REPLACE VIEW v2.latest_budgets AS
SELECT * FROM v2.budgets WHERE version='latest';
