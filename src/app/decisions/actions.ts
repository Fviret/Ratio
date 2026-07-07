"use server";

import { redirect } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";

export async function createDecision(formData: FormData) {
  const { supabase, user, orgId } = await requireOrgUser();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const stakeholders = String(formData.get("stakeholders") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { data: decision, error } = await supabase
    .from("decisions")
    .insert({
      org_id: orgId,
      created_by: user.id,
      title,
      context: String(formData.get("context") ?? "") || null,
      options_json: { notes: String(formData.get("options") ?? "") },
      decision_text: String(formData.get("decision_text") ?? "") || null,
      rationale: String(formData.get("rationale") ?? "") || null,
      decider: String(formData.get("decider") ?? "") || null,
      stakeholders,
      source_raw: String(formData.get("source_raw") ?? "") || null,
    })
    .select("id")
    .single();
  if (error) throw error;

  redirect(`/decisions/${decision.id}`);
}
