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
| Contrats HTTP réels | [API V2](api.md) |
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
- Le handler `GET /api/v2/budgets/{key}/positions` renvoie actuellement des positions vides pour un programme AGGREGATE.
- Les 28 lignes sources, 11 regroupements et 11 allocations LFI validées dans la recette #145 doivent être portées et testées en V2.
- Le nettoyage des migrations V1 est **postérieur à la recette**, conformément à la décision de projet.
