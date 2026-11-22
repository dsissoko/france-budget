---
name: rapprochement-programmes-citoyens
description: Collecter, préserver et regrouper les mesures de programmes politiques dans les CSV de Mon Budget Citoyen, avec classification agentique auditée et calcul comptable déterministe.
version: 0.3.0
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
5. **Exclusivité des postes par regroupement : pour un budget donné, chaque poste citoyen impacté appartient à un seul groupe de propositions.** Un groupe peut toucher zéro, un ou plusieurs postes. Une mesure multi-postes n'est jamais dupliquée. L'unicité porte sur le poste citoyen (et non simplement sur le couple poste/sens) ; les écritures éventuelles de recettes et dépenses restent détaillées à l'intérieur du groupe, puis consolidées et contrôlées.
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

### 3. Regrouper par exclusivité des postes (déterministe)

Construire, pour **un même budget**, un graphe biparti : nœuds « propositions sources » d'un côté et « postes citoyens impactés » de l'autre ; créer une arête pour chaque correspondance agentique **retenue**. Calculer les **composantes connexes**, sans séparation par thème ni par sens de variation :

- Deux propositions partageant au moins un poste appartiennent au même groupe.
- La fusion est **transitive** : A touche Éducation et Santé ; B touche Santé et Retraites => un seul groupe {A,B} réserve Éducation, Santé et Retraites.
- Une proposition sans poste identifié demeure visible dans un groupe documentaire sans impact, sans réservation.
- Chaque poste identifié appartient à **un seul groupe du budget**, et devient indisponible pour tous les autres groupes. Ne jamais créer un second groupe sur un poste déjà réservé ; fusionner les groupes concernés à la place.
- Un groupe peut donc porter **zéro à plusieurs postes** et contenir une à plusieurs propositions ; ses postes peuvent inclure des recettes, des dépenses et des manques à gagner.
- Les groupes sont des résultats **déterministes** de la relation proposition↔poste. Utiliser des IDs stables et ordonner les lignes, ne jamais déduire l'appartenance de titres ou de thèmes.
- Ne pas dupliquer les lignes sources si une proposition touche plusieurs postes. Préserver la source et les liens vers chaque poste.

Exemple séparé : A touche Éducation et Santé ; B touche Santé ; C touche Retraites => groupes {A,B} avec {Éducation,Santé} et {C} avec {Retraites}. Si B touche aussi Retraites, **les trois propositions** forment un groupe unique.

Le schéma existant impose l'appartenance de `party_source_lines` à un seul `group_id`. Conserver cette propriété et modéliser les correspondances proposition↔postes séparément ; aucune proposition ne doit apparaître comme nouvelle ligne source à cause d'un rattachement multiple.

### 4. Qualifier l'imputation (contrôles déterministes + décision explicitée)

Pour chaque candidat à impact : vérifier la direction, la catégorie existante, le périmètre APU, l'année, le caractère annuel/ponctuel, la source, l'additionnalité et les doubles comptes. Séparer `calculate`, `non_chiffrable_apu` et `review_pending`. Une décision `review_pending` ou un simple montant revendiqué ne modifie jamais la simulation.

Lorsqu'au moins deux mesures qualifiées alimentent le même poste **à l'intérieur de son groupe exclusif**, produire un impact consolidé unique par poste, traçable vers toutes les composantes, *après* élimination des recouvrements. Rejeter les incohérences de sens, d'unité et de millésime ; ne pas additionner une enveloppe et ses sous-mesures.

### 5. Rédiger les champs publics (agentique, puis contrôle éditorial)

**Public cible : une personne sans connaissances économiques ou budgétaires.** Les textes issus des programmes politiques constituent la base éditoriale privilégiée : conserver leurs formulations courantes lorsqu'elles sont compréhensibles, sans recopier inutilement leur jargon ou leur rhétorique partisane. La mission de l'agent est de **rendre la proposition immédiatement compréhensible**, pas de rédiger une note d'expertise.

- Produire pour chaque proposition et regroupement un **titre court**, puis une **description de une à trois phrases courtes** : ce qui est proposé, à qui cela s'adresse, et éventuellement pourquoi cela concerne le poste citoyen.
- Employer des mots usuels, des verbes concrets, une seule idée par phrase. Préférer « Créer des places à l'université » à « Accroître la capacité d'accueil de l'enseignement supérieur ».
- Ne pas introduire des notions comme « APU », « COFOG », « imputation », « agrégats », « rendement fiscal » ou « catégorie comptable » dans les textes destinés aux citoyens. Les réserver aux champs techniques et aux sources.
- **Priorité à la pédagogie plutôt qu'à l'exhaustivité technique** : omettre les détails techniques qui n'aident pas le lecteur, sans déformer l'intention, changer les bénéficiaires, les conditions, les chiffres, l'année ou le sens d'une mesure. Ne jamais inventer un effet ou transformer une promesse en fait établi.
- Pour un regroupement, rédiger une présentation de synthèse simple, fidèle aux mesures incluses, sans suggérer une somme financière vérifiée. Garder les titres, descriptions et sources des mesures consultables dans le détail.
- Conserver distincts : **texte source exact ou référence**, **texte public reformulé**, **note de qualification technique** et **statut du chiffrage**. Ne pas écraser le texte du programme dans les CSV.
- Si le programme emploie déjà une formulation simple, la réutiliser autant que possible. En cas d'ambiguïté ou de formule politique invérifiable, préférer « Le programme propose… » et laisser la qualification détaillée hors de la description publique.

**Relecture obligatoire** : un lecteur non initié comprend-il en une lecture de quoi il s'agit ? Le texte conserve-t-il la substance de la proposition ? Est-il compréhensible sans sigle non expliqué ? Toute réponse négative impose une nouvelle rédaction.

**Exemple**

- Document/source : « Création de 250 000 places universitaires ».
- Titre public : « Créer 250 000 places à l'université ».
- Description publique : « Le programme propose d'ouvrir 250 000 places supplémentaires à l'université pour accueillir davantage d'étudiants. »
- Métadonnées conservées séparément : montant revendiqué 3,5 Md€, source, millésime et statut de qualification comptable.

### 6. Exporter puis importer (déterministe)

Les CSV versionnés sont le référentiel réutilisable de provenance et d'enrichissement. Conserver dans des fichiers adjacents ou colonnes versionnées (selon le schéma adopté) les rattachements proposés, preuves, décisions et groupes ; ne pas écraser les lignes originales. Générer ensuite une migration/import idempotent vers Neon. Importer **toutes les mesures documentaires** en tant que contenu visible, indépendamment de leur activation comptable. Les seules écritures calculées proviennent du flux qualifié.

Le code de l'interface/API doit lire les mesures documentaires pour les budgets `AGGREGATE` **et** `PARTIAL`. Le nombre affiché doit provenir du même ensemble dédupliqué que la liste effectivement consultable ; le label « chiffrées » est réservé aux lignes réellement dotées d'un montant, sans suggérer qu'elles ont un impact calculé.

### 7. Vérifier le résultat (déterministe)

Contrôles obligatoires avant fusion :
- inventaire sources = lignes CSV distinctes = lignes importées visibles (à exclusions explicites et documentées près) ;
- chaque mesure source apparaît une seule fois dans l'inventaire documentaire et ses liens de groupes sont retraçables ;
- aucun groupe ne crée une écriture supplémentaire ; **aucun poste citoyen n'est réservé à deux groupes du même budget** ; tout chevauchement impose leur fusion transitive ;
- les montants consolidés sont réconciliés, sans chevauchement ni duplication multi-postes ;
- `AGGREGATE` : trajectoire et bilan identiques avant/après ajout des détails documentaires ;
- `PARTIAL` : seules les écritures validées changent les résultats ;
- interface mobile et desktop : liste, dépliants, compteurs et sources concordent ; titres et descriptions compréhensibles par un non-initié et fidèles aux sources ;
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

### v0.2.0 — 2026-11-22
- Regroupement défini précisément par les composantes connexes du graphe propositions ↔ postes citoyens.
- Exclusivité de **chaque poste au niveau du budget**, et non uniquement des écritures ou couples poste/sens.
- Groupes autorisés à toucher zéro, un ou plusieurs postes ; fusion transitive obligatoire ; propositions sans poste conservées.

### v0.3.0 — 2026-11-22
- Génération éditoriale en langage courant, inspirée prioritairement des formulations déjà pédagogiques des programmes.
- Titres et descriptions courts, sans jargon comptable, avec relecture « non-initié ».
- Préférence donnée à la clarté plutôt qu'à l'exhaustivité technique, sans altérer la substance des engagements ni les chiffres.
