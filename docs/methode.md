# Notre méthode — Mon Budget Citoyen

## Notre approche : des chiffres sérieux, des catégories qui parlent

Mon Budget Citoyen n'est **pas une reproduction du budget de l'État**. Le simulateur couvre **l'ensemble des administrations publiques (APU/S13)** : État, Sécurité sociale et collectivités territoriales. Il regroupe les dépenses et recettes en thèmes compréhensibles : retraites, santé, éducation, logement, sécurité, fiscalité, etc. Les noms et regroupements sont des **choix éditoriaux pédagogiques** ; leur transparence et leur traçabilité sont indispensables. Une nomenclature officielle n'est pas forcément intelligible pour le public.

## 1. Ce qui est officiel et ce qui est estimé

Le **déficit des APU en 2025 est de 152,5 Md€**, selon l'INSEE. Les données provisoires de mai 2026 donnent **1 561,7 Md€ de recettes** et **1 714,2 Md€ de dépenses** (même périmètre, même millésime). Source : [INSEE, compte des APU 2025](https://www.insee.fr/fr/statistiques/8997691), figure 4. Les valeurs antérieures de référence (1 561,6 / 1 714,1 Md€) proviennent de la notification de mars 2026 : [INSEE](https://www.insee.fr/fr/statistiques/8956575).

**Une valeur officielle nationale n'implique pas que chaque catégorie citoyenne le soit.** Le détail des *dépenses par fonction* le plus récent actuellement disponible concerne **2024**, publié dans les tableaux [INSEE COFOG 3.301](https://www.insee.fr/fr/statistiques/8574707) et l'étude [Usage de l'argent public en 2024](https://www.insee.fr/fr/statistiques/8735252). Les impôts par nature sont disponibles pour **2025** dans [INSEE, Impôts](https://www.insee.fr/fr/statistiques/2381408).

La règle est la suivante :
- **Officiel** : montant directement publié pour un champ, une année et une définition précis.
- **Reconstitué** : somme ou différence de composantes officielles **non chevauchantes**, avec calcul explicite.
- **Estimé** : montant fondé sur la dernière ventilation officielle et une hypothèse de prolongation documentée. Une estimation 2025 calculée à partir de fonctions 2024 n'est pas un « chiffre INSEE 2025 » par catégorie.
- **Illustratif** : enveloppe purement pédagogique, non certifiée.

Les montants doivent toujours être accompagnés de leur **périmètre, année, source et statut**. Quand le détail des composantes ne permet pas une ventilation certaine, nous le signalons plutôt que d'affirmer une précision trompeuse.

## 2. De la nomenclature officielle aux agrégats citoyens

La construction du référentiel vise deux rapprochements :
1. Chaque agrégat citoyen doit être rattaché à des composantes de la comptabilité nationale (dépenses : COFOG/CFAP ; recettes : SEC 2010 et détail des impôts), sans compter deux fois une même dépense ou recette.
2. Le total des agrégats doit retrouver les **comptes publics APU consolidés** de l'année de référence ; une ligne d'ajustement technique ne remplace **pas** la justification économique des sous-postes.

Les sous-thèmes « Retraites et pensions », « Famille et enfance », « Chômage et insertion » et « Solidarité et autonomie » forment ensemble une ventilation citoyenne de la protection sociale. Il ne faut jamais ajouter ces quatre lignes à leur parent « Protection sociale ». Les dépenses de santé sont distinctes : les soins relèvent de la fonction Santé, les indemnités journalières de la protection sociale selon la convention INSEE.

### Cas particulier : aides aux entreprises

« Soutien public aux entreprises » distingue :
- les **dépenses budgétaires directes**, à isoler des « Affaires économiques » sans double compte ;
- les **avantages fiscaux** et les **allègements de cotisations**, suivis séparément comme *manques à gagner* et déjà reflétés dans les recettes nettes de référence.

La ligne de **30 Md€** initialement isolée est une **enveloppe pédagogique, et non le montant officiel de l'ensemble des aides aux entreprises**. Les avantages fiscaux (49,7 Md€) et sociaux (69,1 Md€) présentés à titre complémentaire proviennent du « jaune » budgétaire PLF 2027, avec données **2024**. La modification d'un manque à gagner provoque un effet **strictement comptable** dans le simulateur, pas une prévision de rendement fiscal réel. Source : [Jaune budgétaire Aides publiques aux entreprises](https://www.budget.gouv.fr/documentation/file-download/34471).

## 3. Deux façons de présenter un budget politique : agrégats ou mesures partielles

L'objectif de Mon Budget Citoyen est de **restituer fidèlement et de façon attribuable les engagements chiffrés d'un parti**, et non de certifier leur faisabilité économique. Le mode d'intégration dépend des **données que le parti publie**, jamais de son identité.

### Cas A — Budget globalement chiffré : agrégats sourcés prioritaires

Si un programme publie, pour **une même année et un même périmètre**, les **deux masses de recettes et de dépenses**, pour lesquelles le moteur calcule le solde par différence, la restitution du budget utilise directement **ces agrégats revendiqués**. La source, le millésime, l'unité, le caractère **total ou variation** doivent être explicites ; un solde distinct publié est facultatif (et contrôlé s'il existe). **Ce jeu d'agrégats suffit** : les mesures détaillées peuvent être listées et vérifiées, mais n'ont pas à être qualifiées une à une pour restituer le résultat annoncé, et ne sont surtout **pas ajoutées une seconde fois**.

- Si la source annonce des **variations** de recettes et dépenses : recettes présentées = recettes de référence INSEE + variation annoncée ; dépenses présentées = dépenses de référence INSEE + variation annoncée ; amélioration du solde = variation de recettes − variation de dépenses.
- Si la source annonce des **totaux APU absolus**, de périmètre compatible : les totaux publiés sont présentés directement et leur différence donne le solde. Ne pas prendre une variation pour un total.
- Le résultat affiché doit être nommé **« solde revendiqué par la formation »** et accompagné de la source. Il n'est **pas** une certification ni une expertise indépendante de la politique annoncée.

**Exemple LFI 2027** : le [contre-budget officiel, bilan p. 14](https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf) revendique **106,4 Md€ de recettes nouvelles** et **81,7 Md€ de dépenses nouvelles**. Soit **24,7 Md€ d'amélioration annoncée du solde**, appliqués à la référence INSEE dans notre présentation mécanique. Ces montants sont des **variations**, pas les masses totales de recettes et dépenses des administrations publiques. Les mesures détaillent l'annonce ; elles peuvent être de simples **déclarations qualitatives d'impacts sourcées, sans montant individuel**, et ne sont jamais ajoutées aux 106,4 / 81,7 Md€.

**Un budget chiffré globalement est donc plus simple à intégrer qu'un budget partiel** : deux montants sourcés et leur différence calculée, un périmètre, une année et une source suffisent à restituer l'annonce.

### Cas B — Budget partiellement chiffré : INSEE + variations des mesures

Si le couple d'agrégats recettes/dépenses n'est **pas** publié de manière suffisamment précise et comparable, le simulateur conserve la **référence INSEE** pour les postes sans mesure et n'applique que les **variations chiffrées, sourcées et imputables** des mesures disponibles. Le résultat s'intitule **« simulation partielle à partir des mesures disponibles »**, pas bilan officiel intégral du parti. Le calcul ne doit pas être présenté comme un jugement sur l'ensemble du programme.

**Exemple** : une mesure de dépenses de santé +3 Md€ documentée, sans autres agrégats globaux, conserve toutes les autres recettes et dépenses à leur niveau INSEE et augmente mécaniquement les dépenses de 3 Md€. Aucune ligne fictive ne complète le programme : les éventuelles lignes techniques d'ajustement appartiennent à la **ventilation de référence**, pas aux mesures manquantes.

### Règle commune de prudence

Aucun de ces deux modes ne prouve la faisabilité, l'effet macroéconomique réel ou la cohérence économique des annonces. On distingue **l'attribution du chiffrage au parti**, **la restitution arithmétique de son solde** et **la validité économique de ses hypothèses**. La trajectoire jusqu'en 2032 reste mécanique et illustrative, même quand le montant de départ reproduit fidèlement un agrégat sourcé.

## 4. Des mesures politiques aux écritures budgétaires

« Pouvoir d'achat », « immigration » et « écologie » sont des thèmes politiques, pas des postes comptables. Une mesure peut affecter plusieurs agrégats. Le moteur comptable `src/projection.ts` traduit les mesures en variations de recettes et dépenses et contrôle le rapprochement arithmétique. Les services `src/engine/accounting.ts`, `simulation.ts` et `impact.ts` organisent le calcul et la trajectoire.

Un montant **revendiqué par un parti** ne devient pas une expertise indépendante du seul fait qu'il est intégré au simulateur. Certaines mesures sont des **illustrations fictives** ; les contre-budgets 2026 répondent à un autre projet de loi que les comptes APU exécutés de 2025. **En mode AGGREGATE**, les montants sont les engagements globaux publiés pour le périmètre annoncé ; **en mode PARTIAL**, seuls les impacts des mesures disponibles sont simulés. Leur affichage doit permettre de distinguer ces deux situations sans ambiguïté.

**Exemple :** une baisse de TVA de 10 Md€ baisse les recettes de 10 Md€ et augmente le déficit de 10 Md€ **à effets indirects constants**. L'écart de ventilation nul prouve seulement l'égalité comptable.

## 5. Projections et limites

La trajectoire V1 prolonge de manière **mécanique** le déficit de référence 2025 en ajoutant **2,5 % de sa valeur initiale par année**, sans intérêts composés. À partir de 2027, elle applique un effet budgétaire annuel constant du scénario jusqu'en 2032. **Ce n'est ni une prévision économique ni un programme gouvernemental validé.** Les conséquences indirectes sur croissance, emploi, salaires, inflation, fiscalité ou dette ne sont pas actuellement calculées par un modèle causal.

Les budgets citoyens sont des scénarios personnels, pas des lois de finances. La publication et le vote ne valent ni certification économique ni scrutin représentatif. Une révision du référentiel doit préserver le contexte des anciens budgets publiés, notamment les montants de référence utilisés à leur création.

### Lecture des labels de projection en 2032

Les **labels de trajectoire** synthétisent deux faits calculés : (1) le niveau du **déficit projeté en 2032** comparé au déficit de **référence projeté en 2032** et (2) la pente du déficit du scénario **de 2027 à 2032**, après l'application initiale des mesures. Un déficit positif plus élevé est moins favorable. Un écart ponctuel lors de l'application en 2027 n'est pas une pente descendante. Les écarts insignifiants (seuil de 0,1 Md€, configurable) ne donnent pas lieu à une différence artificielle.

| Label public | Couleur | Définition exacte |
| --- | --- | --- |
| **Redressement** | Vert | Déficit 2032 inférieur à la référence **et** trajectoire 2027–2032 stable ou descendante |
| **Amélioration relative** | Orange | Déficit 2032 inférieur à la référence **mais** trajectoire 2027–2032 encore montante |
| **Dégradation** | Rouge | Déficit 2032 supérieur à la référence, **quelle que soit la pente** ; ou déficit égal à la référence avec trajectoire montante |
| **Non qualifié** (cas de bord) | Gris | Série insuffisante ou égalité à la référence sans trajectoire montante ; aucun redressement présumé |

Le budget **de référence** appartient à « Dégradation » tant que sa projection est montante. Une **amélioration relative** n'implique pas que le déficit baisse. À l'inverse, une trajectoire descendante qui demeure au-dessus de la référence est classée « Dégradation » : l'écart à la référence en 2032 est prioritaire. Ces labels ne sont **ni un vote politique ni une prédiction** : ils décrivent le modèle mécanique annoncé ci-dessus.

Le chiffre « **déficit évité** » ou « **déficit supplémentaire** » est **distinct** de la qualification : il mesure exclusivement l'écart entre scénario et référence **à l'horizon 2032**. « Même déficit que la référence » signale un écart nul à la précision affichée.

### Autres labels de l'application — ne pas les confondre

Les **statuts documentaires** décrivent l'état de vérification et de restitution du contenu, **pas** son impact budgétaire. Ils s'appliquent à un budget de parti ou citoyen lorsque la donnée correspondante est renseignée :

| Label documentaire | Signification |
| --- | --- |
| **Non vérifié** | Budget publié sans vérification documentaire indépendante |
| **En préparation** | Collecte ou rapprochement des données encore en cours |
| **Complet** | Propositions intégrées sur le périmètre annoncé, restitution restant à contrôler |
| **À confirmer** | Restitution prête à être soumise à la formation politique, sans confirmation reçue |
| **Confirmé** | Fidélité documentaire explicitement confirmée par la formation, preuves requises ; ne garantit pas la faisabilité |

Les mentions **« budget global / agrégats »** et **« simulation partielle »** décrivent le **mode de restitution** expliqué à la section 3. Elles ne constituent pas un classement de qualité économique. Les **statuts de publication** et les **votes citoyens** sont des dimensions séparées, sans effet sur les trois qualifications de projection.

## 6. Comment vérifier les chiffres

L'inventaire et les contrôles sont publics :
- [Audit des agrégats citoyens et sources](audit-fiabilisation-agregats-2026-11.md)
- [Rapprochement avec les dernières publications INSEE](rapprochement-insee-dernieres-donnees-2026-11.md)
- [Table de correspondance des 25 agrégats](../data/audit-agregats-citoyens-2026-11.csv)
- [Suivi des corrections](https://github.com/dsissoko/france-budget/issues/58)

### Registres publics des propositions politiques

Les sources et les inventaires de travail sont consultables directement dans GitHub. **Une mesure inscrite dans un inventaire n'est pas nécessairement intégrée au simulateur ni validée sur le périmètre consolidé APU.** Les regroupements servent à limiter le nombre de propositions affichées, sans perdre le détail documentaire.

- [Registre ouvert des formations et de leurs sources](../data/programmes/registre-partis-sources-2026-11.csv) : permet de suivre les publications disponibles, y compris les programmes incomplets.
- [RN 2026 — inventaire des 75 lignes](../data/programmes/rn-contre-budget-2026-inventaire.csv) et [regroupement en neuf propositions](../data/programmes/rn-2026-regroupement-9-propositions.csv).
- [LFI 2026 — inventaire préliminaire](../data/programmes/lfi-contre-budget-2026-inventaire-preliminaire.csv) et [regroupement préliminaire en huit propositions](../data/programmes/lfi-2026-regroupement-8-propositions-preliminaire.csv).
- [Équinoxe 2027 — regroupement préliminaire en huit propositions](../data/programmes/equinoxe-2027-regroupement-8-propositions-preliminaire.csv).
- [Les Républicains — fiches chiffrées 2032, inventaire préliminaire](../data/programmes/lr-2032-fiches-inventaire-preliminaire.csv) : montants de fin de trajectoire, chevauchements à neutraliser avant tout calcul.
- [Suivi de la fidélité des budgets politiques](https://github.com/dsissoko/france-budget/issues/59).

Leur publication garantit la **traçabilité et la possibilité de vérification**, pas la certification des montants ou des effets économiques. Les programmes partiels sont inclus suivant les mêmes critères documentaires, sans classement politique.

La base opérationnelle est **Neon PostgreSQL**, servie par `GET /api/reference`. Le fichier historique `src/data.ts` n'est pas le référentiel à auditer en production ; il demeure une dépendance technique du moteur à supprimer lors de l'externalisation complète.


## Évolution interne V2 — causalité macroéconomique conditionnelle (non implémentée)
**Principe :** une proposition peut modifier des indicateurs macroéconomiques selon des hypothèses **attribuées, sourcées et versionnées** ; ces variations peuvent ensuite produire des impacts budgétaires indirects.

Chaîne : `PoliticalMeasure -> (DirectBudgetEntries, MacroEffects) -> MacroContext -> IndirectBudgetEntries -> BudgetScenario`.

- `MacroContext` : année, scénario, valeur initiale et valeur simulée, unité, source et incertitude de chaque indicateur.
- `MacroImpactRule` : relation causale conditionnelle propre à une proposition ou famille de propositions, avec version et hypothèses du porteur.
- `BudgetProjectionRule` : traduction des impacts directs et macroéconomiques en écritures canoniques, avec origine et dédoublonnage.

**Cas illustratif :** un parti peut supposer qu'une restriction migratoire réduit le chômage. Il faut enregistrer cette hypothèse comme celle du porteur, sans la traiter comme une relation économique démontrée. L'effet réel dépend de la population active, de la structure des emplois, des qualifications et de la demande de travail. Une baisse du taux de chômage ne suffit pas à calculer les économies d'indemnisation.

**Conditions de mise en œuvre :** relations sourcées, plages d'incertitude, tests de sensibilité, calcul pluriannuel, traitement explicite des interactions et absence de double comptage. Introduire les relations une par une, sans modèle macro généraliste ni changement d'interface V1.

Voir aussi [les règles de projection](./projections.md).


## Réintégration de tous les programmes — issue #92

La collecte durable et réutilisable est disponible dans `data/programmes/registre-programmes.csv` et dans chaque dossier `data/programmes/<code>/<millesime>/` contenant `sources.csv`, `themes.csv`, `mesures.csv` et `agregats.csv`. Les mesures documentaires sont conservées dans les CSV même lorsqu'elles ne sont pas importées en base. **La transcription peut être partielle** : le registre indique ce qui est exploitable ou bloqué.

Le mode `AGGREGATE` charge **uniquement les deux masses financières revendiquées et les thèmes sourcés dans Neon** ; aucune mesure individuelle n'est intégrée. Le mode `PARTIAL` charge les thèmes et uniquement les mesures comptables chiffrées, sourcées et qualifiées ; en l'absence d'une telle mesure, la page reste documentaire. Les anciennes mesures ont d'abord été archivées en CSV et dans les tables de sauvegarde Neon `issue92_archive_*`.

`npm run test:programmes` valide et affiche la couverture sans se connecter à Neon. Après la migration sauvegardée `db/migrations/20261120_issue92_reversible_reset.sql`, l'importation peut être rejouée avec `DATABASE_URL=... node scripts/import-programmes.mjs --apply`. Le script est **en lecture seule par défaut** et ne réextrait pas les PDF. La version des sources est suivie par Git.
