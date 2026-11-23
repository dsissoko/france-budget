-- V2 application isolation. Run by the database owner, transactionally.
-- Optional: SET LOCAL v2.application_role='your_app_role' in the same transaction.
ALTER FUNCTION v2.write_citizen_budget(jsonb,text,text,integer) SECURITY DEFINER;
REVOKE ALL ON FUNCTION v2.import_budget(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION v2.write_citizen_budget(jsonb,text,text,integer) FROM PUBLIC;

DO $v2_acl$
DECLARE app_role text := NULLIF(current_setting('v2.application_role',true),'');
BEGIN
  IF app_role IS NULL THEN
    RAISE NOTICE 'V2 functions hardened; set v2.application_role to grant runtime access';
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=app_role) THEN
    RAISE EXCEPTION 'V2 application role does not exist: %', app_role;
  END IF;
  EXECUTE format('GRANT USAGE ON SCHEMA v2 TO %I',app_role);
  EXECUTE format('GRANT SELECT ON TABLE v2.reference_posts,v2.reference_parameters,v2.budgets,v2.budget_proposals,v2.budget_measures,v2.budget_impacts,v2.votes,v2.latest_budgets TO %I',app_role);
  EXECUTE format('GRANT INSERT ON TABLE v2.votes TO %I',app_role);
  EXECUTE format('GRANT USAGE ON SEQUENCE v2.votes_id_seq TO %I',app_role);
  EXECUTE format('GRANT EXECUTE ON FUNCTION v2.write_citizen_budget(jsonb,text,text,integer) TO %I',app_role);
END $v2_acl$;
