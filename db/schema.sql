-- France Budget — schema for Neon PostgreSQL. Apply on a new empty database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS budgets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
 description text NOT NULL DEFAULT '',
 origin text NOT NULL DEFAULT 'citizen' CHECK (origin IN ('citizen','party','educational')),
 visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','hidden')),
 reference_year integer NOT NULL CHECK (reference_year BETWEEN 2000 AND 2100),
 reference_data_version text,
 scenario jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(scenario)='object'),
 featured boolean NOT NULL DEFAULT false,
 featured_order integer,
 published_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS measures (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
 category_code text NOT NULL,
 title text NOT NULL,
 description text NOT NULL DEFAULT '',
 kind text NOT NULL CHECK (kind IN ('revenue','expense')),
 delta_amount numeric(18,3) NOT NULL,
 reference_amount numeric(18,3) NOT NULL CHECK (reference_amount >= 0),
 legacy_id text,
 theme text,
 source text,
 reference_year integer,
 status text,
 revenue_delta numeric(18,3),
 expense_delta numeric(18,3),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_measures_budget_legacy ON measures(budget_id,legacy_id) WHERE legacy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_featured ON budgets(featured_order,published_at DESC) WHERE featured=true AND visibility='public';
CREATE TABLE IF NOT EXISTS votes (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
 voter_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (budget_id,voter_hash)
);
CREATE TABLE IF NOT EXISTS publication_limits (
 fingerprint text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_budgets_public ON budgets(published_at DESC) WHERE visibility='public';
CREATE INDEX IF NOT EXISTS idx_votes_budget ON votes(budget_id);
CREATE INDEX IF NOT EXISTS idx_publication_limits_fingerprint ON publication_limits(fingerprint,created_at DESC);
CREATE OR REPLACE FUNCTION public.publish_citizen_budget(payload jsonb, fingerprint text) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE new_id uuid; m jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(8729104);
 IF (SELECT count(*) FROM budgets WHERE origin='citizen' AND visibility='public') >= 50 THEN
  RAISE EXCEPTION 'publication_limit_reached' USING ERRCODE='P0001';
 END IF;
 IF (SELECT count(*) FROM publication_limits WHERE publication_limits.fingerprint=publish_citizen_budget.fingerprint AND created_at>now()-interval '24 hours') >= 2 THEN
  RAISE EXCEPTION 'publication_rate_limited' USING ERRCODE='P0001';
 END IF;
 INSERT INTO budgets(title,description,origin,visibility,reference_year,scenario)
 VALUES(payload->>'title',coalesce(payload->>'description',''),'citizen','public',(payload->>'referenceYear')::int,payload->'scenario')
 RETURNING id INTO new_id;
 FOR m IN SELECT value FROM jsonb_array_elements(payload->'measures') LOOP
  INSERT INTO measures(budget_id,category_code,title,description,kind,delta_amount,reference_amount)
  VALUES(new_id,m->>'categoryCode',m->>'title',coalesce(m->>'description',''),m->>'kind',(m->>'deltaAmount')::numeric,(m->>'referenceAmount')::numeric);
 END LOOP;
 INSERT INTO publication_limits(fingerprint) VALUES(fingerprint);
 RETURN new_id;
END $$;

-- Référentiel canonique versionné (données 2025 et mesures politiques)
CREATE TABLE IF NOT EXISTS reference_categories (
 id text PRIMARY KEY, side text NOT NULL CHECK(side IN ('revenues','expenses')),
 label text NOT NULL,amount numeric(18,3) NOT NULL,canonical text NOT NULL,
 description text NOT NULL,reference_year int NOT NULL DEFAULT 2025,sort_order int NOT NULL
);
-- Ancienne table reference_measures : conserver uniquement pour migration et rollback.
-- Le catalogue courant des mesures politiques est désormais dans measures.
CREATE TABLE IF NOT EXISTS reference_measures (
 id text PRIMARY KEY,party text NOT NULL,theme text NOT NULL,title text NOT NULL,
 revenue_delta numeric(18,3) NOT NULL,expense_delta numeric(18,3) NOT NULL,
 source text NOT NULL,year int NOT NULL,status text NOT NULL,description text NOT NULL,
 sort_order int NOT NULL
);
