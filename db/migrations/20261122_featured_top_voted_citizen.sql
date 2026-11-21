-- Automatically give the one citizen comparison slot to the most voted public budget.
-- Party featured flags and their ordering are not touched.
CREATE OR REPLACE FUNCTION public.refresh_featured_citizen_budget()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  winner uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(8729119);
  SELECT b.id INTO winner
  FROM public.budgets b
  LEFT JOIN public.votes v ON v.budget_id = b.id
  WHERE b.origin='citizen' AND b.visibility='public'
  GROUP BY b.id, b.published_at
  ORDER BY COUNT(v.id) DESC, b.published_at DESC, b.id
  LIMIT 1;

  UPDATE public.budgets b SET
    featured = (b.id = winner),
    featured_order = CASE WHEN b.id = winner THEN 40 ELSE NULL END
  WHERE b.origin='citizen'
    AND (b.featured IS DISTINCT FROM (b.id = winner)
      OR b.featured_order IS DISTINCT FROM (CASE WHEN b.id=winner THEN 40 ELSE NULL END));
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_featured_citizen_budget_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.refresh_featured_citizen_budget();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_featured_citizen_votes ON public.votes;
CREATE TRIGGER trg_refresh_featured_citizen_votes
  AFTER INSERT OR DELETE OR UPDATE OF budget_id ON public.votes
  FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_featured_citizen_budget_trigger();

DROP TRIGGER IF EXISTS trg_refresh_featured_citizen_budgets ON public.budgets;
CREATE TRIGGER trg_refresh_featured_citizen_budgets
  AFTER INSERT OR DELETE OR UPDATE OF visibility,origin,published_at ON public.budgets
  FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_featured_citizen_budget_trigger();

SELECT public.refresh_featured_citizen_budget();
