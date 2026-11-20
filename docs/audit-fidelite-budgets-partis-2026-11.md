# Fidélité des budgets politiques — revue prioritaire au 20 novembre 2026

## Doctrine

L'objectif premier n'est **pas** d'afficher un budget plausible ou représentatif d'une famille politique : c'est de reproduire **le plus fidèlement possible les mesures effectivement publiées par chaque parti**, avec la date et le document source. Aucun montant inventé ne doit être attribué au parti. Un extrait partiel de contre-budget doit être étiqueté **extrait**, et ne doit pas être présenté comme son budget complet ou sa trajectoire de déficit.

Critères pour importer une mesure : source primaire datée (document officiel signé/édité par le parti), page ou section, libellé fidèle, montant **revendiqué** ou « non chiffré », année, base de comparaison (projet initial / exécuté), caractère annuel ou pluriannuel, risque de recouvrement, rattachement aux agrégats citoyens **justifié et non chevauchant**.

Une analyse économique indépendante est une étape distincte de la **fidélité documentaire**. Les chiffrages revendiqués ne sont pas garantis par le simulateur.

## État de production vérifié dans Neon

| Partie | Mesures actuellement affichées | Provenance / difficulté |
|---|---|---|
| RN | 3 mesures 2026, toutes documentées | **Extrait très incomplet** du contre-budget 2026 de 36 Md€ d'amélioration revendiquée ; le scénario actuel n'en reconstitue pas le résultat |
| LFI | 3 mesures 2026, dont **une fictive de +18 Md€ sur patrimoine** | Les deux autres (+3,6 Md€ scolaire, +10,6 Md€ filières renouvelables) sont documentées ; **18 Md€ n'est PAS une mesure publiée validée** |
| Horizons | 2 mesures fictives (−5 Md€ dépenses administratives, −4 Md€ de recettes) | **Aucun lien documentaire probant pour ces montants** ; ne pas appeler cela un budget chiffré officiel d'Horizons |

Le statut `illustration` est bien présent pour ces trois mesures fictives en base. Il n'est **pas suffisant** pour parler de budgets de parti fidèles.

## Documents primaires vérifiés

- **RN 2026**, contre-budget du 23 octobre 2025, PDF officiel : https://rassemblementnational.fr/documents/GRN-CONTRE-BUDGET-2026.pdf . Pages 3–5 et annexes. Effet global revendiqué **+36 Md€** vs projet gouvernemental 2026. Exemples publiés : −10,96 Md€ de recettes TVA sur énergie ; −3,5 Md€ TVA 100 produits ; −6,1 Md€ dépenses de solidarité sous condition d'emploi ; −7,7 Md€ agences ; −8,7 Md€ contribution UE ; +4 Md€ impôt sur fortune financière ; +8,4 Md€ taxe rachats d'actions ; +3,61 Md€ dépenses indexation prestations. Montants et signes à reproduire **par rapport au PLF 2026 d'origine**, jamais à additionner à une conclusion chiffrée issue de la base 2025 sans hypothèse explicite.
- **LFI 2026**, contre-budget d'octobre 2025, PDF officiel : https://lafranceinsoumise.fr/wp-content/uploads/2025/10/Budget-2026_LFI_web_pages.pdf . Mesures publiées : +3,6 Md€ dépenses gratuité scolaire ; +10,6 Md€ développement filières renouvelables ; +22 Md€ dépenses hausse point d'indice et grilles ; +3 Md€ dépenses assurance chômage ; +10 Md€ garantie d'autonomie jeunes ; +5 Md€ recettes IS majoré ; +26 Md€ recettes taxe Zucman multinationales (sous réserve de cohérence des assiettes), etc. Document détaillé beaucoup plus ample que les deux mesures affichées.
- **LFI 2027**, contre-budget présenté le 14 octobre 2026 : annonce de **106,4 Md€ de recettes supplémentaires et 81,7 Md€ de dépenses**, d'après comptes rendus de presse ; primaire chiffré complet **à récupérer/valider avant substitution**. Source secondaire informative : https://www.leparisien.fr/elections/presidentielle/budget-2027-la-france-insoumise-devoile-un-contre-budget-de-lfi-avec-1064-milliards-deuros-de-recettes-et-817-milliards-de-depenses-14-10-2026-DALZK7Y3BNAAZPTTNEALY6U2KQ.php
- **Horizons 2027**, annonces d'octobre 2026 concernant une compensation de **10 Md€ de hausses d'impôts par des économies équivalentes** ; ces annonces de presse ne prouvent pas les lignes fictives existantes en base. Primaire détaillé à obtenir avant chiffrage. Source secondaire : https://www.leparisien.fr/politique/retraites-fonctionnaires-arrets-maladie-les-solutions-durgence-que-va-proposer-le-parti-dedouard-philippe-sur-le-budget-13-10-2026-7PHFKCMC7JCHJPFN35XRWZFZ7E.php

## Anomalies de fidélité à corriger en priorité

1. **Éliminer des scénarios de parti toute mesure fictive** (LFI patrimoine +18 ; Horizons −5 et −4) ; garder leur historique si nécessaire dans une sauvegarde privée mais jamais comme « revendication du parti ».
2. **Ne pas faire passer les trois mesures RN pour un programme complet** ; reconstituer les annexes officielles 2026 et comparer l'écart au bilan +36 Md€ revendiqué. Ne pas sommer un sous-total et ses composantes.
3. Pour **LFI**, choisir explicitement le millésime 2026 ou 2027, non les mixer ; 2027 est le plus pertinent pour la comparaison présidentielle mais son primaire intégral doit être obtenu avant intégration.
4. Pour **Horizons**, n'afficher que les mesures chiffrées suffisamment sourcées ; à défaut, budget « documentation insuffisante / non chiffré » et pas de déficit calculé présenté comme fidèle.
5. **Calcul des impacts** : `src/projection.ts` ne connaît qu'une table statique de règles par `legacy_id`. Importer des mesures supplémentaires dans Neon ne suffit pas pour qu'elles soient calculées ! Il faut étendre les règles avec tests (ou terminer l'externalisation #22). Ne jamais présenter un montant importé mais ignoré par le moteur comme effectivement simulé.
6. **Référence** : contre-budgets 2026 vs **PLF/PLFSS initial 2026**, pas les comptes exécutés 2025. Conserver la distinction entre *effet revendiqué sur le texte 2026* et *illustration comptable appliquée au référentiel citoyen 2025*.
7. Conserver toutes les versions sources, l'extraction, et les statuts « repris du parti », « calcul interprétatif » et « non calculable ». Journaliser chaque mesure retirée et le motif.

## Conditions de publication

- [ ] Extraction exhaustive ou couverture explicitement chiffrée des documents de chaque parti
- [ ] Zéro montant inventé attribué à un parti
- [ ] Chaque mesure calculée est liée à une page officielle et sa base économique
- [ ] Tests de non-régression du moteur par mesure, comparaison bilan publié / scénario et identification des écarts
- [ ] Pas de faux « budget global » à partir d'un échantillon de mesures
- [ ] Adaptation des budgets citoyens historiques et validation sur branche Neon
- [ ] Aucune modification de l'UX/UI en dehors d'une précision textuelle nécessaire à l'honnêteté des résultats

**État : audit de provenance et anomalies identifiées ; reconstitution intégrale et activation non achevées.**
