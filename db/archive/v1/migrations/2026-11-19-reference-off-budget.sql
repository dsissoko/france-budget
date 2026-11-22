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
