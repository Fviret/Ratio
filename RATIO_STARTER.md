# RATIO — Starter Project & Roadmap MVP

> Decision log pour Product Owners : capturer le *pourquoi* des décisions produit, et resurfacer le contexte quand un vieux débat est rouvert.
>
> **Objectif du projet** : livrer un MVP démo-able en 6 semaines, construit avec un workflow agentique (Claude Code + Jira + GitHub), documenté comme un case study "PO augmenté".

---

## 1. Principe directeur du MVP

**On ne commence PAS par le bot Teams.** L'intégration Teams (Azure Bot Service, manifest, permissions tenant) est le plus gros risque technique et administratif du projet. Elle arrive en phase 2, une fois la valeur cœur prouvée.

Le MVP est une **web app** qui prouve les 3 promesses de Ratio :

1. **Capturer** une décision en < 2 minutes (coller un thread → fiche structurée par LLM)
2. **Retrouver** une décision passée par recherche sémantique ("on a déjà débattu de ça ?")
3. **Resurfacer** le contexte : qui a décidé, quelles options écartées, quels critères

Si ces 3 promesses ne convainquent pas 5 PO en démo, le bot Teams ne servira à rien.

---

## 2. Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | Full-stack en un repo, API routes incluses, déploiement Vercel en 1 clic |
| UI | **Tailwind CSS + shadcn/ui** | Rapide, propre, Claude Code le maîtrise parfaitement |
| Base de données | **Supabase (Postgres + pgvector)** | Auth incluse, free tier généreux, RGPD (région EU disponible) |
| Auth | **Supabase Auth** (magic link email) | Zéro friction, pas de gestion de mots de passe |
| LLM extraction | **API Anthropic — claude-sonnet-5** | Extraction structurée thread → fiche décision (sorties structurées JSON) |
| Recherche | **Postgres full-text search** (`tsvector` + `websearch_to_tsquery`) | Natif Supabase, zéro coût variable, suffisant pour le MVP — embeddings OpenAI reportés en phase 2 (décision Semaine 3) |
| Déploiement | **Vercel** (free tier) | Preview deployments par PR = démo-able en continu |
| Repo & CI | **GitHub + GitHub Actions** | Lint + typecheck + build sur chaque PR |
| Gestion projet | **Jira + MCP Atlassian** | Backlog généré, exécution ticket par ticket avec Claude Code |

**Coût estimé MVP** : ~0-15 €/mois (free tiers + quelques euros d'API LLM).

---

## 3. Modèle de données (v1)

```
organizations
  id, name, created_at

users
  id, email, org_id, role

decisions
  id, org_id, title, status (proposed|decided|revisited|reversed)
  context          -- le "pourquoi maintenant"
  options_json     -- options envisagées, avantages/inconvénients
  decision_text    -- ce qui a été décidé
  rationale        -- le pourquoi
  decider          -- qui a tranché
  stakeholders     -- qui était impliqué
  source_raw       -- le thread/texte brut d'origine
  embedding        -- vector(1536) pour la recherche sémantique
  tags text[]
  decided_at, created_at, created_by

decision_links
  decision_id, related_decision_id, relation (supersedes|relates_to|conflicts_with)
```

---

## 4. Roadmap — 6 semaines

### Semaine 1 — Fondations
- [ ] Repo GitHub + Next.js + TypeScript + Tailwind + shadcn/ui
- [ ] Projet Supabase (région EU), schéma DB, pgvector activé
- [ ] Auth magic link + création d'organisation
- [ ] CRUD décision **manuel** (formulaire simple) — sans LLM d'abord
- [ ] CI GitHub Actions (lint, typecheck, tests)
- **Livrable** : je peux créer et lister des décisions à la main

### Semaine 2 — Extraction LLM (le cœur "wow")
- [ ] Endpoint `/api/extract` : texte brut → JSON structuré (contexte, options, décision, rationale, décideur) via claude-sonnet
- [ ] UI "Coller un thread" → prévisualisation de la fiche → édition → sauvegarde
- [ ] Gestion des cas limites : thread sans décision claire, plusieurs décisions dans un thread
- [ ] Petit jeu d'evals : 10 threads de test avec sorties attendues
- **Livrable** : je colle un thread Teams/Slack copié, j'obtiens une fiche décision propre

### Semaine 3 — Recherche
- [x] Infrastructure full-text search : colonne `search_vector` générée, index GIN, fonction `search_decisions` (pivot OpenAI → Postgres natif)
- [x] Endpoint `POST /api/search` : requête en langage naturel → `websearch_to_tsquery` → résultats triés par `ts_rank`
- [x] UI de recherche : barre de recherche sur `/decisions`, résultats avec badge de pertinence normalisé
- [x] Page détail enrichie : tous les champs affichés (`context`, `options`, `rationale`, `decided_at`, `source_raw`)
- **Livrable** : "on avait dit quoi sur la pagination ?" → la bonne décision remonte

### Semaine 4 — Le "resurfacing" (la vraie promesse)
- [ ] Détection de doublon à la création : "⚠️ Une décision similaire existe déjà (87% de similarité) — la voici"
- [ ] Liens entre décisions (supersedes, conflicts_with)
- [ ] Timeline d'une décision : proposée → décidée → revisitée → renversée
- **Livrable** : quand quelqu'un rouvre un débat, Ratio ressort l'historique

### Semaine 5 — Polish & démo
- [ ] **Édition d'une décision** : page `/decisions/[id]/edit` (même formulaire que la création, pré-rempli), Server Action `updateDecision` — les utilisateurs veulent corriger une fiche extraite sans la recréer de zéro
- [ ] **Suppression d'une décision** : bouton sur la page détail (avec confirmation), Server Action `deleteDecision` — nécessaire pour nettoyer les fiches créées vides ou par erreur ; suppression dure pour le MVP (soft-delete avec statut `archived` reporté en phase 2 pour préserver l'historique)
- [ ] Dataset de démo réaliste (15-20 décisions inspirées EDF/BNP, anonymisées)
- [ ] Onboarding : empty state, exemple pré-rempli
- [ ] Landing page 1 écran (promesse + capture + CTA "demander une démo")
- [ ] Corrections issues des premiers tests
- **Livrable** : démo de 5 minutes qui tient debout devant un PO

### Semaine 6 — Discovery & contenu
- [ ] 5-8 démos/interviews avec des PO du réseau (script d'interview préparé)
- [ ] Synthèse des retours → backlog v2 priorisé
- [ ] Article LinkedIn case study : le workflow agentique de bout en bout
- **Décision de fin de MVP** : go/no-go sur le bot Teams (phase 2)

### Phase 2 (hors MVP, si go)
- Bot Teams (Azure Bot Service) : commande `/ratio log` dans un thread
- Multi-tenant renforcé, RLS Supabase, audit RGPD
- Digest hebdo email : "décisions de la semaine"

---

## 5. Tes besoins / prérequis à installer

### Outils locaux
- [ ] **Node.js ≥ 20** + **pnpm** (`npm i -g pnpm`)
- [ ] **Claude Code** (déjà installé chez toi)
- [ ] **Git** + compte GitHub (OK)

### Comptes à créer (tous free tier)
- [ ] **Supabase** — créer un projet, région `eu-west` (RGPD)
- [ ] **Vercel** — lier au repo GitHub
- [ ] **Clé API Anthropic** (console.anthropic.com) — extraction LLM
- [ ] **Clé API OpenAI** (ou Voyage AI) — embeddings

### Configuration workflow agentique
- [ ] Projet Jira `RATIO` + MCP Atlassian branché sur Claude Code
- [ ] `CLAUDE.md` à la racine du repo (conventions, stack, commande `/feature` comme sur le Pédomètre Android)
- [ ] Règle maintenue : **les commits et PR restent humains** (ta position publique)

### Variables d'environnement (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```
> `OPENAI_API_KEY` retirée — pivot vers Postgres full-text search en Semaine 3.

---

## 6. Risques & parades

| Risque | Parade |
|---|---|
| Extraction LLM peu fiable | Evals dès la semaine 2, prévisualisation éditable avant sauvegarde (l'humain valide toujours) |
| Recherche sémantique décevante | Seuil de similarité + fallback recherche plein texte Postgres |
| Scope creep (bot Teams trop tôt) | Interdit avant la semaine 6 et le go/no-go |
| Données sensibles en démo | Dataset anonymisé, jamais de vraies données client EDF/BNP |
| Personne ne veut logger ses décisions | C'est LA question de discovery — l'extraction depuis un copier-coller réduit la friction à ~zéro, à valider en interview |

---

## 7. Définition du succès du MVP

- Démo de 5 min réalisée devant ≥ 5 PO
- ≥ 2 PO disent "je l'utiliserais demain dans mon équipe"
- Article LinkedIn case study publié avec le workflow complet
- Backlog v2 priorisé sur la base de vrais retours

*Le MVP réussit même si Ratio ne devient pas un produit commercial : c'est d'abord la preuve vivante du positionnement "PO augmenté".*
