@AGENTS.md

# RATIO

Décision-log web app pour Product Owners : capturer le *pourquoi* d'une décision produit, la retrouver par recherche sémantique, et resurfacer le contexte quand un vieux débat est rouvert. MVP en 6 semaines — voir `RATIO_STARTER.md` pour la roadmap complète et `BOARD_JOURNAL.md` pour l'avancement.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + pgvector, région EU), Supabase Auth (magic link)
- API Anthropic (claude-sonnet) pour l'extraction structurée thread → fiche décision
- Embeddings OpenAI `text-embedding-3-small` pour la recherche sémantique
- Déploiement Vercel

`ANTHROPIC_API_KEY` et `OPENAI_API_KEY` sont dans `.env.example`/`.env.local`. Comme `SUPABASE_SERVICE_ROLE_KEY`, ce sont des clés **côté serveur uniquement** — jamais de préfixe `NEXT_PUBLIC_`, jamais d'appel direct depuis un Client Component ; elles ne doivent être lues que dans des Server Actions/Route Handlers. `OPENAI_API_KEY` (embeddings) pas encore utilisée (semaine 3).

## Environnement

- Node **20** requis (`.nvmrc` à la racine — `nvm use`). Ce repo utilise `pnpm`, pas `npm`/`yarn` (version figée via `packageManager` dans `package.json`).
- `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm build`

## Structure

- `src/app` — routes App Router
- `src/components/ui` — composants shadcn/ui
- `src/lib/supabase` — clients Supabase (`client.ts`, `server.ts`, `admin.ts`, `middleware.ts`)
- `src/proxy.ts` — rafraîchissement de session (fichier `proxy`, ancien nom `middleware` déprécié en Next.js 16)
- `supabase/migrations` — schéma DB versionné (source de vérité, appliqué avec `supabase db push`)

## Supabase

- Projet `ratio`, région `eu-west-1`, lié via `supabase link` (config dans `supabase/config.toml`, sans secret).
- Trois clients dans `src/lib/supabase/` :
  - `client.ts` (`createClient`) — navigateur, clé anon, session basée cookies (`@supabase/ssr`)
  - `server.ts` (`createClient`, async) — Server Components / Route Handlers / Server Actions, clé anon + cookies via `next/headers`
  - `admin.ts` (`createAdminClient`) — clé service_role, **côté serveur uniquement**, bypass RLS
- Schéma v1 (`organizations`, `users`, `decisions`, `decision_links`) + extension `pgvector` : voir `supabase/migrations/20260706150000_init_schema.sql`.
- RLS non activée pour le MVP semaine 1 (isolation multi-tenant prévue en phase 2, voir `RATIO_STARTER.md`) — toute lecture/écriture doit donc filtrer explicitement par `org_id` côté application.
- Nouvelle évolution de schéma → nouveau fichier dans `supabase/migrations`, jamais d'édition d'une migration déjà appliquée.

## Auth

- Connexion par magic link (`supabase.auth.signInWithOtp`) — pas de mot de passe. Le lien email pointe vers `/auth/confirm` avec un `code` PKCE (flow par défaut de `@supabase/ssr`), échangé via `exchangeCodeForSession`.
- `src/proxy.ts` rafraîchit la session sur chaque requête et redirige vers `/login` si non connecté, sauf sur les chemins publics (`/login`, `/auth/*`).
- Un utilisateur sans `org_id` dans la table `users` est redirigé vers `/onboarding` (créer ou rejoindre une organisation) — cette vérification vit dans les pages, pas dans le proxy.
- Convention pour toute nouvelle route/page protégée : récupérer l'utilisateur via `src/lib/supabase/server.ts`, `redirect("/login")` si absent (défense en profondeur, le proxy le fait déjà), puis filtrer toutes les requêtes DB par `org_id` de l'utilisateur (RLS désactivée, voir section Supabase).

## Décisions (CRUD)

- Routes sous `src/app/decisions/` : `page.tsx` (liste), `new/page.tsx` (formulaire de création), `[id]/page.tsx` (détail), `actions.ts` (Server Actions).
- `src/lib/auth.ts` (`requireOrgUser`) centralise la récupération de l'utilisateur + `org_id` pour toute page/action protégée qui a besoin de l'organisation courante (login/onboarding redirigent automatiquement si absent).
- Toute requête sur `decisions` filtre par `eq("org_id", orgId)` (RLS désactivée, voir section Supabase) ; `created_by` est renseigné automatiquement depuis la session, jamais depuis un champ de formulaire.
- `options_json` est un champ libre `{ notes: string }` alimenté par un simple textarea — pas de sous-formulaire structuré tant que l'extraction LLM (semaine 2) n'impose pas un schéma plus riche.
- `new/page.tsx` est un Server Component (garde `requireOrgUser()`, défense en profondeur cohérente avec `decisions/page.tsx` et `decisions/[id]/page.tsx`) qui rend `new-decision-form.tsx`, le Client Component réel : zone de collage d'un thread → appel `fetch("/api/extract")` → pré-remplissage du formulaire manuel (même Server Action `createDecision`, champ caché `source_raw`). Remplissage via `defaultValue` + `key` incrémenté sur le `<form>` après extraction (remount volontaire), pas de champs contrôlés un par un. `DecisionCandidate`/`ExtractionResult` sont importés depuis `src/lib/extract.ts`, jamais redéfinis localement.
- shadcn/ui : le `Button` de ce projet est basé sur `@base-ui/react` (pas Radix) et n'a **pas** de prop `asChild` — pour un lien qui doit avoir le style d'un bouton, appliquer `buttonVariants({...})` en `className` sur le `<Link>`, ne pas essayer `<Button asChild>`.
- Tout conteneur de page centré avec `mx-auto max-w-*` doit aussi porter `w-full`, sinon il se réduit à la largeur de son contenu (shrink-to-fit) — pas seulement quand le conteneur lui-même est `flex` (piège initial sur `/decisions` et `/onboarding`), mais aussi quand un conteneur *non-flex* est enfant direct du `<body>` (qui est `flex flex-col`, voir `layout.tsx`) : les marges `auto` d'un enfant de conteneur flex interagissent avec l'alignement plutôt que de centrer un bloc pleine-largeur (piège rencontré sur `/decisions/[id]`). Réflexe : ajouter `w-full` à tout `mx-auto max-w-*` de page, flex ou non.

## Extraction LLM

- `src/app/api/extract/route.ts` (POST, protégé — 401 si non connecté) : texte brut collé → fiche décision structurée via l'API Anthropic (`claude-sonnet-5`, choix documenté dans `RATIO_STARTER.md`), en sorties structurées (`output_config.format` avec schéma JSON strict, via `client.messages.parse()`) plutôt qu'un JSON demandé en prose — plus fiable. Le body JSON est parsé dans un `try/catch` dédié (400 explicite si invalide) et `text` est plafonné à `MAX_TEXT_LENGTH` (20 000 caractères, 400 si dépassé) — évite qu'un thread énorme parte intégralement vers un service tiers hors UE sans coût/latence maîtrisés.
- `thinking: { type: "disabled" }` et `effort: "low"` : tâche d'extraction simple, pas besoin de raisonnement approfondi (coût/latence).
- Toute erreur (clé API absente, erreur Anthropic, refus du modèle, sortie non structurée) retourne un JSON `{ error }` avec un code HTTP explicite — jamais de crash silencieux (contrainte explicite du ticket RAT-9). Voir `Anthropic.APIError` pour les erreurs API, catch générique en filet de sécurité pour le reste (ex. erreur de configuration/credentials).
- Le endpoint ne persiste rien en base — il retourne uniquement la fiche extraite ; la sauvegarde (avec `org_id`/`created_by`) reste dans les Server Actions de `src/app/decisions/`.
- La réponse est toujours enveloppée dans `{ status, message, decisions[] }` (`status` ∈ `decision_found` | `no_clear_decision` | `multiple_decisions`) plutôt qu'une fiche unique — permet au modèle de signaler explicitement l'absence de décision ou la présence de plusieurs décisions distinctes dans un même thread, au lieu d'halluciner une fiche pour combler. `decisions` est vide, à un ou à plusieurs éléments selon le statut. Voir `src/app/decisions/new/page.tsx` pour le rendu de chaque cas (message informatif pour `no_clear_decision`, liste de candidats sélectionnables pour `multiple_decisions`).
- La logique d'appel Anthropic (schéma, prompt, parsing) vit dans `src/lib/extract.ts` (`extractDecisions`), importée à la fois par la route HTTP et par le jeu d'evals (`evals/`) — évite de dupliquer le prompt/schéma entre les deux.
- `evals/threads.ts` (10 threads de test représentatifs) + `evals/run.ts` (comparaison automatique à la sortie attendue : `status`, nombre de décisions, sous-chaînes attendues dans `decision_text`/`decider`) — lancer avec `pnpm eval`. Résultats consignés dans `BOARD_JOURNAL.md` à chaque run notable. Volontairement **hors CI** : appels API réels payants et non déterministes, pas adaptés à un run automatique sur chaque PR.

## Conventions

- **Langue** : tout le code (fichiers, variables, fonctions) en anglais ; tout ce qui est visible par un humain (UI, commentaires, docs, commits) en français.
- **Gestion d'erreurs** : les Server Actions ne catchent pas les erreurs Supabase, elles les laissent remonter (`if (error) throw error`) — capturées par la error boundary racine `src/app/error.tsx` (React Error Boundary, prop `unstable_retry` — nommage spécifique à Next.js 16, pas `reset` comme dans les versions précédentes). `src/app/not-found.tsx` gère les 404 (déclenché par `notFound()`, ex. décision introuvable ou hors organisation). Pas encore de retour d'erreur inline dans les formulaires (ex. nom d'organisation en doublon) — à revisiter si ça devient un point de friction réel en usage.
- **Tests** : toujours pas de tests unitaires CRUD (choix assumé, voir historique). Le premier jeu de tests du projet est le jeu d'evals de l'extraction LLM (`evals/`, voir section Extraction LLM) — `pnpm eval`, à lancer manuellement, pas en CI (coût API + non-déterminisme).
- Avant d'utiliser une API Next.js dont le comportement pourrait différer de ce que tu crois savoir (ce projet est sur Next.js 16, plus récent que la plupart des connaissances d'entraînement) : vérifier dans `node_modules/next/dist/docs` plutôt que de supposer — voir `AGENTS.md`.

## CI

- `.github/workflows/ci.yml` : sur chaque PR et push sur `main` — install (`--frozen-lockfile`), `pnpm lint`, `pnpm typecheck`, `pnpm build`. Pas de step de tests dédié : le jeu d'evals (`evals/`, voir section Extraction LLM) fait des appels API réels payants et non déterministes, volontairement exclu de la CI — à lancer manuellement (`pnpm eval`).
- `main` est protégée : le check `ci` doit passer avant de pouvoir merger une PR (`required_status_checks`, configuré via l'API GitHub).
- Le repo `Fviret/Ratio` est **public** — nécessaire pour la protection de branche (GitHub ne l'autorise pas sur un repo privé du plan gratuit). Décision prise le 2026-07-06, voir `BOARD_JOURNAL.md`.

## Gestion de projet

- Backlog et suivi : Jira projet `RAT` (https://floviret.atlassian.net/jira/software/projects/RAT/boards/35), un ticket = une feature du roadmap.
- **Les commits et les PR restent humains** — ne pas commit/push sans demande explicite.
