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
