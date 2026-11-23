# PostgreSQL V2 — modèle et initialisation canonique

> **Production :** schéma `v2`, application Vercel via `/api/v2/*`. Le schéma `public` n'est plus utilisé par l'application V2 ; il est conservé uniquement pour le rollback. Pour la vision globale, voir [le corpus documentaire](../../docs/v2/README.md).

## DDL actif — base neuve

Le script `npm run db:init` effectue, **en une transaction**, l'ordre suivant :

1. [001_schema.sql](001_schema.sql) — tables Budget / Mesure / Proposition / Impact, import transactionnel et référentiel ;
2. [003_citizen_crud.sql](003_citizen_crud.sql) — états de publication, jetons, quotas et écriture citoyenne ;
3. [004_votes.sql](004_votes.sql) — votes pseudonymes et compatibilité des UUID ;
4. [initial_ui.sql](initial_ui.sql) — colonnes UI et paramètres de projection, sans lecture de `public` ;
5. [007_citizen_featured.sql](007_citizen_featured.sql) — fonctions et triggers de sélection du citoyen par votes, propositions, date de publication ;
6. [006_runtime_permissions.sql](006_runtime_permissions.sql) — permissions minimales, séparation lecture/écriture/import ;
7. chargement des 27 postes et paramètres 2025 depuis [data/reference/2025-v2.json](../../data/reference/2025-v2.json).

**Aucune dépendance aux migrations historiques V1.** Les anciens fichiers `002_seed_reference.sql` et `005_ui_contract.sql` sont [archivés](../archive/v1/) car ils utilisaient `public`.

## Commandes

```bash
npm run db:init                 # dry-run local, pas de connexion DB
npm run db:init -- --apply --confirm-empty-v2    # initialisation normale, refuse les budgets existants
npm run db:init -- --apply --force --confirm-reset-v2  # DESTRUCTIF : réinitialise uniquement le schéma v2
npm run db:import               # dry-run des CSV initiaux
npm run db:import -- --apply    # import dans V2_DATABASE_URL ; jamais sans contrôle de cible
npm run db:check                # contrôles locaux
npm run db:check -- --live      # compare Neon V2 et CSV en lecture seule
npm run test:v2                 # tests unitaires + CSV, sans Neon
npm run docs:check              # Markdown et Mermaid
```

Pour `--apply`, fournir `V2_DATABASE_URL`. Le rôle PostgreSQL de l'application doit préexister et être indiqué facultativement par `V2_APP_ROLE` au moment d'un bootstrap : le script SQL construit des `GRANT` limités. La fonction citoyenne s'exécute en `SECURITY DEFINER` ; l'import administratif `v2.import_budget` n'est **pas** directement exécutable par le rôle serveur.

**Important :** sans `--force`, `db:init` refuse une base V2 contenant des budgets. L'option `--force` exige **`--apply --confirm-reset-v2`** et exécute dans **la même transaction** `DROP SCHEMA IF EXISTS v2 CASCADE`, puis le bootstrap complet (tables, vues, fonctions, triggers, permissions et référentiel). Les contributions et votes V2 sont supprimés et les budgets doivent être réimportés avec `npm run db:import -- --apply`. Le schéma historique `public` n'est pas ciblé, mais les dépendances SQL externes à `v2` pourraient être affectées par `CASCADE` : vérifier la base visée et ses dépendances avant d'utiliser cette option. Aucune remise à zéro automatique au merge ou au déploiement Vercel.

## Données et invariants

Le contrat CSV commun aux citoyens et aux formations politiques reste `budget.csv`, `measures.csv`, `proposals.csv`, `impacts.csv`. Les groupes LFI supplémentaires sont conservés dans `documentary.citizenGroups` et les ventilations `documentary.claimedAllocations`, jamais additionnés une deuxième fois à l'AGGREGATE.

- NoPasaran : 0 mesure extraite, 8 propositions citoyennes, 8 impacts ;
- LFI 2027 : 28 mesures sources, 11 propositions consolidées, 11 allocations financières sur 15 postes, masses annoncées 106,4 Md€ recettes / 81,7 Md€ dépenses ;
- les catégories de référence : 27 postes, 2025 ;
- API et répercussions : [Contrats HTTP](../../docs/v2/api.md), [MCD](../../docs/v2/mcd.md), [Pipeline](../../docs/v2/integration.md) ;
- exploitation, tests post-déploiement et rollback : [Runbook](../../docs/v2/exploitation.md).

Toute modification de schéma, de CSV ou de contrats API doit inclure dans la même PR les tests et la documentation correspondants.
