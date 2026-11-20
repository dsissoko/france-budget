-- Tests de préparation des propositions politiques (branche Neon de test)
-- Aucune écriture. Les statuts de validation sont indépendants des impacts APU.

-- 1. Couverture par groupe : toutes les mesures sources reçoivent un groupe unique.
SELECT s.party,s.source_year,COUNT(*) AS nb_lignes,
 COUNT(DISTINCT s.group_id) AS nb_groupes,
 COUNT(*) FILTER (WHERE p.group_id IS NULL) AS lignes_sans_proposition,
 COUNT(*) FILTER (WHERE COALESCE(s.source_url,'')='') AS lignes_sans_source
FROM party_source_measure_draft s
LEFT JOIN party_proposal_draft p ON p.party=s.party AND p.source_year=s.source_year AND p.group_id=s.group_id
GROUP BY s.party,s.source_year ORDER BY s.party,s.source_year;

-- 2. Correspondance des effectifs (résultat attendu : 0 ligne).
SELECT p.party,p.source_year,p.group_id,p.source_measure_count,
 count(s.*) AS actual_count
FROM party_proposal_draft p
LEFT JOIN party_source_measure_draft s ON s.party=p.party AND s.source_year=p.source_year AND s.group_id=p.group_id
GROUP BY p.party,p.source_year,p.group_id,p.source_measure_count
HAVING count(s.*)<>p.source_measure_count;

-- 3. Bilan des montants revendiqués (non consolidés APU).
SELECT party,source_year,flow_direction,SUM(claimed_amount_bn) AS MdEUR
FROM party_source_measure_draft
GROUP BY party,source_year,flow_direction
ORDER BY party,source_year,flow_direction;

-- 4. Les lignes préliminaires ne doivent pas alimenter automatiquement le moteur.
SELECT party,source_year,validation_status,count(*) AS n
FROM party_source_measure_draft GROUP BY party,source_year,validation_status
ORDER BY party,source_year,validation_status;

-- 5. Complétude des tags manuels à revoir.
SELECT party,source_year,source_row,title,apu_manual_tag
FROM party_source_measure_draft
WHERE apu_manual_tag IS NOT NULL AND apu_manual_tag <> ''
ORDER BY party,source_year,source_row;

-- Le solde officiel RN 2026 revendiqué est 35,600 Md€.
-- L'inventaire LFI 2026 est provisoire et ne réconcilie PAS encore les 26,7 Md€
-- annoncés dans son document officiel. Équinoxe 2027 inclut 4,6 Md€
-- d'ajustement activité/technique dans son bilan revendiqué de 78 Md€.
-- Aucun de ces soldes n'est un effet APU validé.
