-- Indexation ciblée sur les requêtes réelles des API et du référentiel documentaire.
-- Contrôlée par EXPLAIN ANALYZE sur Neon le 20/11/2026 :
-- budgets publics : ~0,11 ms, mesures publiées : ~0,08 ms au volume actuel.
-- Ne pas sur-indexer des tables de 5 à 25 lignes.
--
-- Liste des budgets politiques visibles par identifiant de parti (jamais par titre).
CREATE INDEX IF NOT EXISTS idx_budgets_public_party_code
ON public.budgets(party_code,featured_order)
WHERE origin='party' AND visibility='public';

-- Lecture des mesures documentaires d'une proposition et restitution ordonnée.
CREATE INDEX IF NOT EXISTS idx_party_source_measure_group
ON public.party_source_measure_draft(party,source_year,group_id,source_row);

-- Index existants conservés :
-- budgets(id) PK ; budgets(public/published_at) partiel ;
-- measures(budget_id,legacy_id) unique partiel ;
-- votes(budget_id), votes(budget_id,voter_hash) unique ;
-- measure_accounting_entries(measure_id,line_number) PK.
-- Pas d'index JSONB : les calculs transitent par les écritures APU structurées.
-- L'index votes(budget_id) pourrait être redondant avec l'index unique composite :
-- ne pas le supprimer sans EXPLAIN/validation dédiée et retour d'expérience.
