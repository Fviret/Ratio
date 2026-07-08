# Ratio

> La mémoire des décisions produit — capturée en 2 minutes, retrouvée en quelques secondes, resurfacée au moment où elle compte.

---

## Le problème

Un Product Owner prend plusieurs dizaines de décisions par semaine. Très peu sont documentées. Le reste vit dans des threads Slack ensevelis, des emails oubliés, ou nulle part.

Résultat : les mêmes débats reviennent, les mêmes erreurs se répètent. Et quand quelqu'un demande *"pourquoi on a fait ce choix-là ?"*, personne ne sait vraiment répondre.

Les outils existants (Confluence, Notion) demandent de saisir une décision — une étape de trop dans un sprint sous pression. Ratio part du thread déjà écrit, et le transforme.

---

## Ce que fait Ratio

**1. Capturer en < 2 minutes**
Colle un thread Teams ou Slack → Claude Sonnet 5 extrait une fiche structurée (contexte, options écartées, décision, rationale, décideur) → tu révises → tu sauvegardes.

**2. Retrouver en langage naturel**
*"On avait dit quoi sur la pagination ?"* → recherche plein texte sur toutes les décisions de l'organisation → résultats triés par pertinence.

**3. Resurfacer le contexte**
À la création d'une nouvelle décision, les doublons similaires remontent automatiquement. Chaque décision suit une timeline : proposée → décidée → revisitée → renversée. Les liens entre décisions (remplace, contredit, prolonge) sont explicites.

---

## Stack technique

| Couche | Choix |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Base de données | Supabase — Postgres + full-text search natif (`tsvector` + GIN) |
| Auth | Supabase Auth — magic link email, zéro mot de passe |
| Extraction LLM | API Anthropic — `claude-sonnet-5`, sorties structurées JSON strict |
| Emails | Resend (SMTP custom) |
| Déploiement | Vercel |
| CI | GitHub Actions — lint + typecheck + build sur chaque PR |

---

## Workflow agentique

Ce projet est lui-même un case study de développement assisté par IA. Il a été construit en 6 semaines avec [Claude Code](https://claude.ai/code) comme pair de développement principal :

- Backlog généré et suivi dans Jira (`RAT-1` → `RAT-44`)
- Chaque ticket exécuté ticket par ticket avec Claude Code
- Commits et PRs restés humains — l'IA propose, le PO valide
- Journal de bord complet dans `BOARD_JOURNAL.md`

L'objectif : prouver qu'un PO sans équipe dédiée peut livrer un MVP production-ready en 6 semaines avec les bons outils.

---

## Demander une démo

Pas d'accès public — contacte-moi sur [LinkedIn](https://www.linkedin.com/in/florian-viret/) pour une démo guidée de 5 minutes.
