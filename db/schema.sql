-- Mon Budget Citoyen — schema for Neon PostgreSQL. Apply on a new empty database.
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
 IF (SELECT count(*) FROM budgets WHERE origin='citizen' AND visibility='public') >= 100 THEN
  RAISE EXCEPTION 'publication_limit_reached' USING ERRCODE='P0001';
 END IF;
 IF (SELECT count(*) FROM publication_limits WHERE publication_limits.fingerprint=publish_citizen_budget.fingerprint AND created_at>now()-interval '24 hours') >= 100 THEN
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

-- Transversal aids are NEVER summed into APU 2025 public expenditure.
-- Off-budget loss-of-revenue baseline is from the official widened scope for 2024.
-- Changes are applied as equal and opposite changes to the configured receipt.
CREATE TABLE IF NOT EXISTS reference_off_budget (
 id text PRIMARY KEY,
 label text NOT NULL,
 amount numeric(18,3) NOT NULL CHECK (amount>=0),
 source_year integer NOT NULL,
 canonical text NOT NULL,
 description text NOT NULL,
 revenue_impact_category text NOT NULL,
 sort_order integer NOT NULL
);
INSERT INTO reference_off_budget(id,label,amount,source_year,canonical,description,revenue_impact_category,sort_order) VALUES
 ('business-tax-relief','Avantages fiscaux aux entreprises',49.7,2024,
  'Jaune budgétaire PLF 2027 — aides fiscales 2024 · hors budget',
  '49,7 Md€ d’avantages fiscaux recensés en 2024 : crédits d’impôt, exonérations et taux réduits. Hors dépenses et recettes additionnelles du budget de référence 2025 : les recettes sont déjà nettes de ces avantages. Chaque baisse du manque à gagner augmente mécaniquement les recettes fiscales et inversement. Pas de rétroaction économique. Source : https://www.budget.gouv.fr/documentation/file-download/34471',
  'business',0),
 ('business-social-relief','Allègements de cotisations des entreprises',69.1,2024,
  'Jaune budgétaire PLF 2027 — aides sociales 2024 · hors budget',
  '69,1 Md€ d’allègements et exonérations de cotisations recensés en 2024. Hors dépenses et recettes additionnelles du budget de référence 2025 : ces montants sont implicitement intégrés aux recettes de cotisations nettes. Chaque baisse du manque à gagner augmente mécaniquement les cotisations, et inversement. Pas de rétroaction économique. Source : https://www.budget.gouv.fr/documentation/file-download/34471',
  'contributions',1)
ON CONFLICT (id) DO UPDATE SET
 label=EXCLUDED.label,amount=EXCLUDED.amount,source_year=EXCLUDED.source_year,
 canonical=EXCLUDED.canonical,description=EXCLUDED.description,
 revenue_impact_category=EXCLUDED.revenue_impact_category,sort_order=EXCLUDED.sort_order;

-- Update the 2025 pedagogical expense line's tooltip, without changing its 30 Md€.
UPDATE reference_categories
 SET description='Dépense directe pédagogique de 30 Md€ reclassée depuis Économie et transports pour conserver le total APU 2025. Le recensement officiel élargi 2024 atteint 166,1 Md€ : 43,3 Md€ d’aides budgétaires, 49,7 Md€ d’avantages fiscaux, 69,1 Md€ d’allègements de cotisations et 4,0 Md€ d’aides financières. Avantages fiscaux et sociaux : postes hors budget activables séparément, déjà reflétés dans les recettes nettes. Ces périmètres et millésimes différents ne sont pas additionnables. Source : https://www.budget.gouv.fr/documentation/file-download/34471'
 WHERE id='enterprise-support' AND side='expenses' AND reference_year=2025;
