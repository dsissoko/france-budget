# Revue Équinoxe 2027 — dossier documentaire

Source primaire : [Équinoxe — Contre-budget 2027](Equinoxe-Contre-budget-2027.pdf), 48 pages, novembre 2026.

**Décision produit :** alimenter et conserver la fiche Équinoxe en mode documentaire, avec le statut **`en_preparation`**, sans attribution d'un effet APU calculé ni de confirmation officielle.

## Vérifications réalisées

Le tableau de **la page 41** comporte 14 lignes de rapprochement, correspondant aux 14 lignes existantes de `party_source_lines` dans Neon, regroupées en 8 thèmes. La correspondance de noms, sens et montants a été vérifiée. Inventaire traçable : [CSV 14 lignes](equinoxe-2027-synthese-primaire-verifiee.csv).

| Origine de l'effet revendiqué | Détail | Total, Md€ |
|---|---|---:|
| Baisses de dépenses | Retraites 25 ; État et collectivités 14 ; santé 6 ; protection sociale 0,6 ; dette 0,8 | 46,4 |
| Augmentations de recettes | Entreprises 15 ; ménages aisés 31,8 ; retraités 5,9 ; fiscalité environnementale 6,3 | 59,0 |
| Investissements et dépenses nouvelles | Santé et éducation 7 ; transition 5,8 ; adaptation 9,5 ; industrie 2,7 ; pouvoir d'achat 7 | 32,0 |
| **Variation comptable documentaire brute** | 46,4 + 59 − 32 | **+73,4** |
| Effet d'activité revendiqué | Effet macroéconomique, non comptabilisable directement en APU | +6,1 |
| Correction technique revendiquée | Correction PLF, à traiter séparément | −1,5 |
| **Impact total revendiqué** | 73,4 + 6,1 − 1,5 | **+78,0** |

Le document indique aussi un déficit de 3,9 % du PIB en 2027 : **projection attribuée à Équinoxe**, pas résultat du moteur Mon Budget Citoyen.

## Revue documentaire en cours

L'**annexe des pages 42 à 47** contient des fiches détaillées : montant brut, parfois rendement net, source du chiffrage, multiplicateur et hypothèses. Les 14 lignes en base sont des **agrégats de présentation**, pas les fiches élémentaires de l'annexe. Elles ne doivent pas être additionnées une deuxième fois aux futures mesures détaillées.

- [x] Périmètre 2027 et identité de la source établis.
- [x] Tableau de synthèse page 41 rapproché des 14 lignes et 8 thèmes de la base, sans ligne manquante à ce niveau.
- [x] Écart `78 − 73,4 = 4,6` expliqué par **+6,1 d'activité** et **−1,5 de correction**, non par une mesure comptable oubliée.
- [x] Budget `EQX` déjà public en mode *documentary-only* ; `maturity_status=en_preparation`.
- [ ] Individualiser les mesures des annexes p. 42–47, distinguer chaque montant brut du rendement net.
- [ ] Vérifier les hypothèses de réalisation et les éventuels effets communs / doubles comptes (retraites, recettes fiscales, dépenses PLF).
- [ ] Faire la correspondance APU ligne par ligne ou laisser les mesures **documentaires uniquement**.
- [ ] Promouvoir les 14 liens de source PDF dans Neon après revue contrôlée de la modification des données publiques.
- [ ] Recetter l'affichage public après intégration éventuelle du détail des annexes.

## Garde-fous

`en_preparation` ne préjuge pas de la valeur du programme. Pas de chiffre « 78 Md€ d'économies APU validées » : ce total est **revendiqué** et comporte un effet macroéconomique. Les montants `party_source_lines` restent hors du calcul tant que leurs décisions `apu_decision` et liens source→écriture ne sont pas validés. Aucune modification silencieuse des budgets citoyens.

Références : [Issue #65](https://github.com/dsissoko/france-budget/issues/65), [Issue #59](https://github.com/dsissoko/france-budget/issues/59).
