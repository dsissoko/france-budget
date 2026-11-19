-- Raise the public citizen-budget quota, without dropping or modifying existing data.
-- Note: the maximum of 100 public citizen budgets remains a distinct global cap.
-- PostgreSQL CREATE OR REPLACE is safe for the existing function's signature.
CREATE OR REPLACE FUNCTION public.publish_citizen_budget(payload jsonb, fingerprint text) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE new_id uuid; m jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(8729104);
 IF (SELECT count(*) FROM budgets WHERE origin='citizen' AND visibility='public') >= 100 THEN
  RAISE EXCEPTION 'publication_limit_reached' USING ERRCODE='P0001';
 END IF;
 IF (SELECT count(*) FROM publication_limits WHERE publication_limits.fingerprint=publish_citizen_budget.fingerprint AND created_at>now()-interval '24 hours') >= 100 THEN
  RAISE EXCEPTION 'publication_rate_limited' USING ERRCODE='P0001';
 END IF;
 INSERT INTO budgets(title,description,origin,visibility,reference_year,scenario)
 VALUES(payload->>'title',coalesce(payload->>'description',''),'citizen','public',(payload->>'referenceYear')::int,payload->'scenario')
 RETURNING id INTO new_id;
 FOR m IN SELECT value FROM jsonb_array_elements(payload->'measures') LOOP
  INSERT INTO measures(budget_id,category_code,title,description,kind,delta_amount,reference_amount)
  VALUES(new_id,m->>'categoryCode',m->>'title',coalesce(m->>'description',''),m->>'kind',(m->>'deltaAmount')::numeric,(m->>'referenceAmount')::numeric);
 END LOOP;
 INSERT INTO publication_limits(fingerprint) VALUES(fingerprint);
 RETURN new_id;
END $$;
