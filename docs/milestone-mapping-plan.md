# Préparation des rattachements aux milestones — 20 novembre 2026

> **Plan de classement, non exécuté.** Aucune issue/PR n'a été réaffectée, clôturée ou modifiée. Aucun milestone n'a été créé par ce document. Ne procéder au rattachement qu'après création manuelle et confirmation des identifiants des milestones. Pas de merge ou release implicite.

## Milestones fonctionnels validés (noms de travail)

| Code | Milestone | État de travail |
|---|---|---|
| M1 | Expérience citoyenne de base en production / stabilisée | historique, à recetter puis clôturer |
| M2 | Collecte, fidélité et validation des données INSEE et des partis | en cours, priorité courte |
| M3 | Moteur budgétaire déterministe et trajectoires comptables | en cours |
| M4 | Moteur macroéconomique dynamique (effets indirects et rétroactions) | recherche à engager |
| M5 | Contributions et validation collaborative | en cours |
| M6 | Campagne 1 — première diffusion « Parlons chiffres » | préparation et réalisation (docs/promotion/) |
| M7 | Campagne 2 — notoriété (à définir) | vierge : aucun ticket ni PR à y associer |

## Inventaire des 41 Issues : affectation préparatoire

L'affectation ci-dessous décrit **l'objectif principal** de chaque Issue, pas son état d'achèvement. En particulier les anciennes issues v1.0.0 restent ouvertes sur GitHub : les recetter avant clôture rétrospective.

| Milestone | Issues |
|---|---|
| M1 | #2, #3, #4, #9, #10, #11, #12, #13, #14, #15, #16, #17, #18, #19, #26, #27, #28, #29, #30, #32, #34, #38, #39, #50 |
| M2 | #5, #7, #8, #58, #59 |
| M3 | #6, #20, #21, #22, #23, #24, #25, #46 |
| M4 | #41 |
| M5 | #40, #42 (à scinder ou reformuler : pédagogie/contribution vs diffusion) |
| M6 | Aucune Issue spécifique existante identifiée ; préparer des Issues tirées de docs/promotion/campagne-promotionnelle.md : lancement, communautés, relais, mesure J7, bilan J14 |
| M7 | Aucune — rester vierge |
| Hors milestone (gouvernance) | #60 |

**Comptage :** M1 24, M2 5, M3 8, M4 1, M5 2, hors milestone 1 = 41.

## Inventaire des 19 PR fusionnées (rattachement informatif aux Issues / finalités)

Les PR peuvent directement porter un milestone GitHub, mais notre convention est de **prioriser le lien PR → Issue → milestone** pour éviter les doubles suivis. Ne pas inférer automatiquement « closes » quand une PR traite partiellement une Issue.

| PR | Domaine principal | Issue ou lien à confirmer |
|---|---|---|
| #1 — API publication et votes Neon | M1 | #11/#15 à vérifier |
| #31 — synthèse A/B | M1 | #30 |
| #33 — synthèse Mon budget | M1 | #32 |
| #35 — synthèse Voter | M1 | #34 |
| #36 — identité en pied de page | M1 | #18 ou suivi rétro |
| #37 — identité globale | M1 | #18 ou suivi rétro |
| #43 — roadmap et contributions | M5 | #40/#42, contenu partiellement transverse |
| #44 — partage de budget | M1 | #38 |
| #45 — modularisation du moteur | M3 | #46 |
| #47 — jauges INSEE dans Comparer | M1 | #26 / amélioration recette |
| #48 — qualifications Voter, jauges, parité | M1 | #19 / #24 (mixte : inspecter avant liaison) |
| #49 — référence 2025, budget 2027, horizon 2032 | M3 | #23 (liaison à confirmer) |
| #51 — slopegraph | M1 | #50 |
| #52 — slopegraph partagé | M1 | #50, éviter doublon de suivi |
| #53 — plafonds publication | M1 | #11/#39, ou Issue de protection à créer |
| #54 — ne montrer que les écarts A/B | M1 | #26, ou Issue de recette à créer |
| #55 — manques à gagner hors budget | M3 | #6/#22 selon périmètre |
| #56 — documentation campagne promotionnelle | M6 | créer Issue rétrospective préparatoire **sans prétendre qu'une diffusion a eu lieu** |
| #57 — CGU et procédure de modération | Hors milestone ou M5 | décision à prendre : conformité/gouvernance ou cadre des contributions |

## Points de nettoyage, sans mutation pour le moment

1. **Doublons présumés** : #20 / #22 (externalisation Neon), #21 / #23 (trajectoires). Comparer critères et historiques avant de conserver l'une et de fermer l'autre comme doublon.
2. **Issue mixte #42** : conserver la gouvernance des contributions dans M5 ; isoler sa composante de diffusion dans une Issue M6 si elle reste nécessaire.
3. **Issue #60** : classer « transverse / gouvernance » hors milestone ; la branche `docs/issue-60-collaboration-workflow` et son AGENTS.md ne sont pas nécessairement sur main.
4. **PR #57** : arbitrer conformité, modération et droits de suppression. Ne pas l'assimiler automatiquement à « marketing ».
5. **M1 historique** : la présence en production ne suffit pas à clôturer toutes les Issues. Vérifier critères de validation et distinguer les améliorations reportées (#39, #27–29, etc.). Un milestone M1 dit « stabilisé » ne doit pas être déclaré achevé tant que son périmètre retenu est ouvert sans décision de report.
6. **M2** : #5 et #7 concernent un premier socle historique ; #58 et #59 visent une vérification plus exigeante. Conserver la distinction « première intégration » vs « fiabilisation ».
7. **M3 / M4** : #24 traite de la qualification du désendettement sur modèle déterministe ; #41 seule porte explicitement les effets macroéconomiques dynamiques. Ne pas les confondre.
8. **M6** : la documentation `docs/promotion/` indique uniquement une campagne **préparée** ; ne pas fermer le milestone sans diffusion et bilan attestés par des preuves.
9. **M7** : rester strictement vide jusqu'au cadrage de la seconde campagne.

## Procédure après création des milestones

1. Récupérer dans GitHub les **numéros réels** des 7 milestones (M1...M7 sont des codes provisoires et **ne sont pas des ID GitHub**).
2. Vérifier les décisions sur #42, #57 et les deux paires de doublons.
3. Ajouter les labels de gouvernance aux éléments hors milestone, sans y affecter de jalon.
4. Affecter les Issues à leur milestone, par petits lots vérifiables ; lier les PR aux Issues avec références exactes.
5. Contrôler les critères d'acceptation et les preuves avant de fermer les Issues historiques ; fermer un milestone seulement après recette de son objectif.
6. Mettre à jour un tableau de suivi de l'avancement après les opérations. **Merge et déploiement restent des décisions séparées et explicites.**

Sources : GitHub Issues/PR et docs/roadmap.md, docs/vision.md, docs/promotion/campagne-promotionnelle.md ; inventaire en lecture le 20 novembre 2026.
