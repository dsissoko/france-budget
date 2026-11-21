# Identité du déploiement

L’en-tête affiche l’identité du **code réellement compilé**, et non la valeur potentiellement anticipée de `package.json` ou du manifeste Release Please.

- **Avant la première release GitHub publiée** : `build a3f92b1`.
- **Commit d'une GitHub Release officielle** : `v1.1.0 · a3f92b1`.
- **N commits après une GitHub Release officielle**, si l’ascendance GitHub est confirmée : `v1.1.0+3 · b82d41c`. Le suffixe `+3` est une *distance Git affichée dans l’UI*, pas une version SemVer.
- **SHA inconnu** : `build inconnu`.
- **GitHub indisponible / historique non vérifiable** : `build <sha>`. Aucune version officielle n'est inventée.

## Fonctionnement

`vite.config.ts` injecte `__BUILD_METADATA__` lors de la compilation.

1. Le SHA est lu dans `VERCEL_GIT_COMMIT_SHA`, puis `GITHUB_SHA`, puis `git rev-parse HEAD`.
2. Sur Vercel, `scripts/build-identity.mjs` consulte l'API GitHub publique (GitHub Releases, puis compare tag→SHA). Une release n’est acceptée que si elle est publiée (ni brouillon ni prerelease) et si son tag est identique au commit compilé ou son ancêtre.
3. Si cette preuve manque, seul le SHA est affiché. Les appels réseau sont limités dans le temps.
4. Le SHA est lié au commit GitHub. Le navigateur n'effectue aucun appel à l'API GitHub.

Variables facultatives : `VERCEL_GIT_REPO_OWNER`, `VERCEL_GIT_REPO_SLUG`, `GITHUB_TOKEN` (utile pour éviter les limites de l'API GitHub ; jamais exposé au navigateur). En local, la vérification des releases est désactivée par défaut ; `CHECK_GITHUB_RELEASES=1 npm run build` l'active.

**Important :** l'identité est figée au build. Publier une release après le déploiement ne modifie pas rétroactivement l'application déjà construite. Pour afficher le nouvel identifiant, il faut déployer à nouveau.

## Vérifications

`npm test` couvre absence de release, release publiée, distance en commits, releases ignorées, erreur réseau et SHA invalide.

La version de `package.json` n'est pas modifiée par cette fonctionnalité ; Release Please conserve la responsabilité des versions et des tags.
