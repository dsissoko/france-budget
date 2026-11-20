-- Modèle documentaire générique pour le chantier de fidélité des budgets partisans.
-- Migration de préparation : ne crée ni nouveaux budgets visibles, ni effets budgétaires.
-- Déjà éprouvé dans la branche de travail Neon audit-reference-insee-2026-11-20.
-- À promouvoir via revue de schéma ; ne pas exécuter automatiquement sur la production.

CREATE TABLE IF NOT EXISTS public.party_source_measure_draft (
    party text NOT NULL,
    source_year integer NOT NULL,
    source_row integer NOT NULL,
    group_id text NOT NULL,
    group_label text NOT NULL,
    flow_direction text NOT NULL
        CHECK (flow_direction IN ('expense_decrease', 'expense_increase', 'revenue_decrease', 'revenue_increase')),
    title text NOT NULL,
    claimed_amount_bn numeric(18, 3) NOT NULL,
    source_url text NOT NULL,
    apu_manual_tag text,
    validation_status text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (party, source_year, source_row)
);

CREATE TABLE IF NOT EXISTS public.party_proposal_draft (
    party text NOT NULL,
    source_year integer NOT NULL,
    group_id text NOT NULL,
    title text NOT NULL,
    source_measure_count integer NOT NULL,
    review_status text NOT NULL,
    PRIMARY KEY (party, source_year, group_id)
);

-- Le rattachement à un seul groupe permet d'afficher 6 à 10 propositions
-- sans confondre montant revendiqué et impact comptable sur les APU.
-- Ne JAMAIS sommer une ligne de sous-total et ses composantes.
-- Ne JAMAIS calculer à la fois un groupe et les mesures qui le composent.
-- Ces tables de préparation ne sont pas exposées par GET /api/reference.

-- Registre des formations candidates, sans exposition publique ni sélection éditoriale.
CREATE TABLE IF NOT EXISTS public.party_source_registry_draft (
    party_code text PRIMARY KEY,
    formation_name text NOT NULL,
    document_year integer NOT NULL,
    source_type text NOT NULL,
    source_url text NOT NULL,
    verification_status text NOT NULL,
    notes text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cette table n'est pas un tableau de popularité ni une preuve d'exhaustivité.
-- L'inclusion dans Voter exige vérification primaire, couverture déclarée,
-- correspondance APU et capacité réelle du moteur à calculer le scénario.
