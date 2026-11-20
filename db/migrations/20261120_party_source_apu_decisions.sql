-- Décisions comptables explicites. N'interpréter aucun ancien tag libre.
ALTER TABLE public.party_source_lines
  ADD COLUMN IF NOT EXISTS apu_decision text,
  ADD COLUMN IF NOT EXISTS apu_reason text;

-- Les anciennes colonnes apu_manual_tag restent des notes de revue,
-- PAS une décision de publication ni une affectation budgétaire.
DO $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint
   WHERE conname='party_source_lines_apu_decision_check'
     AND conrelid='public.party_source_lines'::regclass
 ) THEN
   ALTER TABLE public.party_source_lines
     ADD CONSTRAINT party_source_lines_apu_decision_check
     CHECK (apu_decision IS NULL OR apu_decision IN ('calculate','non_chiffrable_apu'));
 END IF;
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint
   WHERE conname='party_source_lines_apu_reason_check'
     AND conrelid='public.party_source_lines'::regclass
 ) THEN
   ALTER TABLE public.party_source_lines
     ADD CONSTRAINT party_source_lines_apu_reason_check
     CHECK (apu_decision IS DISTINCT FROM 'non_chiffrable_apu'
         OR length(trim(COALESCE(apu_reason,'')))>0);
 END IF;
END $$;

-- Aucune décision n'est automatiquement validée.
-- Publication des nouvelles mesures : review_status = validated
-- ET chaque ligne de ce groupe explicitement revue.
