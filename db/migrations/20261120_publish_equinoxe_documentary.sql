-- One source-backed, documentary-only budget for Équinoxe 2027.
-- The budget stays HIDDEN until the compatible application build is READY
-- and its public API has been checked. Visibility change is a separate gate.
-- No invented or unreviewed monetary deltas, no copied citizen scenario.
INSERT INTO public.budgets
  (title,description,origin,party_code,visibility,reference_year,
   featured,featured_order,maturity_status,scenario)
SELECT
  'Équinoxe — propositions budgétaires 2027',
  'Contre-budget 2027 : huit thèmes documentaires recensés à partir des publications du parti. Inventaire provisoire ; les effets budgétaires APU ne sont pas encore validés. Aucun déficit propre à ce programme n’est calculé et aucune confirmation officielle n’est revendiquée.',
  'party','EQX','hidden',2025,false,NULL,'en_preparation',
  '{"budget":{"revenues":{},"expenses":{}},"picked":[],"documentaryOnly":true}'::jsonb
WHERE EXISTS (
  SELECT 1 FROM public.party_proposals
  WHERE party_code='EQX' AND source_year=2027
  HAVING count(*)=8
)
AND NOT EXISTS (
  SELECT 1 FROM public.budgets WHERE origin='party' AND party_code='EQX'
)
RETURNING id,party_code,visibility,maturity_status,scenario;

-- No change to RN/LFI; Horizons' unsourced historical fiction remains hidden.
-- Later publication gate:
-- UPDATE public.budgets SET visibility='public'
-- WHERE party_code='EQX' AND origin='party'
--   AND scenario->>'documentaryOnly'='true';
