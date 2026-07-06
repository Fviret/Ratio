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

## Environnement

- Node **20** requis (`.nvmrc` à la racine — `nvm use`). Ce repo utilise `pnpm`, pas `npm`/`yarn`.
- `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm build`

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

## Gestion de projet

- Backlog et suivi : Jira projet `RAT` (https://floviret.atlassian.net/jira/software/projects/RAT/boards/35), un ticket = une feature du roadmap.
- **Les commits et les PR restent humains** — ne pas commit/push sans demande explicite.
