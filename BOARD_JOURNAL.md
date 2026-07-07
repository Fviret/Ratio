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

## 2026-07-07 (suite) — RAT-17 : infrastructure de recherche (pivot full-text)

- **[RAT-17](https://floviret.atlassian.net/browse/RAT-17) démarré et complété** avec un périmètre ajusté suite à une décision de pivot.
- **Décision : abandon d'OpenAI `text-embedding-3-small` au profit de Postgres full-text search.** Rationnel : la friction de mise en place (compte OpenAI + carte bancaire + crédit initial) ne se justifiait pas au regard du coût réel ($0,0004 pour 50 décisions) et de l'enjeu MVP. Postgres `tsvector` + `websearch_to_tsquery` est natif dans Supabase, zéro clé API, zéro coût variable, et suffisant pour un corpus de quelques dizaines de décisions. Les embeddings sémantiques sont reportés en phase 2 si la recherche plein texte se révèle insuffisante en usage réel.
- **Migration `20260707100000_add_fulltext_search.sql` appliquée** : colonne `search_vector tsvector GENERATED ALWAYS AS (...) STORED` (titre + décision + contexte + rationale + décideur) avec index GIN, et fonction SQL `search_decisions(query_text, p_org_id, p_limit)` retournant les décisions triées par `ts_rank`.
- SDK `openai` désinstallé, `src/lib/embed.ts` supprimé, `actions.ts` nettoyé (pas de code d'embedding). `OPENAI_API_KEY` retirée de la stack active (reste dans `.env.example` pour traçabilité).
- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent. Migration vérifiée : local = remote (`supabase migration list`).

## 2026-07-07 (suite) — RAT-18 : endpoint de recherche

- **[RAT-18](https://floviret.atlassian.net/browse/RAT-18) démarré et complété** : `src/app/api/search/route.ts` (POST, protégé).
- Reçoit `{ query: string }` (max 500 caractères), récupère l'`org_id` de l'utilisateur (403 si absent), appelle `supabase.rpc("search_decisions", { query_text, p_org_id, p_limit: 10 })`, retourne `{ results }`.
- Même conventions de robustesse que `/api/extract` : corps JSON parsé dans un `try/catch` dédié (400 explicite), guards sur query vide et trop longue.
- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent — `/api/search` apparaît dans le manifest de build.

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

## 2026-07-07 (suite) — RAT-19 : UI de recherche

- **[RAT-19](https://floviret.atlassian.net/browse/RAT-19) démarré et complété** : barre de recherche plein texte sur `/decisions`, badge de pertinence, enrichissement de la page détail.
- **Architecture** : `decisions/page.tsx` reste Server Component (charge la liste complète côté serveur, `requireOrgUser`) et rend `DecisionsList` (Client Component extrait dans `decisions-list.tsx`) — même split Server/Client que `/decisions/new` (RAT-13).
- **Barre de recherche** : formulaire (input + bouton « Rechercher »), soumission appelle `POST /api/search`, résultats remplacent la liste. En dehors du mode recherche (input vide), la liste pré-chargée côté serveur est affichée sans aucun appel réseau.
- **Badge de pertinence** : valeur `rank real` retournée par `ts_rank` normalisée par le score max (premier résultat = 100 %) — affiché sous forme de badge « N % » sur chaque carte résultat. Normalisation choisie car `ts_rank` ne garantit pas des valeurs entre 0 et 1 ; le pourcentage relatif est plus lisible pour l'utilisateur.
- **Page détail** : ajout de `decided_at` (date de décision si renseignée) et `source_raw` (thread brut, affiché en bas de fiche pour traçabilité) dans la requête et dans le rendu. Libellé « Stakeholders » francisé en « Parties prenantes ».
- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent.
- `CLAUDE.md` mis à jour : section Recherche (UI, normalisation du score, split Server/Client).

## 2026-07-07 (suite) — RAT-20 : audit de fin de Semaine 3

- **[RAT-20](https://floviret.atlassian.net/browse/RAT-20) démarré et complété** : audit du code de la Semaine 3 (RAT-17 à RAT-19) via le subagent `auditeur` (lecture seule), sur `supabase/migrations/20260707100000_add_fulltext_search.sql`, `src/app/api/search/route.ts`, `src/app/decisions/decisions-list.tsx`, `src/app/decisions/page.tsx`, `src/app/decisions/[id]/page.tsx`.
- **Aucun point bloquant** : l'isolation multi-tenant est correcte — `org_id` toujours dérivé de la session serveur, jamais injecté par le client.
- **4 points importants trouvés et corrigés** :
  1. `api/search/route.ts` ligne 15 : `error` Supabase non extrait sur la requête profil — une erreur DB masquée en faux 403 "organisation introuvable". Corrigé : extraction de `profileError`, retour 500 JSON si présent.
  2. `decisions-list.tsx` : race condition sur les requêtes concurrentes — une réponse stale pouvait écraser la dernière. Corrigé : `AbortController` par requête, abandon explicite de la précédente au début de chaque appel ; le `finally` ne met plus à jour l'état si la requête est déjà annulée.
  3. `decisions-list.tsx` : erreurs réseau/API (4xx/5xx, fetch raté) silencieusement transformées en "aucun résultat". Corrigé : state `searchError`, message d'erreur explicite affiché à la place.
  4. `decisions-list.tsx` : `<input type="search">` sans label accessible (WCAG 1.3.1). Corrigé : `<label htmlFor="decisions-search" className="sr-only">` associé à l'input ; `aria-live="polite"` ajouté sur le conteneur des résultats.
- **Suggestions notées, non corrigées** (non bloquantes pour le MVP) : SECURITY INVOKER + search_path non déclarés dans la fonction SQL ; EXECUTE PUBLIC par défaut sur `search_decisions` (à restreindre à `authenticated` en même temps que l'activation de RLS en phase 2) ; stop-words français retournent 0 résultat sans explication ; `source_raw` affiché en intégralité sans troncature ; normalisation du score peut afficher de très faibles pourcentages.
- `pnpm lint`, `pnpm typecheck` passent.

## 2026-07-07 (suite) — RAT-21 : test manuel de fin de Semaine 3

- **[RAT-21](https://floviret.atlassian.net/browse/RAT-21) démarré et complété** : test manuel du parcours complet de la Semaine 3 en conditions réelles (session authentifiée via contournement admin Supabase, nettoyé après usage).
- **6 scénarios validés, aucune anomalie** :
  1. Recherche avec résultat : "déploiement" → 1 résultat "Choix de la plateforme de déploiement" avec badge 100 % — OK.
  2. Aucun résultat : "fusée spatiale interstellaire" → message "Aucun résultat pour «...»" — OK.
  3. Vider la barre : input vidé → liste complète réapparaît (5 décisions, aucun badge %) sans appel réseau — OK.
  4. Page détail enrichie : champ "Thread source" affiché (`source_raw` renseigné) ; "Date de décision" absent quand `decided_at` est null (comportement attendu du composant `<Field>`) — OK.
  5. Badge de pertinence relatif : 1 seul résultat de recherche → normalisé à 100 % — OK.
  6. Non-régression formulaire de création : zone de collage de thread + tous les champs manuels intacts, aucune régression — OK.
- Note : les données de test existantes n'ont pas assez de chevauchement pour tester les scores relatifs multi-résultats (ex. 100 % / 60 % / 40 %) — à retester avec le dataset de démo (Semaine 5, RAT prévu).

## 2026-07-07 (suite) — RAT-22 : clôture Semaine 3

- **[RAT-22](https://floviret.atlassian.net/browse/RAT-22) démarré et complété** : consolidation du journal et clôture de l'Epic [RAT-16](https://floviret.atlassian.net/browse/RAT-16) — Semaine 3 Recherche.
- **Bilan Semaine 3** : 6 tickets livrés (RAT-17 à RAT-22), tous "Terminé".
  - RAT-17 : infrastructure full-text search — migration `search_vector` + index GIN + fonction `search_decisions`.
  - RAT-18 : endpoint `POST /api/search` — auth + org_id + conventions de robustesse (400/401/403/500 explicites).
  - RAT-19 : UI de recherche — barre de recherche sur `/decisions`, badge de pertinence normalisé, page détail enrichie (`decided_at`, `source_raw`).
  - RAT-20 : audit — 0 bloquant, 4 importants corrigés (faux 403, race condition, erreur silencieuse, label a11y WCAG 1.3.1).
  - RAT-21 : test manuel — 6 scénarios validés sans anomalie.
  - RAT-22 : journal de bord.
- **Décision notable de la semaine — pivot OpenAI → Postgres full-text search** : abandon d'`text-embedding-3-small` (OpenAI) au profit de `tsvector` + `websearch_to_tsquery('french')` natif Supabase. Rationnel : friction de mise en place (compte, billing, clé API tierce) disproportionnée par rapport au coût réel ($0,0004 pour 50 décisions) et à la valeur ajoutée sur un corpus de quelques dizaines de décisions. Postgres full-text search couvre les besoins MVP ; embeddings sémantiques reportés en phase 2 si la recherche s'avère insuffisante en usage réel.
- **Autres décisions techniques de la semaine** :
  - Score de pertinence normalisé plutôt que raw `ts_rank` (valeurs non bornées entre 0 et 1) — 1er résultat = 100 %, les suivants en proportion relative ; plus lisible pour l'utilisateur.
  - `AbortController` par requête de recherche pour éviter les race conditions (réponse stale écrasant la réponse récente).
  - Édition et suppression de décision ajoutées au backlog Semaine 5 dans `RATIO_STARTER.md` — réflexe utilisateur prévisible, nécessaire avant la démo.
- **Point de vigilance reporté en phase 2** : `EXECUTE` sur `search_decisions` accordé à `PUBLIC` par défaut (PostgreSQL) — à restreindre à `authenticated` en même temps que l'activation de RLS.

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

## 2026-07-07 (suite) — Semaine 4 : détection de doublon, liens entre décisions, statut de décision

- Création du backlog Semaine 4 — Contexte enrichi : Epic [RAT-23](https://floviret.atlassian.net/browse/RAT-23), avec [RAT-24](https://floviret.atlassian.net/browse/RAT-24) (détection de doublon), [RAT-25](https://floviret.atlassian.net/browse/RAT-25) (liens entre décisions), [RAT-26](https://floviret.atlassian.net/browse/RAT-26) (stepper de statut), [RAT-27](https://floviret.atlassian.net/browse/RAT-27) (audit), [RAT-28](https://floviret.atlassian.net/browse/RAT-28) (test manuel), [RAT-29](https://floviret.atlassian.net/browse/RAT-29) (journal).

## 2026-07-07 (suite) — RAT-24 : détection de doublon à la création

- **[RAT-24](https://floviret.atlassian.net/browse/RAT-24) démarré et complété** : bandeau d'avertissement de doublon sur `/decisions/new`.
- **Implémentation** : state `titleValue` synchronisé avec l'input "Titre" via `onChange` ; `useEffect` avec debounce 500 ms et `AbortController` qui appelle `POST /api/search` (réutilisation de l'endpoint existant, sans nouveau code backend) ; si des résultats sont trouvés, bandeau jaune avec liens vers les décisions similaires. La sauvegarde reste possible — l'avertissement n'est pas bloquant.
- **Correction lint notable** : premier jet appelait `setDuplicates(null)` directement dans le corps du `useEffect` (règle ESLint `react-hooks/set-state-in-effect`). Déplacé dans le `onChange` du champ titre.
- `selectCandidate()` (extraction LLM) appelle aussi `setTitleValue(candidate.title)` pour déclencher la détection après pré-remplissage.
- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent.

## 2026-07-07 (suite) — RAT-25 : liens entre décisions

- **[RAT-25](https://floviret.atlassian.net/browse/RAT-25) démarré et complété** : CRUD des liens entre décisions.
- **Schéma** : table `decision_links` avec clé composite `(decision_id, related_decision_id, relation)` (pas de colonne `id` séparée) ; enum `decision_relation` (`supersedes | relates_to | conflicts_with`), déjà présents dans la migration initiale.
- **Server Actions** dans `actions.ts` : `linkDecision` (vérifie que les deux décisions appartiennent à l'org, insère le lien, invalide les deux pages) et `unlinkDecision` (même vérification, supprime le lien). Guard anti-auto-lien (`decisionId === relatedId → throw`).
- **Client Component `decision-links.tsx`** : affiche les liens existants (direction forward et reverse avec labels traduits : "Remplace", "Lié à", "Conflicte avec" / "Remplacée par"), formulaire d'ajout avec recherche debounce 300 ms (`AbortController`, filtre les décisions déjà liées et la décision courante), `useTransition` pour l'ajout asynchrone.
- **Page détail** : récupère les liens dans les deux sens (`decision_id = id` et `related_decision_id = id`) en `Promise.all`, puis charge les titres des décisions liées en une seule requête `.in("id", allRelatedIds)`.
- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent.

## 2026-07-07 (suite) — RAT-26 : stepper de statut et transitions

- **[RAT-26](https://floviret.atlassian.net/browse/RAT-26) démarré et complété** : stepper visuel du statut de décision et bouton de transition.
- **Schéma** : enum `decision_status` (`proposed | decided | revisited | reversed`) avec colonne `status` dans `decisions` et migration `20260707200000_add_decision_status.sql` (défaut `proposed`).
- **Transitions valides** : `proposed → decided → revisited → reversed` (sens unique, pas de retour). Validées côté serveur dans `updateDecisionStatus` via `VALID_TRANSITIONS: Record<string, string>`. Transition `decided` peuple aussi `decided_at`.
- **UI** : stepper horizontal avec 4 étapes sur la page détail — étapes passées en rempli + "✓", étape active avec anneau de focus, étapes futures en grisé. Rendu avec `Fragment` (clé sur la paire cercle + connecteur) et `cn()` pour les classes conditionnelles. Un seul bouton affiché (la transition valide suivante), disparu si l'état final `reversed` est atteint.
- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent. `CLAUDE.md` mis à jour.

## 2026-07-07 (suite) — RAT-27 : audit de fin de Semaine 4

- **[RAT-27](https://floviret.atlassian.net/browse/RAT-27) démarré et complété** : audit du code de la Semaine 4 (RAT-24 à RAT-26) via le subagent `auditeur` (lecture seule), sur `src/app/decisions/new/new-decision-form.tsx`, `src/app/decisions/actions.ts`, `src/app/decisions/[id]/decision-links.tsx`, `src/app/decisions/[id]/page.tsx`.
- **2 points de sécurité corrigés** :
  1. (S1) Auto-lien non bloqué côté serveur dans `linkDecision` — guard `if (decisionId === relatedId) throw` ajouté.
  2. (S2) Transition `proposed → decided` ne peuplait pas `decided_at` — ajout du spread conditionnel `...(newStatus === "decided" ? { decided_at: new Date().toISOString() } : {})`.
- **2 points d'isolation corrigés** :
  1. (I1) Les requêtes SELECT de vérification dans 3 Server Actions (`linkDecision`, `updateDecisionStatus`, `unlinkDecision`) ne propagaient pas les erreurs Supabase — extraction de `checkError` + `if (checkError) throw checkError` systématique.
  2. (I4) `unlinkDecision` ne vérifiait l'appartenance à l'org que pour `decisionId`, pas `relatedId` — changé en `.in("id", [decisionId, relatedId]).eq("org_id", orgId)` avec assertion `decisions.length !== 2`.
- **2 points d'amélioration corrigés** :
  1. (I2) Pas de debounce sur la recherche de liens dans `decision-links.tsx` — pattern `setTimeout` 300 ms ajouté.
  2. (I3) Accessibilité : boutons "Retirer" sans `aria-label` distinctif (plusieurs sur la même page), select sans label. Corrigés : `aria-label={`Retirer le lien : ${link.relatedTitle}`}`, `<label htmlFor="link-relation" className="sr-only">`, `aria-label="Retirer la décision sélectionnée"` sur le bouton ×.
- **1 bug de page corrigé** : `page.tsx` swallowait silencieusement les erreurs Supabase sur les requêtes `decision_links` (destructuration sans `error`). Corrigé : `const [{ data: fwdLinks, error: fwdError }, ...]` + `if (fwdError) throw fwdError`.
- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent.

## 2026-07-07 (suite) — RAT-28 : test manuel de fin de Semaine 4

- **[RAT-28](https://floviret.atlassian.net/browse/RAT-28) démarré et complété** : test manuel du parcours complet de la Semaine 4 en conditions réelles (session authentifiée, données de test présentes en base).
- **6 scénarios validés** :
  1. Saisir "blocage" dans le titre → bandeau jaune "Des décisions similaires existent déjà" avec lien vers "Blocage featutre" — OK.
  2. Créer malgré l'avertissement → décision créée normalement, redirection vers la page détail — OK.
  3. Créer un lien entre deux décisions → lien visible sur les deux pages détail (direction forward et reverse) — OK.
  4. Supprimer un lien → disparaît immédiatement (revalidation de cache) — OK.
  5. Passer "Choix de la plateforme de déploiement" de `proposed` à `decided` → stepper mis à jour (✓ sur Proposée, cercle actif sur Décidée) — OK.
  6. Transitions invalides impossibles : l'UI n'expose qu'une seule transition valide (pas de bouton "retour"), le serveur rejette toute transition hors `VALID_TRANSITIONS` — OK.
- **Note technique** : les boutons "Retirer" et "Passer en Revisitée" étant tous deux `type="submit"`, le sélecteur `button[type="submit"]` frappait le mauvais bouton lors des tests automatisés. Le correctif d'accessibilité RAT-27 (I3) — `aria-label` sur les boutons Retirer — a résolu le problème de ciblage en même temps que le problème d'accessibilité.
- Aucune anomalie. Aucun ticket correctif ouvert.

## 2026-07-07 (suite) — RAT-29 : clôture Semaine 4

- **[RAT-29](https://floviret.atlassian.net/browse/RAT-29) démarré et complété** : consolidation du journal et clôture de l'Epic [RAT-23](https://floviret.atlassian.net/browse/RAT-23) — Semaine 4 Contexte enrichi.
- **Bilan Semaine 4** : 6 tickets livrés (RAT-24 à RAT-29), tous "Terminé".
  - RAT-24 : détection de doublon à la création — bandeau jaune avec liens, debounce 500 ms sur `POST /api/search`.
  - RAT-25 : liens entre décisions — CRUD complet (créer, afficher, supprimer), liens dans les deux sens sur la page détail.
  - RAT-26 : stepper de statut — transitions `proposed → decided → revisited → reversed`, validation serveur, `decided_at` peuplé.
  - RAT-27 : audit — 2 sécurité (auto-lien, `decided_at`), 2 isolation (propagation erreurs, vérification org des deux IDs), 2 amélioration (debounce, accessibilité), 1 bug page (erreurs swallowées).
  - RAT-28 : test manuel — 6 scénarios validés sans anomalie.
  - RAT-29 : journal de bord.
- **Décisions techniques notables** :
  - Réutilisation de `POST /api/search` pour la détection de doublon (zéro nouveau backend — l'endpoint existant suffit).
  - Clé composite `(decision_id, related_decision_id, relation)` sur `decision_links` — pas de colonne `id` auto-incrémentée, impose d'inclure les trois champs dans chaque opération de suppression.
  - Transitions de statut en sens unique enforced côté serveur (`VALID_TRANSITIONS` map) — l'UI ne fait que refléter ce qui est autorisé (un seul bouton, disparu à l'état final).
  - Les correctifs d'accessibilité (aria-label distincts par bouton Retirer) se sont avérés fonctionnellement nécessaires pour le ciblage des boutons lors des tests automatisés — alignment rare mais heureux entre a11y et testabilité.
- **Points de vigilance reportés** (non bloquants MVP) : pas de vérification d'unicité de lien côté UX (le doublon est rejeté par la PK composite en base, mais sans message explicite) ; transitions de statut non réversibles par design, à confirmer avec les utilisateurs en usage réel.

## 2026-07-07 (suite) — Semaine 5 : CRUD complet, données de démo, landing page

## 2026-07-07 (suite) — RAT-31 : édition d'une décision

- **[RAT-31](https://floviret.atlassian.net/browse/RAT-31) démarré et complété** : Server Action `updateDecision` dans `actions.ts` + nouvelle route `src/app/decisions/[id]/edit/page.tsx` (Server Component pur, pré-rempli depuis la DB).
- Bouton "Modifier" ajouté sur la page détail (`[id]/page.tsx`) via `buttonVariants({ variant: "outline", size: "sm" })` sur un `<Link>` — cohérent avec la convention shadcn/ui sans `asChild`.
- Pattern : Server Component pour la page edit (charge la décision, `notFound()` si hors org), formulaire `action={updateDecision}`, redirection vers `[id]` après enregistrement via `redirect()`.

## 2026-07-07 (suite) — RAT-32 : suppression d'une décision

- **[RAT-32](https://floviret.atlassian.net/browse/RAT-32) démarré et complété** : Server Action `deleteDecision` + Client Component `delete-decision-button.tsx` avec `window.confirm` + `useRef<HTMLFormElement>` + `requestSubmit()` pour déclencher la Server Action sans `useTransition`.
- `ON DELETE CASCADE` sur `decision_links` (FKs vers `decisions`) assure la suppression des liens associés — zéro logique applicative nécessaire pour propager.

## 2026-07-07 (suite) — RAT-33 : dataset de démo

- **[RAT-33](https://floviret.atlassian.net/browse/RAT-33) démarré et complété** : script `scripts/seed-demo.ts` avec 15 décisions réalistes (4 statuts, décideurs nommés, contexte/rationale remplis) + 6 liens (`supersedes` ×2, `relates_to` ×3, `conflicts_with` ×1).
- Idempotence : tag `"demo-seed"` dans `tags text[]`, vérification `.contains("tags", [SEED_TAG])` avant insertion — le second run détecte la présence et s'arrête sans doublon.
- Contournement Node 20 / WebSocket : `realtime: { transport: _NoopWS }` dans la config Supabase pour désactiver le module realtime qui tente d'accéder à `WebSocket` inexistant en Node 20. Lancer avec `pnpm seed-demo` (`tsx --env-file=.env.local`).

## 2026-07-07 (suite) — RAT-34 : onboarding empty state + "Charger un exemple"

- **[RAT-34](https://floviret.atlassian.net/browse/RAT-34) démarré et complété** : empty state sur `/decisions` (illustration + CTA "Créer ma première décision") affiché uniquement hors mode recherche et si `decisions.length === 0`. Bouton "Charger un exemple" sur `/decisions/new` : `setThreadText(DEMO_THREAD)` pré-remplit le textarea avec un thread Slack de référence (décision PostHog vs Amplitude) — permet de démontrer l'extraction LLM sans préparer de thread réel.

## 2026-07-07 (suite) — RAT-35 : landing page

- **[RAT-35](https://floviret.atlassian.net/browse/RAT-35) démarré et complété** : `src/app/page.tsx` réécrit en landing page publique (hero + 3 bénéfices + CTA "Demander une démo" → `/login`). Si utilisateur connecté → `redirect("/decisions")`.
- Correctif middleware : `PUBLIC_PATHS` incluait seulement `/login` et `/auth` — ajout d'une vérification `pathname === "/"` (exact match, pas `startsWith` qui rendrait tout public).

## 2026-07-07 (suite) — RAT-36 : audit de fin de Semaine 5

- **[RAT-36](https://floviret.atlassian.net/browse/RAT-36) démarré et complété** : audit du code Semaine 5 par le subagent `auditeur` — 4 points importants identifiés, tous corrigés immédiatement :
  1. `updateDecision` retournait silencieusement sur titre vide → `throw new Error("Le titre est requis")`.
  2. `updateDecision` sans vérification d'existence avant UPDATE → ajout `.maybeSingle()` + `notFound()` (cohérent avec `updateDecisionStatus`).
  3. Badge de statut affiché en anglais sur `[id]/page.tsx` → `STATUS_LABELS[currentStatus]`.
  4. Badge de statut affiché en anglais dans `decisions-list.tsx` → ajout local de `STATUS_LABELS` + fallback.
- 1 suggestion non bloquante laissée ouverte : protection contre la double soumission sur `DeleteDecisionButton` (impact nul : Supabase DELETE sur 0 lignes ne remonte pas d'erreur).

## 2026-07-07 (suite) — RAT-37 : test manuel de fin de Semaine 5

- **[RAT-37](https://floviret.atlassian.net/browse/RAT-37) démarré et complété** : 5 scénarios validés en prévisualisation navigateur.
  - Édition : titre modifié en `[modifié]`, soumission, page détail affiche le nouveau titre, titre restauré ensuite.
  - Suppression : décision "reunion du 7" (test) supprimée via `window.confirm` intercepté + `requestSubmit`, redirection vers `/decisions`, décision absente de la liste.
  - Dataset de démo : 15 décisions visibles en liste avec statuts en français (Proposée, Décidée, Revisitée, Renversée).
  - "Charger un exemple" : clic bouton → textarea pré-rempli avec le thread PostHog/Amplitude.
  - Landing page : `/` → redirection vers `/decisions` pour utilisateur connecté (middleware + page.tsx vérifiés).
- Aucune anomalie rencontrée.

## 2026-07-07 (suite) — RAT-38 : clôture Semaine 5

- **[RAT-38](https://floviret.atlassian.net/browse/RAT-38) démarré et complété** : journal de bord Semaine 5 rédigé, Epic [RAT-30](https://floviret.atlassian.net/browse/RAT-30) clôturé.
- **Bilan Semaine 5** : 8 tickets livrés (RAT-31 à RAT-38), tous "Terminé".
  - RAT-31 : édition d'une décision — formulaire pré-rempli, Server Action `updateDecision`, redirection page détail.
  - RAT-32 : suppression — Client Component avec confirmation + `requestSubmit()`, cascade DB automatique.
  - RAT-33 : dataset de démo — 15 décisions + 6 liens, idempotent, script `pnpm seed-demo`.
  - RAT-34 : onboarding — empty state liste + bouton "Charger un exemple" sur formulaire nouveau.
  - RAT-35 : landing page — `/` publique, hero + 3 bénéfices + CTA, redirection dashboard si connecté.
  - RAT-36 : audit — 4 corrections (validation titre, vérification existence avant UPDATE, badges statut en français).
  - RAT-37 : test manuel — 5 scénarios validés sans anomalie.
  - RAT-38 : journal + clôture Epic.
- **Décisions techniques notables** :
  - Workaround Node 20 / WebSocket dans les scripts : `realtime: { transport: _NoopWS }` pour contourner l'absence de `WebSocket` natif en Node 20.
  - Exact match `pathname === "/"` dans le middleware pour les chemins publics — `startsWith("/")` aurait rendu toutes les routes publiques.
  - `STATUS_LABELS` défini localement dans `decisions-list.tsx` (Client Component) plutôt qu'exporté depuis `[id]/page.tsx` — évite de coupler un Client Component à un module Server Component.
- **État du MVP à fin Semaine 5** : CRUD complet (créer, lire, éditer, supprimer), extraction LLM, recherche full-text, liens entre décisions, stepper de statut, données de démo prêtes, landing page publique. Semaine 6 : polish final et déploiement Vercel.
- **Points de vigilance reportés** : même liste qu'en Semaine 4 (unicité de lien sans message explicite, transitions irréversibles à confirmer en usage) + suggestion de double-soumission sur DeleteDecisionButton (non bloquant).

## 2026-07-07 (suite) — Semaine 6 : déploiement & polish UX

## 2026-07-07 (suite) — RAT-40 : déploiement Vercel

- **[RAT-40](https://floviret.atlassian.net/browse/RAT-40) démarré** : préparation technique du déploiement — code prêt, aucune modification requise.
  - Pas de références `localhost` dans le code source.
  - `next.config.ts` minimal, pas de `vercel.json` requis (Next.js auto-détecté par Vercel).
  - `packageManager: "pnpm@10.34.4"` dans `package.json` — Vercel auto-détecte pnpm.
  - `.env.example` nettoyé : retrait de `OPENAI_API_KEY` (abandonnée en Semaine 3).
  - `supabase/config.toml` : `site_url` pointe vers `127.0.0.1:3000` (config CLI locale uniquement — la config de production se fait dans le dashboard Supabase).
- **Actions manuelles requises** (hors périmètre code) :
  1. Vercel : importer `Fviret/Ratio`, déploiement auto sur push `main`, variables d'env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`).
  2. Supabase dashboard → Authentication → URL Configuration → Site URL + Redirect URL vers le domaine Vercel.
- URL de production : à compléter après configuration Vercel.

## 2026-07-07 (suite) — RAT-41 : polish UX final

- **[RAT-41](https://floviret.atlassian.net/browse/RAT-41) démarré et complété** : 4 améliorations UX pour la démo.
  - Template de titre : `layout.tsx` → `title: { default: "Ratio", template: "%s — Ratio" }`. Chaque page exporte son propre `metadata.title` ; la page détail et la page édition utilisent `generateMetadata` pour inclure le titre de la décision.
  - Lien "← Décisions" ajouté en haut de `[id]/page.tsx` et `new-decision-form.tsx`.
  - Lien "← Retour à la décision" ajouté en haut de `[id]/edit/page.tsx`.
  - Tri décroissant par `created_at` déjà en place depuis Semaine 3 — aucun changement nécessaire.

## 2026-07-07 (suite) — RAT-42 : audit de fin de Semaine 6

- **[RAT-42](https://floviret.atlassian.net/browse/RAT-42) démarré et complété** : audit du code Semaine 6 par le subagent `auditeur` — 2 points importants identifiés, corrigés immédiatement.
  1. `generateMetadata` dans `[id]/page.tsx` et `[id]/edit/page.tsx` utilisait `createClient()` (anon, sans filtre `org_id`) — avec RLS désactivée, le titre d'une décision d'une autre organisation était accessible via la balise `<title>` (fuite inter-org). Correction : `requireOrgUser()` + `.eq("org_id", orgId)` dans les deux `generateMetadata`.
  2. 3 suggestions de placement d'imports (après `export const`) — non bloquant, ESLint ne l'impose pas, laissé tel quel.
- **Décision technique** : `generateMetadata` peut appeler `requireOrgUser()` directement — si le `redirect()` est levé (utilisateur non authentifié ou sans org), Next.js le propage correctement et redirige le navigateur, même depuis la phase de génération de métadonnées.

## 2026-07-07 (suite) — RAT-43 : test manuel de fin de Semaine 6

- **[RAT-43](https://floviret.atlassian.net/browse/RAT-43) démarré et complété** : 7 scénarios validés en prévisualisation locale.
  - `<title>` liste : "Décisions — Ratio" ✅
  - `<title>` détail : "[titre décision] — Ratio" ✅
  - `<title>` édition : "Modifier — [titre décision] — Ratio" ✅
  - `<title>` nouvelle décision : "Nouvelle décision — Ratio" ✅
  - Lien "← Décisions" visible sur page détail et nouvelle décision ✅
  - Lien "← Retour à la décision" visible sur page édition ✅
  - `generateMetadata` filtre bien par `org_id` (correction RAT-42 vérifiée) ✅
  - Test en production (URL Vercel) : conditionné à la complétion de RAT-40 par l'utilisateur.

## 2026-07-07 (suite) — RAT-44 : clôture Semaine 6

- **[RAT-44](https://floviret.atlassian.net/browse/RAT-44) démarré et complété** : journal de bord Semaine 6 rédigé, Epic [RAT-39](https://floviret.atlassian.net/browse/RAT-39) clôturé.
- **Bilan Semaine 6** : 5 tickets livrés côté code (RAT-40 à RAT-44), RAT-40 en attente d'action manuelle utilisateur (Vercel + Supabase dashboard).
  - RAT-40 : code prêt pour Vercel, nettoyage `.env.example`, checklist d'actions manuelles fournie.
  - RAT-41 : template de titre `%s — Ratio`, liens "retour" sur 3 pages, `generateMetadata` pour titres dynamiques.
  - RAT-42 : audit — correction fuite inter-org dans `generateMetadata` (filtre `org_id` manquant).
  - RAT-43 : tests manuels — 7 scénarios validés sans anomalie en local.
  - RAT-44 : journal + clôture Epic.
- **Décision go/no-go bot Teams** : reportée — le MVP code est complet mais le déploiement Vercel (RAT-40 actions manuelles) n'est pas encore finalisé. Go/no-go à reconsidérer après les premières démos utilisateurs.
- **État du MVP à fin Semaine 6** : application complète, prête pour la production. Déploiement Vercel en attente de la configuration manuelle de l'utilisateur. Code côté : toutes les fonctionnalités MVP livrées (CRUD décisions, extraction LLM, recherche full-text, liens, statuts, démo, landing page, polish UX).
