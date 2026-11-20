# LFI — contre-budget 2027 : premier rapprochement documentaire (non certifié)

> **État au 20 novembre 2026 : revue intermédiaire.** Le document primaire a été identifié et son URL canonique retrouvée, mais son contenu PDF intégral n'a **pas pu être téléchargé et relu page par page** depuis cet environnement. Les postes ci-dessous viennent d'une **reprise indépendante**, [L'Avenir en commun — Financement](https://www.lavenirencommun.org/financement/), qui déclare les extraire du PDF officiel. Ne pas les qualifier de « primaire vérifié » avant relecture directe.

## Sources et périmètre

- **Document primaire à confronter :** [La France insoumise / Mélenchon 2027, *Comment nous allons remettre de l'ordre dans les comptes publics*, 14 octobre 2026](https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf).
- Présentation officielle : [site de campagne, Découvrir le programme](https://melenchon2027.fr/programme/decouvrir/).
- **Reprise utilisée pour le premier contrôle :** [tableaux de financement 2027](https://www.lavenirencommun.org/financement/) ; source éditoriale indépendante **non affiliée officiellement**.
- **Périmètre :** orientations budgétaires de la seule année 2027, **pas** le chiffrage intégral du programme présidentiel pluriannuel.
- Conserver séparément l'inventaire LFI **2026** (143 lignes provisoires). **Ne jamais mélanger les deux millésimes**, ni importer ces totaux comme mesures 2026.

## Test de rapprochement des neuf grands blocs documentaires

| Recettes nouvelles 2027 | Md€ |
|---|---:|
| Retour sur les baisses d'impôts depuis 2017 | 44,0 |
| Taxation des très grandes fortunes | 35,0 |
| Fiscalité des grandes entreprises | 16,9 |
| Taxation des opérations financières | 8,5 |
| Lutte contre la fraude fiscale | 2,0 |
| **Total annoncé et recomposé** | **106,4** |

| Dépenses nouvelles 2027 | Md€ |
|---|---:|
| Relance par les revenus populaires | 37,5 |
| Renforcement des services publics | 22,2 |
| Mesures de protection sociale | 12,0 |
| Planification écologique | 10,0 |
| **Total annoncé et recomposé** | **81,7** |

**Solde revendiqué :** 106,4 − 81,7 = **+24,7 Md€ d'amélioration du déficit en 2027**, sous les hypothèses et périmètres revendiqués par la formation. Il ne s'agit ni d'une certification APU ni d'un résultat simulé indépendant.

Le [CSV de rapprochement](lfi-2027-blocs-documentaires-a-verifier.csv) est limité aux **neuf agrégats de présentation**. Ils ne constituent **pas neuf mesures calculables** et ne doivent jamais être additionnés aux mesures élémentaires : éviter tout double compte.

**Hors budget direct APU** : la proposition de **100 Md€ d'investissements annuels via un pôle public bancaire** figure séparément dans la présentation ; ne pas l'ajouter aux 81,7 Md€ de dépenses publiques ou au déficit.

## Questions documentaires à vérifier dans le PDF primaire

1. Exactitude de chaque montant, des titres et du bilan 2027, page et unité.
2. Reconstitution des **lignes individuelles** par bloc, sans ajouter un sous-total à ses composantes.
3. Relation entre les recettes de fiscalité des grandes entreprises, les mesures relatives à la fortune, et les postes anti-fraude : exclusions ou chevauchements documentaires éventuels.
4. Dépenses : distinguer transfert entre administrations, coût budgétaire direct, dépenses de personnel et éventuels effets induits.
5. Cohérence avec l'édition 2027 de *L'Avenir en commun* publiée postérieurement, en conservant la date et la source du contre-budget.
6. Mesures hors APU direct : ne pas assimiler investissement bancaire et dépense publique consolidée.

## Règles proposées pour l'état « À confirmer » (vert documentaire uniquement)

- Périmètre 2027 présenté exactement comme « orientations budgétaires 2027 », **sans prétendre couvrir tout le programme**.
- Chaque mesure visible doit renvoyer à une référence primaire vérifiée (document, page, année et montant revendiqué), ou être explicitement « non chiffrée / à vérifier ».
- Le total revendiqué 106,4/81,7/24,7 doit être séparé de tout impact **APU calculé**. Aucun solde simulé intégral tant que les mesures comptables ne sont pas validées.
- Les exclusions manuelles et le statut `non_chiffrable_apu` sont conservés pour les seules mesures documentaires concernées.
- **Le statut `confirme` n'est jamais accordé sans une confirmation vérifiable émanant du parti.**

**État actuel : ces préconditions ne sont PAS encore toutes remplies. Ne pas changer `budgets.maturity_status` dans Neon et ne pas activer de nouvelles mesures à ce stade.**

## Travaux suivant cette revue

- [ ] Télécharger et lire le PDF officiel intégral ; lier les montants à leurs pages exactes.
- [ ] Extraire les ~28 postes individuels du document (nombre avancé par la reprise, à valider sur source), vérifier les sommes et sous-totaux.
- [ ] Regrouper pour l'UX existante sans perte de provenance ; ne pas surcharger le moteur avec les lignes agrégées.
- [ ] Enregistrer le millésime 2027 **à part** de 2026 ; stabiliser les identifiants source et groupe.
- [ ] Qualifier les écritures APU sur chaque élément éligible, tester la non-régression avant activation.
- [ ] Procéder à la revue fonctionnelle du statut de maturité documentaire et seulement ensuite envisager « À confirmer ».

Suivi : [Issue #59](https://github.com/dsissoko/france-budget/issues/59) et [Issue #22](https://github.com/dsissoko/france-budget/issues/22).
