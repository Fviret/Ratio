import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_QUERY_LENGTH = 500;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Erreur récupération profil:", profileError);
    return NextResponse.json({ error: "erreur serveur" }, { status: 500 });
  }
  if (!profile?.org_id) {
    return NextResponse.json({ error: "organisation introuvable" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "corps de requête JSON invalide" }, { status: 400 });
  }

  const query =
    typeof (body as { query?: unknown })?.query === "string"
      ? (body as { query: string }).query.trim()
      : "";
  if (!query) {
    return NextResponse.json({ error: "champ 'query' manquant" }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `requête trop longue (max ${MAX_QUERY_LENGTH} caractères)` },
      { status: 400 },
    );
  }

  const { data: results, error } = await supabase.rpc("search_decisions", {
    query_text: query,
    p_org_id: profile.org_id,
    p_limit: 10,
  });

  if (error) {
    console.error("Erreur lors de la recherche:", error);
    return NextResponse.json({ error: "erreur lors de la recherche" }, { status: 500 });
  }

  return NextResponse.json({ results: results ?? [] });
}
