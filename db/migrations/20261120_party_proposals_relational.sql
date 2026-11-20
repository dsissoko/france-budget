-- 2026-11-20 — répertoire relationnel durable des propositions politiques.
-- Non destructif et idempotent ; aucune proposition n'est activée automatiquement.
-- Les montants revendiqués ne sont PAS des écritures comptables APU.
--
-- Identité de formation : political_parties.code (jamais un titre ou un libellé).
-- Identité de proposition : (party_code, source_year, group_id).
-- Identité d'une ligne documentaire : (party_code, source_year, source_row).
-- Une ligne ne peut appartenir qu'à un groupe (FK composite).
CREATE TABLE IF NOT EXISTS public.party_proposals (
  party_code text NOT NULL REFERENCES public.political_parties(code),
  source_year integer NOT NULL CHECK (source_year BETWEEN 2000 AND 2100),
  group_id text NOT NULL CHECK (length(trim(group_id)) > 0),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  review_status text NOT NULL DEFAULT 'review_pending'
    CHECK (review_status IN ('review_pending','validated','rejected')),
  source_measure_count integer NOT NULL CHECK (source_measure_count >= 1),
  PRIMARY KEY (party_code, source_year, group_id)
);

CREATE TABLE IF NOT EXISTS public.party_source_lines (
  party_code text NOT NULL,
  source_year integer NOT NULL CHECK (source_year BETWEEN 2000 AND 2100),
  source_row integer NOT NULL CHECK (source_row >= 1),
  group_id text NOT NULL,
  direction text NOT NULL
    CHECK (direction IN ('expense_decrease','expense_increase','revenue_decrease','revenue_increase')),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  claimed_amount_bn numeric(18,3) NOT NULL CHECK (claimed_amount_bn >= 0),
  source_url text NOT NULL CHECK (source_url LIKE 'https://%'),
  apu_manual_tag text,
  validation_status text NOT NULL,
  PRIMARY KEY (party_code, source_year, source_row),
  CONSTRAINT party_source_lines_group_fk
    FOREIGN KEY (party_code, source_year, group_id)
    REFERENCES public.party_proposals(party_code, source_year, group_id)
);

-- Les données documentaires existantes utilisaient encore des libellés.
-- Mapping exceptionnel et explicite ; aucun parsing de titres.
WITH mapping(label,code) AS (
  VALUES ('RN','RN'),('LFI','LFI'),('Équinoxe','EQX')
)
INSERT INTO public.party_proposals
(party_code,source_year,group_id,title,review_status,source_measure_count)
SELECT mapping.code,d.source_year,d.group_id,d.title,'review_pending',d.source_measure_count
FROM public.party_proposal_draft d JOIN mapping ON mapping.label=d.party
ON CONFLICT (party_code,source_year,group_id) DO NOTHING;

WITH mapping(label,code) AS (
  VALUES ('RN','RN'),('LFI','LFI'),('Équinoxe','EQX')
)
INSERT INTO public.party_source_lines
(party_code,source_year,source_row,group_id,direction,title,claimed_amount_bn,source_url,apu_manual_tag,validation_status)
SELECT mapping.code,d.source_year,d.source_row,d.group_id,d.flow_direction,
       d.title,d.claimed_amount_bn,d.source_url,d.apu_manual_tag,d.validation_status
FROM public.party_source_measure_draft d JOIN mapping ON mapping.label=d.party
ON CONFLICT (party_code,source_year,source_row) DO NOTHING;

-- FK PK et index existants suffisent à la lecture par (party_code,source_year).
-- Cet index sert à charger un groupe avec ses lignes dans l'ordre source.
CREATE INDEX IF NOT EXISTS idx_party_source_lines_group
ON public.party_source_lines(party_code,source_year,group_id,source_row);

-- Pas de source_id inventé, pas d'impact sur budgets/measures/votes,
-- pas d'exposition dans GET /api/reference avant validation de l'impact APU.
