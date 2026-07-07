# Journal de board — RATIO

Trace chronologique de l'avancement du board Jira (`RAT`, https://floviret.atlassian.net/jira/software/projects/RAT/boards/35) et des décisions d'organisation du projet. Une entrée par session de travail significative.

Format :
```
## AAAA-MM-JJ
- Ce qui a été fait
- Tickets Jira concernés
- Notes / décisions
```

---

## 2026-07-06

- Connexion du repo local au repo GitHub `Fviret/Ratio` (HTTPS via `gh`, branche `main` trackée sur `origin/main`).
- Connexion vérifiée au projet Jira `RAT` (board 35, floviret.atlassian.net).
- Création du backlog Semaine 1 — Fondations : Epic [RAT-1](https://floviret.atlassian.net/browse/RAT-1), avec 5 tickets priorisés et chiffrés :
  - [RAT-2](https://floviret.atlassian.net/browse/RAT-2) — Repo GitHub + Next.js + TS + Tailwind + shadcn/ui (P0, 0,5 j)
  - [RAT-3](https://floviret.atlassian.net/browse/RAT-3) — Projet Supabase (EU) + schéma DB + pgvector (P0, 1 j)
  - [RAT-4](https://floviret.atlassian.net/browse/RAT-4) — Auth magic link + création d'organisation (P1, 1 j, dépend de RAT-3)
  - [RAT-5](https://floviret.atlassian.net/browse/RAT-5) — CRUD décision manuel (P1, 1,5 j, dépend de RAT-3 et RAT-4)
  - [RAT-6](https://floviret.atlassian.net/browse/RAT-6) — CI GitHub Actions (P2, 0,5 j)
- Note : le projet Jira (team-managed) n'expose pas de champ natif Priorité/Story Points sur ces tickets — priorité et estimation encodées en labels (`priorite-P0/P1/P2`, `estimation-Xj`) et dans la description de chaque ticket.

## 2026-07-06 (suite)

- **[RAT-2](https://floviret.atlassian.net/browse/RAT-2) démarré et complété** : scaffolding Next.js 16 (App Router, TypeScript) + Tailwind CSS v4 + shadcn/ui, géré avec pnpm.
- Décision : upgrade Node 18 → **Node 20** (via nvm, `.nvmrc` ajouté) — requis par le starter et par Next.js 16. Node 20 installé en local sans toucher à l'alias `default` de nvm (scope limité à ce projet).
- Décision : Next.js **16** (dernière version stable) plutôt que la v15 documentée initialement dans `RATIO_STARTER.md` — la doc datait d'avant la sortie de la v16, rien dans la roadmap ne dépend d'une API v15 spécifique.
- Vérifié : `pnpm dev` sert la page par défaut Next.js sans erreur, `pnpm lint` et `tsc --noEmit` passent sans erreur.
- `CLAUDE.md` créé (conventions, stack, structure, règle "commits/PR restent humains").
- Ajout du ticket **[RAT-7](https://floviret.atlassian.net/browse/RAT-7)** — Audit CLAUDE.md (P2, 0,5 j), bloqué par RAT-3/4/5.

## 2026-07-06 (suite 2)

- **[RAT-3](https://floviret.atlassian.net/browse/RAT-3) démarré et complété** : projet Supabase `ratio` créé (région `eu-west-1`, org `Fviret's Org`), connexion via CLI Supabase authentifié avec un Personal Access Token fourni par l'utilisateur (jamais commité).
- Schéma v1 appliqué via migration (`supabase/migrations/20260706150000_init_schema.sql`) : tables `organizations`, `users`, `decisions`, `decision_links`, extension `pgvector`, index `ivfflat` sur l'embedding. Migration confirmée appliquée (`supabase migration list` : local = remote).
- Décision : pas de RLS activée à ce stade — isolation multi-tenant explicitement reportée en phase 2 (voir `RATIO_STARTER.md`). L'application devra filtrer par `org_id` côté code jusque-là.
- `src/lib/supabase.ts` ajouté (client browser + client service_role), dépendance `@supabase/supabase-js` installée.
- `.env.local` renseigné (URL, clé anon, clé service_role, mot de passe DB généré aléatoirement) — non commité. `.env.example` ajouté comme template (exception ajoutée à `.gitignore`).
- Vérifié : `pnpm build` passe (Next.js compile avec `.env.local` chargé), lint et typecheck OK.
- `CLAUDE.md` mis à jour : section Supabase (clients, schéma, convention RLS/org_id, workflow des migrations).

## 2026-07-06 (suite 3)

- **[RAT-4](https://floviret.atlassian.net/browse/RAT-4) démarré et complété** : auth magic link + création d'organisation.
- Restructuration des clients Supabase en `src/lib/supabase/` (`client.ts`, `server.ts`, `admin.ts`, `middleware.ts`) avec `@supabase/ssr` pour une session basée cookies compatible App Router ; suppression de l'ancien `src/lib/supabase.ts` flat.
- `src/proxy.ts` ajouté pour le rafraîchissement de session — Next.js 16 a renommé la convention `middleware.ts` en `proxy.ts` (avertissement de dépréciation détecté et corrigé, voir `node_modules/next/dist/docs`).
- Pages : `/login` (formulaire email, `signInWithOtp`), `/auth/confirm` (route handler, échange du `code` PKCE via `exchangeCodeForSession` — le template email par défaut de Supabase utilise ce flow, pas le `token_hash`/`verifyOtp` initialement supposé), `/onboarding` (créer ou rejoindre une organisation), `/` (dashboard minimal + déconnexion).
- Config Auth Supabase mise à jour via l'API Management (`uri_allow_list` → `http://localhost:3000/**`) pour autoriser la redirection locale.
- **Vérifié en conditions réelles, de bout en bout** : lien magique envoyé à flo.viret@gmail.com, récupéré et lu via l'outil Gmail, lien suivi dans le navigateur de preview, organisation "Ratio Demo" créée et persistée en base (vérifié via l'API REST Supabase), déconnexion et protection de route (`/` → redirection `/login` si non connecté) confirmées.
- `pnpm lint`, `tsc --noEmit` et `pnpm build` passent sans erreur.
- `CLAUDE.md` mis à jour : section Auth (flow magic link/PKCE, rôle du proxy, convention org_id pour les nouvelles routes protégées).

## 2026-07-06 (suite 4)

- **[RAT-5](https://floviret.atlassian.net/browse/RAT-5) démarré et complété** : CRUD décision manuel, sans LLM.
- Routes `src/app/decisions/` : liste (`page.tsx`), formulaire de création (`new/page.tsx`), détail (`[id]/page.tsx`), Server Action `createDecision` (`actions.ts`).
- `src/lib/auth.ts` ajouté (`requireOrgUser`) pour factoriser la récupération utilisateur + `org_id`, réutilisé par les pages decisions.
- Champs du formulaire : titre, contexte, options (texte libre → `options_json.notes`), décision, rationale, décideur, stakeholders (liste séparée par virgules → `text[]`). `org_id` et `created_by` toujours dérivés de la session, jamais du formulaire.
- Deux corrections découvertes en testant dans le navigateur : (1) le composant `Button` shadcn de ce projet est basé sur `@base-ui/react`, pas Radix — pas de prop `asChild` ; les liens stylés comme des boutons utilisent `buttonVariants({...})` en `className` sur `<Link>`. (2) un conteneur `flex flex-col mx-auto max-w-*` sans `w-full` se réduit à son contenu (shrink-to-fit) — corrigé sur `/decisions` et `/onboarding`.
- **Vérifié en conditions réelles** : reconnexion par magic link (nouvel email lu via Gmail), création d'une décision de test via le formulaire, redirection vers la page détail, decision visible dans la liste avec le bon layout. Donnée de test supprimée après vérification (via l'API REST Supabase) pour ne pas polluer la base.
- `pnpm lint`, `tsc --noEmit` et `pnpm build` passent sans erreur.
- `CLAUDE.md` mis à jour : section Décisions (CRUD) — structure des routes, convention `requireOrgUser`, pièges shadcn/Tailwind rencontrés.

## 2026-07-06 (suite 5)

- **[RAT-6](https://floviret.atlassian.net/browse/RAT-6) démarré et complété** : CI GitHub Actions.
- `.github/workflows/ci.yml` : sur chaque PR et push `main` — install (frozen lockfile), `pnpm lint`, `pnpm typecheck` (nouveau script ajouté), `pnpm build`. Pas de step tests dédié — aucun test n'existe encore dans le repo (les evals LLM arrivent en semaine 2).
- `packageManager: pnpm@10.34.4` ajouté à `package.json` pour figer la version utilisée par `pnpm/action-setup` en CI.
- **Décision notable** : le critère "PR bloquée si le workflow échoue" nécessite la protection de branche GitHub, indisponible sur un repo **privé** du plan gratuit (GitHub demande de passer sur Pro ou de rendre le repo public). Après validation explicite, le repo **`Fviret/Ratio` est passé en visibilité publique** pour débloquer cette fonctionnalité gratuitement.
- Protection de branche activée sur `main` via l'API GitHub : le check `ci` est requis avant de pouvoir merger une PR (`required_status_checks.strict = true`), force-push et suppression de branche désactivés.
- Vérifié : premier run du workflow déclenché par le push sur `main`, conclusion `success`.
- `CLAUDE.md` mis à jour : nouvelle section CI (contenu du workflow, protection de branche, note sur la visibilité publique du repo).

## 2026-07-06 (suite 6) — Audit CLAUDE.md (RAT-7)

- **[RAT-7](https://floviret.atlassian.net/browse/RAT-7) démarré et complété** : relecture complète de `CLAUDE.md` face à l'état réel du code (tous les fichiers sous `src/`, `supabase/`, `.github/`).
- **Problème trouvé et corrigé** : `RATIO_STARTER.md` était référencé partout (`CLAUDE.md`, `BOARD_JOURNAL.md`, descriptions Jira) mais n'avait jamais été copié dans le repo — il n'existait que dans les Téléchargements de l'utilisateur. Copié à la racine du repo.
- **Problème trouvé et corrigé** : `src/app/layout.tsx` gardait encore le titre/`lang` par défaut de `create-next-app` ("Create Next App", `lang="en"`) alors que toute l'UI est en français. Corrigé (`title: "RATIO"`, description, `lang="fr"`).
- **Gestion d'erreurs** : ajout de `src/app/error.tsx` (error boundary racine, attention : prop `unstable_retry` et non `reset` en Next.js 16 — vérifié dans `node_modules/next/dist/docs` avant d'écrire le code) et `src/app/not-found.tsx` (404), qui n'existaient pas. Corrigé aussi plusieurs requêtes Supabase qui ignoraient silencieusement `error` et traitaient toute erreur comme "pas trouvé"/"pas d'organisation" (`src/lib/auth.ts`, `src/app/page.tsx`, `src/app/onboarding/page.tsx`, `src/app/decisions/page.tsx`, `src/app/decisions/[id]/page.tsx`) — désormais elles remontent l'erreur (`throw`), capturée par la error boundary, au lieu de masquer une vraie panne DB derrière un comportement "utilisateur sans organisation" ou "404" trompeur.
- **Conventions ajoutées à `CLAUDE.md`** (nouvelle section "Conventions") : langue (code en anglais, tout ce qui est visible par un humain en français), gestion d'erreurs (pattern `throw` + error boundary, pas de retour inline pour l'instant), tests (aucun pour l'instant, volontaire — le premier jeu utile sera les evals LLM de la semaine 2), rappel de vérifier `node_modules/next/dist/docs` avant d'utiliser une API Next.js incertaine (Next 16 est plus récent que l'essentiel des connaissances d'entraînement).
- **Convention ajoutée** : `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` (pas encore utilisées, semaine 2) documentées comme clés côté serveur uniquement, même règle que `SUPABASE_SERVICE_ROLE_KEY`.
- Vérifié : `pnpm lint`, `pnpm typecheck` et `pnpm build` passent ; testé en navigateur avec une session active (titre d'onglet, page 404, liste des décisions) — aucune régression.

## 2026-07-06 (suite 7) — Semaine 2 : backlog + démarrage RAT-9

- Création du backlog Semaine 2 — Extraction LLM : Epic [RAT-8](https://floviret.atlassian.net/browse/RAT-8), avec [RAT-9](https://floviret.atlassian.net/browse/RAT-9) (endpoint `/api/extract`), [RAT-10](https://floviret.atlassian.net/browse/RAT-10) (UI coller un thread), [RAT-11](https://floviret.atlassian.net/browse/RAT-11) (cas limites), [RAT-12](https://floviret.atlassian.net/browse/RAT-12) (jeu d'evals), puis [RAT-13](https://floviret.atlassian.net/browse/RAT-13) (audit avec le subagent `auditeur`), [RAT-14](https://floviret.atlassian.net/browse/RAT-14) (test manuel de fin d'itération) et [RAT-15](https://floviret.atlassian.net/browse/RAT-15) (mise à jour du journal), dans cet ordre de dépendances.
- **[RAT-9](https://floviret.atlassian.net/browse/RAT-9) démarré et complété** : endpoint `POST /api/extract`, protégé (401 si non connecté), qui appelle l'API Anthropic (`claude-sonnet-5` — modèle documenté dans `RATIO_STARTER.md`/`CLAUDE.md`) pour extraire une fiche décision structurée à partir d'un thread brut.
- Choix technique : sorties structurées (`output_config.format` avec schéma JSON strict + `client.messages.parse()`) plutôt qu'un JSON demandé en prose — garantit une réponse conforme au schéma sans parsing fragile. `thinking` désactivé et `effort: "low"` : tâche d'extraction simple, pas besoin de raisonnement approfondi.
- **Bug trouvé et corrigé en testant** : sans `ANTHROPIC_API_KEY` configurée, l'erreur levée par le SDK n'est pas une `Anthropic.APIError` (c'est une erreur de résolution des credentials) — elle traversait donc le `catch` initial et provoquait un crash 500 brut (violation directe du critère RAT-9 "pas de crash silencieux"). Corrigé avec un filet de sécurité générique qui retourne un JSON `{ error }` structuré dans tous les cas.
- **Vérifié en conditions quasi réelles** : `ANTHROPIC_API_KEY` volontairement laissée vide à la demande de l'utilisateur (test de la gestion d'erreur uniquement, pas de l'appel réel) — reconnexion temporaire via le contournement documenté dans `DEV_LOGIN_BYPASS.md` (non commité) pour tester l'endpoint authentifié : texte vide → 400 propre, texte réel sans clé → 500 JSON propre (avant correctif : crash brut). Non-authentifié → redirigé par le proxy (défense en profondeur déjà en place). Contournement supprimé après test.
- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent.
- `CLAUDE.md` mis à jour : nouvelle section "Extraction LLM".

## 2026-07-06 (suite 8) — RAT-10

- **[RAT-10](https://floviret.atlassian.net/browse/RAT-10) démarré et complété** : `src/app/decisions/new/page.tsx` devient un Client Component avec une zone de collage de thread au-dessus du formulaire manuel existant (RAT-5) — extraction via `/api/extract` (RAT-9), pré-remplissage éditable, sauvegarde via la même Server Action `createDecision`. `source_raw` (thread brut) ajouté à l'insertion en base.
- Choix technique : pré-remplissage des champs via `defaultValue` + `key` incrémenté sur le `<form>` après extraction réussie (remount volontaire), plutôt que des champs contrôlés un par un — évite d'ajouter un `onChange` sur les 7 champs, le formulaire reste modifiable normalement après remplissage.
- **Bug trouvé et corrigé en testant** : la page détail décision (`/decisions/[id]/page.tsx`) se réduisait à une largeur de 32px — même famille de piège que documenté (`mx-auto max-w-*` sans `w-full`), mais ici le conteneur n'est pas lui-même `flex` ; c'est son parent (`<body>`, `flex flex-col` dans `layout.tsx`) qui le transforme en item flex, et les marges `auto` interagissent avec l'alignement flex au lieu de centrer un bloc pleine largeur. `CLAUDE.md` généralisé : ajouter `w-full` à tout conteneur `mx-auto max-w-*` de page, flex ou non.
- **Vérifié en conditions quasi réelles** : reconnexion temporaire via le contournement documenté (nettoyé après usage) — sans `ANTHROPIC_API_KEY`, le flux "coller un thread" affiche bien l'état de chargement puis le message d'erreur JSON (pas de crash) ; le formulaire manuel reste pleinement fonctionnel en parallèle (pas de régression RAT-5), sauvegarde et affichage détail vérifiés (donnée de test supprimée après coup).
- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent.
- `CLAUDE.md` mis à jour : section Décisions (CRUD) (flow d'extraction) et généralisation du piège `w-full`.

## 2026-07-06 (suite 9) — RAT-11

- **[RAT-11](https://floviret.atlassian.net/browse/RAT-11) démarré et complété** : gestion des cas limites de l'extraction.
- Évolution du schéma de sortie de `/api/extract` : la réponse est désormais toujours `{ status, message, decisions[] }` (`status` ∈ `decision_found` | `no_clear_decision` | `multiple_decisions`) plutôt qu'une fiche unique implicite — le prompt système instruit explicitement le modèle à distinguer les 3 cas plutôt que d'halluciner une fiche pour un thread sans décision.
- UI (`/decisions/new`) : message informatif (pas une erreur) quand aucune décision claire n'est trouvée ; liste de candidats sélectionnables quand plusieurs décisions distinctes sont détectées — cliquer sur un candidat pré-remplit le formulaire (même mécanisme que RAT-10), l'humain choisit laquelle enregistrer.
- **Clé API Anthropic obtenue et configurée** (`.env.local`, jamais commitée) — nécessaire ici car le critère d'acceptation exige un test sur des exemples réels, pas seulement la gestion d'erreur structurelle (contrairement à RAT-9/RAT-10 testés sans clé).
- **Testé en conditions réelles avec la clé, via le contournement de connexion documenté (nettoyé après usage)** sur 3 exemples :
  - Décision claire (migration CI vers GitHub Actions) → `decision_found`, fiche correcte.
  - Discussion sans décision tranchée (sujet reporté) → `no_clear_decision`, message pertinent, formulaire non touché.
  - Thread avec deux décisions indépendantes (outil de CI + nom de fonctionnalité) → `multiple_decisions`, 2 candidats corrects, sélection puis pré-remplissage vérifiés dans l'UI.
- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent.
- `CLAUDE.md` mis à jour : section Extraction LLM (nouveau contrat de réponse).

## 2026-07-06 (suite 10) — RAT-12 : jeu d'evals

- **[RAT-12](https://floviret.atlassian.net/browse/RAT-12) démarré et complété** : premier jeu de tests du projet, dédié à l'extraction LLM.
- Refactor préalable : la logique d'appel Anthropic (schéma, prompt, parsing, `extractDecisions`) extraite de `src/app/api/extract/route.ts` vers `src/lib/extract.ts`, réutilisée telle quelle par le script d'evals — évite de dupliquer le prompt/schéma et garantit que l'eval teste le même code que la route HTTP en production.
- `evals/threads.ts` : 10 threads de test couvrant les axes demandés — décision claire technique (CI/GitHub Actions), décision claire produit (nommage), décision avec rationale/stakeholders multiples, décision informelle très courte, deux variantes de discussion sans décision (reportée / questions ouvertes), thread à deux décisions, thread à trois décisions (compte-rendu multi-sujets), débat contradictoire tranché par un décideur explicite, et un cas "décision partielle" (une partie tranchée, une autre volontairement laissée ouverte — piège à hallucination).
- `evals/run.ts` : compare la sortie réelle à la sortie attendue par thread (`status`, nombre de décisions, sous-chaînes attendues dans `decision_text`/`decider`), affiche un résumé pass/fail par thread + taux de réussite global. Lancé via `pnpm eval` (nouveau script, utilise `tsx --env-file=.env.local`).
- **Résultat du premier run réel (avec la clé API Anthropic configurée en RAT-11)** : **10/10 threads réussis**, aucun écart constaté. À noter : échantillon volontairement restreint et rédigé par nous-mêmes (donc plus "propre" que des threads Teams/Slack réels bruités) — un score parfait ici ne garantit pas la robustesse sur des cas réels de la semaine 5/6 ; à réévaluer si des erreurs d'extraction sont rapportées en usage.
- Décision : le jeu d'evals reste **hors CI** (appels API réels payants et non déterministes) — documenté dans `CLAUDE.md`, à lancer manuellement.
- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent.
- `CLAUDE.md` mis à jour : section Extraction LLM (evals) et section Conventions (Tests).

## 2026-07-07 — RAT-13 : audit de fin de Semaine 2

- **[RAT-13](https://floviret.atlassian.net/browse/RAT-13) démarré et complété** : audit du code de la Semaine 2 (extraction LLM, RAT-9 à RAT-12) via le subagent `auditeur` (lecture seule), sur `src/lib/extract.ts`, `src/app/api/extract/route.ts`, `src/app/decisions/new/page.tsx`, `src/app/decisions/actions.ts`, `evals/threads.ts`, `evals/run.ts`.
- **Aucun point bloquant** : pas de fuite de données inter-organisations dans ce périmètre (`/api/extract` ne touche pas la base ; `createDecision` continue de dériver `org_id`/`created_by` de la session, jamais du formulaire — pas de régression sur la vulnérabilité trouvée en RAT-7).
- **4 points importants trouvés et corrigés** :
  1. `request.json()` dans `route.ts` était appelé hors du `try/catch` — un corps de requête non-JSON provoquait un crash 500 brut au lieu du JSON `{ error }` structuré exigé par RAT-9. Corrigé : parsing du body dans son propre `try/catch` (400 explicite).
  2. Aucune limite de taille sur le texte envoyé à l'API Anthropic (service tiers hors UE) — ajout de `MAX_TEXT_LENGTH` (20 000 caractères), 400 explicite si dépassé.
  3. `/decisions/new` était un Client Component pur, sans garde serveur (`requireOrgUser`), contrairement aux autres pages `decisions/` — un utilisateur authentifié mais sans organisation pouvait déclencher des appels payants à l'extraction avant d'échouer silencieusement à la sauvegarde. Corrigé : la page est redevenue un Server Component qui appelle `requireOrgUser()` puis rend le Client Component réel (extrait dans `new-decision-form.tsx`).
  4. `DecisionCandidate`/`ExtractionResult` étaient redéfinis localement dans `new/page.tsx` en doublon des types déjà exportés par `src/lib/extract.ts` (risque de divergence silencieuse). Corrigé : import direct depuis `src/lib/extract.ts`.
- **Suggestions notées, non corrigées** (pas bloquantes pour le MVP) : les `checks` d'`evals/run.ts` associent décisions et assertions par index positionnel plutôt que par contenu (faux négatif possible si l'ordre des décisions varie sur un thread multi-décisions) ; les assertions des evals portent sur des mots-clés déjà présents verbatim dans le texte d'entrée (signal faible contre l'hallucination/recopie) ; pas de rate limiting sur `/api/extract`. À revisiter si ça devient un problème réel en usage.
- **Vérifié** : `pnpm lint`, `pnpm typecheck` et `pnpm build` passent (Node 20 requis, `nvm use` — un premier essai sous Node 18 par défaut avait fait échouer `pnpm build`). Testé en navigateur avec une session active : `/decisions/new` rend correctement le formulaire avec la garde serveur en place, extraction d'un thread de test (`decision_found`) réalisée sans erreur réseau ni console.
- `CLAUDE.md` mis à jour : section Décisions (CRUD) (structure Server/Client Component de `new/`) et section Extraction LLM (`MAX_TEXT_LENGTH`, parsing du body).

## 2026-07-07 (suite) — RAT-14 : test manuel de fin de Semaine 2

- **[RAT-14](https://floviret.atlassian.net/browse/RAT-14) démarré et complété** : test manuel du parcours complet en conditions réelles, 9 scénarios validés sans anomalie.
- **Scénarios testés** :
  - Flux principal : décision claire extraite, formulaire pré-rempli, champ édité, sauvegarde → page détail correcte.
  - Aucune décision : message informatif affiché, formulaire non touché et utilisable à la main.
  - Décisions multiples : 2 candidats affichés, sélection du second, pré-remplissage correct.
  - Saisie manuelle directe sans extraction : création et affichage OK.
  - Titre manquant : champ `required` bloque la soumission navigateur.
  - Thread > 20 000 caractères : message d'erreur "thread trop long" (400), pas de crash.
  - Protection de route : accès direct à `/decisions/new` hors session → redirection `/login`.
  - Liste des décisions : toutes les décisions créées listées correctement.
  - Page détail : layout correct, aucune régression de mise en page.
- Aucune anomalie. Aucun ticket correctif ouvert.

## 2026-07-07 (suite) — RAT-15 : clôture Semaine 2

- **[RAT-15](https://floviret.atlassian.net/browse/RAT-15) démarré et complété** : consolidation du journal et clôture de l'Epic [RAT-8](https://floviret.atlassian.net/browse/RAT-8) — Semaine 2 Extraction LLM.
- **Bilan Semaine 2** : 7 tickets livrés (RAT-9 à RAT-15), tous "Terminé".
  - RAT-9 : endpoint `/api/extract` — extraction LLM via `claude-sonnet-5`, sorties structurées, gestion d'erreurs exhaustive.
  - RAT-10 : UI "coller un thread" — zone de collage + pré-remplissage éditable du formulaire manuel.
  - RAT-11 : cas limites — contrat `{ status, message, decisions[] }` à 3 statuts, UI pour chaque cas.
  - RAT-12 : jeu d'evals — 10 threads représentatifs, 10/10 au premier run ; logique d'extraction factorisée dans `src/lib/extract.ts`.
  - RAT-13 : audit — 4 points importants corrigés (parsing JSON hors try/catch, taille max du texte, garde serveur manquante sur `/decisions/new`, duplication de types).
  - RAT-14 : test manuel — 9 scénarios validés sans anomalie.
  - RAT-15 : journal de bord.
- **Décisions notables de la semaine** :
  - Sorties structurées (`output_config.format` + `client.messages.parse()`) plutôt qu'un JSON demandé en prose — plus fiable, schéma garanti côté SDK.
  - `thinking: disabled` + `effort: low` pour l'extraction — tâche simple, gain de coût/latence sans perte de qualité (validé par les evals).
  - Contrat à 3 statuts plutôt qu'une fiche unique implicite — empêche le modèle d'halluciner une décision sur un thread ambigu.
  - Jeu d'evals délibérément hors CI — appels API réels payants et non déterministes ; à lancer manuellement avant chaque évolution du prompt.
  - Architecture `/decisions/new` : Server Component (garde `requireOrgUser`) + Client Component séparé (`new-decision-form.tsx`) — pattern à reproduire pour toute future page nécessitant à la fois un guard serveur et de l'interactivité client.
