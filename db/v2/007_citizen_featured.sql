-- V2 citizen comparison curation: ONE featured published citizen, selected by votes.
-- Parties' featured fields are never updated. No dependency on public/V1 schema.
-- Safe to apply on an already populated V2 database, including production.
CREATE OR REPLACE FUNCTION v2.refresh_featured_citizen_budget()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=v2,pg_temp AS $$
DECLARE winner uuid;
BEGIN
  -- Serialize competing vote and publication events.
  PERFORM pg_advisory_xact_lock(hashtext('v2_featured_citizen_selection'));
  SELECT b.id INTO winner
    FROM v2.budgets b
    LEFT JOIN v2.votes v ON v.budget_id=b.id
    LEFT JOIN LATERAL (SELECT count(*) AS proposal_count FROM v2.budget_proposals p WHERE p.budget_id=b.id) pc ON true
    WHERE b.origin='citizen' AND b.version='latest'
      AND b.publication_status='published'
    GROUP BY b.id,b.published_at,pc.proposal_count
    ORDER BY count(v.id) DESC,pc.proposal_count DESC,b.published_at DESC NULLS LAST,b.id
    LIMIT 1;

  UPDATE v2.budgets b SET
    featured=(b.id=winner),
    featured_order=CASE WHEN b.id=winner THEN 40 ELSE NULL END
  WHERE b.origin='citizen'
    AND (b.featured IS DISTINCT FROM (b.id=winner)
      OR b.featured_order IS DISTINCT FROM
        (CASE WHEN b.id=winner THEN 40 ELSE NULL END));
END;
$$;

CREATE OR REPLACE FUNCTION v2.refresh_featured_citizen_budget_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=v2,pg_temp AS $$
BEGIN
  PERFORM v2.refresh_featured_citizen_budget();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_featured_citizen_votes ON v2.votes;
CREATE TRIGGER trg_refresh_featured_citizen_votes
  AFTER INSERT OR DELETE OR UPDATE OF budget_id ON v2.votes
  FOR EACH STATEMENT EXECUTE FUNCTION v2.refresh_featured_citizen_budget_trigger();

DROP TRIGGER IF EXISTS trg_refresh_featured_citizen_budgets ON v2.budgets;
CREATE TRIGGER trg_refresh_featured_citizen_budgets
  AFTER INSERT OR DELETE OR UPDATE OF publication_status,origin,version,published_at
  ON v2.budgets
  FOR EACH STATEMENT EXECUTE FUNCTION v2.refresh_featured_citizen_budget_trigger();

-- Recompute if the number of proposals changes (publication edits/imports).
DROP TRIGGER IF EXISTS trg_refresh_featured_citizen_proposals ON v2.budget_proposals;
CREATE TRIGGER trg_refresh_featured_citizen_proposals
  AFTER INSERT OR DELETE OR UPDATE OF budget_id ON v2.budget_proposals
  FOR EACH STATEMENT EXECUTE FUNCTION v2.refresh_featured_citizen_budget_trigger();

-- Bring already-published V2 records in line with the restored business rule.
SELECT v2.refresh_featured_citizen_budget();

-- Trigger functions are invoked only by database triggers; application must not
-- be able to call the mutation directly.
REVOKE ALL ON FUNCTION v2.refresh_featured_citizen_budget() FROM PUBLIC;
REVOKE ALL ON FUNCTION v2.refresh_featured_citizen_budget_trigger() FROM PUBLIC;
