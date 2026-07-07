export type ExpectedDecisionCheck = {
  decisionTextContains?: string[];
  deciderContains?: string;
};

export type EvalCase = {
  id: string;
  description: string;
  text: string;
  expected: {
    status: "decision_found" | "no_clear_decision" | "multiple_decisions";
    decisionsCount: number;
    checks?: ExpectedDecisionCheck[];
  };
};

export const EVAL_CASES: EvalCase[] = [
  {
    id: "01-technique-claire",
    description: "Décision technique claire, un seul décideur",
    text: `Marie: Je pense qu'on devrait migrer notre CI de CircleCI vers GitHub Actions, ça simplifierait la maintenance et on a déjà tout sur GitHub.
Julien: D'accord, GitHub Actions a aussi une meilleure intégration avec les PR.
Marie: Ok on part sur GitHub Actions alors, je m'occupe de la migration cette semaine.`,
    expected: {
      status: "decision_found",
      decisionsCount: 1,
      checks: [
        { decisionTextContains: ["GitHub Actions"], deciderContains: "Marie" },
      ],
    },
  },
  {
    id: "02-produit-claire",
    description: "Décision produit claire (nommage d'une fonctionnalité)",
    text: `Sophie: Pour la nouvelle fonctionnalité d'historique des décisions, je propose qu'on l'appelle "Timeline" plutôt que "Historique", c'est plus parlant pour les utilisateurs.
Marie: Oui carrément, Timeline c'est plus clair. On part là-dessus.`,
    expected: {
      status: "decision_found",
      decisionsCount: 1,
      checks: [{ decisionTextContains: ["Timeline"] }],
    },
  },
  {
    id: "03-claire-stakeholders",
    description: "Décision claire avec rationale explicite et plusieurs stakeholders",
    text: `Julien: Pour la base de données du MVP, je propose Supabase plutôt que de monter notre propre Postgres + Auth. On gagne du temps sur l'auth et le vector search est inclus.
Marie: Ça matche avec ce qu'on avait vu avec Camille sur la RGPD, Supabase a une région EU.
Camille: Oui confirmé, région eu-west disponible, c'est bon pour la conformité.
Julien: Parfait, on part sur Supabase alors, je fais le setup.`,
    expected: {
      status: "decision_found",
      decisionsCount: 1,
      checks: [
        { decisionTextContains: ["Supabase"], deciderContains: "Julien" },
      ],
    },
  },
  {
    id: "04-claire-informelle",
    description: "Décision claire mais très courte et informelle",
    text: `Bob: on garde le bouton en rouge finalement ?
Alice: oui gardons le rouge, plus visible. c'est décidé`,
    expected: {
      status: "decision_found",
      decisionsCount: 1,
      checks: [{ decisionTextContains: ["rouge"] }],
    },
  },
  {
    id: "05-ambigue-reportee",
    description: "Discussion sans décision, sujet reporté",
    text: `Marie: Est-ce qu'on devrait passer à GitHub Actions un jour ?
Julien: Peut-être, faudrait voir le coût.
Marie: Ouais je sais pas trop, on en reparle la semaine prochaine ?
Julien: Ok pas de souci.`,
    expected: {
      status: "no_clear_decision",
      decisionsCount: 0,
    },
  },
  {
    id: "06-ambigue-questions",
    description: "Échange de questions ouvertes sans résolution",
    text: `Camille: Vous pensez qu'on devrait faire du dark mode ?
Sophie: Bonne question, ça dépend du temps qu'on a.
Camille: Et niveau accessibilité, on a des contraintes ?
Sophie: Faudrait demander à l'équipe design.`,
    expected: {
      status: "no_clear_decision",
      decisionsCount: 0,
    },
  },
  {
    id: "07-multiple-deux",
    description: "Deux décisions indépendantes (technique + produit) dans le même thread",
    text: `Marie: Pour la CI, on part sur GitHub Actions, c'est décidé.
Julien: Ok nickel.

Marie: Autre sujet : pour le nom de la nouvelle feature, on part sur 'Timeline' plutôt que 'Historique', c'est plus clair pour les utilisateurs.
Sophie: Oui carrément, va pour Timeline.`,
    expected: {
      status: "multiple_decisions",
      decisionsCount: 2,
      checks: [
        { decisionTextContains: ["GitHub Actions"] },
        { decisionTextContains: ["Timeline"] },
      ],
    },
  },
  {
    id: "08-multiple-trois",
    description: "Trois décisions dans un compte-rendu de réunion multi-sujets",
    text: `Compte-rendu réunion hebdo produit :

1. Base de données : on part sur Supabase (Julien).
2. Nom de la feature de recherche : on l'appelle "Recherche sémantique" et pas "Smart Search" pour rester en français (Marie).
3. Déploiement : on utilise Vercel plutôt qu'un serveur dédié, pour les preview deployments (Camille).`,
    expected: {
      status: "multiple_decisions",
      decisionsCount: 3,
      checks: [
        { decisionTextContains: ["Supabase"] },
        { decisionTextContains: ["Recherche sémantique"] },
        { decisionTextContains: ["Vercel"] },
      ],
    },
  },
  {
    id: "09-debat-tranche",
    description: "Débat contradictoire tranché explicitement par un décideur",
    text: `Julien: Moi je pense qu'on devrait garder notre propre serveur d'auth, plus de contrôle.
Camille: Je suis pas d'accord, ça va nous prendre des semaines et on n'a pas le temps pour le MVP.
Julien: Peut-être mais niveau sécurité on maîtrise mieux.
Marie (Lead) : On tranche : on part sur Supabase Auth pour le MVP, on pourra revoir en phase 2 si besoin. Julien, je comprends le point sécurité mais le time-to-market prime là.`,
    expected: {
      status: "decision_found",
      decisionsCount: 1,
      checks: [
        { decisionTextContains: ["Supabase Auth"], deciderContains: "Marie" },
      ],
    },
  },
  {
    id: "10-partielle",
    description: "Une partie de la discussion est tranchée, une autre reste ouverte (ne doit pas être inventée)",
    text: `Sophie: Pour le MVP, on est d'accord qu'on ne fait pas le bot Teams tout de suite, on se concentre sur la web app.
Marie: Oui carrément, c'est trop risqué en phase 1. Décidé.
Sophie: Par contre pour la phase 2, on garde ouvert entre bot Teams ou digest email, on décidera plus tard selon les retours utilisateurs.`,
    expected: {
      status: "decision_found",
      decisionsCount: 1,
      checks: [{ decisionTextContains: ["bot Teams"] }],
    },
  },
];
