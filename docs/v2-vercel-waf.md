# WAF Vercel Hobby — stratégie sans régression V1

**Cette documentation n'active rien. Aucune configuration Vercel ou règle WAF de production n'est modifiée par la PR.**

## Portée strictement V2

La V1 utilise notamment `/api/budgets`, `/api/votes`, `/api/reference` et `/api/share/*`. Elle doit rester intégralement fonctionnelle. **Ne jamais appliquer une règle `/api/*` ni une règle globale**, et ne pas activer de changement de WAF sur le projet de production sans validation distincte.

Vercel Hobby dispose d'outils de Firewall/WAF, de limitation de débit sous quotas du plan et de protection des déploiements Preview. Vérifier les fonctionnalités et quotas disponibles au moment de la configuration sur le compte. Les règles sont **configurées au niveau du projet Vercel** : une règle Preview mal ciblée peut donc affecter la production.

**Politique envisagée (non activée)** :
- `GET /api/v2/*` public.
- `POST /api/v2/budgets` : seule route de création citoyenne publique ; validation serveur stricte + limitation de fréquence spécifique.
- `PATCH /api/v2/budgets/:key` et `DELETE /api/v2/budgets/:key` : en plus des protections anti-abus, requièrent une clé d'édition opaque remise à la création. Aucun compte citoyen requis.
- Écritures sur les budgets de partis : **import administratif uniquement**, pas de droit API public.
- Le contrôle d'en-tête `Origin` / CORS n'est qu'une défense complémentaire, pas une authentification. Un secret intégré dans le JavaScript public (`VITE_*`, header constant) n'est jamais secret.
- Les identifiants Neon `V2_DATABASE_URL` restent secrets **sur le serveur**, sans repli sur `DATABASE_URL` V1.
- Un challenge WAF appliqué à une API JSON peut retourner de l'HTML à `fetch` : ne pas activer par défaut sans recette dédiée.

## Procédure de déploiement WAF (étape séparée)

1. **Aucune règle de production avant validation explicite.**
2. Préférer un **projet Vercel QA distinct**. Si Preview partage le projet Vercel, imposer `Environment=Preview` et des correspondances exactes de chemin et méthode.
3. Tester en observation/log uniquement ; évaluer les faux positifs. Ne viser que `POST /api/v2/budgets`, `PATCH/DELETE /api/v2/budgets/:key` (si la méthode est disponible dans les conditions du WAF).
4. Tester GET/POST de la V1, votes, partage et chargement UI avant **et** après toute modification ; s'assurer que `/api/*` et les GET V2 ne sont pas ralentis ni bloqués.
5. Conserver une capture de la configuration initiale et le rollback exact. Désactiver immédiatement la seule règle V2 en cas de régression.
6. Activer sur la production seulement après vérification de l'isolation et validation du périmètre. **Ne pas piloter ce changement par la CI de l'application**.

## Scénarios de recette minimaux

| Requête | Attendu |
| --- | --- |
| GET /api/budgets (V1) | Inchangé |
| POST /api/budgets (V1) | Inchangé |
| POST /api/votes (V1) | Inchangé |
| /api/reference, /api/share/:id, /b/:id (V1) | Inchangé |
| GET /api/v2/budgets (V2) | Public, inchangé |
| POST /api/v2/budgets | Autorisé après validation serveur, limité en fréquence si règle activée |
| PATCH/DELETE /api/v2/budgets/:key sans clé | 403 |
| PATCH/DELETE avec clé valide + révision | Autorisé, soumis à validations |
| POST politique via API citoyenne | 400/403 |

Documentation officielle :
- https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules
- https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
- https://vercel.com/docs/deployment-protection

**Pas de secret partagé public UI↔Vercel** : la clé d'édition est propre à un seul budget et n'est connue que du visiteur qui l'a créé. Pour un budget perdu, la récupération nécessitera un parcours spécifique, non prévu dans ce lot.
