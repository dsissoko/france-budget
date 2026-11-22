-- Initial pivot snapshot. READ from V1 public, WRITE only into v2.
-- Run once on an isolated Neon QA branch after 001_schema.sql.
INSERT INTO v2.reference_posts(reference_year,side,category_id,label,reference_amount_bn)
SELECT reference_year,side,id,label,amount::numeric
FROM public.reference_categories WHERE reference_year=2025
UNION ALL
SELECT 2025,'offBudget',id,label,amount::numeric FROM public.reference_off_budget
ON CONFLICT(reference_year,side,category_id) DO NOTHING;
