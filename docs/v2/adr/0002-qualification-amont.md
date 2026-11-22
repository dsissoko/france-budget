# ADR-0002 — Qualification agentique en amont

**Statut : accepté.**

## Contexte
La provenance, la ventilation multi-postes et le périmètre des programmes ne peuvent pas être inférés de manière fiable au runtime.

## Décision
Le skill propose une qualification justifiée depuis des sources primaires. Une revue métier arbitre. Les sorties approuvées sont matérialisées en CSV versionnés. Import, calcul et API restent déterministes.

## Conséquences
Aucune estimation silencieuse. Les montants non ventilables restent documentaires. Les règles de regroupement exclusif et de non-double-compte sont des contrôles déterministes.
