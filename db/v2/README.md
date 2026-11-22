# Backend V2 — isolation de la production V1

V2 possède ses routes `/api/v2/*` et ses tables sous le schéma PostgreSQL `v2`. **Ne jamais exécuter cette migration dans la production V1 sans un contrôle d'isolation et une approbation du déploiement.**

## Migration
`db/v2/001_schema.sql` crée les tables et la fonction atomique `v2.import_budget(jsonb)`, avec une vue `v2.latest_budgets`. Elle n'écrit pas dans `public`.

Le référentiel pivot est le budget citoyen : il doit être chargé **par copie figée des catégories/valeurs citoyennes** dans `v2.reference_posts` sur la branche QA, avant les impacts. La V2 ne calcule jamais de ventilation INSEE.

## CSV contract
Trois fichiers identiques pour toutes les origines : `budget.csv`, `proposals.csv`, `impacts.csv`. `budget.csv.version` est obligatoire (`latest` pour la version active). `budget.csv.documentary_json` optionnel permet de stocker les références documentaires, présentations longues, textes de sources et revendications agrégées **sans les transformer en impacts**.

Chaque proposition conserve montant revendiqué, statut, source, et explication narrative de sa ventilation (dans sa description). `impacts.csv` porte les rattachements explicites aux postes du pivot citoyen. Les budgets AGGREGATE peuvent décrire leurs propositions sans additionner leurs impacts au total déclaré.

L'import est une opération mécanique et idempotente à **identité stable (`budget_key`, `version`)**. L'importeur ne classe, ne ventile et n'estime aucune proposition. Le schéma ne stocke ni `themes` ni `measures`.

## Sûreté
La V1 `public` et ses APIs `/api/*` restent actives. En développement, utiliser une branche Neon isolée et une preview. Pour tout déploiement V2 parallèle, créer un rôle dédié et vérifier ses droits, car un schéma seul n'est pas une barrière de sécurité.

Les routes GET V2 sont publiques. Le POST V2 permet uniquement de créer un budget citoyen, avec validations côté serveur et limite de publication. PATCH (brouillons) et DELETE (retrait logique) requièrent une clé d'édition propre au budget ; les budgets politiques ne sont éditables que via l'import CSV administratif. Aucune gestion de comptes utilisateur, aucun secret constant dans le JavaScript public. Les publications restent non modifiables, comme en V1.

## Reproductible (recette et CI)

1. Exécuter `db/v2/001_schema.sql` sur une **branche Neon QA**, puis `db/v2/002_seed_reference.sql` pour figer les postes du budget citoyen, sans modifier `public`.
2. `npm run test:v2` : vérifie les CSV des 16 budgets et les tests unitaires, **sans base de données**.
3. `node scripts/v2/import.mjs data/programmes/nopasaran/2025` : dry-run NoPasaran.
4. `V2_DATABASE_URL=<URL DE LA BRANCHE QA> node scripts/v2/import.mjs --all --apply` : applique les lots dans le seul schéma `v2`. **N'utiliser que la branche QA**, jamais la chaîne V1 `DATABASE_URL`.
5. Tester `GET /api/v2/budgets`, `GET /api/v2/budgets?origin=party`, `GET /api/v2/budgets/nopasaran-2025`, `GET /api/v2/reference` sur la Preview avec `V2_DATABASE_URL` isolée.

### Contrat des lectures V2
- Une ressource unique pour toutes les origines, pas de routes citoyen/parti.
- Seuls les budgets **`version='latest'`** sont visibles ; les versions historiques sont stockées séparément.
- Le détail expose `documentary` (sources primaires et agrégats revendiqués, sans calcul automatique) et `proposals[]` avec `impacts[]`.
- Le CRUD citoyen V2 (POST, PATCH de brouillon, DELETE logique) et la route de vote V2 sont implémentés côté backend ; la V2 conserve l'anonymat et un jeton d'édition par budget. **Le raccordement de l'UI, la reprise exhaustive des identifiants et votes V1 et les tests E2E sont encore à faire avant bascule.**
- `claimed_amount_bn` et `delta_amount_bn` sont deux concepts distincts ; les montants sont stockés en `NUMERIC` pour éviter les arrondis binaires.

### Critères de complétude
NoPasaran : **8 propositions/8 impacts**. Les 15 programmes politiques : **285 propositions/0 impact** (qualification amont incomplète). Ne pas déclarer l'import des programmes politiques *métier complet* tant que les impacts attendus ne sont pas renseignés et justifiés dans leurs CSV. Les sources et agrégats revendiqués sont des données documentaires : ils ne sont pas ajoutés aux résultats comptables.

### Limites et mesures de sécurité
- Une **branche Neon seule** assure l'isolation des essais. Pour le futur schéma V2 sur production, prévoir des rôles et des permissions limités à `v2`, sans droits d'écriture sur `public`.
- La fonction `v2.import_budget` peut remplacer les données d'un même couple `(budget_key,version)` : ne pas l'exposer comme endpoint public.
- La migration historique des votes, la stratégie de version/bascule et le routage UI V2 restent à développer. Aucun changement V1 de cette PR.
- L'extraction de PDF et la qualification de leurs propositions sont une **étape amont** : elles produisent le triplet CSV ; les routines V2 fournies ici ne prétendent pas automatiser l'extraction documentaire depuis un PDF.

## CRUD citoyen / vote V2 en QA

Migrations dans cet ordre :
1. `001_schema.sql` — tables unifiées et import.
2. `002_seed_reference.sql` — snapshot des postes de référence sur la branche QA.
3. `003_citizen_crud.sql` — états `draft/published/withdrawn`, quotas V1, version active et fonction transactionnelle d'écriture.
4. `004_votes.sql` — votes anonymes, colonne `legacy_budget_id`, compatibilité des identifiants.

Routes :
- `GET /api/v2/budgets` / `GET /api/v2/budgets/:key` — budgets `latest` publiés, origine neutre.
- `POST /api/v2/budgets` — crée un budget citoyen avec `title`, `description`, `author`, `referenceYear=2025`, `proposals[]` (et `impacts[]` par proposition), `publish`. Réponse `201` : `budgetKey`, `id`, `revision`, `status`, `editToken`.
- `PATCH /api/v2/budgets/:key` — met à jour un brouillon complet, avec `revision` et `Authorization: Bearer <editToken>`. La publication est définitive.
- `DELETE /api/v2/budgets/:key` — retrait logique, avec `revision` et la même clé; aucune suppression des votes.
- `POST /api/v2/votes` — contrat de vote unique et cookie `fb_voter` conservés.
- `GET /api/v2/share/:id` — métadonnées OG et ancien UUID si mappé. Le rewrite `/b/:id` de V1 **reste inchangé**, aucune modification de production avant cutover.

Les écritures `proposals` et `impacts` passent ensemble par le CRUD du budget en transaction ; aucun endpoint POST politique public. Ne jamais exposer `v2.import_budget` à l'Internet public.

**Avant toute bascule**, consulter la matrice exhaustive de compatibilité et recette dans [`docs/v2-cutover-regression-gates.md`](../../docs/v2-cutover-regression-gates.md). Ce lot ne modifie ni `src/App.tsx` ni la V1 de production, et n'active aucune règle WAF.
