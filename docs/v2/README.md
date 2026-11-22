# Référentiel documentaire V2

> **Architecture de production depuis le 22 novembre 2026.** Les PR #142 et #145 ont été consolidées dans `main`. L'application Vercel utilise `/api/v2/*` sur le schéma Neon `v2`. Le schéma V1 `public` est conservé pour rollback. L'initialisation des budgets initiaux repose sur les CSV, non sur la reprise des tests V1.

## Navigation

| Domaine | Document |
|---|---|
| Vocabulaire, invariants et règles de gestion | [Métier](metier.md) |
| Parcours citoyens, états et critères de recette | [Fonctionnel](fonctionnel.md) |
| Composants et sécurité | [Architecture](architecture.md) |
| Entités, clés, contraintes | [MCD Mermaid](mcd.md) |
| PDF → qualification → CSV → SQL | [Intégration](integration.md) |
| Contrats HTTP réels | [API V2](api.md) et [OpenAPI 3.1](openapi.yaml) |
| Initialisation, cutover et retour arrière | [Exploitation](exploitation.md) |
| Décisions structurantes | [ADR](adr/README.md) |

## Autorité des sources

1. **Schéma** : fichiers SQL dans [db/v2](../../db/v2/).
2. **Contrat HTTP** : handlers sous [api/v2](../../api/v2/).
3. **Jeux initiaux** : CSV sous [data/programmes](../../data/programmes/) ; NoPasaran y est défini indépendamment des budgets citoyens de test V1.
4. **Qualification** : [skill](../../skills/budget-impact-qualification/SKILL.md) et [pipeline V2](../v2-qualification-pipeline.md).
5. **Moteur** : `src/projection-core.ts` et règles d'agrégats/impacts explicitement validées.
6. **Historique V1** : pages racine existantes sur le schéma `public`, conservées pour la transition, ne définissent pas l'architecture cible.

## Règle de maintenance

Toute évolution de modèle, contrat API, règle métier, import, UX ou exploitation doit mettre à jour les documents concernés **dans la même PR**. Les diagrammes Mermaid doivent correspondre au schéma et au code, sans anticiper une fonctionnalité qui n'existe pas.

## Points ouverts vérifiés

- Les migrations historiques 002 et 005, qui lisent encore `public`, sont marquées héritage et ne doivent pas être utilisées pour de nouvelles installations. Le bootstrap autonome actuel est `npm run db:init` avec `data/reference/2025-v2.json` et `db/v2/initial_ui.sql`.
- Le handler `GET /api/v2/budgets/{key}/positions` restitue les positions AGGREGATE **si des allocations qualifiées sont présentes** ; les autres programmes sans allocations restent documentaires.
- Les 28 mesures sources, 11 regroupements et 11 allocations LFI ont été intégrés dans la V2 et importés en production ; la parité Neon des allocations est contrôlée (84,4 Md€ recettes, 37,7 Md€ dépenses).
- `db:init`, `db:import`, `db:check` et `docs:check` sont versionnés. La création sur base vierge a été vérifiée sur Neon QA, avec import NoPasaran idempotent ; les endpoints HTTP de production ont répondu 200 et les données NoPasaran/LFI ont été contrôlées. Le rollback V1 reste conservé. Les scripts V1 sont désormais archivés dans Git hors de la chaîne active, tandis que le schéma `public` reste intact pour rollback.
