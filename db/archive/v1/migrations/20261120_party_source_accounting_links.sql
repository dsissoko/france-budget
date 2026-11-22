-- Migration additive : traçabilité ligne source -> proposition -> mesure comptable.
-- Les liaisons restent vides tant que les sources et montants APU ne sont pas validés.
-- Un même document source ne peut contribuer à plusieurs mesures actives.
-- Les deux contraintes composites garantissent le même parti et la même proposition.

-- Identifiants composites de référence pour imposer l'appartenance commune.
CREATE UNIQUE INDEX IF NOT EXISTS uq_budgets_id_party_code
  ON public.budgets(id,party_code);

CREATE UNIQUE INDEX IF NOT EXISTS uq_measures_id_budget_id
  ON public.measures(id,budget_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_source_lines_with_group
  ON public.party_source_lines(party_code,source_year,group_id,source_row);

-- Une mesure comptable appartient au plus à un regroupement documentaire.
CREATE TABLE IF NOT EXISTS public.proposal_accounting_measures (
  measure_id uuid PRIMARY KEY,
  budget_id uuid NOT NULL,
  party_code text NOT NULL,
  source_year integer NOT NULL,
  group_id text NOT NULL,
  CONSTRAINT proposal_accounting_measures_measure_fk
    FOREIGN KEY(measure_id,budget_id) REFERENCES public.measures(id,budget_id),
  CONSTRAINT proposal_accounting_measures_party_fk
    FOREIGN KEY(budget_id,party_code) REFERENCES public.budgets(id,party_code),
  CONSTRAINT proposal_accounting_measures_group_fk
    FOREIGN KEY(party_code,source_year,group_id)
    REFERENCES public.party_proposals(party_code,source_year,group_id),
  CONSTRAINT proposal_accounting_measures_composite_unique
    UNIQUE(measure_id,party_code,source_year,group_id)
);

-- Une même ligne source ne peut alimenter deux mesures comptables.
-- FK composite : impossible de rattacher une source d'un autre parti ou groupe.
CREATE TABLE IF NOT EXISTS public.source_accounting_links (
  party_code text NOT NULL,
  source_year integer NOT NULL,
  group_id text NOT NULL,
  source_row integer NOT NULL,
  measure_id uuid NOT NULL,
  PRIMARY KEY(party_code,source_year,source_row),
  CONSTRAINT source_accounting_links_source_fk
    FOREIGN KEY(party_code,source_year,group_id,source_row)
    REFERENCES public.party_source_lines(party_code,source_year,group_id,source_row),
  CONSTRAINT source_accounting_links_measure_fk
    FOREIGN KEY(measure_id,party_code,source_year,group_id)
    REFERENCES public.proposal_accounting_measures(measure_id,party_code,source_year,group_id)
);

-- Pour charger rapidement les lignes explicatives d'une mesure.
CREATE INDEX IF NOT EXISTS idx_source_accounting_links_measure
  ON public.source_accounting_links(measure_id);

-- Les tables de rattachement sont délibérément VIDES.
-- Une proposition n'est publiable qu'après revue des sources, décision APU
-- (calculable / non chiffrable et motivation), ventilation équilibrée et
-- contrôle de non-recouvrement ; aucune activation implicite dans cette migration.
