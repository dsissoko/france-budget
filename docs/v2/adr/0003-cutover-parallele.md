# ADR-0003 — Migration parallèle V1 → V2

**Statut : déploiement effectué le 22 novembre 2026 ; schéma V1 conservé pour retour arrière.**

## Contexte
La V1 utilisait `public` en production. La V2 utilise désormais le schéma `v2` de la même base Neon et l'API `/api/v2/*` déployée par Vercel depuis le commit `bd8452a`.

## Décision
Nous avons maintenu `public` lors de la bascule, puis importé NoPasaran et les programmes politiques depuis les CSV versionnés avant le déploiement. **Ne pas migrer les budgets citoyens et votes V1 existants : déclarés jetables par le responsable du projet.**

## Conséquences
Pas de synchronisation historique V1 obligatoire. En revanche, toute nouvelle publication ou vote V2 post-cutover devient non jetable : le rollback doit intégrer leurs écritures. Une branche de sauvegarde Neon antérieure à V2 est disponible.
