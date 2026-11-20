# Publication des versions — Mon Budget Citoyen

## Doctrine

- M1 correspond à `v1.1.0`, M2 à `v1.2.0`, jusqu'à M8 à `v1.8.0` ; un changement majeur nécessite une décision explicite.
- Les correctifs peuvent utiliser `PATCH` entre deux jalons.
- Les titres des PR squashées et les commits respectent [Conventional Commits](https://www.conventionalcommits.org/fr/v1.0.0/).
- **Release Please ne connaît pas les jalons GitHub** : les numéros de versions ne sont donc pas automatiquement garantis par les commits.

## Initialisation M1

- Le manifest est initialisé à `1.0.0` comme base de calcul (ce n'est pas une release publiée).
- `release-as: 1.1.0` force la **première proposition** de version M1 ; le `package.json` actuel reste en `0.1.0` jusqu'à la PR de release.
- **Ne pas déclencher** le workflow tant que M1 n'est pas validé. Il est volontairement limité à `workflow_dispatch`.
- Vérifier le contenu, les versions et le changelog de la PR proposée, puis valider sa fusion séparément.
- Après la première publication, retirer `release-as` dans une PR dédiée pour éviter de forcer à nouveau `1.1.0`.

## Jalons suivants

- À la clôture de chaque jalon, cadrer explicitement la version attendue et, si nécessaire, utiliser temporairement `release-as` pour la version mineure cible. Une montée mineure générée automatiquement par un `feat:` ne vaut pas validation de jalon.
- Déclencher manuellement **Prepare release (manual)** pour préparer ou finaliser la release GitHub, selon l'état de la PR Release Please.
- Le workflow peut créer un tag et une GitHub Release après fusion de sa PR ; **ne pas l'exécuter pour la deuxième fois sans validation de cette publication**.
- Les tags et GitHub Releases sont distincts des déploiements Vercel. Vérifier les déclencheurs Vercel et les protections de production avant toute fusion ou publication.
- Le jeton `GITHUB_TOKEN` peut nécessiter l'autorisation de créer des PR dans les paramètres Actions du dépôt. Selon les règles GitHub, les PR créées avec ce jeton ne déclenchent pas nécessairement les autres workflows : vérifier explicitement la CI de la PR.

## Vérifications

- La CI contrôle les titres de PR (hors PR de release générées par Release Please), TypeScript, Vitest et le build.
- Le contrôle du titre n'est bloquant pour la fusion que si son statut est déclaré obligatoire dans les protections de branche GitHub.
- Ne jamais fusionner une PR de release ou publier en production sans accord explicite.
