# Analyse d'impact UI V1 → Backend V2

**Date : 22 novembre 2026 · Statut : analyse, sans modification UI ou V1.**
Périmètre examiné : `src/App.tsx`, `src/share.ts`, `src/citizen-proposals.ts`, `src/projection-core.ts`, `src/party-budget.ts`, `src/engine/simulation.ts`, `src/budget-maturity.ts`, `src/engine/vote-qualification.ts`, API V1 `reference`, `budgets`, `votes`, API V2 `reference`, `budgets`, `positions`, `votes`, schéma et données CSV V2. Cette analyse ne vaut pas recette navigateur.

## Décision sur la reprise des budgets citoyens

- **NoPasaran** : source de vérité = triplet CSV `data/programmes/nopasaran/2025/`, déjà importable par le pipeline V2 ; vérifier les **8 propositions / 8 impacts et montants**. La reprise V1 par script n'est **pas nécessaire**.
- Autres budgets citoyens publiés en V1 : données de **test**, **ne pas migrer**. Ne pas les faire apparaître dans l'UI V2 après bascule.
- Code déjà engagé `legacy_budget_id`, `v2.votes` et capacité de migration contrôlée : **le conserver**, sans en faire un prérequis ni un script de migration généralisé. Le lien V1 de NoPasaran et ses votes ne sont conservés **que si l'on décide explicitement de garder les liens et votes acquis** ; le réimport CSV, à lui seul, ne recopie ni UUID historique ni votes. Clarifier le traitement du compteur de votes et des liens historiques avant bascule ; rien de caché ni de supposé.
- Ne pas importer les tests citoyens pour « remplir » la V2.

## Architecture de migration UI — règle directrice

**Même interface et même moteur, changement contrôlé de contrat de données.** L'UI ne doit pas continuer à distinguer structurellement une liste de propositions politiques issue de `measures[]` et une liste citoyenne issue de `scenario.citizenMeasures[]`. Les données **publiées** V2 sont uniquement `budgets`, `budget_proposals` et `budget_proposal_impacts` ; l'origine détermine les droits et le statut documentaire, pas la forme des propositions. Un état local de brouillon dans le navigateur peut manipuler les mêmes objets `Proposal` / `Impact`, mais n'introduit jamais un champ V2 `citizenMeasures`.

Éviter un « faux modèle V1 » créé côté API V2 avec `scenario`, `picked`, `citizenMeasures` ou de nouvelles tables `measures` pour masquer l'absence de migration. Préférer un **adaptateur UI typé** convertissant les réponses canoniques V2 en vues : état du référentiel, budget affiché, propositions, positions, métadonnées et projections. Le moteur existant reçoit des **écritures explicites** déjà qualifiées, et conserve tous ses calculs.

## 1. Points d'intégration réellement présents en V1

| Emplacement | V1 actuelle | V2 existante | Transformation nécessaire |
|---|---|---|---|
| `App.tsx` `useEffect(fetch('/api/reference'))` | `revenues[]`, `expenses[]`, `offBudget[]`, `measures[]`, `referenceVersion`, `simulation` | `GET /api/v2/reference` renvoie `posts[]` (année, side, categoryId, label, referenceAmountBn) | Fournir séparément la nomenclature complète (descriptions, canonical, offBudget.revenueImpactCategory, ordre), paramètres actifs et millésime ; **ne jamais fabriquer des descriptions ou paramètres**. `measures[]` doit disparaître du modèle V2 publié, et tous les usages du moteur être adaptés. |
| `refreshPublic` | GET `/api/budgets` → tableaux d'objets publiés V1 avec `scenario` et badges | GET `/api/v2/budgets` → summaries canoniques, `proposalCount`, `impactCount`, `votes` | Introduire un type `BudgetSummaryV2`; enrichir **dans les données V2** le statut documentaire, le statut de qualité, les informations de publication, `featured`/ordre et les indicateurs nécessaires. Ne pas utiliser `count` comme une liste de propositions. |
| `calculatePublic`, `partyMeasuresFor`, `eligiblePartyBudget` | `scenario.picked`, `scenario.budget`, `claimedTotals`, `measures[]` ou `citizenMeasures[]` | `GET /api/v2/budgets/:key` → `proposals[]` avec `impacts[]` et `documentary` ; `positions` distinctes | Charger les détails explicitement et calculer à partir des impacts **qualifiés**. Aucune proposition sans impact ne participe aux calculs. Gérer `PARTIAL` et `AGGREGATE` distinctement pour les résultats, sans doubler les agrégats et sans inventer un impact. |
| `renderBudgetDetail`, cartes voter/comparer | `partyMeasuresFor(b,measures)` OU `b.scenario.citizenMeasures` ; description + listes et jauges | Une liste `proposals[]` uniforme | N'afficher dans le **bloc des mesures chiffrées** que les propositions avec `impacts.length>0`, pour **partis comme citoyens**. Éléments documentaires et agrégats gardés dans `documentary` mais pas présentés comme mesures calculées. Même interaction accordéon, jauges, libellés et sources pour les deux origines. |
| `publishBudget` | POST V1 avec `scenario`, `picked`, `citizenMeasures`, `measures`, puis `id` | POST V2 avec `title/description/author/referenceYear/proposals[]/impacts[]/publish`, renvoie `budgetKey`, `id`, `revision`, `editToken` | Construire le payload V2 **depuis les propositions locales uniformisées** ; conserver UUID public, afficher le nouveau budget et rafraîchir. V1 calculait aussi des `residual` : définir leur représentation explicite avant publication, sans inventer de propositions. Vérifier double affectation, borne 0-200 %, unicité des postes et retour erreur. |
| `vote(id)` | POST `/api/votes`, cookie `fb_voter`, réponse 201 ou 409 | POST `/api/v2/votes` similaire | Changer la route au cutover ; compteurs, vote unique et retour « déjà voté » inchangés. Ne pas recopier les votes de budgets de test. |
| `/b/:id`, `readBudgetLink` | UUID public dans l'URL de partage, `/api/share/:id` | `/api/v2/share/:id` déjà créé | Conserver les UUID publics V2. Si ancien lien NoPasaran indispensable, utiliser le mapping déjà engagé **seulement pour ce budget**. Adapter le rewrite Vercel **uniquement à la bascule**, jamais avant. |
| `applyOrigin` et démarrage depuis un budget public | V1 copie `scenario`, ou adopte `aggregateOrigin` + `aggregateIncludedIds` | V2 possède le budget et ses impacts mais pas le même objet `scenario` | Conversion explicite `BudgetDetailV2 → DraftCitizenV2`. Pour AGGREGATE, reprendre la masse déclarée comme base, sans rejouer les mesures du parti. **Point de recette prioritaire** : le POST citoyen V2 actuel ne persiste pas les métadonnées de filiation `aggregateOrigin` ; corriger le contrat de données pour ce cas sans retour à `scenario` V1. |
| `saveScenario` et `loadSaved` | Sauvegarde locale `localStorage` avec copie de `citizenMeasures` | Pas de compte ni de persistance serveur des brouillons UI prévue | Garder la sauvegarde navigateur et la modifier vers un `DraftBudgetV2` uniforme. Gérer une fois l'ancienne clé locale V1 si pertinent, **sans la persister en nouveau format V2**. Le CRUD brouillon distant n'impose pas un nouveau parcours UI. |
| `download` | Bouton « Exporter » → JSON applicatif non normalisé | Dé-scopé (#143) | Retirer bouton, fonction et icône non utilisée **dans la PR UI de bascule**, pas maintenant en prod V1. |
| `MaturityTag`, `CitizenChampion`, `featured`, `voteQualification` | Champs `maturity_status`, confirmation, `featured`, `featured_order`, nombre de votes, trajectoire 2032 | Champs manquants/partiels dans la V2 | Restituer dynamiquement, conserver la règle champion du budget citoyen le plus voté et les critères actuels de qualification. **Ne pas hardcoder dans l'UI**. |

## 2. Problèmes fonctionnels à résoudre AVANT le branchement

### P0 — Référentiel V2 incomplet pour le moteur/UI

`GET /api/v2/reference` fournit actuellement les 27 postes et leurs montants, **pas** le `canonical`, la description, l'ordre, le `revenueImpactCategory` pour les `offBudget`, ni les paramètres actifs de simulation, `referenceVersion`, `assessment`. L'UI V1 attend ces éléments et bloque son initialisation s'ils manquent. Le moteur `projection-core.ts` utilise expressément `offBudget.revenueImpactCategory` pour appliquer un changement de manque à gagner **à la recette fiscale/sociale correspondante**. `src/engine/simulation.ts` doit recevoir les paramètres de trajectoire, non un nouvel algorithme.

**Solution cible :** modèle V2 de référence enrichi, fondé sur le snapshot des données V1 et sur leurs paramètres/sources autorisés, avec API structurée ; aucun fallback implicite vers la base V1, aucune valeur inventée. Tests de parité de chacune des 27 catégories et des 7 paramètres (ainsi que les seuils).

### P0 — Résultats et double comptage

- `PARTIAL` : base publique 2025 + impacts **explicites** `budget_proposal_impacts`. Les propositions politiques à impact nul ou non qualifié sont purement documentaires, même si elles ont un montant revendiqué. Présentation de budget obligatoire via `budget.description`.
- `AGGREGATE` : les agrégats déclarés, s'ils sont suffisamment qualifiés et compatibles avec le moteur existant, constituent **la masse revendiquée** et ne s'additionnent jamais aux propositions. L'API `positions` actuelle répond `positions: []` pour les AGGREGATE ; ce n'est **pas suffisant pour afficher la comparaison budgétaire et la trajectoire**. Définir explicitement le contrat des agrégats sourcés et le calcul existant ; sinon afficher un résultat non calculable sans simuler un bilan inventé.
- `offBudget` : l'effet numérique ne se limite pas à modifier la ligne hors-budget : il doit affecter les recettes correspondantes avec le signe inverse. Les 8 impacts NoPasaran constituent le pivot de test. Les valeurs SQL de `positions` ne sont pas à considérer comme un résultat comptable complet tant que ce rapprochement n'est pas appliqué.

### P0 — Publication citoyenne à partir d'un budget AGGREGATE

Le parcours V1 `applyOrigin` peut copier un budget politique agrégé puis ajouter des choix citoyens. Le POST V2 actuel accepte `budgetMode` mais ne persiste pas la **filiation, la source et la masse de départ** ; `normalizeCitizenBody` reconstruit `documentary:{}`. Il faut formaliser un *snapshot de source* et des ajouts citoyens explicites, calculés **une seule fois**. Aucune réintroduction de `citizenMeasures`, `picked` ni `aggregateOrigin` V1 tels quels en base.

### P1 — Informations de carte, sélection, statut documentaire

Le GET de liste V2 ne renvoie pas `featured`, `featured_order`, `maturity_status`, `confirmation_organization`, `confirmation_evidence_url`, `confirmed_at`. Les titres et descriptions sont disponibles ; les votes aussi. Les champs manquants doivent être traités dans le modèle de présentation V2 (modèle de données ou vue/API dédiée, pas une duplication du modèle de mesures). Il faut maintenir les badges indépendants : **documentation/qualité**, performance financière, champion citoyen. Sélection en comparaison : budget INSEE + budgets mis en avant, puis choix A/B, avec alignement et rendu inchangés.

### P1 — Chargement des détails et performances

L'ancienne liste contient le `scenario` nécessaire à tous les calculs ; la liste V2 expose des compteurs et le détail est une requête séparée par `budgetKey`. La future UI doit gérer le **chargement des détails** (préchargement contrôlé des budgets visibles, cache par `budgetKey`, états loading/error), sans provoquer N requêtes par rendu ou clignotements. Le code doit conserver les UUID publics pour vote/liens mais employer les **clés stables** pour l'accès aux budgets V2.

### P1 — Publication et comportements existants

La V1 publie directement et définitivement ; la V2 accepte brouillon/PATCH/DELETE mais aucun bouton d'édition publiée n'est demandé. Conserver le parcours actuel et ne pas créer de gestion de comptes. Le secret d'édition par budget n'est utile que pour un parcours de retrait explicitement proposé ; il ne doit pas figurer dans l'URL ni dans une donnée publique. Prévoir tests validation des 100 publications, erreurs 409/429, publications depuis un agrégat et depuis référence simple.

### P2 — Dé-scopage et nettoyage

Retrait du bouton/export lors de l'adaptation UI, suppression de la dépendance du UI publié à `src/citizen-proposals.ts` et des structures publiées `citizenMeasures` et `measures[]` politiques. Remplacer les sauvegardes locales historiques par le type canonique en gardant si nécessaire un adaptateur de lecture de vieux brouillons. Ne pas supprimer les fonctions de calcul utiles ou les commentaires de sûreté.

## 3. Découpage d'implémentation recommandé

1. **Contrat de référence complet** : V2 livre catégories, descriptions, codes pédagogiques, ordre, correspondances hors-budget et paramètres/sources de projection.
2. **Adaptateur calcul V2** : fonctions pures `BudgetDetailV2 + ReferenceV2 → Result`, parité des masses, offBudget, PARTIAL/AGGREGATE, NoPasaran et projection 2032. **Réutiliser** `calculateScenario`, `calculatePublishedBudget`, `calculateAggregateCitizenBudget`, `simulationService` et `voteQualification` sans en changer les hypothèses.
3. **Contrat de publication citoyenne complet** : uniformisation des propositions locales ; cas de création à partir de la référence et d'un AGGREGATE ; tests POST/validation; pas de champ V1 `citizenMeasures`.
4. **Contrat de liste et présentation V2** : badge documentaire et qualitatif, `featured`, compteur des votes et proposition **chiffrée** uniquement, récupération des détails.
5. **Refonte ciblée des flux UI** (comprendre/comparer/mon budget/voter), en préservant la mise en page ; suppression du bouton Exporter ; maintien de Enregistrer/Publier.
6. **Tests d'acceptation** : typecheck, Vitest, tests SQL/QA, E2E Preview et captures visuelles V1/V2, votes, partage, duplications, AGGREGATE, NoPasaran 8/8 et déficits/projections.

## 4. Matrice de tests de non-régression

| Test | Attendu |
|---|---|
| Référence V1 / V2 | 27 postes, montants, descriptions et rapprochement identiques ; 7 paramètres de simulation ; pas de changement du déficit de référence |
| NoPasaran | 8 propositions et 8 impacts en V2 ; montants des 8 postes et trajectoire 2032 identiques ; affiche le bon indicateur de redressement |
| PARTIAL politique à 0 impact | aucun impact chiffré affiché et aucun effet comptable inventé ; présentation narrative et sources conservées |
| AGGREGATE politique sourcé | masses revendiquées sans double comptage ; comparaison, déficit et trajectoire cohérents ou indisponibilité explicitement qualifiée |
| Création citoyenne depuis pivot | POST sans `citizenMeasures` ; sauvegarde locale, publication et vote fonctionnels |
| Création citoyenne depuis AGGREGATE | base déclarée + seuls nouveaux deltas ; filiation conservée et absence de double comptage |
| Comparer | référence INSEE disponible ; budgets featured sélectionnables ; choix A/B et écarts identiques |
| Voter | vote unique, compteurs, badge champion citoyen fondé sur le nombre de votes ; tri et filtres conservés |
| Partager | `/b/:id`, métadonnées OG et `/?budget=...` cohérents |
| Qualité / documentaire | statuts, confirmation, provenance et sources affichés sans inventer un impact |
| Export | bouton absent, Enregistrer et Publier présents |
| V1 | UI, routes et base V1 inchangées jusqu'au cutover ; WAF production non modifié |

## 5. Conditions de bascule et décisions

- Aucun besoin de migration des **autres budgets citoyens de test**. Réimporter NoPasaran depuis les CSV et appliquer les décisions de publication/compteurs sans migration générale. Le code de mapping/votes existant reste dormant, non requis.
- Aucun nouveau moteur, aucune projection INSEE/Eurostat (issue #143), aucune nouvelle table `citizenMeasures`.
- **Ne pas fusionner ni connecter l'UI à la V2 tant que les P0 ne sont pas satisfaits et la Preview Vercel testée**.
- Aucun effet de bord sur V1 ni aucune activation de WAF au niveau du projet production.
