import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  extractDecisions,
  ExtractionRefusedError,
  ExtractionUnstructuredError,
} from "@/lib/extract";

const MAX_TEXT_LENGTH = 20_000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "corps de requête JSON invalide" }, { status: 400 });
  }

  const text =
    typeof (body as { text?: unknown })?.text === "string"
      ? (body as { text: string }).text.trim()
      : "";
  if (!text) {
    return NextResponse.json({ error: "champ 'text' manquant" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `thread trop long (max ${MAX_TEXT_LENGTH} caractères)` },
      { status: 400 },
    );
  }

  try {
    const result = await extractDecisions(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de l'extraction:", error);

    if (error instanceof ExtractionRefusedError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    if (error instanceof ExtractionUnstructuredError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

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
