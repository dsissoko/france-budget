# ADR-0001 — Modèle canonique Budget / Mesure / Proposition / Impact

**Statut : accepté pour la cible V2 (mise à jour issue #154, 23 novembre 2026).**

## Contexte

Les anciennes représentations confondaient les engagements directement extraits d'un programme politique avec les regroupements nécessaires au rapprochement budgétaire. Cette confusion existait en SQL (`budget_proposals`), dans les CSV (`proposals.csv`) et dans les compteurs UI.

## Décision

1. Une **mesure** est un engagement élémentaire extrait des sources primaires, avec sa traçabilité documentaire et un montant revendiqué éventuel.
2. Une **proposition** regroupe zéro à N mesures et constitue l'unité de présentation et de rattachement des impacts. Zéro mesure est autorisé pour les propositions citoyennes directes.
3. Un **impact** est une variation comptable qualifiée, affectée exclusivement à une ligne du budget citoyen et rattachée à une proposition.

Le contrat d'import canonique est constitué de `budget.csv`, `measures.csv`, `proposals.csv` et `impacts.csv`. La relation utilise `measure_key` dans les mesures et `proposal_key` dans les propositions, les mesures et les impacts.

## Conséquences

- Tables physiques `v2.budgets`, `v2.budget_measures`, `v2.budget_proposals`, `v2.budget_impacts`.
- Une seule création initiale transactionnelle via `npm run db:init`, suivie de `npm run db:import`. Pas de migrations historiques successives.
- Conservation des 28 mesures / 11 propositions documentaires LFI 2027 et des huit propositions citoyennes directes NoPasaran.
- La qualification des sources et la proposition des regroupements sont agentiques ; l'unicité, les contraintes et le calcul sont déterministes.
- En mode `AGGREGATE`, les ventilations internes et les éventuels impacts documentaires ne sont pas ajoutés aux masses globales.
