# Gate de bascule V1 → V2 — recette fonctionnelle et absence de régression

**État : V2 en Preview/QA, pas de bascule production.** La PR #142 n'a pas vocation à modifier le frontend V1 tant que la parité ci-dessous n'est pas prouvée. Le code V1 doit rester disponible pour rollback.

## Contrats UI V1 réellement consommés

Audit du code `src/App.tsx`, `api/budgets/index.ts`, `api/reference.ts`, `api/votes.ts` et `api/share/[id].ts` :
- `GET /api/reference` : `revenues[]`, `expenses[]`, `offBudget[]`, `measures[]`, `referenceYear`, `referenceVersion`, `simulation` avec paramètres de trajectoire et seuils de qualification.
- `GET /api/budgets` : `budgets[]` avec UUID public, `title`, `description`, `origin`, `scenario`, `votes`, `featured`, `featured_order`, `maturity_status`, `confirmation_organization`, `confirmation_evidence_url`, `confirmed_at`, `published_at`, `budgetMode` ; affichage et comparaison incluent les données documentaires.
- `POST /api/budgets` : publication citoyenne, quotas et validation des propositions ; V1 transmet un `scenario` historique. **La V2 doit recevoir `proposals[]` et `impacts[]` directement, sans champ `citizenMeasures` persistant.** Le frontend doit être adapté en une fois.
- `POST /api/votes` : cookie pseudonyme `fb_voter`, vote unique par budget, HTTP 201/409.
- `/b/:id` et `/?budget=<uuid>` : liens publics déjà diffusés ; préserver l'identifiant d'origine lorsque `legacy_budget_id` existe.

## Tableau de parité des fonctions

| Fonction | V1 actuelle | Backend V2 actuel | Gate de bascule |
| --- | --- | --- | --- |
| Référentiel et simulation | catégories, descriptions, paramètres et seuils | postes pivots uniquement | adaptateur de contrat + tests |
| Budgets publics | `scenario`, badges, votes, featured, maturité, dates | colonnes canoniques, documentaire, votes | mapping UI et restitution de tous les champs attendus |
| Propositions citoyennes | `scenario.citizenMeasures` (V1 uniquement) | `v2.budget_proposals` + `v2.budget_proposal_impacts` | afficher les deux origines via les mêmes structures |
| Création citoyenne | publication unique sans compte, 100 places | POST V2 + clé d'édition par budget, quotas serveur | test navigateur et parité du plafond |
| Modification | copie locale avant publication, publication définitive | PATCH de brouillon, édition publiée interdite | ne pas introduire de parcours UI non demandé |
| Suppression | pas de retrait autonome V1 | DELETE logique avec clé de création | UI facultative, préserver votes et traces |
| Vote | `public.votes` + cookie | `v2.votes` + même cookie | mapping exhaustif historique + protection des votes pendant bascule |
| Partage | `/b/:id` V1, métadonnées OG | `/api/v2/share/:id`, ancien UUID admis si mappé | bascule contrôlée du rewrite après tests |
| Moteur | calcul des impacts, simulation 2025–2032 et assessment | postes V2 et endpoint `positions` | **réutiliser** `src/projection-core.ts`, `src/engine/simulation.ts`, `src/engine/assessment.ts`, `src/party-budget.ts` |
| Budget AGGREGATE | masses déclarées et réconciliation sans double comptage | agrégats documentaires conservés | adaptation de représentation V2 → moteur existant |
| Documentation | thèmes V1 et textes sources | `budget.description`, `documentary`, `proposals[]` | afficher directement textes compréhensibles d'un non-initié |
| Export JSON | bouton historique non normé | hors périmètre V2 | retirer bouton et fonction seulement au cutover UI, issue #143 |

**Aucune création d'un second moteur** : les fonctions comptables existantes doivent être partagées par la V2. La normalisation vers INSEE/ESA2010/COFOG ou GFSM est hors périmètre (#143).

## Recette Neon QA déjà exécutée

- Schéma V2 et 27 postes pivots ajoutés dans la **branche Neon QA**, aucune écriture V1.
- 16 budgets `latest`, 293 propositions dont 285 politiques, 8 impacts qualifiés NoPasaran ; les 285 propositions politiques ont actuellement 0 impact.
- Réimport NoPasaran idempotent, 8 montants identiques au calcul V1, version historique isolée de la vue `latest`, rollback transactionnel d'import invalide.
- CRUD citoyen SQL vérifié : création brouillon → modification → publication → refus de modification après publication ; mauvaise clé, révision périmée refusées ; retrait logique invisible pour le public.
- V1 NoPasaran : mapping explicite de l'identifiant `c2e1262e-e312-4f82-bf50-0dd63a751083` sur le budget V2 QA, copie de ses **3 votes existants** en V2 ; comparaison `votes_v1=3`, `votes_v2=3`. **Cet essai ne constitue pas une migration exhaustive des budgets et votes V1.**
- CI de la branche : tests V1 et V2 + audit éditorial ; aucun WAF actif.

## Critères de mise en production — TOUS obligatoires

- [ ] Qualifier et sourcer les impacts politiques nécessaires à chaque budget PARTIAL (les sources insuffisantes restent explicitement documentaires) ; aucune invention.
- [ ] Corriger les descriptions politiques absentes, actuellement 260 alertes de description manquante, relecture accessible au non-initié.
- [ ] Finaliser la compatibilité entre les payloads V2 et tous les traitements UI, y compris la simulation, badges, featured et paramètres.
- [ ] Rejouer toutes les parités de calculs, projections et statuts avec NoPasaran, programmes PARTIAL et AGGREGATE, cas de réutilisation de budget politique par un citoyen.
- [ ] Migrer **tous** les citoyens et leurs votes, contrôler les liens UUID historiques, prévoir écritures concurrentes et rollback.
- [ ] Tester E2E (GET, création, brouillon, publication, tentative tierce, vote, partage, comparaison, affichage).
- [ ] Adapter l'UI **sans `citizenMeasures` en V2** ; retirer uniquement « Exporter » et sa fonction obsolète, conserver « Enregistrer » et « Publier ».
- [ ] Vérifier sur Vercel Preview, Neon QA ; WAF V2 non activé en production sans test ciblé, **aucun impact V1**.
- [ ] PR revue, CI verte, décision distincte de merge/cutover et plan de retour arrière.

## Plan de retour arrière

Tant que le frontend V1 et ses routes restent inchangés, rollback = désactiver la Preview V2. Lors de la bascule, conserver snapshot V1/Neon, mapping UUID et procédure de reprise des votes/écritures depuis l'instant du snapshot. **Ne pas prétendre qu'un simple changement de routes suffit si des publications ou votes nouveaux ont été enregistrés entre deux versions.**

Sources : [issue #135](https://github.com/dsissoko/france-budget/issues/135), [issue #139](https://github.com/dsissoko/france-budget/issues/139), [issue #143](https://github.com/dsissoko/france-budget/issues/143), [PR #142](https://github.com/dsissoko/france-budget/pull/142).
