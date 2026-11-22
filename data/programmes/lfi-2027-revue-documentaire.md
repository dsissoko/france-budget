# LFI — contre-budget 2027 : contrôle sur document primaire

**Revue documentaire du 20 novembre 2026.** La source officielle a été lue directement, pages 1–24, et **28 propositions individuellement chiffrées** ont été relevées (14 recettes, 14 dépenses). Le [CSV primaire](lfi-2027-mesures-primaires.csv) contient chaque ligne, son montant revendiqué, sa page, son sens et sa source. Le registre [des neuf agrégats antérieur](lfi-2027-blocs-documentaires-a-verifier.csv) est conservé comme trace historique mais ses mentions « primary pending » sont dépassées.

## Contrôle des totaux revendiqués (Md€)

| Poste | Reconstitution des mesures individuelles | Total |
|---|---|---:|
| Recettes — retour sur les baisses d'impôts | 9 + 10 + 22 + 3 | 44,0 |
| Recettes — grandes fortunes | 15 + 20 | 35,0 |
| Recettes — grandes entreprises | 3 + 5 + 3,9 + 5 | 16,9 |
| Recettes — transactions financières | 5 + 2,5 + 1 | 8,5 |
| Recettes — lutte contre la fraude | 2 | 2,0 |
| **Total recettes revendiqué** | | **106,4** |
| Dépenses — revenus populaires | 17 + 8 + 3 + 9,5 | 37,5 |
| Dépenses — services publics | 0,5 + 3,6 + 3,5 + 3 + 2,6 + 2 + 7 | 22,2 |
| Dépenses — adaptation climatique | 10 | 10,0 |
| Dépenses — protection sociale | 9 + 3 | 12,0 |
| **Total dépenses revendiqué** | | **81,7** |
| **Amélioration du solde revendiquée** | 106,4 − 81,7 | **24,7** |

Source : [document officiel LFI 2027](https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf), dépenses pages 8–12, recettes pages 13–14, bilan page 14.

## Réserves comptables

- Les 28 montants sont **ceux annoncés par LFI** ; l'extraction de source est contrôlée, **pas** leur faisabilité, indépendance ou imputation APU.
- Les **100 Md€ d'investissements annuels du pôle public bancaire** (pages 7 et 15–16) sont un instrument de financement et ne doivent **pas** s'ajouter aux 81,7 Md€ de dépenses, ni être considérés automatiquement comme dépenses APU.
- L'enveloppe de **10 Md€ climatique** (page 11) est explicitement présentée comme un investissement à engager « dès 2026 » ; clarifier l'imputation à l'année 2027 avant activation dans la projection.
- La **suppression des allégements de cotisations au-delà de 2 SMIC** (page 14) est décrite sans recette isolée dans le bilan à 106,4 Md€ : conserver comme proposition **non chiffrée séparément** ; ne pas lui attribuer automatiquement les 75,6 Md€ de coût global des exonérations.
- D'autres engagements (SMIC à 1 700 € net, tarifs carburants, rénovation, emplois de santé, investissements et réforme de l'IR à 14 tranches) apparaissent dans le texte **sans ligne additionnelle chiffrée autonome** dans le bilan : ils restent documentaires et ne doivent pas être sommés une deuxième fois.
- La gratuité des cantines à 3,6 Md€ apparaît aussi dans les mesures **LFI 2026** déjà activées : **ne jamais cumuler mécaniquement les millésimes 2026 et 2027**.
- Les postes d'investissement, les transferts internes entre administrations et les recettes d'effets comportementaux nécessitent une vérification APU indépendante. Le total de 24,7 Md€ est **une revendication**, pas le déficit simulé du site.

## Qualification et publication

- **Extraction des montants primaires et arithmétique : effectuées** (28 lignes dans le CSV).
- **APU : 6 mesures à effet direct qualifiées** par les catégories de la référence 2025 (CVAE, emplois enseignants, places universitaires, budget hospitalier, retraites, chômage), pour un sous-ensemble de **+3 Md€ de recettes et +19 Md€ de dépenses revendiquées**. La ventilation est comptable et pédagogique, **pas une validation indépendante des effets économiques**. Les 22 autres lignes restent non activées : 13 candidates, 8 à ventiler et 1 au millésime incertain. Chaque montant non activé nécessite une correspondance explicite, une vérification d'année et de recouvrement.
- **Déploiement de calcul** : migration préparée dans `db/archive/v1/migrations/20261120_lfi_2027_activate_direct_apu.sql`, validée sur une branche Neon de recette. Elle substitue les **six mesures 2027** aux deux mesures 2026 sélectionnées, **sans supprimer les deux historiques** ; aucun mélange des années. Le solde du sous-ensemble calculé est **-16 Md€**, ce qui **n'est pas le solde revendiqué du contre-budget 2027** (+24,7 Md€).
- Pour activer des mesures 2027, préparer des liens `source_accounting_links` et `proposal_accounting_measures`, puis des écritures `measure_accounting_entries` dûment validées. La seule existence d'un montant sourcé ne garantit pas qu'il soit incrémental par rapport aux comptes APU 2025.

Références : [issue #72](https://github.com/dsissoko/france-budget/issues/72) et [chantier #59](https://github.com/dsissoko/france-budget/issues/59).
