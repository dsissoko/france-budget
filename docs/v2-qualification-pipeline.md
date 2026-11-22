# Pipeline V2 — qualification agentique à l'intérieur d'une chaîne déterministe

## Décision d'architecture

**Le pipeline est déterministe de bout en bout, avec une seule étape agentique délimitée : qualification de la correspondance entre propositions et impacts budgétaires.** Le modèle `Budget / Proposal / Impact` est le même pour partis et citoyens. Le traitement n'est jamais exécuté par un agent à l'ouverture de l'UI, pendant l'import ni dans les calculs du moteur.

Le skill opérationnel est [`skills/budget-impact-qualification/SKILL.md`](../skills/budget-impact-qualification/SKILL.md).

| Étape | Nature | Entrées | Sortie / invariant |
| --- | --- | --- | --- |
| 1. Acquisition et extraction | Déterministe après choix des sources | PDF officiel, référence de publication | Inventaire de propositions, montants, pages et URL ; provenance conservée |
| 2. Qualification comptable | **Agentique — skill** | Inventaire, référentiel 27 postes, sources | Registre de décisions argumentées et propositions d'écritures |
| 3. Arbitrage | Contrôle métier explicite | Registre et pièces justificatives | Écritures acceptées / rejetées / bloquées ; pas de publication implicite |
| 4. Matérialisation CSV | Déterministe | Décisions acceptées | `budget.csv`, `proposals.csv`, `impacts.csv` cohérents |
| 5. Validation et recette | Déterministe | CSV et référentiel | Schéma, sources, montants, signes, doublons, additionnalité, versions, tests |
| 6. Import V2 | Déterministe et transactionnel | Triplet validé, `V2_DATABASE_URL` QA | Écritures dans `v2` uniquement ; pas de fallback `public` |
| 7. Calcul et rendu | Déterministe | API `/api/v2/*` | Moteur existant, projections, comparaison et UI ; aucune inférence IA runtime |

## Frontière agent / machine

L'agent répond à « *quelle opération publique ce chiffrage pourrait-il modifier, avec quel signe et quelle part comptablement défendable ?* ». Le validateur répond à « *cette écriture est-elle référencée, bien formée, complète, additive et cohérente ?* ». Le moteur répond à « *que produit l'application mécanique des deltas acceptés ?* ».

Aucune suggestion d'agent n'est convertie automatiquement en `validated` ni ajoutée à `impacts.csv` sans justification vérifiable. Si l'agent ne peut démontrer une ventilation fiable, la mesure reste dans `proposals.csv` avec montant sourcé et sans impact.

## Distinction essentielle : trois montants

- **Montant revendiqué** : `claimed_amount_bn` de la mesure dans le PDF ; peut être directement sourcé sans qualification APU.
- **Écriture comptable** : `delta_amount_bn` sur une ligne du pivot citoyen ; nécessite une qualification du poste, du signe, de l'année et de l'additionnalité.
- **Résultat budgétaire affiché** : dérivé soit de l'ensemble des écritures `PARTIAL`, soit des agrégats documentés `AGGREGATE`. Ne jamais les sommer entre eux.

En `AGGREGATE`, les impacts individuels peuvent documenter la ventilation *sans modifier le résultat agrégé*, ce qui évite de compter deux fois une annonce. Prévoir un rapport de couverture et les écarts aux totaux sourcés ; un résidu n'est pas une mesure à imputer au poste « autres » par défaut.

## Consolidation déterministe par poste — choix retenu

**Le modèle conserve l'unicité `(budget_id,side,category_id)`.** Une étape déterministe succède à la qualification agentique : elle additionne les contributions validées partageant un poste et produit une proposition technique `pivot-<side>-<category_id>` ainsi qu'une seule ligne `impacts.csv`. Toutes les mesures originales restent dans `proposals.csv` avec leur montant revendiqué, leur source et un statut de regroupement ; le groupe les relie via `source_origin=pivot_consolidation` et `notes=members=...`.

LFI : `src-19` (+0,5) et `src-21` (+3,5) restent deux mesures primaires distinctes, regroupées en `pivot-expenses-education` (+4,000) ; le calcul ne reçoit qu'une écriture. L'UI affiche un groupe Éducation avec les deux mesures constitutives, sans masquer leur identité, et le compteur source reste **28 mesures**. Le jeu physique CSV contient 29 propositions (28 mesures primaires et un groupe technique), 5 écritures sur 5 postes (six contributions qualifiées).

La consolidation doit vérifier l'égalité exacte de la somme de ses membres, la validité de chaque clé, la même direction et année, l'absence de doublon, et la conservation des propositions initiales. Ne jamais regrouper des mesures non qualifiées pour inventer une ventilation.

## Contrôles de recette

1. LFI 2027 : 28 propositions source distinctes, 14 recettes + 14 dépenses, sans doubles issues du V1.
2. Deux mesures originales `src-19` et `src-21` conservées et liées à **une seule écriture `expenses/education` de +4,000 Md€**.
3. Six contributions actuellement qualifiées, consolidées en cinq écritures : +3,000 Md€ recettes et +19,000 Md€ dépenses ; les 22 autres restent sans imputation artificielle.
4. Mode `AGGREGATE` LFI : +106,4 Md€ de recettes, +81,7 Md€ de dépenses, amélioration revendiquée +24,7 Md€ **inchangés par l'ajout des écritures individuelles**.
5. NoPasaran : 8 propositions, 8 impacts, mêmes catégories, signes, déficit et trajectoire 2032.
6. Prévenir toute publication d'un export certifié INSEE ou d'une ventilation non sourcée.
7. Tests CI + imports QA idempotents + vérification endpoint + recette mobile Preview ; jamais de merge ni écriture V1 sans accord.

## Démarche de déploiement

Valider la consolidation dans les CSV sans changer la contrainte SQL, tester les jeux locaux, puis appliquer l'import **uniquement sur branche Neon QA isolée** ; réimporter LFI 2027 et vérifier `proposal_count`, `impact_count`, détails API et calculs. La Preview est alors mise à jour pour revue humaine. La livraison V2 reste séparée de la production.

**La compétence agentique est réutilisable pour n'importe quel parti : aucune règle spéciale « LFI » dans le moteur, l'API ou les tables.**
