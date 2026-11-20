-- Migration incrémentale : identité stable des formations et écritures APU normalisées.
-- Appliquée à Neon le 20/11/2026. À conserver comme trace versionnée.
-- Conservateur : colonnes et anciennes données sont gardées le temps de valider la bascule.

CREATE TABLE IF NOT EXISTS public.political_parties (
  code text PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) > 0)
);

-- Le registre documentaire reste la source d'initialisation de l'identité.
INSERT INTO public.political_parties (code,name)
SELECT party_code,formation_name
FROM public.party_source_registry_draft
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS party_code text;
ALTER TABLE public.measures ADD COLUMN IF NOT EXISTS apu_entries jsonb;

-- Mise en correspondance ponctuelle des trois budgets hérités.
-- Le code parti est ensuite la seule clé métier, jamais le titre.
UPDATE public.budgets SET party_code=CASE id
 WHEN '00000000-0000-4000-8000-000000000001'::uuid THEN 'RN'
 WHEN '00000000-0000-4000-8000-000000000002'::uuid THEN 'LFI'
 WHEN '00000000-0000-4000-8000-000000000003'::uuid THEN 'HOR'
 ELSE party_code END
WHERE origin='party' AND party_code IS NULL;

-- Sur une base neuve, exécuter les ALTER seulement si les contraintes n'existent pas.
ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_party_code_fk
  FOREIGN KEY(party_code) REFERENCES public.political_parties(code) NOT VALID;
ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_party_code_presence
  CHECK (origin <> 'party' OR party_code IS NOT NULL) NOT VALID;
ALTER TABLE public.budgets VALIDATE CONSTRAINT budgets_party_code_fk;
ALTER TABLE public.budgets VALIDATE CONSTRAINT budgets_party_code_presence;

CREATE TABLE IF NOT EXISTS public.measure_accounting_entries (
  measure_id uuid NOT NULL REFERENCES public.measures(id) ON DELETE CASCADE,
  line_number integer NOT NULL CHECK (line_number > 0),
  side text NOT NULL CHECK (side IN ('revenues','expenses')),
  category_id text NOT NULL,
  amount numeric(18,3) NOT NULL,
  PRIMARY KEY(measure_id,line_number)
);

-- PK de catégories déjà en place sur id ; unicité composite pour faire respecter
-- par Postgres le côté recettes/dépenses d'une écriture.
ALTER TABLE public.reference_categories
  ADD CONSTRAINT reference_categories_id_side_unique UNIQUE(id,side);
ALTER TABLE public.measure_accounting_entries
  ADD CONSTRAINT measure_accounting_entries_category_fk
  FOREIGN KEY(category_id,side) REFERENCES public.reference_categories(id,side) NOT VALID;
ALTER TABLE public.measure_accounting_entries
  VALIDATE CONSTRAINT measure_accounting_entries_category_fk;

-- L'import des 5 mesures politiques existantes provient du relevé 2026-11-20
-- et a été effectué dans Neon. Ne pas réinjecter de valeurs inventées ici.
-- API : lecture de measure_accounting_entries, jamais des titres.
-- Conservation temporaire de measures.apu_entries pour rollback uniquement.
-- Futur nettoyage : cette colonne JSON peut disparaître après validation prod.
