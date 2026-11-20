-- Audit read-only des liens de traçabilité, exécutable après chaque import.
-- Tout résultat non nul dans les contrôles "invalides" bloque l'activation.
-- Les groupes review_pending et décisions NULL sont attendus avant revue humaine.

-- 1. Groupe documentaire validé mais lignes non décidées, non validées,
--    ou lignes "calculate" sans rattachement à une mesure.
SELECT p.party_code,p.source_year,p.group_id,
       count(*) FILTER(WHERE sl.validation_status <> 'validated' OR sl.apu_decision IS NULL) AS unchecked_lines,
       count(*) FILTER(WHERE sl.apu_decision='calculate' AND sal.measure_id IS NULL) AS unlinked_calculable_lines,
       count(*) FILTER(WHERE sl.apu_decision='non_chiffrable_apu'
                         AND length(trim(coalesce(sl.apu_reason,'')))=0) AS unreasoned_exclusions
FROM public.party_proposals p
JOIN public.party_source_lines sl USING (party_code,source_year,group_id)
LEFT JOIN public.source_accounting_links sal
  ON (sal.party_code,sal.source_year,sal.source_row)=(sl.party_code,sl.source_year,sl.source_row)
WHERE p.review_status='validated'
GROUP BY p.party_code,p.source_year,p.group_id;

-- 2. Mesure source existante mais sans ventilation comptable ou divergente.
SELECT m.id,m.legacy_id,pam.party_code,pam.source_year,pam.group_id,
       coalesce(sum(e.amount) FILTER(WHERE e.side='revenues'),0) AS apu_revenues,
       coalesce(m.revenue_delta,0) AS claim_revenues,
       coalesce(sum(e.amount) FILTER(WHERE e.side='expenses'),0) AS apu_expenses,
       coalesce(m.expense_delta,0) AS claim_expenses
FROM public.proposal_accounting_measures pam
JOIN public.measures m ON m.id=pam.measure_id
LEFT JOIN public.measure_accounting_entries e ON e.measure_id=m.id
GROUP BY m.id,pam.party_code,pam.source_year,pam.group_id
HAVING count(e.measure_id)=0
 OR abs(coalesce(sum(e.amount) FILTER(WHERE e.side='revenues'),0)-coalesce(m.revenue_delta,0))>0.001
 OR abs(coalesce(sum(e.amount) FILTER(WHERE e.side='expenses'),0)-coalesce(m.expense_delta,0))>0.001;

-- 3. Synthèse d'avancement.
SELECT p.party_code,p.source_year,count(DISTINCT (p.source_year,p.group_id)) proposals,
       count(DISTINCT (sl.source_year,sl.source_row)) source_lines,
       count(DISTINCT (pam.measure_id)) linked_measures,
       count(DISTINCT (sal.source_year,sal.source_row)) linked_lines,
       count(DISTINCT (p.source_year,p.group_id)) FILTER(WHERE p.review_status='validated') validated_groups
FROM public.party_proposals p
LEFT JOIN public.party_source_lines sl USING (party_code,source_year,group_id)
LEFT JOIN public.proposal_accounting_measures pam USING (party_code,source_year,group_id)
LEFT JOIN public.source_accounting_links sal USING (party_code,source_year,group_id)
GROUP BY p.party_code,p.source_year
ORDER BY p.party_code,p.source_year;
