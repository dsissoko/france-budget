# Archives des migrations V1

Ce répertoire conserve les **scripts SQL historiques** du schéma `public` et les deux migrations transitoires qui copiaient des références V1 dans V2. Ils ne font **plus partie de la chaîne d'initialisation active**.

- `migrations/` : migrations V1 pré-bascule ;
- `schema.sql` : schéma V1 ;
- `002_seed_reference.sql` et `005_ui_contract.sql` : anciens seed V2 dépendant de `public`.

**Ne pas exécuter ces scripts sur la production V2.** Leur conservation facilite l'audit et la reconstitution historique, mais le déploiement courant se reconstruit exclusivement avec [db/v2](../../v2/), le référentiel versionné et les CSV des programmes. Le schéma `public` en base est conservé pour rollback et n'a pas été supprimé.

Import historique V1 : [scripts/archive/v1/import-programmes.mjs](../../../scripts/archive/v1/import-programmes.mjs), également retiré du CI actif.
