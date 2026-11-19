# Roadmap — Mon Budget Citoyen

> Roadmap produit et scientifique. Les piliers sont **parallèles**, non trois versions successives. Les échéances et numéros au-delà des versions déjà documentées sont indicatifs. L'interface publique est volontairement stabilisée.

## Pilier 1 — Participation citoyenne (v1.x)

**Objectif :** comprendre, comparer, construire, publier et soutenir les budgets publics, sur une interface simple.

- **Livré / en recette :** les quatre vues (Comprendre, Comparer, Mon budget, Voter), les scénarios locaux, la publication et le vote sans compte.
- **À améliorer :** lien permanent vers chaque budget publié, partage natif et invitation des proches, accès direct à la fiche depuis un lien partagé.
- **À fiabiliser :** contrôle des votes multiples et abus, gestion des signalements, mentions claires sur les limites de représentativité.
- **Principe UX :** pas de refonte ni de nouveaux indicateurs dans les listes ; privilégier les changements fonctionnels ciblés.

## Pilier 2 — Moteur économique et données (chantier démarré)

**Objectif :** passer progressivement d'un simulateur comptable pédagogique à des projections documentées, testables et reproductibles.

1. **M1 — Cohérence comptable.** Sources et millésimes, ventilation des mesures, contrôle des recouvrements, séparation impact direct / impact estimé. Voir [#22](https://github.com/dsissoko/france-budget/issues/22).
2. **M2 — Trajectoires.** Projections sur cinq ans, déficit, dette nominale, dette/PIB et charge d'intérêts, hypothèses explicites et analyses de sensibilité. Voir [#23](https://github.com/dsissoko/france-budget/issues/23), [#24](https://github.com/dsissoko/france-budget/issues/24) et [#25](https://github.com/dsissoko/france-budget/issues/25).
3. **M3 — Évaluation macroéconomique.** Examiner les effets sur croissance, emploi, consommation, investissement et recettes en documentant méthodes, incertitudes et limites. Chantier de recherche, **sans promesse de prédiction certifiée**.

Une proposition politique validée comme *fidèlement retranscrite* par son auteur n'est pas pour autant une évaluation indépendante de ses effets économiques.

## Pilier 3 — Contributions, vérification et diffusion (chantier démarré)

**Objectif :** ouvrir la production des connaissances et des données à des contributeurs identifiés, en conservant une gouvernance neutre.

- **Économistes, chercheurs, développeurs :** proposer des hypothèses, tests, jeux de données et améliorations du moteur par issue ou PR.
- **Partis et équipes de programme :** soumettre/corriger leurs mesures, proposer la ventilation dans les catégories, préciser les hypothèses, dates et sources ; même procédure pour toutes les formations.
- **Communication et communautés :** contribuer à la pédagogie et à la diffusion non partisane de l'outil, sans promotion d'un programme particulier.
- **Canal de contribution :** GitHub Issues et Pull Requests ; voir [CONTRIBUTING.md](../CONTRIBUTING.md).

## Règles de publication et de validation

- Séparer systématiquement **source officielle**, **montant revendiqué**, **choix de ventilation**, **résultat calculé** et **interprétation économique**.
- Aucune assertion « approuvé par un parti » sans vérification indépendante de l'habilitation et preuve archivée.
- Une revue documentaire et des tests reproductibles précèdent toute intégration au référentiel ou au moteur.
- Évaluer la méthode indépendamment des opinions politiques ; mêmes critères pour tous.
- Les évolutions du moteur et les contributions ne modifient pas automatiquement les scénarios déjà publiés. Prévoir un versionnement et une stratégie de migration avant toute activation.

## Suivi

Les issues GitHub décrivent les travaux concrets. Cette roadmap est la vue d'ensemble et ne remplace pas les décisions de recette ni les versions historiques documentées dans [vision.md](vision.md).
