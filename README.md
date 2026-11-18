# France Budget

[![Statut du site sur Vercel](https://img.shields.io/website?url=https%3A%2F%2Fmon-budget-citoyen.vercel.app&label=Vercel&logo=vercel&logoColor=white)](https://mon-budget-citoyen.vercel.app)

**Application en ligne : [Mon Budget Citoyen](https://mon-budget-citoyen.vercel.app)**

Un simulateur citoyen open source pour **comprendre**, **comparer** les propositions politiques et **construire son propre budget**.

> **V1 de démonstration** : les agrégats utilisés dans l'interface sont fictifs et ne représentent pas l'exécution réelle 2025. Les mesures sont des illustrations thématiques et ne constituent pas des chiffrages validés des partis.

## Vision
Voir [docs/vision.md](docs/vision.md).

## Lancer localement
```bash
npm install
npm run dev
```
Vérifier : `npm run check && npm run build`.

## Architecture
- Vite + React + TypeScript + CSS léger + Recharts + Lucide.
- Données mockées et catégorisées : `src/data.ts`.
- Simulateur interactif sans serveur ; réglages citoyens enregistrés localement.
- Nomenclatures canoniques illustratives accessibles dans « Mon budget ».
- Aucune donnée personnelle collectée.

## CI/CD
GitHub Actions réalise le typecheck et la compilation. Vercel est connecté nativement à ce dépôt : chaque push sur `main` déclenche la production, chaque pull request une preview. Aucun secret ou token de déploiement dans GitHub Actions.

## Feuille de route
1. Intégrer comptes publics Insee 2025 complets et rapprochements vérifiés.
2. Indexer des contre-budgets sourcés RN, LFI, Horizons, avec métadonnées et statut du chiffrage.
3. Ajouter un modèle de correspondance fiable COFOG/SEC 2010/LOLF, par périmètre.
4. Documenter hypothèses macroéconomiques, incompatibilités et recouvrements de mesures.
5. Ajouter des tests de données, accessibilité et parcours mobile.

## Licence
MIT. Les données et documents tiers restent sous leurs licences respectives.
