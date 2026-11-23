# Revue éditoriale — issue #156

**Statut : en revue, non importé en production.** PR de contenus uniquement, sans schéma SQL ni migration.

## Portée et volumes

- **14 présentations de budget** harmonisées : ECO 2027, Équinoxe 2027, LFI 2026 et 2027, LR 2026, RN 2026, PS 2027, PCF 2026, Horizons 2027, MoDem 2027, Nouvelle Énergie 2027, Reconquête 2027, Renaissance 2027, UPR 2027.
- **242 descriptions de propositions** rédigées ou enrichies : 143 LFI 2026, 75 RN 2026, 14 Équinoxe 2027 et 10 LR 2026. Les descriptions déjà documentées sont conservées.
- **NoPasaran** : aucune modification, budget citoyen hors périmètre.
- **PP 2026** : aucune modification, voir anomalie de provenance ci-dessous.
- LFI 2027 : `budget.csv.description` et `documentary_json.background_text` sont alignés sur la `presentation.csv` déjà présente, pour éviter que l'importeur donne deux textes divergents.

## Sources primaires de référence

Les sources et leurs millésimes restent inchangés dans les CSV. Les textes sont issus de l'inventaire documentaire déjà constitué, des intitulés des mesures et des contre-budgets primaires. Les propositions détaillées restent soumises à relecture pour confirmer chaque nuance :

| Programme | Source primaire déjà inventoriée | État |
| --- | --- | --- |
| RN 2026 | https://rassemblementnational.fr/documents/GRN-CONTRE-BUDGET-2026.pdf | 75 descriptions nouvelles, 3 anciennes conservées |
| LFI 2026 | https://lafranceinsoumise.fr/wp-content/uploads/2025/10/Budget-2026_LFI_web_pages.pdf | 143 descriptions nouvelles, 2 anciennes conservées |
| Équinoxe 2027 | https://parti-equinoxe.fr/contre-budget-2027/ | 14 descriptions enrichies |
| LR 2026 | https://republicains.fr/wp-content/uploads/2026/10/20261011_Fiches_presse_comptes_publics_mise_en_page.pdf | 10 descriptions enrichies, projections **2032** distinguées de 2026 |
| ECO 2027 | https://ecologisteetsocial.fr/2026/09/30/budget-2027-vite-lecologie-nos-propositions-pour-casser-le-cycle-des-crises/ | présentation générale harmonisée |
| PS 2027 | https://parti-socialiste.fr/vie-parlementaire/les-7-priorites-des-socialistes-pour-le-budget-2027/ | 7 priorités présentées sans propositions inventées |
| PCF 2026 | https://po.pcf.fr/wp-content/uploads/sites/40/2025/10/Commissioneconomiquebudget2026.pdf | source existante, extraction incomplète indiquée |
| UPR 2027 | https://upr.fr/notre-programme | programme présidentiel en préparation ; aucune mesure budgétaire inventée |

Les dossiers sans source budgétaire primaire précise ne reçoivent pas de résumé politique fictif : la description explique l'état de leur documentation dans **l'application**, et pas l'intégralité des positions du parti.

## Anomalie de provenance à résoudre avant clôture

`data/programmes/pp/2026/budget.csv` désigne « **Parti patriote** » tandis que `documentary_json.sources` pointe vers un article du mouvement **Place publique** (`place-publique.eu`). Cette incohérence d'identité préexiste à #156 ; changer le titre ou attribuer les prises de position au mauvais mouvement excéderait le seul enrichissement descriptif. **Ne pas enrichir ce budget tant que le porteur n'est pas confirmé.**

## Invariants et contrôles

- **Champs autorisés seulement :** `budget.csv.description`, `proposals.csv.title/description`, `documentary_json.background_text`, `presentation.csv.description` si nécessaire.
- **Aucun changement** des identifiants, de la provenance `sources`, de `measures.csv`, `impacts.csv`, des agrégats, allocations ou des montants ; aucun recalcul des impacts.
- Contrôle à réaliser avec le validateur de la #157, sur deux copies séparées de chaque dossier :

```bash
node scripts/v2/editorial-upgrade.mjs path/to/main/data/programmes/rn/2026 path/to/pr/data/programmes/rn/2026
npm run db:import
npm run test:v2
npm run db:check
```

- **Avant application** : effectuer une revue éditoriale des descriptions, en particulier celles générées à partir de titres courts où l'information primaire est limitée ; relever et corriger les passages qui vont au-delà des sources.
- **Neon** : ne pas exécuter `db:init`. Après validation et fusion, réimporter les CSV avec `npm run db:import -- --apply` dans la base QA, comparer les données et les votes avant/après puis procéder de même pour la production seulement après feu vert.
- La fonction `v2.import_budget` procède à des upserts par `budget_key/version` et `proposal_key` ; les clés existantes sont conservées tant que les lignes CSV sont inchangées.
