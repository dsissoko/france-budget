-- Budget maturity: generic field, initially displayed only for party budgets.
-- Values are editorial workflow states; no statement of economic feasibility.
-- The 'confirmed' state requires documentary evidence of actual party confirmation.
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS maturity_status text NOT NULL DEFAULT 'en_preparation',
  ADD COLUMN IF NOT EXISTS confirmation_organization text,
  ADD COLUMN IF NOT EXISTS confirmation_evidence_url text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.budgets'::regclass AND conname='budgets_maturity_status_check') THEN
  ALTER TABLE public.budgets ADD CONSTRAINT budgets_maturity_status_check
   CHECK(maturity_status IN ('en_preparation','complet','a_confirmer','confirme'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.budgets'::regclass AND conname='budgets_confirmation_evidence_check') THEN
  ALTER TABLE public.budgets ADD CONSTRAINT budgets_confirmation_evidence_check
   CHECK(maturity_status <> 'confirme' OR
      (nullif(trim(confirmation_organization),'') IS NOT NULL
       AND confirmation_evidence_url LIKE 'https://%'
       AND confirmed_at IS NOT NULL));
 END IF;
END $$;

-- Immutable trail of every actual transition, including initial backfill.
CREATE TABLE IF NOT EXISTS public.budget_maturity_history (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 budget_id uuid NOT NULL REFERENCES public.budgets(id),
 previous_status text,
 new_status text NOT NULL
   CHECK(new_status IN ('en_preparation','complet','a_confirmer','confirme')),
 changed_at timestamptz NOT NULL DEFAULT now(),
 changed_by text NOT NULL,
 confirmation_organization text,
 confirmation_evidence_url text,
 confirmed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_budget_maturity_history_budget_date
 ON public.budget_maturity_history(budget_id,changed_at DESC,id DESC);

CREATE OR REPLACE FUNCTION public.audit_budget_maturity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='INSERT' OR (OLD.maturity_status IS DISTINCT FROM NEW.maturity_status) THEN
   INSERT INTO public.budget_maturity_history
    (budget_id,previous_status,new_status,changed_by,
     confirmation_organization,confirmation_evidence_url,confirmed_at)
   VALUES (NEW.id, CASE WHEN TG_OP='INSERT' THEN NULL ELSE OLD.maturity_status END,
            NEW.maturity_status,current_user,NEW.confirmation_organization,
            NEW.confirmation_evidence_url,NEW.confirmed_at);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_audit_budget_maturity ON public.budgets;
CREATE TRIGGER trg_audit_budget_maturity
AFTER INSERT OR UPDATE OF maturity_status ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.audit_budget_maturity();

-- Preexisting rows were inserted before the trigger was installed.
INSERT INTO public.budget_maturity_history(budget_id,previous_status,new_status,changed_by,
 confirmation_organization,confirmation_evidence_url,confirmed_at)
SELECT b.id,NULL,b.maturity_status,current_user,
 b.confirmation_organization,b.confirmation_evidence_url,b.confirmed_at
FROM public.budgets b
WHERE NOT EXISTS (SELECT 1 FROM public.budget_maturity_history h WHERE h.budget_id=b.id);

-- No existing budget is marked completed or officially confirmed here.
-- Publication/visibility is a separate dimension, not changed by this migration.
