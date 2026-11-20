-- Generic source catalog: documentary statements without individual monetary estimates.
-- The global aggregate, when available, carries the numbers; statement titles and
-- described impacts retain the evidence without fabricated zero-valued amounts.
ALTER TABLE public.party_source_lines
  ALTER COLUMN claimed_amount_bn DROP NOT NULL,
  ALTER COLUMN direction DROP NOT NULL;
ALTER TABLE public.party_source_lines
  ADD COLUMN IF NOT EXISTS impact_description text;
DO $
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid='public.party_source_lines'::regclass
      AND conname='party_source_line_amount_or_impact_check') THEN
  ALTER TABLE public.party_source_lines
    ADD CONSTRAINT party_source_line_amount_or_impact_check
    CHECK (claimed_amount_bn IS NOT NULL OR length(trim(coalesce(impact_description,''))) > 0);
 END IF;
END $;
