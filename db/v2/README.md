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

Les endpoints V2 sont en lecture seule tant que l'authentification et les droits d'écriture CRUD ne sont pas spécifiés. La publication/import passent par le processus contrôlé d'import, pas par un POST public anonyme.
