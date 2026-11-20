# Reconstitution des agrégats citoyens avec les dernières publications officielles
**Date de contrôle : 20 novembre 2026.** **Application inchangée.** Toutes les unités sont en Md€.

## Décision de méthode

**Ne pas attendre une publication future.** Utiliser immédiatement les dernières données officielles disponibles, en distinguant les millésimes. Le périmètre est **APU (S13)**, et les catégories restent celles que comprend le citoyen. En particulier, une ligne « TVA et consommation » n'est pas la même chose que la TVA seule ; une ligne « Fiscalité des entreprises » n'est pas l'IS seul.

Les chiffres de fonctions (COFOG) 2024 sont utilisés **comme ancrages officiels 2024** ; les recettes fiscales détaillées 2025 sont **des ancrages officiels 2025** ; les totaux APU 2025 restent **la référence de cadrage**. Les parties non couvertes doivent être **explicitement estimées**, et non maquillées en valeurs officielles.

## Derniers points d'ancrage officiels vérifiés

### Recettes, exercice 2025, INSEE (28 août 2026)

Source primaire : https://www.insee.fr/fr/statistiques/2381408 (tableau « Impôts », colonne 2025 provisoire).

| Composante officielle | Montant 2025 | Agrégat citoyen candidat | Précaution |
|---|---:|---|---|
| TVA | 208,8 | `vat` | `vat` inclut aussi la consommation, donc 208,8 n'est pas le total de la catégorie |
| IRPP avant crédits d'impôt | 103,6 | `income` | **brut avant crédits** : ne pas mélanger avec le net des recettes APU |
| IS avant crédits d'impôt | 69,5 | `business` | **brut avant crédits** ; autres taxes entreprises peuvent relever de `business` |
| CSG | 156,6 | `socialtax` | Autres prélèvements sociaux à ajouter séparément |
| CRDS | 9,3 | `socialtax` | Ne pas additionner aux données CSG/CRDS agrégées si déjà incluses |
| TICPE et autres accises énergétiques publiées sous l'intitulé « accises sur produits énergétiques (TICPE) » | 30,5 | `energy` | Sous-ensemble ; ne pas recompter dans `vat` |
| Taxe foncière | 44,2 | `property` | Sous-ensemble de la fiscalité de production SEC |
| CFE | 8,1 | `business` | Est incluse dans les impôts divers sur la production |
| CVAE | 3,7 | `business` | Est incluse dans les impôts divers sur la production |
| Impôts sur produits (hors TVA, ligne distincte) | 128,1 | plusieurs catégories | Contient notamment accises : ne pas cumuler avec ses composantes |
| Impôts courants sur le revenu | 383,3 | plusieurs catégories | Contient IRPP, IS, CSG/CRDS : ne pas cumuler avec ses composantes |
| Impôts divers sur la production | 72,7 | plusieurs catégories | Contient taxe foncière, CFE, CVAE, etc. |
| Impôts en capital | 21,7 | `property` candidat | Contient droits de mutation à titre gratuit, 21,1 |

Ces montants sont **des composantes officielles**, non la validation des montants préexistants dans Neon. Les postes citoyens sont nécessairement plus larges ou transversaux. **Un solde obtenu par différence doit porter le statut « reconstitué/estimé ».**

### Dépenses, exercice 2024, INSEE (février / mars 2026)

Sources primaires : https://www.insee.fr/fr/statistiques/8735252 (Insee Première 2093) et https://www.insee.fr/fr/statistiques/8574707 (3.301, COFOG S13 2024).

| Ancrage fonctionnel officiel 2024 (chiffres arrondis de l'article) | Montant | Correspondance citoyenne |
|---|---:|---|
| Protection sociale totale | 693 | Somme `social`+`family`+`unemployment`+`solidarity` **après** concordance des sous-fonctions |
| Prestations famille | 67 | `family`, **2024**, périmètre fonctionnel à vérifier |
| Chômage et formation demandeurs d'emploi | 49 | `unemployment`, **2024**, périmètre fonctionnel à vérifier |
| Santé | 261 | `health` |
| Enseignement | 149 | `education` |
| Affaires économiques | 166 | `economy`+`enterprise-support`, **à ventiler sans double compte** |
| Services publics généraux | 181 | `general` |
| Défense | 54 | `defense` |
| Protection environnement | 30 | `environment` |

La publication détaille aussi d'autres fonctions et sous-fonctions dans le fichier source 3.301. **Ne pas déduire « retraite = 693 − 67 − 49 »** : le reste comprend handicap, maladie, exclusion sociale, survie, etc. Les chiffres 2024 arrondis ne suffisent pas à fabriquer la décomposition exhaustive de 2025.

**Attention** : l'INSEE indique qu'un changement de nomenclature des collectivités affecte en 2024 la répartition *logement / affaires économiques* ; ne pas prendre ces fonctions comme comparables sans correction. La santé COFOG exclut les indemnités journalières classées en protection sociale.

### Cadrage total 2025

Sources INSEE : https://www.insee.fr/fr/statistiques/8988845 et https://www.insee.fr/fr/statistiques/2381404 . L'INSEE diffuse **1 714,1 Md€** de dépenses totales dans son tableau d'août 2026 (données provisoires). Le déficit de référence 2025 employé dans Neon est **152,5 Md€**. Ne pas écraser des totaux sur la seule base d'un article révisé : enregistrer version et publication utilisées, vérifier des comptes de même millésime avant migration.

## Protocole de recalage immédiat sans attendre décembre

1. **Recettes 2025** : construire une concordance exhaustive, exclusivement à partir des postes disjoints du compte APU 2025 et de la sous-décomposition fiscale 2025. Pour les lignes citoyennes, attribuer chaque sous-composante une seule fois. Contrôler que les « dont » ne soient jamais sommés au parent.
2. **Dépenses** : reconstruire d'abord le jeu **fonctionnel 2024 exact** à partir de 3.301 (non des seuls arrondis de l'article), puis subdiviser la protection sociale en 10.x ; distinguer strictement `economy` et `enterprise-support` avec des règles documentées.
3. **Projection pédagogique vers 2025** : conserver l'année de référence 2025 du simulateur ; pour une catégorie sans mesure directe 2025, calculer une **estimation 2025** en extrapolant la dernière décomposition officielle disponible et la faire correspondre aux totaux 2025. La règle de prolongation (ratio des totaux, indices sectoriels, ou évolution constatée de composantes) doit être écrite, auditée et étiquetée ; ne pas parler de « dépenses officielles 2025 par catégorie ».
4. **Mise en production** : uniquement après contrôles de sommation, de non-recouvrement, d'impact du moteur, de reproductibilité des scénarios publiés et validation sur branche de test Neon. **Zéro changement UX/UI**.

## Écarts immédiats à investiguer

- `social`+`family`+`unemployment`+`solidarity` = **620 Md€ Neon 2025** ; référence **693 Md€ COFOG 2024** : écart de **−73 Md€ malgré un exercice postérieur**. Indice fort de mauvaise ventilation, mais pas preuve d'un écart officiel 2025 tant que 2025 n'est pas reconstruit.
- `education` = **180 Md€ Neon 2025** contre **149 Md€ 2024** : +31 Md€. À justifier, ou à corriger.
- `environment` = **50 Md€ Neon 2025** contre **30 Md€ 2024** : +20 Md€. À justifier, ou à corriger.
- `vat` = **260 Md€ Neon 2025**, mais **TVA seule** = 208,8 Md€ officielle 2025. **L'écart n'est pas en soi une erreur** car la catégorie agrège la consommation ; construire les autres composantes sans double compte.
- `socialtax` = **210 Md€ Neon 2025**, alors que **CSG+CRDS** officielles 2025 = **165,9 Md€**. Les autres contributions fiscales sociales doivent être identifiées avant conclusion.

## Statut de ce livrable

**Ancrages officiels effectivement vérifiés ; réconciliation exhaustive non achevée.** Ce texte ne prétend pas justifier les 25 montants actuels ni fournir une nouvelle grille de production. L'absence d'accès programmatique au classeur xlsx INSEE 3.301 lors de cette session empêche de certifier sa décomposition détaillée 2024. Aucun changement de la base Neon ni de l'interface n'a été effectué.
