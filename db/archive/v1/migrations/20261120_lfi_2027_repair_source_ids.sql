-- Repair for staging imported before numeric source_row concatenation was fixed.
-- Reversible identifier normalization, without deleting a single line or accounting entry.
-- Fresh installations already have IDs 1..28 and bypass this block.
DO $repair$
DECLARE total_rows integer; malformed integer; linked_rows integer;
BEGIN
 SELECT count(*), count(*) FILTER (WHERE source_row > 28)
   INTO total_rows, malformed FROM public.party_source_lines
   WHERE party_code='LFI' AND source_year=2027;
 IF total_rows=28 AND malformed=0 THEN RETURN; END IF;
 SELECT count(*) INTO linked_rows FROM public.source_accounting_links
   WHERE party_code='LFI' AND source_year=2027;
 IF total_rows<>28 OR malformed<>26 OR linked_rows<>0 THEN
   RAISE EXCEPTION 'LFI 2027 repair unsafe: rows %, nonsequential %, linked %',
       total_rows, malformed, linked_rows;
 END IF;
 -- Two-phase renumbering avoids transient unique-key collisions, e.g. old R01=10 and R10=100.
 UPDATE public.party_source_lines SET source_row=source_row+10000
 WHERE party_code='LFI' AND source_year=2027;
 UPDATE public.party_source_lines
   SET source_row=CASE
     WHEN (source_row-10000) % 10=0 THEN (source_row-10000)/10
     ELSE ((source_row-10000)-14)/100+14
   END
 WHERE party_code='LFI' AND source_year=2027 AND source_row>10000;
 IF (SELECT count(DISTINCT source_row) FROM public.party_source_lines
     WHERE party_code='LFI' AND source_year=2027 AND source_row BETWEEN 1 AND 28) <>28 THEN
   RAISE EXCEPTION 'LFI 2027 source identifiers did not normalize completely';
 END IF;
END $repair$;
