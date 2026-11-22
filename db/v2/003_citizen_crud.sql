-- V2-only citizen write lifecycle. Never modifies V1 / public.
ALTER TABLE v2.budgets
  ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'published'
    CHECK(publication_status IN ('draft','published','withdrawn')),
  ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1 CHECK(revision>0);

CREATE TABLE IF NOT EXISTS v2.citizen_edit_grants (
  budget_id uuid PRIMARY KEY REFERENCES v2.budgets(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK(token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only published latest budgets are exposed to anonymous reads.
DROP VIEW IF EXISTS v2.latest_budgets;
CREATE VIEW v2.latest_budgets AS
SELECT * FROM v2.budgets
WHERE version='latest' AND publication_status='published';

-- All write operations are transactional, with server-generated edit-token hash.
CREATE OR REPLACE FUNCTION v2.write_citizen_budget(
  payload jsonb,
  operation text,
  secret_hash text,
  expected_revision integer DEFAULT NULL
) RETURNS TABLE(budget_id uuid, new_revision integer, new_status text)
LANGUAGE plpgsql SET search_path=v2,pg_temp AS $$
DECLARE
  b jsonb := payload->'budget';
  key text := b->>'budget_key';
  current_id uuid;
  current_revision integer;
  current_status text;
  saved_id uuid;
  proposed_status text;
BEGIN
  IF secret_hash IS NULL OR secret_hash !~ '^[a-f0-9]{64}$'
    THEN RAISE EXCEPTION 'invalid_edit_capability'; END IF;
  IF operation NOT IN ('create','update','withdraw')
    THEN RAISE EXCEPTION 'invalid_operation'; END IF;
  IF key IS NULL OR key !~ '^citizen-[0-9a-f-]{36}$'
    THEN RAISE EXCEPTION 'invalid_citizen_budget_key'; END IF;
  IF operation = 'create' THEN
    IF b->>'origin' IS DISTINCT FROM 'citizen' OR b->>'version' IS DISTINCT FROM 'latest'
      THEN RAISE EXCEPTION 'invalid_citizen_origin_or_version'; END IF;
    IF expected_revision IS NOT NULL THEN RAISE EXCEPTION 'unexpected_revision_on_create'; END IF;
    IF EXISTS(SELECT 1 FROM v2.budgets WHERE budget_key=key)
      THEN RAISE EXCEPTION 'citizen_budget_already_exists'; END IF;
    saved_id := v2.import_budget(payload);
    proposed_status := CASE WHEN payload->>'publish'='true' THEN 'published' ELSE 'draft' END;
    UPDATE v2.budgets SET publication_status=proposed_status
      WHERE id=saved_id;
    INSERT INTO v2.citizen_edit_grants(budget_id,token_hash) VALUES(saved_id,secret_hash);
    RETURN QUERY SELECT saved_id,1,proposed_status;
    RETURN;
  END IF;
  SELECT bb.id,bb.revision,bb.publication_status
    INTO current_id,current_revision,current_status
  FROM v2.budgets bb
  INNER JOIN v2.citizen_edit_grants g ON g.budget_id=bb.id
  WHERE bb.budget_key=key AND bb.version='latest' AND bb.origin='citizen'
    AND g.token_hash=secret_hash
  FOR UPDATE OF bb;
  IF current_id IS NULL THEN RAISE EXCEPTION 'edit_capability_denied'; END IF;
  IF current_status='withdrawn' THEN RAISE EXCEPTION 'budget_withdrawn'; END IF;
  IF expected_revision IS NULL OR expected_revision<>current_revision
    THEN RAISE EXCEPTION 'revision_conflict'; END IF;
  IF operation='withdraw' THEN
    UPDATE v2.budgets SET publication_status='withdrawn',
      revision=revision+1,updated_at=now()
      WHERE id=current_id RETURNING revision,publication_status INTO current_revision,current_status;
    RETURN QUERY SELECT current_id,current_revision,current_status;
    RETURN;
  END IF;
  -- Published citizen budgets are immutable, as promised by the V1 UI.\n  -- Withdrawal preserves the data and its voting history.\n  IF current_status='published' THEN RAISE EXCEPTION 'published_budget_immutable'; END IF;\n  IF b->>'origin' IS DISTINCT FROM 'citizen' OR b->>'version' IS DISTINCT FROM 'latest'\n    THEN RAISE EXCEPTION 'invalid_citizen_origin_or_version'; END IF;\n  IF b->>'budget_mode' IS DISTINCT FROM
    (SELECT budget_mode FROM v2.budgets WHERE id=current_id)
    THEN RAISE EXCEPTION 'budget_mode_immutable'; END IF;
  IF (b->>'reference_year')::integer IS DISTINCT FROM
    (SELECT reference_year FROM v2.budgets WHERE id=current_id)
    THEN RAISE EXCEPTION 'reference_year_immutable'; END IF;
  saved_id := v2.import_budget(payload);
  IF saved_id<>current_id THEN RAISE EXCEPTION 'unexpected_identity_change'; END IF;
  proposed_status := CASE
    WHEN payload->>'publish'='true' THEN 'published'
    ELSE current_status END;
  UPDATE v2.budgets SET revision=revision+1,
    publication_status=proposed_status,updated_at=now()
    WHERE id=current_id RETURNING revision,publication_status INTO current_revision,current_status;
  RETURN QUERY SELECT current_id,current_revision,current_status;
END $$;
