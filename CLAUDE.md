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
- `src/lib` — utilitaires (`utils.ts`, futur client Supabase, etc.)

## Gestion de projet

- Backlog et suivi : Jira projet `RAT` (https://floviret.atlassian.net/jira/software/projects/RAT/boards/35), un ticket = une feature du roadmap.
- **Les commits et les PR restent humains** — ne pas commit/push sans demande explicite.
