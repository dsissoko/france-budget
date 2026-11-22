---
name: rapprochement-programmes-citoyens
description: Collecter, préserver et regrouper les mesures de programmes politiques dans les CSV de Mon Budget Citoyen, avec classification agentique auditée et calcul comptable déterministe.
version: 0.1.0
---

# Skill — Rapprochement des programmes avec les postes citoyens

## Objectif

Restituer **toutes** les mesures identifiées dans un programme, au minimum à titre documentaire, et rapprocher les propositions des postes budgétaires citoyens sans double comptage ni invention de chiffrage. La qualification comptable **ne conditionne pas la visibilité documentaire**.

Références du dépôt : `docs/methode.md`, `docs/schema.md`, `data/programmes/registre-programmes.csv`, `data/programmes/<code>/<année>/{sources,themes,mesures,agregats}.csv`, `.github/PULL_REQUEST_TEMPLATE/political-programme.md`.

## Invariants non négociables

1. Les lignes sources ont des identifiants stables (`party_code`, `source_year`, identifiant de mesure / `source_row`) et restent disponibles sans perte dans les CSV. Un groupe ne remplace jamais ses membres.
2. Séparer **mesure originale**, **regroupement documentaire**, **correspondance avec un poste citoyen** et **impact comptable**. Conserver les thèmes et les sources.
3. **Toute mesure sourcée** est affichable en mode documentaire, y compris sans montant individuel, sans classification certaine ou sans impact comptable qualifié. Les sous-totaux éditoriaux restent distincts des mesures élémentaires.
4. Le rapprochement agentique produit une **proposition**, une justification, une confiance et des éventuelles alternatives. Il ne crée jamais d'écriture comptable par lui-même.
5. Le même budget ne doit disposer que d'**un impact effectif par couple (côté comptable, catégorie citoyenne)** ; si plusieurs lignes concernent le même poste, fusionner les écritures **après** examen des recouvrements. Une mesure multi-postes demande une ventilation explicite, sans duplication de montant.
6. Les regroupements documentaires peuvent être thématiques, mais une correspondance comptable n'est pas une preuve de causalité, d'additionnalité ou de compatibilité APU. Ne jamais agréger aveuglément les montants annoncés.
7. En mode `AGGREGATE`, préserver le solde revendiqué fondé sur les masses globales : les mesures et leurs regroupements **n'ajoutent aucun montant au moteur**. En mode `PARTIAL`, seuls les effets directs qualifiés et réconciliés sont calculés.
8. Année, périmètre, unité, signe, source et éventuel chevauchement doivent être contrôlés ; ne jamais cumuler automatiquement deux millésimes, un agrégat avec ses sous-mesures, un financement avec une dépense APU, ni des variations avec des totaux.
9. Ne modifier ni les budgets citoyens, ni les votes, ni les catégories de référence sans décision dédiée. Import rejouable et migrations réversibles ; pas d'écriture en production sans autorisation.
10. Les choix s'appliquent uniformément à toutes les formations, indépendamment de leur orientation politique.

## Chaîne de traitement

### 1. Inventorier et tracer (déterministe)

Lire `registre-programmes.csv` puis les quatre CSV par formation/millésime. Réconcilier le nombre de lignes avec les documents primaires disponibles. Archiver les mesures historiques avant toute réinitialisation. Distinguer : mesure chiffrée, non chiffrée, agrégat, doublon documentaire, variante de millésime. Rendre les absences et les extractions partielles visibles.

### 2. Proposer les rattachements (agentique, hors calcul)

Pour **chaque ligne source**, produire une hypothèse de correspondance vers une ou plusieurs catégories existantes (dépenses, recettes, manques à gagner hors budget), une justification issue du contenu, une confiance `high|medium|low`, et un statut `mapped|ambiguous|unmapped`. S'appuyer sur les définitions de catégories et non sur une simple similarité de libellés.

Ne pas créer de catégorie inconnue. En cas d'ambiguïté, conserver la ligne en documentaire avec les alternatives ; une correspondance incertaine n'autorise aucune imputation.

### 3. Grouper (déterministe à partir des propositions validées)

Former les groupes d'affichage par budget, millésime, poste citoyen et sens de variation compatible ; identifier les groupes par clé stable, jamais par titre. Préserver l'appartenance d'origine de chaque mesure et les liens `group_id`/`source_row`. Si une mesure touche plusieurs postes, conserver **une seule ligne source** et plusieurs liens de rattachement, avec une répartition chiffrée uniquement si elle est justifiée.

Attention : si le schéma existant impose une appartenance unique `party_source_lines.group_id`, garder le groupe documentaire primaire unique et représenter les correspondances multi-postes dans une relation séparée, plutôt que dupliquer la ligne.

### 4. Qualifier l'imputation (contrôles déterministes + décision explicitée)

Pour chaque candidat à impact : vérifier la direction, la catégorie existante, le périmètre APU, l'année, le caractère annuel/ponctuel, la source, l'additionnalité et les doubles comptes. Séparer `calculate`, `non_chiffrable_apu` et `review_pending`. Une décision `review_pending` ou un simple montant revendiqué ne modifie jamais la simulation.

Lorsqu'au moins deux mesures qualifiées alimentent le même poste, produire une **écriture consolidée unique**, traçable vers toutes les composantes, *après* élimination des recouvrements. Rejeter les incohérences de sens, d'unité et de millésime ; ne pas additionner une enveloppe et ses sous-mesures.

### 5. Exporter puis importer (déterministe)

Les CSV versionnés sont le référentiel réutilisable de provenance et d'enrichissement. Conserver dans des fichiers adjacents ou colonnes versionnées (selon le schéma adopté) les rattachements proposés, preuves, décisions et groupes ; ne pas écraser les lignes originales. Générer ensuite une migration/import idempotent vers Neon. Importer **toutes les mesures documentaires** en tant que contenu visible, indépendamment de leur activation comptable. Les seules écritures calculées proviennent du flux qualifié.

Le code de l'interface/API doit lire les mesures documentaires pour les budgets `AGGREGATE` **et** `PARTIAL`. Le nombre affiché doit provenir du même ensemble dédupliqué que la liste effectivement consultable ; le label « chiffrées » est réservé aux lignes réellement dotées d'un montant, sans suggérer qu'elles ont un impact calculé.

### 6. Vérifier le résultat (déterministe)

Contrôles obligatoires avant fusion :
- inventaire sources = lignes CSV distinctes = lignes importées visibles (à exclusions explicites et documentées près) ;
- chaque mesure source apparaît une seule fois dans l'inventaire documentaire et ses liens de groupes sont retraçables ;
- aucun groupe ne crée une écriture supplémentaire ; aucun poste n'a deux impacts effectifs de même côté dans un budget ;
- les montants consolidés sont réconciliés, sans chevauchement ni duplication multi-postes ;
- `AGGREGATE` : trajectoire et bilan identiques avant/après ajout des détails documentaires ;
- `PARTIAL` : seules les écritures validées changent les résultats ;
- interface mobile et desktop : liste, dépliants, compteurs et sources concordent ;
- non-régression des budgets citoyens, votes, exports, tests TypeScript/Vitest/build et migrations.

## Cas de référence : LFI 2027

Le dépôt documente **28 lignes chiffrées primaires**, soit 14 de recettes et 14 de dépenses dans `data/programmes/lfi/2027/mesures.csv` et `data/programmes/lfi-2027-revue-documentaire.md`. Il existe aussi des lignes historiques `neon_legacy_export` : **ne pas les recompter comme nouvelles mesures**. Critère d'acceptation : les 28 lignes documentaires primaires sont toutes visibles via leurs groupes dans l'application, avec leurs sources, même si aucun impact n'est activé ; le solde revendiqué reste de +24,7 Md€ (106,4 - 81,7).

Exemple : « Création de 10 000 postes dans l'enseignement » (0,5 Md€) et « Création de 250 000 places universitaires » (3,5 Md€) peuvent être rapprochées de l'Éducation pour l'affichage ; **4 Md€ reste un total documentaire**, pas une écriture calculée sans décision comptable explicite.

## Journal d'apprentissage du skill

Après chaque campagne, conserver dans la PR les nouvelles ambiguïtés rencontrées, la résolution validée, les exemples avant/après et les tests ajoutés. Mettre à jour ce skill **dans la même PR que la règle modifiée**, versionner ses changements et éviter les exceptions propres à un parti.

### v0.1.0 — 2026-11-22
- Priorité à l'exhaustivité documentaire, même pour les budgets globalement chiffrés.
- Rattachement agentique aux postes citoyens, suivi de regroupements déterministes.
- Un seul impact comptable effectif par poste et côté, avec rapprochement des mesures d'origine.
- Pas de recalcul des agrégats revendiqués à partir des mesures affichées.
