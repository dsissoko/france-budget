---
name: rapprochement-programmes-citoyens
description: Collecter, préserver et regrouper les mesures de programmes politiques dans les CSV de Mon Budget Citoyen, avec classification agentique auditée et calcul comptable déterministe.
version: 1.0.0
---

# Skill — Rapprochement des programmes avec les postes citoyens

## Objectif

Restituer **toutes** les mesures identifiées dans un programme, au minimum à titre documentaire, et rapprocher les propositions des postes budgétaires citoyens sans double comptage ni invention de chiffrage. La qualification comptable **ne conditionne pas la visibilité documentaire**.

**Source durable : les CSV versionnés.** Les PDF servent à renseigner et vérifier les CSV ; Neon et l’UI consomment leur contenu. Corriger dans les CSV puis réimporter, jamais masquer les défauts éditoriaux par une correction isolée en base. Toute génération de JSON de preview ou de données de base doit être reproductible depuis les CSV.\n\nRéférences du dépôt : `docs/methode.md`, `docs/schema.md`, `data/programmes/registre-programmes.csv`, `data/programmes/<code>/<année>/{sources,themes,mesures,agregats}.csv`, `.github/PULL_REQUEST_TEMPLATE/political-programme.md`.

## Principe de sobriété des contraintes

**Ne jamais inventer de contrainte technique, économique ou méthodologique.** Le programme politique fournit les engagements à restituer ; l'application impose uniquement les contraintes indispensables pour intégrer et afficher des données cohérentes, sans erreur de calcul ni double compte. Ne pas transformer les choix d'implémentation actuels, les pratiques proposées, les vérifications facultatives ou les préférences d'un agent en conditions supplémentaires imposées aux programmes. Lorsqu'une information manque, conserver le caractère documentaire et expliciter l'incertitude, plutôt que bloquer son intégration. Pour chaque condition bloquante, être capable d'indiquer sa source : **programme**, **contrainte effective UI/API/Neon** ou **nécessité d'intégration démontrée**. Sinon, la supprimer ou la traiter en recommandation non bloquante.

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

### 4. Calculer les impacts sur le budget citoyen (objectifs et exigences de résultat)

**Mission : restituer aussi fidèlement que possible les conséquences financières des propositions sur le budget citoyen, en distinguant ce que le programme annonce, ce que l'on peut traduire dans les postes de l'application et ce qui reste incertain, sans imposer de critères supplémentaires non nécessaires.** Le skill fixe les résultats attendus, **pas la méthode de calcul ni un algorithme imposé**. L'agent choisit les moyens d'analyse adaptés aux sources disponibles ; seuls les résultats qualifiés sont utilisés par le moteur déterministe.

**Résultats attendus pour chaque regroupement :**

- **Couverture utile** : identifier les postes citoyens réellement susceptibles d'être affectés et le sens attendu de chaque effet (hausse, baisse ou effet non établi). Un groupe peut n'avoir aucun effet quantifiable ou affecter plusieurs postes.
- **Chiffrage exploitable quand il est justifiable** : privilégier les montants explicitement annoncés dans le programme ; lorsqu'une traduction ou une estimation est nécessaire, expliciter uniquement les hypothèses et sources utiles à la compréhension et à l'intégration. Ne pas exiger des données que le programme ne fournit pas si leur absence n'empêche ni l'affichage documentaire ni une imputation justifiée. Aucun montant inventé pour combler une lacune.
- **Fidélité financière** : ne pas confondre coût d'une mesure, économies annoncées, recette fiscale, enveloppe d'investissement, financement, effet sur le solde et impact sur un poste du budget citoyen. Un montant publié n'est pas nécessairement un impact additionnel sur la référence INSEE/APU du simulateur.
- **Cohérence globale** : chercher à rapprocher les impacts attribuables des montants et soldes annoncés, lorsqu'ils sont comparables, sans forcer artificiellement l'égalité. Expliquer les écarts, les montants hors périmètre, les effets indirects et les chevauchements.
- **Pas de double compte** : un poste citoyen est réservé à son unique regroupement pour le budget. À l'intérieur du groupe, les montants retenus doivent couvrir les effets propres à chaque proposition **sans compter deux fois un même effet**, même lorsque plusieurs propositions partagent un poste ou qu'une proposition touche plusieurs postes. Un regroupement n'ajoute aucun impact en plus de ceux qu'il rassemble.
- **Traçabilité et transparence** : fournir pour chaque impact son poste, son sens, son montant éventuel, son statut, son origine (chiffrage revendiqué / estimation argumentée / absence de chiffrage), la référence documentaire et une justification courte compréhensible. Préserver les détails et réserves techniques hors du texte éditorial.
- **Incertitude explicite** : une proposition demeure visible même si l'impact n'est pas chiffrable, si sa ventilation est ambiguë ou si des hypothèses nécessaires ne sont pas vérifiables. Mieux vaut un impact non calculé et correctement expliqué qu'un chiffre faussement précis.
- **Neutralité et reproductibilité** : mêmes exigences de preuve pour toutes les formations ; conserver dans les CSV les hypothèses, décisions et résultats validés, afin de ne pas réanalyser les PDF à chaque import.

**Critères d'activation dans le simulateur :**

- Un impact n'est activable que si les informations nécessaires au calcul sur un poste existant sont disponibles et cohérentes (poste, sens, montant et base de référence pertinente). Ne pas ajouter d'exigences de preuve ou de précision qui ne sont pas nécessaires à ce calcul.
- Si l'intégration existante l'exige, utiliser les états `calculate`, `non_chiffrable_apu` et `review_pending` pour distinguer les impacts calculés, exclus ou incertains. Ces états ne constituent pas de nouvelles exigences de contenu pour les programmes. Une mesure insuffisamment chiffrée reste affichable.
- En mode `AGGREGATE`, les regroupements et leurs impacts documentés expliquent le programme **sans modifier les masses globales revendiquées déjà utilisées** ; ils ne s'y ajoutent pas. En mode `PARTIAL`, seuls les impacts directs qualifiés alimentent la simulation.
- **Livrable attendu : une proposition ou un regroupement intelligible, ses postes réservés et les impacts disponibles, chiffrés ou non.** Le niveau de justification est proportionné aux données du programme et aux seules nécessités de l'intégration. Aucun résultat approximatif ne doit être présenté comme certifié.

### 5. Rédiger les champs publics (agentique, puis contrôle éditorial)

**Public cible : une personne sans connaissances économiques ou budgétaires.** Les textes issus des programmes politiques constituent la base éditoriale privilégiée : conserver leurs formulations courantes lorsqu'elles sont compréhensibles, sans recopier inutilement leur jargon ou leur rhétorique partisane. La mission de l'agent est de **rendre la proposition immédiatement compréhensible**, pas de rédiger une note d'expertise.

- Produire pour chaque proposition et regroupement un **titre court**, puis une **description de une à trois phrases courtes** : ce qui est proposé, à qui cela s'adresse, et éventuellement pourquoi cela concerne le poste citoyen.
- **Longueur maximale : utiliser la limite du champ définie dans l'UI et/ou dans le schéma et les contraintes Neon.** Inspecter les deux sources ainsi que leurs validations API. Lorsqu'elles divergent, respecter la limite effective la plus restrictive et signaler l'incohérence. Si aucune limite explicite n'existe, **déduire une longueur cible raisonnable** de l'emplacement et de l'usage réel du champ (carte, titre, résumé, détail), en tenant compte de l'affichage mobile et de la lisibilité. Documenter cette limite proposée dans le contrat éditorial avec sa justification et la faire respecter dans les contrôles de génération ; ne pas prétendre qu'il s'agit déjà d'une contrainte technique. La génération doit viser une marge de sécurité et produire immédiatement un texte complet tenant dans le champ, espaces et ponctuation compris. Ne jamais tronquer automatiquement une phrase ni compter sur une ellipse CSS pour corriger un texte trop long.
- Pour tout dépassement, reformuler en supprimant les répétitions et détails secondaires, sans perdre le sens, les chiffres essentiels ni la source ; vérifier **après génération** la longueur effective et recommencer si nécessaire. La version longue originale reste dans les données sources, pas dans le champ public limité.
- Lorsqu'une longueur ou une contrainte change dans l'UI ou dans Neon, mettre à jour les contrôles/tests du pipeline et régénérer les champs concernés. Si aucune limite technique explicite n'est définie, utiliser la limite éditoriale déduite, versionnée et testée, puis proposer de l'aligner dans l'UI et Neon lors de l'implémentation.
- Employer des mots usuels, des verbes concrets, une seule idée par phrase. Préférer « Créer des places à l'université » à « Accroître la capacité d'accueil de l'enseignement supérieur ».
- Ne pas introduire des notions comme « APU », « COFOG », « imputation », « agrégats », « rendement fiscal » ou « catégorie comptable » dans les textes destinés aux citoyens. Les réserver aux champs techniques et aux sources.
- **Priorité à la pédagogie plutôt qu'à l'exhaustivité technique** : omettre les détails techniques qui n'aident pas le lecteur, sans déformer l'intention, changer les bénéficiaires, les conditions, les chiffres, l'année ou le sens d'une mesure. Ne jamais inventer un effet ou transformer une promesse en fait établi.
- Pour un regroupement, rédiger une présentation de synthèse simple, fidèle aux mesures incluses, sans suggérer une somme financière vérifiée. Garder les titres, descriptions et sources des mesures consultables dans le détail.
- Conserver distincts : **texte source exact ou référence**, **texte public reformulé**, **note de qualification technique** et **statut du chiffrage**. Ne pas écraser le texte du programme dans les CSV.
- Si le programme emploie déjà une formulation simple, la réutiliser autant que possible. En cas d'ambiguïté ou de formule politique invérifiable, préférer « Le programme propose… » et laisser la qualification détaillée hors de la description publique.

**Relecture obligatoire** : le titre et la description respectent-ils chacun la limite exacte de leur champ UI ? Un lecteur non initié comprend-il en une lecture de quoi il s'agit ? Le texte conserve-t-il la substance de la proposition ? Est-il compréhensible sans sigle non expliqué ? Toute réponse négative impose une nouvelle rédaction.

**Exemple**

- Document/source : « Création de 250 000 places universitaires ».
- Titre public : « Créer 250 000 places à l'université ».
- Description publique : « Le programme propose d'ouvrir 250 000 places supplémentaires à l'université pour accueillir davantage d'étudiants. »
- Métadonnées conservées séparément : montant revendiqué 3,5 Md€, source, millésime et statut de qualification comptable.

### 6. Exporter puis importer (déterministe)

Les CSV versionnés sont le référentiel réutilisable de provenance et d'enrichissement. Pour les programmes enrichis, les fichiers `presentation.csv`, `groupes-citoyens.csv`, `rattachements-citoyens.csv`, `impacts-citoyens.csv` complètent `mesures.csv` et les quatre fichiers historiques. `presentation.csv` fournit le texte de présentation du budget, distinct de l’URL de la source ; `groupes-citoyens.csv` fournit les titres et descriptions publics ; `rattachements-citoyens.csv` porte les liens sources↔postes et la justification ; `impacts-citoyens.csv` décrit par poste les montants attribuables et les réserves. Aucun fichier de preview n'est une deuxième source de vérité. Conserver dans des fichiers adjacents ou colonnes versionnées (selon le schéma adopté) les rattachements proposés, preuves, décisions et groupes ; ne pas écraser les lignes originales. Générer ensuite une migration/import idempotent vers Neon. Importer **toutes les mesures documentaires** en tant que contenu visible, indépendamment de leur activation comptable. Les seules écritures calculées proviennent du flux qualifié.

En mode `AGGREGATE`, **l'import doit intégrer les lignes documentaires même si elles ne sont pas activées dans la simulation** ; ne jamais les écarter au prétexte que le couple de masses financières est déjà connu. L'import ne doit pas remplacer une présentation éditoriale issue des CSV par une accumulation de titres et d'URL, ni par un texte générique. Les URL ne figurent que dans les champs source et sont rendues cliquables par l'UI, avec un libellé humain. Une migration de schéma, si nécessaire, fait partie du contrat d'intégration et ne doit pas déclencher de recalcul implicite.\n\nLe code de l'interface/API doit lire les mesures documentaires pour les budgets `AGGREGATE` **et** `PARTIAL`. Le nombre affiché doit provenir du même ensemble dédupliqué que la liste effectivement consultable ; le label « chiffrées » est réservé aux lignes réellement dotées d'un montant, sans suggérer qu'elles ont un impact calculé.

### 7. Vérifier le résultat (déterministe)

Contrôles obligatoires avant fusion :
- inventaire sources = lignes CSV distinctes = lignes importées visibles (à exclusions explicites et documentées près) ;
- chaque mesure source apparaît une seule fois dans l'inventaire documentaire et ses liens de groupes sont retraçables ;
- aucun groupe ne crée une écriture supplémentaire ; **aucun poste citoyen n'est réservé à deux groupes du même budget** ; tout chevauchement impose leur fusion transitive ;
- les montants consolidés sont réconciliés, sans chevauchement ni duplication multi-postes ; lorsqu'une mesure concerne plusieurs postes et que sa ventilation manque, laisser les impacts par poste non chiffrés plutôt que répartir arbitrairement le montant ;\n- pour chaque poste, distinguer `montant revendiqué et attribuable à ce poste`, `montant revendiqué non ventilé`, et `impact effectivement appliqué à la simulation` ;
- `AGGREGATE` : trajectoire et bilan identiques avant/après ajout des détails documentaires ;
- `PARTIAL` : seules les écritures validées changent les résultats ;
- interface mobile et desktop : liste, dépliants, compteurs et sources concordent ; titres et descriptions compréhensibles par un non-initié et fidèles aux sources, et **tous les champs générés respectent leur plafond UI** ;
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

### v0.4.0 — 2026-11-22
- Les limites de longueur du texte généré sont **celles des champs UI**, non des constantes arbitraires du skill.
- Génération sous plafond et contrôle déterministe des caractères ; réécriture plutôt que troncature.
- Adaptation des contrôles lorsque l'UI fait évoluer ses contraintes.

### v0.5.0 — 2026-11-22
- Recherche des limites dans l'UI, les validations API **et** Neon, avec priorité à la contrainte effective la plus restrictive.
- À défaut, déduction d'un plafond éditorial justifié par le contexte d'affichage, documenté et testé, sans le présenter comme une limite technique préexistante.

### v0.6.0 — 2026-11-22
- Deuxième volet du skill : objectifs de chiffrage et de qualification des impacts sur les postes citoyens.
- Directives centrées sur les résultats attendus (fidélité, couverture, cohérence, traçabilité, absence de doubles comptes, incertitude), sans imposer d'algorithme de calcul.
- Distinction explicite entre montant annoncé, estimation, impact activable et simple restitution documentaire.

### v0.7.0 — 2026-11-22
- Principe directeur : aucune contrainte inventée au-delà des engagements du programme politique et des seules nécessités démontrées de l'intégration.
- Les exigences documentaires facultatives ne bloquent ni l'affichage des mesures ni le traitement d'impacts calculables.
- Distinction entre contraintes effectives et recommandations méthodologiques non bloquantes.

### v1.0.0 — 2026-11-22
- Chaîne stabilisée : PDF et sources primaires → CSV documentaires enrichis → import Neon → restitution API/UI.
- Schéma d'échange public : présentation, groupes, liens propositions↔postes, impacts avec réserves et source.
- Import documentaire obligatoire également en mode agrégat ; aucune URL brute dans les champs éditoriaux.
- Impact financier annoncé distingué de l'effet calculé, avec ventilation non forcée en cas de mesure multi-postes.
- Règles orientées résultats et seules contraintes d'intégration justifiées.
