import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_QUERY_LENGTH = 500;

export async function POST(request: NextRequest) {
  const demoOrgId = process.env.DEMO_ORG_ID;
  if (!demoOrgId) {
    return NextResponse.json({ results: [] });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const query = (body as Record<string, unknown>)?.query;
  if (typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "Paramètre query manquant." }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Requête trop longue." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_decisions", {
    query_text: query.trim(),
    p_org_id: demoOrgId,
    p_limit: 10,
  });

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la recherche." }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [] });
}
