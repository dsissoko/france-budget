-- Issue #92 — reversible reset of political accounting and preservation of sourced themes.
-- Prerequisite: all historical measures and documentary source lines have been exported
-- to data/programmes/<party>/<year>/*.csv (260 documentary + 13 accounting rows).
-- NEVER delete reference categories, citizen budgets, or votes.
-- Run this transaction before scripts/import-programmes.mjs --apply.
-- @statement
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='budget_integration_mode' AND typnamespace='public'::regnamespace) THEN
  CREATE TYPE public.budget_integration_mode AS ENUM ('AGGREGATE','PARTIAL');
 END IF;
END $$;
-- @statement
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS budget_mode public.budget_integration_mode
GENERATED ALWAYS AS (
 CASE WHEN origin <> 'party' THEN NULL::public.budget_integration_mode
 WHEN jsonb_typeof(scenario->'claimedTotals'->'revenuesBn')='number'
  AND jsonb_typeof(scenario->'claimedTotals'->'expensesBn')='number'
 THEN 'AGGREGATE'::public.budget_integration_mode
 ELSE 'PARTIAL'::public.budget_integration_mode END
) STORED;
-- @statement
ALTER TABLE public.party_proposals ADD COLUMN IF NOT EXISTS source_url text;
-- @statement
ALTER TABLE public.party_proposals ADD COLUMN IF NOT EXISTS description text;
-- @statement
ALTER TABLE public.party_proposals DROP CONSTRAINT IF EXISTS party_proposals_source_measure_count_check;
-- @statement
ALTER TABLE public.party_proposals ADD CONSTRAINT party_proposals_source_measure_count_check
CHECK(source_measure_count>=0);
-- @statement
UPDATE public.party_proposals p SET source_url=COALESCE(p.source_url,(
 SELECT MIN(l.source_url) FROM public.party_source_lines l
 WHERE (l.party_code,l.source_year,l.group_id)=(p.party_code,p.source_year,p.group_id)
)) WHERE p.source_url IS NULL;
-- @statement
CREATE TABLE IF NOT EXISTS public.issue92_archive_budgets AS
SELECT * FROM public.budgets WHERE origin='party';
-- @statement
CREATE TABLE IF NOT EXISTS public.issue92_archive_measures AS
SELECT m.* FROM public.measures m JOIN public.budgets b ON b.id=m.budget_id WHERE b.origin='party';
-- @statement
CREATE TABLE IF NOT EXISTS public.issue92_archive_entries AS
SELECT e.* FROM public.measure_accounting_entries e
 JOIN public.measures m ON m.id=e.measure_id
 JOIN public.budgets b ON b.id=m.budget_id WHERE b.origin='party';
-- @statement
CREATE TABLE IF NOT EXISTS public.issue92_archive_party_source_lines AS TABLE public.party_source_lines;
-- @statement
CREATE TABLE IF NOT EXISTS public.issue92_archive_party_proposals AS TABLE public.party_proposals;
-- @statement
CREATE TABLE IF NOT EXISTS public.issue92_archive_proposal_accounting_measures AS TABLE public.proposal_accounting_measures;
-- @statement
CREATE TABLE IF NOT EXISTS public.issue92_archive_source_accounting_links AS TABLE public.source_accounting_links;
-- @statement
DO $$
BEGIN
 IF (SELECT count(*) FROM public.issue92_archive_measures)<>13 OR
    (SELECT count(*) FROM public.issue92_archive_party_source_lines)<>260 THEN
  RAISE EXCEPTION 'Issue92 archive parity mismatch: expected 13 historical accounting measures and 260 source lines';
 END IF;
 IF EXISTS (
   SELECT 1 FROM public.issue92_archive_measures m
   WHERE NOT EXISTS(SELECT 1 FROM public.budgets b WHERE b.id=m.budget_id)
 ) THEN RAISE EXCEPTION 'Historical measure budget link missing'; END IF;
END $$;
-- @statement
DELETE FROM public.source_accounting_links WHERE party_code IN
 (SELECT code FROM public.political_parties);
-- @statement
DELETE FROM public.proposal_accounting_measures WHERE party_code IN
 (SELECT code FROM public.political_parties);
-- @statement
DELETE FROM public.party_source_lines WHERE party_code IN
 (SELECT code FROM public.political_parties);
-- @statement
DELETE FROM public.measure_accounting_entries WHERE measure_id IN
 (SELECT m.id FROM public.measures m JOIN public.budgets b ON b.id=m.budget_id WHERE b.origin='party');
-- @statement
DELETE FROM public.measures WHERE budget_id IN
 (SELECT id FROM public.budgets WHERE origin='party');
-- @statement
UPDATE public.party_proposals SET source_measure_count=0 WHERE party_code IN
 (SELECT code FROM public.political_parties);
-- @statement
UPDATE public.budgets SET scenario=(
  scenario || '{"picked":[]}'::jsonb ||
  CASE WHEN jsonb_typeof(scenario->'claimedTotals'->'revenuesBn')='number'
        AND jsonb_typeof(scenario->'claimedTotals'->'expensesBn')='number'
       THEN '{"documentaryOnly":false}'::jsonb
       ELSE '{"documentaryOnly":true}'::jsonb END
 ) WHERE origin='party';
-- @statement
DO $$
BEGIN
 IF (SELECT count(*) FROM public.measures m JOIN public.budgets b ON b.id=m.budget_id WHERE b.origin='party')>0 OR
 (SELECT count(*) FROM public.party_source_lines)>0 THEN
 RAISE EXCEPTION 'Issue92 cleanup left active political measures'; END IF;
END $$;
