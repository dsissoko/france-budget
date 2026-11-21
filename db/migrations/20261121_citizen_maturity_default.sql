-- #117 : neutral default for citizen budgets, shared documentary maturity vocabulary.
BEGIN;
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_maturity_status_check;
ALTER TABLE public.budgets ADD CONSTRAINT budgets_maturity_status_check
 CHECK (maturity_status IN ('non_verifie','en_preparation','complet','a_confirmer','confirme'));
ALTER TABLE public.budget_maturity_history DROP CONSTRAINT IF EXISTS budget_maturity_history_new_status_check;
ALTER TABLE public.budget_maturity_history ADD CONSTRAINT budget_maturity_history_new_status_check
 CHECK (new_status IN ('non_verifie','en_preparation','complet','a_confirmer','confirme'));
ALTER TABLE public.budgets ALTER COLUMN maturity_status SET DEFAULT 'non_verifie';
UPDATE public.budgets SET maturity_status='non_verifie'
 WHERE origin='citizen' AND maturity_status='en_preparation';
COMMIT;
