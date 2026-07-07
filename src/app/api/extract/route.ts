import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DECISION_ITEM_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Titre court de la décision" },
    context: { type: "string", description: "Le pourquoi maintenant — contexte de la décision" },
    options: {
      type: "string",
      description: "Options envisagées et leurs avantages/inconvénients, résumés en texte libre",
    },
    decision_text: { type: "string", description: "Ce qui a été décidé" },
    rationale: { type: "string", description: "Le pourquoi de la décision" },
    decider: { type: "string", description: "Qui a tranché (nom ou rôle), chaîne vide si non identifiable" },
    stakeholders: {
      type: "array",
      items: { type: "string" },
      description: "Personnes impliquées ou consultées, en dehors du décideur",
    },
  },
  required: [
    "title",
    "context",
    "options",
    "decision_text",
    "rationale",
    "decider",
    "stakeholders",
  ],
  additionalProperties: false,
} as const;

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: ["decision_found", "no_clear_decision", "multiple_decisions"],
      description:
        "decision_found : une seule décision claire dans le thread. " +
        "no_clear_decision : le thread ne contient pas de décision identifiable (discussion en cours, question ouverte, etc.). " +
        "multiple_decisions : le thread contient plusieurs décisions distinctes.",
    },
    message: {
      type: "string",
      description:
        "Message explicatif à destination de l'utilisateur quand status vaut no_clear_decision ou multiple_decisions. Chaîne vide si status vaut decision_found.",
    },
    decisions: {
      type: "array",
      items: DECISION_ITEM_SCHEMA,
      description:
        "Vide si no_clear_decision, un seul élément si decision_found, un élément par décision si multiple_decisions.",
    },
  },
  required: ["status", "message", "decisions"],
  additionalProperties: false,
} as const;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "champ 'text' manquant" }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      thinking: { type: "disabled" },
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: EXTRACTION_SCHEMA },
      },
      system:
        "Tu extrais une ou plusieurs fiches décision structurées à partir d'un thread de discussion brut (Teams/Slack copié). " +
        "Réponds uniquement avec les champs demandés, en français, en te basant strictement sur le contenu du thread. " +
        "N'invente aucune information absente du texte.\n\n" +
        "Détermine d'abord le statut :\n" +
        "- Si le thread ne contient aucune décision claire et tranchée (discussion en cours, question ouverte, simple échange d'idées) : " +
        "status = \"no_clear_decision\", decisions = [], et message explique pourquoi (ex. \"Ce thread contient une discussion en cours mais aucune décision tranchée.\").\n" +
        "- Si le thread contient exactement une décision claire : status = \"decision_found\", decisions = [cette décision], message = \"\".\n" +
        "- Si le thread contient plusieurs décisions distinctes (sur des sujets différents) : status = \"multiple_decisions\", " +
        "decisions = [une entrée par décision], et message résume combien de décisions ont été trouvées.",
      messages: [{ role: "user", content: text }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "extraction refusée par le modèle" },
        { status: 422 },
      );
    }

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "réponse du modèle non structurée" },
        { status: 502 },
      );
    }

    return NextResponse.json(response.parsed_output);
  } catch (error) {
    console.error("Erreur lors de l'extraction:", error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `erreur API Anthropic : ${error.message}` },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "erreur inattendue lors de l'extraction" },
      { status: 500 },
    );
  }
}
