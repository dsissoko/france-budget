# ADR-0001 — Modèle canonique Budget / Proposition / Impact

**Statut : accepté pour la cible V2.**

## Contexte
En V1, les scénarios historiques et les mesures politiques avaient des représentations distinctes selon l'origine, compliquant les comparaisons.

## Décision
Un budget, quelle que soit son origine, contient des propositions, elles-mêmes porteuses d'impacts comptables explicites. Les données initiales sont dans les trois CSV `budget.csv`, `proposals.csv`, `impacts.csv`. Stocker le montant revendiqué indépendamment de l'impact validé.

## Conséquences
Lecture commune des budgets citoyens et politiques. Le modèle AGGREGATE exige un travail supplémentaire pour exprimer la ventilation interne des masses et conserver les sources détaillées de #145 sans double compte.
