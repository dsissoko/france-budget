---
name: budget-impact-qualification
description: Chaîne agentique V2 d'extraction de mesures sourcées, regroupement exclusif en propositions et qualification des impacts sur le pivot du budget citoyen. L'agent propose les classements ; les validations et l'import sont déterministes.
---

# Chaîne de qualification Mesure → Proposition → Impact

## Concepts canoniques

- **Mesure :** engagement élémentaire extrait fidèlement d'un programme politique, identifié par `measure_key`, traçable à une source primaire. Le montant `claimed_amount_bn` est *revendiqué*, pas automatiquement imputable.
- **Proposition :** unité consolidée, identifiée par `proposal_key`, regroupant une ou plusieurs mesures sources par lien explicite. Le citoyen peut créer directement une proposition sans mesures extraites (0 mesure).
- **Impact :** variation budgétaire justifiée sur un poste de référence ; il est rattaché à une proposition et non directement à une mesure. Un seul impact par `(budget_key,side,category_id)`.

Références impératives : `docs/v2/metier.md`, `docs/v2/mcd.md`, `docs/v2/integration.md`, `db/v2/001_schema.sql`, `scripts/v2/import.mjs`, référentiel de l'année, sources primaires des mesures.

## Pipeline

```mermaid
flowchart LR
    A["PDF / URL primaire"] --> B["Extraction agentique des mesures"]
    B --> C["measures.csv : source, millésime, montant revendiqué"]
    C --> D["Qualification des lignes du pivot"]
    D --> E["Regroupement agentique en propositions"]
    E --> F["proposals.csv + impacts.csv"]
    F --> G["Revue humaine"]
    G --> H["Validation déterministe : clés, montants, exclusivité"]
    H --> I["Import SQL transactionnel"]
```

**L'agent n'écrit ni en base, ni dans le moteur de calcul, ni dans les droits de publication.** L'extraction et le rapprochement documentaire sont agentiques ; le contrôle des références, la construction du contrat, les additions et l'import sont déterministes. La revue métier confirme les hypothèses retenues.

## Étape 1 — Extraire les mesures

Pour chaque mesure, conserver au minimum :
- `budget_key,measure_key,title,description,source_url,source_year` ;
- `source_section,source_excerpt,source_status,source_origin,notes` si disponibles ;
- `claimed_amount_bn,direction,amount_unit` si le chiffrage est expressément documenté.

Ne jamais mélanger deux millésimes LFI, supposer un montant manquant ou remplacer la source primaire par une inférence non sourcée. Les mesures non chiffrées sont conservées.

## Étape 2 — Regrouper les mesures en propositions

Identifier les postes citoyens potentiellement concernés sur la base d'une justification vérifiable. Former les groupes exclusifs selon les composantes connexes du graphe **mesures ↔ postes** : si plusieurs mesures concernent le même poste, elles appartiennent à une même proposition. Si une mesure touche deux postes, les composantes correspondantes fusionnent transitivement.

Chaque mesure extraite appartient exactement à **une** proposition, matérialisée dans `measures.csv` par `proposal_key`. Pour un groupe, fournir dans `proposals.csv` :
`budget_key,proposal_key,title,description`.

Garder aussi les engagements non imputables : une proposition peut n'avoir aucun impact. Une proposition citoyenne saisie directement n'a pas de mesure source fictive.

## Étape 3 — Qualifier les impacts

Pour chaque proposition, documenter dans un **registre de revue**, distinct des CSV importables :
- ses `measure_key` membres et les preuves de provenance ;
- `classification_status` : `direct_candidate`, `split_required`, `overlap_risk`, `year_uncertain`, `out_of_scope`, `insufficient_evidence` ;
- pour chaque impact candidat : `side,category_id,delta_amount_bn`, source/page, calcul exact, signe, justification et incertitude ;
- les chevauchements avec d'autres mesures, propositions, agrégats et écritures.

**Ne produire `impacts.csv` que pour les montants justifiables.** Format : `budget_key,proposal_key,side,category_id,delta_amount_bn` en Md€ avec un signe explicite. Une même proposition peut couvrir plusieurs postes ; un poste ne peut figurer dans deux propositions du même budget. Aucune clé `measure_key` n'identifie un impact.

En `PARTIAL`, seuls les impacts retenus modifient la simulation. En `AGGREGATE`, les masses annoncées sont autoritaires : les ventilations documentaires (`claimedAllocations`) sont **internes** et non des deltas additionnels. Conserver tout reliquat sans répartition arbitraire. Ne pas confondre les dispositifs hors budget et les recettes APU.

## Étape 4 — Valider et exporter

Fichiers canoniques communs à toutes les origines :
1. `budget.csv` — identité du budget, millésime, mode et métadonnées.
2. `measures.csv` — mesures sources (en-tête seul pour les propositions citoyennes directes).
3. `proposals.csv` — regroupements, dont ceux de cardinalité 0 mesure.
4. `impacts.csv` — affectations signées qualifiées et exclusives.

Les fichiers complémentaires LFI `groupes-citoyens.csv`, `rattachements-citoyens.csv` et `impacts-citoyens.csv` peuvent conserver la traçabilité détaillée et les ventilations internes ; ils doivent être **cohérents** avec les quatre CSV canoniques, sans devenir une deuxième source d'impacts comptables.

Exécuter `npm run test:v2` et `npm run db:check`. En QA : création complète avec `db:init`, import avec `db:import` puis `db:check -- --live`. Vérifier l'idempotence et les compteurs source/proposition/impact, sans invention de montants.

## Jeux de référence à ne pas dégrader

- **LFI 2027 :** 28 mesures sources → 11 propositions consolidées ; 11 allocations documentaires activées sur 15 postes ; 5 impacts explicites CSV seulement, non additionnés à l'AGGREGATE. Le poste Éducation regroupe les mesures `src-19`, `src-20`, `src-21` ; la seule écriture CSV du poste reste `4.000` Md€ issue des deux mesures qualifiées `src-19` et `src-21`.
- **NoPasaran :** huit propositions créées directement, zéro mesure extraite, huit impacts ; le poste défense conserve un impact consolidé de −25 Md€.

Une qualification `validated` ne peut jamais être déduite du seul fait qu'une mesure est numériquement chiffrée. Conserver et expliquer les inconnues et réserves.
