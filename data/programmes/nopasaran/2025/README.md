# NoPasaran 2025 — fixture d'intégration commune

Jeu de données issu du budget citoyen réel `c2e1262e-e312-4f82-bf50-0dd63a751083` (« Redressement avec la paix et la justice fiscale »), extrait de la branche Neon QA le 22 novembre 2026. **Aucune modification de la production.** Le double impact sur le poste `expenses/defense` a été regroupé en **une proposition unique −25 Md€**, contenant les composantes −3 et −22 Md€ dans la description. Le calcul est inchangé.

## Format pivot CSV commun (citoyens ET partis)
- `budget.csv` : 1 ligne par budget, `budget_key` identifiant stable d'import indépendant du UUID Neon ; `origin` est une propriété, pas une variante de schéma.
- `proposals.csv` : 1 ligne par proposition ; `proposal_key` identifiant stable dans le budget ; `claimed_amount_bn` est un montant *revendiqué*, distinct d'un impact APU. `source_url` et `source_year` sont facultatifs pour un citoyen, utiles pour les partis.
- `impacts.csv` : 0 à N impacts pour chaque proposition ; `side` dans `revenues`, `expenses`, `offBudget`. Montant *signé* en milliards d'euros (Md€). La clé de poste `(budget_key,side,category_id)` est unique ici.
- `expected-positions.csv` : **fixture de validation uniquement, non importée** ; valeurs attendues après application des deltas aux références INSEE 2025. Évite un contrôle circulaire.
- Encodage UTF-8, séparateur virgule, champs entre guillemets, décimales avec point, champs inconnus vides (jamais un zéro inventé).

## Correspondance au modèle Neon cible
- `budget.csv` → `budgets` ; `budget_key` nécessite une résolution d'identité stable (le schéma existant ne contient pas encore de colonne dédiée).
- `proposals.csv` → `budget_proposals` ; `proposal_key` se mappe **pour l'essai** à `client_id` (nom à généraliser plus tard).
- `impacts.csv` → `budget_proposal_impacts` ; `delta_amount_bn` → `delta_amount`.
- `claimed_amount_bn`, `source_url`, `source_year` requièrent une **extension future commune de la table des propositions**. Ce fixture citoyen ne perd aucune donnée : ces colonnes y sont vides. Pour les partis, cette extension est obligatoire avant import exhaustif.
- `budget_mode` est facultatif. Le mode AGGREGATE ou PARTIAL affecte le **calcul**, jamais la structure des CSV, ni celle du modèle relationnel.
- La table `budgets.scenario` porte encore le snapshot de calcul, mais pas une seconde liste de propositions dans le modèle cible. Les montants de test sont reconstructibles depuis la référence + les impacts.

## Critères d'essai
1. Import du budget et des 8 propositions + 8 impacts dans une branche Neon isolée ; pas de changement de production.
2. Vérification de l'unicité par poste et de l'intégrité des liens.
3. Parité de chaque `expected_amount_bn`, notamment `expenses/defense=30.4`.
4. Rejouer la même entrée sans doubler les propositions ni les impacts (idempotence).
5. Aucun changement de l'UI validée. Aucune migration SQL ou changement de schéma à ce stade.

## Résultats réels du test Neon QA (22 novembre 2026)

Branche : `qa-nopasaran-unified-import-20261122` (`br-gentle-hill-b9gmz04u`). Un budget **masqué** indépendant a été créé à partir des CSV : `0a087765-0509-4aa3-9108-88fc3c53d65e`.

| Vérification | Résultat |
|---|---|
| Chargement des fichiers `budget.csv`, `proposals.csv`, `impacts.csv` | **OK** (CSV lus et transformés en requêtes SQL génériques sur QA) |
| Création du budget masqué | **OK** |
| Écriture des propositions | **8** |
| Écriture des impacts | **8** |
| Deuxième passage des mêmes écritures en UPSERT | **8 / 8, aucun doublon** |
| Contenu titres/descriptions comparé à NoPasaran normalisé | **8/8 identiques** |
| Valeurs budgétaires calculées vs `expected-positions.csv` | **8/8 identiques** |
| Égalité JSONB exacte du budget calculé avec le témoin normalisé | **OK** après traitement décimal exact |
| Modification du schéma, de l'UI, ou des données Neon de production | **Aucune** |

### Contraintes détectées pendant l'itération
1. `budgets.budget_mode` est une **colonne générée** ; **ne jamais l'insérer**. Le champ CSV `budget_mode` est une intention/attente métier à rapprocher du mode déterminé en base, non une valeur SQL à écrire.
2. La colonne `budgets.visibility` n'accepte que `public` et `hidden` : utiliser `hidden` pour les tests.
3. Le poste `expenses/defense` doit être porté par **une seule proposition** (−25 Md€) à cause de la contrainte d'unicité.
4. Les montants sont des nombres décimaux en **Md€** : calculer en `NUMERIC` PostgreSQL (ou arithmétique décimale exacte), **pas en nombres flottants JavaScript**. Une première addition flottante donnait `9.700000000000003`, corrigée en `9.7` avant comparaison stricte.
5. L'import a utilisé des requêtes `INSERT ... ON CONFLICT` depuis le contenu des **CSV GitHub**, et non le script historique `scripts/archive/v1/import-programmes.mjs`. Ce dernier **n'est pas encore compatible** avec le format pivot. Le test valide **la capacité du schéma relationnel cible existant** à recevoir les données du témoin ; il ne vaut pas validation du pipeline historique des partis.
6. Les champs documentaires facultatifs (`claimed_amount_bn`, `source_url`, `source_year`) sont vides pour NoPasaran. Le schéma courant `budget_proposals` ne les stocke pas encore : ne pas prétendre que le round-trip documentaire politique est validé.

**Attention :** l'essai utilise une clé stable `budget_key` résolue côté importeur vers l'UUID de la nouvelle ligne `budgets`. Le modèle cible devra formaliser ce mapping/idempotence au niveau du budget avant l'import multi-programmes.

Ce dossier constitue **un prototype de format commun** et ne remplace pas encore le contrat des CSV politiques existants. Voir #135, #136 et #137/#138.
