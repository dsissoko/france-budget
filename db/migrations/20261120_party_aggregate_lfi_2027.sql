-- Agrégats déclarés, sourcés, non certifiés : mécanisme commun pour tout parti.
-- Mode AGGREGATE choisi si et seulement si claimedTotals complet et réconcilié.
-- Les chiffres LFI 2027 sont des VARIATIONS par rapport au budget de référence,
-- pas les masses totales des administrations publiques.
-- Source : contre-budget officiel 2027, page 14.
DO $$
DECLARE p jsonb;
BEGIN
 SELECT scenario INTO p FROM budgets
 WHERE id='00000000-0000-4000-8000-000000000002'
   AND origin='party' AND party_code='LFI'
 FOR UPDATE;
 IF p IS NULL THEN RAISE EXCEPTION 'Budget politique LFI absent'; END IF;
 IF abs((106.4::numeric-81.7::numeric)-24.7::numeric)>0.001 THEN
   RAISE EXCEPTION 'Agrégats LFI non réconciliés';
 END IF;
 UPDATE budgets SET scenario=jsonb_set(scenario,'{claimedTotals}',
 jsonb_build_object(
   'year',2027,
   'basis','delta',
   'revenuesBn',106.4,
   'expensesBn',81.7,
   'balanceDeltaBn',24.7,
   'sourceUrl','https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf',
   'description','Chiffrage du contre-budget 2027 revendiqué par LFI ; bilan p. 14'
 ),true),
 description='Contre-budget LFI 2027 : recettes nouvelles +106,4 Md€, dépenses nouvelles +81,7 Md€, amélioration annoncée du solde +24,7 Md€. Les 28 mesures chiffrées documentent les agrégats ; elles ne sont pas additionnées une seconde fois. Montants revendiqués, non expertise indépendante.'
 WHERE id='00000000-0000-4000-8000-000000000002';
END $$;
