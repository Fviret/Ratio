import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EXTRACTION_SCHEMA = {
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
      max_tokens: 2048,
      thinking: { type: "disabled" },
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: EXTRACTION_SCHEMA },
      },
      system:
        "Tu extrais une fiche décision structurée à partir d'un thread de discussion brut (Teams/Slack copié). " +
        "Réponds uniquement avec les champs demandés, en français, en te basant strictement sur le contenu du thread. " +
        "N'invente aucune information absente du texte.",
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
