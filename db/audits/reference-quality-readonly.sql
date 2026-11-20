-- Audit en lecture seule du référentiel Mon Budget Citoyen.
-- Ne modifie aucune table, ne touche ni aux budgets publiés ni aux votes.
-- Exécution : Neon SQL Editor sur une branche de lecture ou sur le projet, sans écriture.

-- 1. Totaux APU et solde (exercice 2025).
SELECT reference_year,
  SUM(amount) FILTER (WHERE side='revenues') AS recettes_md_eur,
  SUM(amount) FILTER (WHERE side='expenses') AS depenses_md_eur,
  SUM(amount) FILTER (WHERE side='expenses')
    - SUM(amount) FILTER (WHERE side='revenues') AS deficit_md_eur,
  COUNT(*) FILTER (WHERE side='revenues') AS nombre_recettes,
  COUNT(*) FILTER (WHERE side='expenses') AS nombre_depenses
FROM reference_categories
GROUP BY reference_year ORDER BY reference_year;

-- 2. Relevé des catégories et des soldes d'ajustement.
SELECT reference_year, side, id, label, amount, canonical
FROM reference_categories ORDER BY reference_year, side, sort_order;

-- 3. Qualité minimale des données et identifiants d'agrégat.
SELECT COUNT(*) FILTER (WHERE amount < 0) AS montants_negatifs,
  COUNT(*) FILTER (WHERE canonical IS NULL OR btrim(canonical)='') AS correspondances_manquantes,
  COUNT(*) FILTER (WHERE description IS NULL OR btrim(description)='') AS descriptions_manquantes
FROM reference_categories;

-- 4. Compléments hors agrégat national : ne jamais additionner aux dépenses.
SELECT id, source_year, label, amount, revenue_impact_category
FROM reference_off_budget ORDER BY sort_order;

-- 5. Contrôle de validité des catégories de recettes de rattachement.
SELECT o.id, o.revenue_impact_category
FROM reference_off_budget o
LEFT JOIN reference_categories c ON c.id=o.revenue_impact_category
  AND c.side='revenues' AND c.reference_year=2025
WHERE c.id IS NULL;

-- 6. Statut des chiffrages politiques actifs.
SELECT b.title, m.status, COUNT(*) AS n
FROM measures m JOIN budgets b ON b.id=m.budget_id
WHERE b.origin='party'
GROUP BY b.title,m.status ORDER BY b.title,m.status;

-- 7. Mesures politiques sans ID historique : invisible dans GET /api/reference.
SELECT b.title, m.id, m.title
FROM measures m JOIN budgets b ON b.id=m.budget_id
WHERE b.origin='party' AND m.legacy_id IS NULL;

-- Attention : la vérification d'absence de chevauchements COFOG/SEC ne se
-- déduit PAS de ces seules tables, qui ne contiennent pas encore de lignes
-- sources officielles normalisées ni de poids de correspondance.
