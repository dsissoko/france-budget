# Référentiel documentaire V2

> **Cible architecturale, bascule production non encore effectuée.** La PR #142 porte l'application V2 ; la PR #145 contient des enrichissements LFI encore à intégrer au modèle V2. Le schéma `v2` a été créé sur Neon production, mais le trafic n'a pas basculé.

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

- Les migrations 002 et 005 utilisent encore des données de `public` : le bootstrap V2 totalement autonome reste à réaliser après la recette.
- Le handler `GET /api/v2/budgets/{key}/positions` restitue les positions AGGREGATE **si des allocations qualifiées sont présentes** ; les autres programmes sans allocations restent documentaires.
- Les 28 lignes sources, 11 regroupements et 11 allocations LFI de #145 sont repris dans la branche V2 (CI validée) ; la parité avec Neon QA et le rendu Preview restent à tester.
- Le nouveau `db:init` indépendant du schéma V1 et le contrôle `db:check` sont présents et testés en CI, mais pas encore validés en base vierge. Le nettoyage des migrations V1 reste **postérieur à la recette**.
