-- Métadonnées documentaires pour les programmes politiques.
-- Les CSV restent la source de vérité ; aucune écriture comptable créée ici.
ALTER TABLE public.party_proposals
 ADD COLUMN IF NOT EXISTS citizen_impacts jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.party_source_lines
 ADD COLUMN IF NOT EXISTS source_page integer;
COMMENT ON COLUMN public.party_proposals.citizen_impacts IS
 'Impacts citoyens revendiqués, documentaires. Ils ne constituent pas des écritures de simulation.';
COMMENT ON COLUMN public.party_source_lines.source_page IS
 'Page imprimée du document primaire pour la provenance.';
