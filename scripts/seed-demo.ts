/**
 * Script de seed : peuple la base avec 15 décisions de démo réalistes.
 * Idempotent — détecte les données existantes via le tag "demo-seed".
 * Usage : pnpm seed-demo
 */
import { createClient } from "@supabase/supabase-js";

// Node.js 20 n'a pas WebSocket natif — on passe un transport factice pour désactiver realtime.
class _NoopWS {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { realtime: { transport: _NoopWS as unknown as typeof WebSocket } },
);

const DEMO_ORG_NAME = process.env.DEMO_ORG_NAME ?? "Ratio Demo";
const SEED_TAG = "demo-seed";

async function main() {
  // Récupérer l'org de démo
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("name", DEMO_ORG_NAME)
    .maybeSingle();

  if (orgError) throw orgError;
  if (!org) {
    console.error(`Organisation "${DEMO_ORG_NAME}" introuvable. Crée-la d'abord via l'onboarding.`);
    process.exit(1);
  }

  const orgId = org.id;

  // Idempotence : vérifier si le seed a déjà été appliqué
  const { data: existing } = await supabase
    .from("decisions")
    .select("id")
    .eq("org_id", orgId)
    .contains("tags", [SEED_TAG])
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("Données de démo déjà présentes — rien à faire.");
    return;
  }

  console.log(`Insertion des décisions de démo dans l'org "${DEMO_ORG_NAME}"…`);

  // 15 décisions de démo couvrant différents contextes PO (anonymisées)
  const decisions = [
    {
      title: "Migration vers une architecture micro-services",
      status: "decided",
      context: "Le monolithe actuel bloque les déploiements indépendants des équipes. Chaque release nécessite une coordination de 3 squads.",
      options_json: { notes: "Option A : découpage progressif (strangler fig) — faible risque, migration sur 18 mois.\nOption B : réécriture complète — risque élevé, 6 mois.\nOption C : statu quo — dette technique croissante." },
      decision_text: "Adopter le pattern strangler fig pour migrer progressivement vers des micro-services, en commençant par le module de facturation.",
      rationale: "L'option A minimise les risques tout en livrant de la valeur rapidement. Le module facturation est isolé et bien testé — idéal pour commencer.",
      decider: "Sarah Chen (CTO)",
      stakeholders: ["Tech Lead", "Product Director", "DevOps"],
      decided_at: "2026-06-15T10:00:00Z",
    },
    {
      title: "Choix du framework front-end pour la refonte",
      status: "decided",
      context: "La refonte de l'interface client nécessite de choisir entre Vue 3 et React 18. L'équipe actuelle est expérimentée sur Vue 2.",
      options_json: { notes: "Vue 3 : montée en compétences douce, écosystème plus petit.\nReact 18 : écosystème plus large, plus de profils disponibles sur le marché." },
      decision_text: "Adopter React 18 avec Next.js pour la refonte.",
      rationale: "Malgré la courbe d'apprentissage, React offre un pool de talents plus large pour les recrutements prévus en Q3. Next.js apporte SSR natif sans configuration.",
      decider: "Marc Dupont (Tech Lead)",
      stakeholders: ["Équipe front", "RH", "Product Manager"],
      decided_at: "2026-05-20T14:00:00Z",
    },
    {
      title: "Stratégie de test : TDD vs test-after",
      status: "revisited",
      context: "Taux de régression en hausse (+40% sur 2 sprints). Question posée : faut-il imposer le TDD à toute l'équipe ?",
      options_json: { notes: "TDD obligatoire : qualité accrue mais vélocité réduite initialement.\nTest-after ciblé : compromis acceptable pour les fonctionnalités critiques.\nPas de changement : statu quo risqué." },
      decision_text: "Adopter le TDD pour tous les nouveaux modules, test-after autorisé pour les corrections urgentes.",
      rationale: "La dette de tests accumulée coûte plus cher en maintenance que le temps investi en TDD. Décision confirmée après retour d'expérience de 2 sprints.",
      decider: "Comité technique",
      stakeholders: ["Développeurs", "QA", "Scrum Master"],
      decided_at: "2026-04-10T09:00:00Z",
    },
    {
      title: "Révision de la politique de TDD après bilan Q2",
      status: "decided",
      context: "Après 8 semaines d'application, la vélocité a chuté de 20% mais le taux de régression a baissé de 60%. Bilan mitigé.",
      options_json: { notes: "Maintenir TDD obligatoire : résultats qualité convaincants malgré le coût vélocité.\nAssouplir : TDD requis uniquement sur le code métier critique." },
      decision_text: "Assouplir la règle : TDD requis sur le code métier et les APIs, optionnel sur l'UI et les scripts de migration.",
      rationale: "Le gain qualité sur le code métier est réel et mesurable. L'obligation sur l'UI génère de la friction sans valeur proportionnelle.",
      decider: "Comité technique",
      stakeholders: ["Développeurs", "QA", "PO"],
      decided_at: "2026-06-05T11:00:00Z",
    },
    {
      title: "Provider cloud : AWS vs GCP pour le nouveau cluster",
      status: "decided",
      context: "Le contrat datacenter on-premise expire en décembre. Migration cloud obligatoire. Budget : 120k€/an maximum.",
      options_json: { notes: "AWS : leader du marché, expertise interne déjà présente (2 certifiés), coût légèrement supérieur.\nGCP : meilleure intégration avec BigQuery (déjà utilisé), tarifs compétitifs.\nAzure : partenariat Microsoft existant mais peu d'expertise interne." },
      decision_text: "Migrer vers GCP. Le cluster Kubernetes sera hébergé sur GKE.",
      rationale: "L'intégration native avec BigQuery élimine des frictions de pipeline de données existantes. Le delta de coût vs AWS est marginal sur 3 ans.",
      decider: "Direction IT",
      stakeholders: ["DevOps", "Data team", "Finance"],
      decided_at: "2026-05-30T16:00:00Z",
    },
    {
      title: "Adoption de GraphQL pour l'API publique",
      status: "proposed",
      context: "Les partenaires se plaignent du nombre d'appels REST nécessaires pour récupérer leurs données. Over-fetching et under-fetching fréquents.",
      options_json: { notes: "GraphQL : flexibilité maximale pour les clients, complexité backend accrue.\nREST v2 amélioré : endpoints spécialisés par use case, moins de rupture.\nOData : standard moins connu dans l'écosystème." },
      decision_text: "",
      rationale: "",
      decider: "",
      stakeholders: ["Équipe API", "Partenaires", "Architecte"],
    },
    {
      title: "Stratégie d'internationalisation (i18n)",
      status: "decided",
      context: "Lancement prévu en Espagne et au Portugal en Q4. L'application n'est actuellement disponible qu'en français.",
      options_json: { notes: "next-intl : intégration native Next.js, bon support TypeScript.\ni18next : plus mature, plus de plugins, légèrement plus verbeux.\nTraduction manuelle : inacceptable à l'échelle." },
      decision_text: "Utiliser next-intl avec fichiers JSON par locale. Langue par défaut : français. Support initial : fr, es, pt.",
      rationale: "next-intl s'intègre nativement avec l'App Router Next.js — pas de workaround nécessaire. Équipe déjà familière avec la syntaxe.",
      decider: "Léa Martin (PO International)",
      stakeholders: ["Équipe front", "Traducteurs", "Marketing"],
      decided_at: "2026-06-20T10:00:00Z",
    },
    {
      title: "Politique de versioning des APIs internes",
      status: "decided",
      context: "Deux incidents de production causés par des changements non rétrocompatibles d'APIs internes. Pas de contrat formalisé entre équipes.",
      options_json: { notes: "SemVer strict avec changelog : rigoureux mais lourd.\nHeader de version (Accept-Version) : compatible REST, flexible.\nPas de versioning : rapide mais risqué (déjà prouvé)." },
      decision_text: "Versioning par header Accept-Version obligatoire pour toutes les APIs internes. Breaking changes annoncés avec 2 sprints de préavis minimum.",
      rationale: "Les incidents récents ont coûté 3h de downtime chacun. Le versioning par header est un standard bien supporté et moins intrusif que le versioning d'URL.",
      decider: "Comité architecture",
      stakeholders: ["Toutes les squads backend"],
      decided_at: "2026-05-12T14:30:00Z",
    },
    {
      title: "Outil de monitoring : Datadog vs Grafana/Prometheus",
      status: "decided",
      context: "Stack de monitoring actuelle (logs Kibana + alertes Nagios) insuffisante. Pas de traces distribuées, alerting trop verbeux.",
      options_json: { notes: "Datadog : tout-en-un, coût élevé (~8k€/mois à l'échelle).\nGrafana + Prometheus + Tempo : open source, complexité d'administration, coût infra.\nNew Relic : alternative Datadog, pricing similaire." },
      decision_text: "Adopter Grafana Cloud (tier payant) + Prometheus self-hosted. Traces distribuées via Tempo.",
      rationale: "Le coût Datadog dépasse le budget alloué. Grafana Cloud offre un bon équilibre entre commodité et coût — les ingénieurs DevOps ont déjà l'expertise Prometheus.",
      decider: "Thomas Renard (VP Engineering)",
      stakeholders: ["DevOps", "SRE", "Finance"],
      decided_at: "2026-06-01T09:00:00Z",
    },
    {
      title: "Gestion des feature flags",
      status: "decided",
      context: "Les dark launches et A/B tests sont gérés manuellement via des variables d'environnement. Pas de rollout progressif possible sans redéploiement.",
      options_json: { notes: "LaunchDarkly : solution SaaS complète, 2k€/mois.\nGrowthBook : open source, self-hosted, feature-complete.\nImplémentation maison : contrôle total, maintenance à assumer." },
      decision_text: "Adopter GrowthBook self-hosted sur notre infrastructure GCP.",
      rationale: "GrowthBook couvre tous nos besoins (flags, A/B, statistiques) sans coût SaaS. L'hébergement sur GCP est cohérent avec notre stack. L'équipe a évalué la solution sur 2 semaines.",
      decider: "Aline Moreau (Head of Product)",
      stakeholders: ["Product", "Data", "Engineering"],
      decided_at: "2026-06-28T11:00:00Z",
    },
    {
      title: "Archivage des données utilisateur après inactivité",
      status: "proposed",
      context: "RGPD : obligation de purger ou anonymiser les données des comptes inactifs depuis plus de 3 ans. Pas de politique définie actuellement.",
      options_json: { notes: "Anonymisation soft : remplace les PII par des tokens, conserve l'historique agrégé.\nSuppression dure : suppression complète — simple mais perte de données analytiques.\nArchivage cold storage : déplacement vers un bucket GCS froid, accès sur demande." },
      decision_text: "",
      rationale: "",
      decider: "",
      stakeholders: ["DPO", "Legal", "Data", "Engineering"],
    },
    {
      title: "Suppression du service de notifications par SMS",
      status: "reversed",
      context: "Le service SMS coûte 4k€/mois pour un taux d'ouverture de 12%, inférieur aux emails (34%). Proposition de suppression pour réduire les coûts.",
      options_json: { notes: "Supprimer : économie immédiate de 48k€/an, impact sur les utilisateurs sans email.\nConserver : statu quo.\nRéduire : SMS uniquement pour les alertes critiques (sécurité, fraude)." },
      decision_text: "Supprimer le service SMS notifications pour les communications marketing.",
      rationale: "ROI insuffisant. Budget réalloué vers les notifications push mobile.",
      decider: "Direction Marketing",
      stakeholders: ["CRM", "Finance", "Support"],
      decided_at: "2026-03-15T09:00:00Z",
    },
    {
      title: "Rétablissement des notifications SMS pour les alertes critiques",
      status: "decided",
      context: "Depuis la suppression des SMS, 3 incidents de fraude n'ont pas été détectés à temps par des utilisateurs sans push notifications activées. Le support a reçu 47 réclamations.",
      options_json: { notes: "Rétablir SMS pour toutes les notifications : coût initial reprend.\nSMS ciblés : alertes sécurité et fraude uniquement — coût estimé ~800€/mois.\nAutre canal : WhatsApp Business — à évaluer." },
      decision_text: "Rétablir les SMS pour les alertes de sécurité et de fraude uniquement. Notifications marketing restent sur email/push.",
      rationale: "Les incidents de fraude représentent un coût et un risque réputationnel bien supérieurs à 800€/mois. La décision de suppression complète était trop radicale.",
      decider: "Comité risques",
      stakeholders: ["Sécurité", "Support", "Finance", "Legal"],
      decided_at: "2026-05-02T15:00:00Z",
    },
    {
      title: "Standardisation des outils de documentation technique",
      status: "decided",
      context: "La documentation technique est éparpillée entre Confluence, Notion, des README GitHub et des Google Docs partagés. Onboarding difficile pour les nouveaux.",
      options_json: { notes: "Confluence only : centralisation, intégration Jira, coût licence supplémentaire.\nNotion : flexible, bonne UX, moins structuré.\nDocs-as-code (Docusaurus dans le repo) : versionné avec le code, friction à l'écriture." },
      decision_text: "Confluence comme outil principal pour la documentation d'architecture et les ADRs. Les README restent dans les repos pour la documentation technique de proximité.",
      rationale: "L'intégration Confluence/Jira facilite la traçabilité décision → ticket. Les README resteront pour la documentation technique courante — deux niveaux de documentation complémentaires.",
      decider: "Engineering Manager",
      stakeholders: ["Toutes les équipes tech"],
      decided_at: "2026-06-10T10:00:00Z",
    },
    {
      title: "Stratégie de cache pour les APIs haute fréquence",
      status: "proposed",
      context: "Trois endpoints représentent 70% du trafic entrant. Temps de réponse p95 : 800ms. Objectif : p95 < 200ms sans scaling horizontal supplémentaire.",
      options_json: { notes: "Redis : standard de l'industrie, déjà utilisé pour les sessions.\nMemcached : plus simple, pas de persistance — suffisant pour du cache read-only.\nCache HTTP (Varnish/Nginx) : côté réseau, transparent pour le backend." },
      decision_text: "",
      rationale: "",
      decider: "",
      stakeholders: ["Backend", "SRE", "Product"],
    },
  ];

  // Insérer les décisions
  const { data: inserted, error: insertError } = await supabase
    .from("decisions")
    .insert(
      decisions.map((d) => ({
        org_id: orgId,
        title: d.title,
        status: d.status,
        context: d.context,
        options_json: d.options_json,
        decision_text: d.decision_text || null,
        rationale: d.rationale || null,
        decider: d.decider || null,
        stakeholders: d.stakeholders,
        decided_at: "decided_at" in d ? d.decided_at : null,
        tags: [SEED_TAG],
      }))
    )
    .select("id, title");

  if (insertError) throw insertError;

  console.log(`✓ ${inserted!.length} décisions insérées.`);

  // Index des décisions par titre pour les liens
  const byTitle = new Map(inserted!.map((d) => [d.title, d.id]));

  // Liens entre décisions (relations sémantiquement cohérentes)
  const links = [
    // La révision TDD remplace la décision initiale
    {
      from: "Révision de la politique de TDD après bilan Q2",
      to: "Stratégie de test : TDD vs test-after",
      relation: "supersedes",
    },
    // Le rétablissement SMS renverse la suppression
    {
      from: "Rétablissement des notifications SMS pour les alertes critiques",
      to: "Suppression du service de notifications par SMS",
      relation: "supersedes",
    },
    // Migration micro-services liée au choix cloud
    {
      from: "Migration vers une architecture micro-services",
      to: "Provider cloud : AWS vs GCP pour le nouveau cluster",
      relation: "relates_to",
    },
    // Feature flags liés à l'i18n (déploiements progressifs par région)
    {
      from: "Gestion des feature flags",
      to: "Stratégie d'internationalisation (i18n)",
      relation: "relates_to",
    },
    // Monitoring lié au cluster GCP
    {
      from: "Outil de monitoring : Datadog vs Grafana/Prometheus",
      to: "Provider cloud : AWS vs GCP pour le nouveau cluster",
      relation: "relates_to",
    },
    // Archivage RGPD conflicte avec la suppression SMS (données à conserver)
    {
      from: "Archivage des données utilisateur après inactivité",
      to: "Rétablissement des notifications SMS pour les alertes critiques",
      relation: "conflicts_with",
    },
  ];

  const linkRows = links
    .map((l) => ({
      decision_id: byTitle.get(l.from),
      related_decision_id: byTitle.get(l.to),
      relation: l.relation,
    }))
    .filter((l) => l.decision_id && l.related_decision_id);

  if (linkRows.length > 0) {
    const { error: linkError } = await supabase
      .from("decision_links")
      .insert(linkRows as { decision_id: string; related_decision_id: string; relation: string }[]);
    if (linkError) throw linkError;
    console.log(`✓ ${linkRows.length} liens insérés.`);
  }

  console.log("Seed terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
