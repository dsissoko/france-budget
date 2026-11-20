-- LFI 2027: première activation comptable générique d'un lot explicitement qualifié.
-- La référence INSEE 2025 est conservée intégralement, sauf écritures ci-dessous.
-- Les montants sont les revendications du parti, transcrites comme hypothèses DIRECTES;
-- aucune validation externe des effets indirects/macroéconomiques n'est prétendue.
-- Séparer strictement 2026 et 2027 (remplacer picked, ne jamais les ajouter).
-- Migration versionnée, idempotente; aucune suppression de mesures ni de sources.
--
-- Contrat: mêmes tables et processus pour n'importe quel parti.
CREATE TEMP TABLE IF NOT EXISTS _qualified_direct(
  source_row integer PRIMARY KEY,
  category_id text NOT NULL,
  kind text NOT NULL,
  rationale text NOT NULL
) ON COMMIT DROP;
INSERT INTO _qualified_direct(source_row,category_id,kind,rationale)
VALUES
    (4,'business','revenue','CVAE: prélèvement sur la valeur ajoutée des entreprises; recette APU, effets induits exclus.'),
    (19,'education','expense','Créations de postes dans l''enseignement, dépense publique COFOG 09; montant 2027 revendiqué.'),
    (21,'education','expense','Places universitaires nouvelles, dépenses d''enseignement COFOG 09, montant revendiqué.'),
    (22,'health','expense','Hausse du budget hospitalier, COFOG 07; emplois déjà compris dans les 3 Md€.'),
    (27,'social','expense','Retour sur réforme des retraites, prestations vieillesse COFOG 10.2; effets sur cotisations non modélisés.'),
    (28,'unemployment','expense','Abrogation des réformes d''assurance chômage, COFOG 10.5; effets de comportement exclus.')
ON CONFLICT (source_row) DO NOTHING;

DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM _qualified_direct d
 JOIN party_source_lines l ON l.party_code='LFI' AND l.source_year=2027 AND l.source_row=d.source_row
 JOIN reference_categories c ON c.id=d.category_id AND c.reference_year=2025
    AND c.side=CASE WHEN d.kind='revenue' THEN 'revenues' ELSE 'expenses' END
 WHERE l.claimed_amount_bn>0
   AND l.direction=CASE WHEN d.kind='revenue' THEN 'revenue_increase' ELSE 'expense_increase' END;
 IF n<>6 THEN RAISE EXCEPTION 'Import LFI blocked: %/6 verified source/category pairs',n; END IF;
 IF (SELECT count(*) FROM budgets WHERE origin='party' AND party_code='LFI'
       AND id='00000000-0000-4000-8000-000000000002') <> 1
 THEN RAISE EXCEPTION 'LFI budget missing'; END IF;
 IF EXISTS(SELECT 1 FROM source_accounting_links sal
   JOIN _qualified_direct q ON sal.source_row=q.source_row
   WHERE sal.party_code='LFI' AND sal.source_year=2027
     AND sal.measure_id<>md5('LFI:2027:'||q.source_row::text)::uuid)
 THEN RAISE EXCEPTION 'Existing LFI source linked to a different measure'; END IF;
END $$;

-- 1. Les seules sources qualifiées : les autres conservent leur statut prudent.
UPDATE party_source_lines l SET validation_status='validated',
  apu_decision='calculate',
  apu_manual_tag='direct_claimed_apu_2027',
  apu_reason=q.rationale
FROM _qualified_direct q
WHERE l.party_code='LFI' AND l.source_year=2027 AND l.source_row=q.source_row
  AND (l.validation_status,l.apu_decision,l.apu_reason,l.apu_manual_tag)
      IS DISTINCT FROM ('validated','calculate',q.rationale,'direct_claimed_apu_2027');

-- 2. Chaque mesure conserve sa ligne documentaire, sans ligne chiffrée artificielle.
INSERT INTO measures(id,budget_id,category_code,title,description,kind,delta_amount,reference_amount,
 theme,source,reference_year,status,revenue_delta,expense_delta)
SELECT md5('LFI:2027:'||l.source_row::text)::uuid,
 '00000000-0000-4000-8000-000000000002'::uuid,
 q.category_id,l.title,
 'Effet budgétaire direct revendiqué par LFI pour 2027. Ventilation indicative APU 2025 : '||q.rationale||
 ' N''inclut aucun effet macroéconomique; ne préjuge pas des autres propositions du programme.',
 q.kind,l.claimed_amount_bn,c.amount,
 p.title,l.source_url,2027,'publié',
 CASE WHEN q.kind='revenue' THEN l.claimed_amount_bn ELSE 0 END,
 CASE WHEN q.kind='expense' THEN l.claimed_amount_bn ELSE 0 END
FROM _qualified_direct q
JOIN party_source_lines l ON (l.party_code,l.source_year,l.source_row)=('LFI',2027,q.source_row)
JOIN party_proposals p ON (p.party_code,p.source_year,p.group_id)=(l.party_code,l.source_year,l.group_id)
JOIN reference_categories c ON c.id=q.category_id AND c.reference_year=2025
 AND c.side=CASE WHEN q.kind='revenue' THEN 'revenues' ELSE 'expenses' END
ON CONFLICT (id) DO NOTHING;

INSERT INTO measure_accounting_entries(measure_id,line_number,side,category_id,amount)
SELECT md5('LFI:2027:'||l.source_row::text)::uuid,1,
 CASE WHEN q.kind='revenue' THEN 'revenues' ELSE 'expenses' END,q.category_id,l.claimed_amount_bn
FROM _qualified_direct q JOIN party_source_lines l
 ON (l.party_code,l.source_year,l.source_row)=('LFI',2027,q.source_row)
ON CONFLICT (measure_id,line_number) DO NOTHING;

INSERT INTO proposal_accounting_measures(measure_id,budget_id,party_code,source_year,group_id)
SELECT md5('LFI:2027:'||l.source_row::text)::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid,'LFI',2027,l.group_id
FROM _qualified_direct q JOIN party_source_lines l
 ON (l.party_code,l.source_year,l.source_row)=('LFI',2027,q.source_row)
ON CONFLICT (measure_id) DO NOTHING;

INSERT INTO source_accounting_links(party_code,source_year,group_id,source_row,measure_id)
SELECT 'LFI',2027,l.group_id,l.source_row,md5('LFI:2027:'||l.source_row::text)::uuid
FROM _qualified_direct q JOIN party_source_lines l
 ON (l.party_code,l.source_year,l.source_row)=('LFI',2027,q.source_row)
ON CONFLICT (party_code,source_year,source_row) DO NOTHING;

-- 3. Le scénario public doit suivre uniquement 2027, pas les deux millésimes.
UPDATE budgets SET
 title='Scénario LFI 2027 — mesures budgétaires qualifiées',
 description='Simulation partielle des effets directs revendiqués dans le contre-budget LFI 2027, appliqués à la référence INSEE 2025. Les mesures non validées restent documentaires, hors calcul.',
 scenario=jsonb_set(scenario,'{picked}',
  (SELECT jsonb_agg((md5('LFI:2027:'||source_row::text)::uuid)::text ORDER BY source_row)
     FROM _qualified_direct))
WHERE id='00000000-0000-4000-8000-000000000002';

-- 4. Verrouille l'intégrité de l'échantillon actif et le non-mélange.
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM measures m JOIN proposal_accounting_measures pam ON pam.measure_id=m.id
 JOIN source_accounting_links sal ON sal.measure_id=m.id
 JOIN party_source_lines sl ON (sl.party_code,sl.source_year,sl.source_row)=(sal.party_code,sal.source_year,sal.source_row)
 JOIN measure_accounting_entries e ON e.measure_id=m.id
 JOIN _qualified_direct q ON q.source_row=sl.source_row
 WHERE pam.party_code='LFI' AND pam.source_year=2027
   AND sl.validation_status='validated' AND sl.apu_decision='calculate'
   AND e.category_id=q.category_id
   AND e.amount=sl.claimed_amount_bn
   AND m.reference_year=2027;
 IF n<>6 THEN RAISE EXCEPTION 'LFI direct measures integration incomplete %/6',n; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements_text(
       (SELECT scenario->'picked' FROM budgets
       WHERE id='00000000-0000-4000-8000-000000000002')) x
     WHERE x IN ('lfi-school','lfi-green'))>0
 THEN RAISE EXCEPTION 'LFI 2026/2027 mix detected'; END IF;
END $$;
