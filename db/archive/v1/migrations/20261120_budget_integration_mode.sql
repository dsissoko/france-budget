-- Issue #92: integration mode is a first-class, database-enforced budget type.
-- Generated from the pair of sourced monetary aggregates. No manual per-party flags,
-- no stale mode after an aggregate is added or removed.
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='budget_integration_mode' AND typnamespace='public'::regnamespace) THEN
   CREATE TYPE public.budget_integration_mode AS ENUM ('AGGREGATE','PARTIAL');
 END IF;
END $$;

ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS budget_mode public.budget_integration_mode GENERATED ALWAYS AS (
  CASE WHEN origin <> 'party' THEN NULL::public.budget_integration_mode
       WHEN jsonb_typeof(scenario->'claimedTotals'->'revenuesBn')='number'
        AND jsonb_typeof(scenario->'claimedTotals'->'expensesBn')='number'
       THEN 'AGGREGATE'::public.budget_integration_mode
       ELSE 'PARTIAL'::public.budget_integration_mode
  END
) STORED;

COMMENT ON COLUMN public.budgets.budget_mode IS
'AGGREGATE: two documented revenue/expense masses; PARTIAL: INSEE reference plus qualified deltas. Generated, not set by party-specific application logic.';
