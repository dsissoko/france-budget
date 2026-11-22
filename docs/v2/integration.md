# Intégration et qualification des programmes

```mermaid
sequenceDiagram
    autonumber
    participant D as Source primaire
    participant A as Skill agentique
    participant R as Revue métier
    participant G as Git / CSV
    participant V as Validateur
    participant I as Importeur V2
    participant N as Neon v2
    D->>A: PDF / URL / pages / chiffres
    A->>R: Correspondances, justifications, réserves
    R-->>G: Décisions approuvées
    G->>V: budget.csv, proposals.csv, impacts.csv
    V->>V: Sources, montants, unicité, signes, pivot
    V-->>I: Jeu valide
    I->>N: v2.import_budget(payload)
    N-->>I: UUID stable ou erreur transactionnelle
    I->>N: Vérification de concordance
```

## Source de vérité

- `budget.csv` : identité/version, présentation, documents et agrégats annoncés.
- `proposals.csv` : titre, description, montant revendiqué, statut, URL, année.
- `impacts.csv` : poste citoyen et variation signée *validée* ; un seul impact par budget/côté/poste.
- `scripts/v2/import.mjs` : validation et persistance sans raisonnement agentique.
- `skills/budget-impact-qualification/SKILL.md` : méthode d'analyse des sources et de décision.

## Exigences LFI de la PR #145

```mermaid
flowchart TD
    A["28 lignes sources"] --> B["Qualification des postes"]
    B --> C["Regroupements exclusifs : 11 propositions"]
    C --> D{"Montant ventilable sans hypothèse ?"}
    D -->|Oui| E["Allocation interne aux masses annoncées"]
    D -->|Non| F["Reliquat documentaire non ventilé"]
    E --> G["Agrégat +106,4 / +81,7"]
    F --> G
    G --> H["Solde +24,7, sans double comptage"]
```

L'importeur V2 ne sait pas encore recevoir les fichiers `groupes-citoyens.csv` / `rattachements-citoyens.csv` / `impacts-citoyens.csv` de #145 dans une représentation canonique conservant toutes les sources **et** l'effet AGGREGATE. Il faut adapter le pipeline et tester le calcul avant le cutover. Les revendications ne doivent jamais être dupliquées dans `budget_proposal_impacts` comme deltas additionnels.

## Vérification d'un import

1. Sources CSV distinctes = sources importées, à exclusion documentée près.
2. Aucun poste du même budget attribué deux fois.
3. Allocations + reliquats = montants revendiqués (par côté).
4. Deux exécutions du même import donnent le même résultat logique.
5. L'API et l'UI affichent le même inventaire que la base.
6. Les contributions citoyennes postérieures à la bascule ne sont jamais écrasées par le seed.
