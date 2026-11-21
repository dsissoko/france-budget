# Changelog

## [1.1.0](https://github.com/dsissoko/france-budget/compare/v1.0.0...v1.1.0) (2026-11-21)


### Features

* accordéon Mon Budget et lecture des propositions dans Voter ([#106](https://github.com/dsissoko/france-budget/issues/106)) ([e49f433](https://github.com/dsissoko/france-budget/commit/e49f433a9a148c481c35707d743f4e4b450ab640))
* **data:** activer six mesures LFI 2027 par écritures APU génériques ([#87](https://github.com/dsissoko/france-budget/issues/87)) ([e90e88a](https://github.com/dsissoko/france-budget/commit/e90e88aaeecc23d7ca30e0e564d5b9636d20fb27))
* **data:** intégration best effort des programmes, thèmes et agrégats sourcés ([#92](https://github.com/dsissoko/france-budget/issues/92)) ([#93](https://github.com/dsissoko/france-budget/issues/93)) ([2e31cb0](https://github.com/dsissoko/france-budget/commit/2e31cb0b5e0190873a0b2ae62626a25e9d502983))
* **data:** inventorier les 28 mesures chiffrées du contre-budget LFI 2027 ([#85](https://github.com/dsissoko/france-budget/issues/85)) ([85ac340](https://github.com/dsissoko/france-budget/commit/85ac3402f471e5e8f3a7eba58e081034da3d1c13))
* **issue-22:** drive application projection from versioned Neon parameters ([9d23c84](https://github.com/dsissoko/france-budget/commit/9d23c84598c3ec550eb816dab349897f3caf565b))
* **issue-22:** expose versioned simulation parameters from Neon ([f455045](https://github.com/dsissoko/france-budget/commit/f455045f29e7d4111eb5633415e5ca944eb4be48))
* **issue-22:** inject configurable assessment thresholds ([c325c25](https://github.com/dsissoko/france-budget/commit/c325c25a5cf83dcc1fe1c5049e2c40f78af2238c))
* **issue-22:** inject Neon simulation assumptions into pure TS engine ([705c703](https://github.com/dsissoko/france-budget/commit/705c703631c21642cd6564ba0dd8852e3ccaf76c))
* **issue-22:** pass Neon assessment thresholds to simulation engine ([1f057b0](https://github.com/dsissoko/france-budget/commit/1f057b04a452f2068ce3a4fe0d35f346c9dc98ba))
* **issue-22:** seed versioned qualification thresholds in Neon ([1b6d1c0](https://github.com/dsissoko/france-budget/commit/1b6d1c0c78aee1b0116b0cf8a2b2574c5c6203b0))
* **issue-22:** validate and expose Neon assessment thresholds ([60c7ba9](https://github.com/dsissoko/france-budget/commit/60c7ba961f5deecbbb940135312710a7493565ef))
* **issue-22:** versioned Neon simulation parameters schema and seed ([d7df8bb](https://github.com/dsissoko/france-budget/commit/d7df8bb7641c0f309083b081da88ac83bcfaa885))
* listes compactes et défilantes des mesures ([#104](https://github.com/dsissoko/france-budget/issues/104)) ([960a32f](https://github.com/dsissoko/france-budget/commit/960a32f862ebe17fdd04999254a4d4dbb8f6d552))
* publier une empreinte SHA-256 du référentiel Neon ([d520b06](https://github.com/dsissoko/france-budget/commit/d520b06579ca85054b8a1c6f2bcc157e87fd96ce))
* refondre les propositions citoyennes ([#102](https://github.com/dsissoko/france-budget/issues/102)) ([39fffa4](https://github.com/dsissoko/france-budget/commit/39fffa45511852184020d058f5e7e23563e706fc))
* tracer l'empreinte de référence dans les publications et exports ([7f0b0d6](https://github.com/dsissoko/france-budget/commit/7f0b0d6765a40ccbc396095ecbb8d53ae3bdf039))


### Bug Fixes

* afficher les quatre onglets sur une ligne à toute largeur ([21fb66f](https://github.com/dsissoko/france-budget/commit/21fb66f10f10d60512920902b7e0231891747884))
* afficher les quatre onglets sur une ligne en responsive ([c3970f5](https://github.com/dsissoko/france-budget/commit/c3970f5489d130f52e67b6cb58191af42bf64205))
* afficher toutes les propositions documentaires LFI dans Comparer et Voter ([#84](https://github.com/dsissoko/france-budget/issues/84)) ([6d0bb1f](https://github.com/dsissoko/france-budget/commit/6d0bb1f0713fd34e324b91c6f54e5e708577cf99))
* bloquer tout scénario si une mesure Neon est invalide ([6a44f51](https://github.com/dsissoko/france-budget/commit/6a44f517baa7ee366b646b3078af1306a38b6430))
* **comparer:** sélection libre des budgets A et B ([#98](https://github.com/dsissoko/france-budget/issues/98)) ([#99](https://github.com/dsissoko/france-budget/issues/99)) ([3846277](https://github.com/dsissoko/france-budget/commit/3846277a8437a9841700492daba71ca5f876e0f4))
* **compare:** show saved presentations and only available measures after A/B summary ([#96](https://github.com/dsissoko/france-budget/issues/96)) ([#97](https://github.com/dsissoko/france-budget/issues/97)) ([54bfaea](https://github.com/dsissoko/france-budget/commit/54bfaeac6a3a2074fdaa1afaec70e703060b1347))
* contrôler le format de l'empreinte de référence publiée ([774ae31](https://github.com/dsissoko/france-budget/commit/774ae3153be0ccdea56d2bbc1a82f419905b0cb4))
* **engine:** priorité aux agrégats officiels sourcés, sinon référence INSEE et deltas ([#90](https://github.com/dsissoko/france-budget/issues/90)) ([46c50af](https://github.com/dsissoko/france-budget/commit/46c50afa78910c794f50ed77f0c4e7e16c841509))
* éviter le crash React avant chargement asynchrone du référentiel Neon ([03bba3f](https://github.com/dsissoko/france-budget/commit/03bba3f94e7726589feba22b5499c62a152210e1))
* interdire le repli statique des mesures Neon ([15b5de6](https://github.com/dsissoko/france-budget/commit/15b5de691a171988ffe835dcdd5c022c027fa8fa))
* interdire le repli statique des mesures Neon ([96cdc7c](https://github.com/dsissoko/france-budget/commit/96cdc7c4179d921ce083b8ae3e8b05e1cd7a8903))
* interdire le repli statique des mesures Neon ([f13991a](https://github.com/dsissoko/france-budget/commit/f13991a0c37c9800695815a1b05b377228955ef1))
* **issue-22:** forbid legacy fixture fallback in browser calculations ([01e298e](https://github.com/dsissoko/france-budget/commit/01e298eaf69463d5af2d7e17461405fd3a3ee285))
* **issue-22:** preserve legacy fixture calendar for tests ([0c0e183](https://github.com/dsissoko/france-budget/commit/0c0e183b52758e61214cd7e8b957f872984781b8))
* **issue-22:** remove production fallback to historical static reference ([fb4427e](https://github.com/dsissoko/france-budget/commit/fb4427e26724f0816a7cfd432a5dc8637bfca8a0))
* **issue-22:** supply explicit empty overrides to Neon projection core ([96ae3fe](https://github.com/dsissoko/france-budget/commit/96ae3fe67c8f5186349d4fee9cd3d126d2ce757c))
* **issue-22:** use actual Neon enterprise-support category for pedagogical amount ([fecb37e](https://github.com/dsissoko/france-budget/commit/fecb37e7b0fd462198a193308506c4bae0c08869))
* **issue-22:** use Neon projection parameters for vote badges ([37c2cd7](https://github.com/dsissoko/france-budget/commit/37c2cd77656e935c9323fb2391a2906f986d841c))
* **issue-22:** use Neon reference year for publication and vote projection ([fca675e](https://github.com/dsissoko/france-budget/commit/fca675e7b4b69443710afce2f9173bef83f48f13))
* **moteur:** permettre la validation APU mesure par mesure, sans bloquer un groupe entier ([#86](https://github.com/dsissoko/france-budget/issues/86)) ([60d5d92](https://github.com/dsissoko/france-budget/commit/60d5d921597c3c39bcf1bdb13dc92c8dfeabf1c3))
* restore budget presentation and measures with aggregate inheritance ([#94](https://github.com/dsissoko/france-budget/issues/94)) ([9054837](https://github.com/dsissoko/france-budget/commit/9054837b9fd647138b831f2f34d737d1d7756906))
* retirer les labels A/B redondants du comparateur ([#101](https://github.com/dsissoko/france-budget/issues/101)) ([13c9216](https://github.com/dsissoko/france-budget/commit/13c9216c97034340161a3eb3f89cf8e0dd52b684))
* sécuriser le contrat comptable Neon sans repli statique ([32495ad](https://github.com/dsissoko/france-budget/commit/32495ad7f1352cb3eeea3331002a8b91018142f4))
* typer explicitement les montants du référentiel API ([2939a47](https://github.com/dsissoko/france-budget/commit/2939a473a1526dc1ac93190d1d66c4f0b7b62f36))
* **ui:** en mode agrégats afficher les mesures comme déclarations sourcées ([#91](https://github.com/dsissoko/france-budget/issues/91)) ([5199c55](https://github.com/dsissoko/france-budget/commit/5199c55a9072b3c7c5b8c73aa361c11ff38ca557))
* **ui:** éviter les doublons entre mesures calculées et propositions documentaires ([#88](https://github.com/dsissoko/france-budget/issues/88)) ([55a8369](https://github.com/dsissoko/france-budget/commit/55a8369c168ea66f2f190415cc446552d0cb3f92))
* valider les catégories et montants APU dès la lecture Neon ([465074f](https://github.com/dsissoko/france-budget/commit/465074f167dccfe0ff01c2e476fd1ed393c9f30a))
