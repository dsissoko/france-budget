# NoPasaran 2025 — jeu d'intégration citoyen V2

Programme citoyen « Redressement avec la paix et la justice fiscale », conservé en CSV comme source de vérité. Les éléments citoyens sont des **propositions directes**, sans extraction documentaire préalable de mesures politiques.

## Contrat canonique

| Fichier | Contenu |
|---|---|
| `budget.csv` | Identité `nopasaran-2025`, millésime, origine `citizen`, mode `PARTIAL` |
| `measures.csv` | En-tête seul : **zéro mesure source extraite** |
| `proposals.csv` | **8 propositions** citoyennes consolidées (`proposal_key`, titre, description) |
| `impacts.csv` | **8 impacts** rattachés aux propositions, uniques par `(budget_key,side,category_id)` |
| `expected-positions.csv` | Fixture de recette uniquement, non importée |

Une proposition peut porter plusieurs décisions citoyennes dans sa description ; le poste `expenses/defense` conserve **un impact de −25 Md€**, composé des intentions −3 et −22 Md€, sans double comptage.

Les clés sont stables, le CSV est UTF-8 séparé par des virgules et les montants sont des décimaux en milliards d'euros, avec point décimal. Ne jamais convertir un montant inconnu en zéro.

## Vérification

- `npm run db:import` : lecture et validation à blanc.
- `npm run test:v2` : invariants, postes, calcul et idempotence.
- Sur Neon QA vierge : `npm run db:init -- --apply --confirm-empty-v2`, `npm run db:import -- --apply`, puis `npm run db:check -- --live`.

La référence et les impacts reconstituent les huit postes attendus, dont `expenses/defense=30.4` Md€. Les budgets citoyens et votes précédents ne sont pas conservés lors de la reconstruction explicitement approuvée de la V2 ; l'import CSV ne crée aucun vote.
