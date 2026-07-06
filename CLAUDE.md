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
- `src/lib` — utilitaires (`utils.ts`, `supabase.ts`)
- `supabase/migrations` — schéma DB versionné (source de vérité, appliqué avec `supabase db push`)

## Supabase

- Projet `ratio`, région `eu-west-1`, lié via `supabase link` (config dans `supabase/config.toml`, sans secret).
- `src/lib/supabase.ts` expose deux clients : `createBrowserSupabaseClient()` (clé anon, côté client) et `createServiceRoleSupabaseClient()` (clé service_role, **côté serveur uniquement** — ne jamais l'exposer au client).
- Schéma v1 (`organizations`, `users`, `decisions`, `decision_links`) + extension `pgvector` : voir `supabase/migrations/20260706150000_init_schema.sql`.
- RLS non activée pour le MVP semaine 1 (isolation multi-tenant prévue en phase 2, voir `RATIO_STARTER.md`) — toute lecture/écriture doit donc filtrer explicitement par `org_id` côté application.
- Nouvelle évolution de schéma → nouveau fichier dans `supabase/migrations`, jamais d'édition d'une migration déjà appliquée.

## Gestion de projet

- Backlog et suivi : Jira projet `RAT` (https://floviret.atlassian.net/jira/software/projects/RAT/boards/35), un ticket = une feature du roadmap.
- **Les commits et les PR restent humains** — ne pas commit/push sans demande explicite.
