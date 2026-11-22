-- Issue #102 : propositions citoyennes avec plusieurs impacts du format pivot.
-- Migration additive : les budgets publiés historiquement et leurs mesures restent inchangés.
CREATE TABLE IF NOT EXISTS budget_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_budget_proposal_client UNIQUE (budget_id, client_id),
  CONSTRAINT uq_budget_proposal_id_budget UNIQUE (id, budget_id)
);

CREATE TABLE IF NOT EXISTS budget_proposal_impacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL,
  budget_id uuid NOT NULL,
  side text NOT NULL CHECK (side IN ('revenues','expenses','offBudget')),
  category_id text NOT NULL,
  delta_amount numeric(18,3) NOT NULL CHECK (delta_amount <> 0),
  CONSTRAINT fk_proposal_budget FOREIGN KEY (proposal_id,budget_id)
    REFERENCES budget_proposals(id,budget_id) ON DELETE CASCADE,
  -- Un poste du pivot ne peut appartenir qu'à une proposition dans un budget.
  CONSTRAINT uq_budget_pivot_post UNIQUE (budget_id, side, category_id),
  CONSTRAINT uq_proposal_post UNIQUE (proposal_id, side, category_id)
);

CREATE INDEX IF NOT EXISTS idx_budget_proposals_budget_id ON budget_proposals(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_proposal_impacts_proposal ON budget_proposal_impacts(proposal_id);

-- La publication reste atomique : budget, mesures comptables historiques,
-- propositions et impacts sont insérés dans la même transaction SQL.
CREATE OR REPLACE FUNCTION public.publish_citizen_budget(payload jsonb, fingerprint text) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  new_id uuid;
  m jsonb;
  p jsonb;
  i jsonb;
  impacts jsonb;
  proposal_uuid uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(8729104);
  IF (SELECT count(*) FROM budgets WHERE origin='citizen' AND visibility='public') >= 100 THEN
    RAISE EXCEPTION 'publication_limit_reached' USING ERRCODE='P0001';
  END IF;
  IF (SELECT count(*) FROM publication_limits
      WHERE publication_limits.fingerprint=publish_citizen_budget.fingerprint
        AND created_at>now()-interval '24 hours') >= 100 THEN
    RAISE EXCEPTION 'publication_rate_limited' USING ERRCODE='P0001';
  END IF;

  INSERT INTO budgets(title,description,origin,visibility,reference_year,scenario)
  VALUES(payload->>'title',coalesce(payload->>'description',''),'citizen','public',
         (payload->>'referenceYear')::int,payload->'scenario')
  RETURNING id INTO new_id;

  FOR m IN SELECT value FROM jsonb_array_elements(payload->'measures') LOOP
    INSERT INTO measures(budget_id,category_code,title,description,kind,delta_amount,reference_amount)
    VALUES(new_id,m->>'categoryCode',m->>'title',coalesce(m->>'description',''),
           m->>'kind',(m->>'deltaAmount')::numeric,(m->>'referenceAmount')::numeric);
  END LOOP;

  FOR p IN SELECT value FROM jsonb_array_elements(
      coalesce(payload->'scenario'->'citizenMeasures','[]'::jsonb)) LOOP
    INSERT INTO budget_proposals(budget_id,client_id,title,description)
    VALUES(new_id,p->>'id',p->>'title',coalesce(p->>'description',''))
    RETURNING id INTO proposal_uuid;

    -- Compatibilité avec les anciennes mesures citoyennes à un seul poste.
    impacts := CASE WHEN jsonb_typeof(p->'impacts')='array' THEN p->'impacts'
      ELSE jsonb_build_array(jsonb_build_object(
        'kind',p->>'kind','categoryId',p->>'categoryId','delta',p->'delta')) END;

    FOR i IN SELECT value FROM jsonb_array_elements(impacts) LOOP
      INSERT INTO budget_proposal_impacts(proposal_id,budget_id,side,category_id,delta_amount)
      VALUES(proposal_uuid,new_id,i->>'kind',i->>'categoryId',(i->>'delta')::numeric);
    END LOOP;
  END LOOP;

  INSERT INTO publication_limits(fingerprint) VALUES(fingerprint);
  RETURN new_id;
END $$;
