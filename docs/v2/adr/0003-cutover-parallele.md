# ADR-0003 — Migration parallèle V1 → V2

**Statut : stratégie retenue, cutover non encore effectué.**

## Contexte
La V1 exploite `public` en production. Un schéma `v2` séparé a été créé en parallèle.

## Décision
Maintenir `public` tant que la recette et le rollback ne sont pas validés. Importer NoPasaran depuis les CSV, ainsi que les programmes politiques. **Ne pas migrer les budgets citoyens et votes V1 existants : déclarés jetables par le responsable du projet.**

## Conséquences
Pas de synchronisation historique V1 obligatoire. En revanche, toute nouvelle publication ou vote V2 post-cutover devient non jetable : le rollback doit intégrer leurs écritures. Une branche de sauvegarde Neon antérieure à V2 est disponible.
