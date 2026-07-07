"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

export async function linkDecision(formData: FormData) {
  const { supabase, orgId } = await requireOrgUser();

  const decisionId = String(formData.get("decision_id"));
  const relatedId = String(formData.get("related_id"));
  const relation = String(formData.get("relation"));

  // Vérifier que les deux décisions appartiennent à l'org
  const { data: decisions } = await supabase
    .from("decisions")
    .select("id")
    .in("id", [decisionId, relatedId])
    .eq("org_id", orgId);

  if (!decisions || decisions.length !== 2) throw new Error("Décision introuvable");

  const { error } = await supabase
    .from("decision_links")
    .insert({ decision_id: decisionId, related_decision_id: relatedId, relation });
  if (error) throw error;

  revalidatePath(`/decisions/${decisionId}`);
  revalidatePath(`/decisions/${relatedId}`);
}

const VALID_TRANSITIONS: Record<string, string> = {
  proposed: "decided",
  decided: "revisited",
  revisited: "reversed",
};

export async function updateDecisionStatus(formData: FormData) {
  const { supabase, orgId } = await requireOrgUser();

  const id = String(formData.get("id"));
  const newStatus = String(formData.get("status"));

  const { data: current } = await supabase
    .from("decisions")
    .select("status")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!current) throw new Error("Décision introuvable");
  if (VALID_TRANSITIONS[current.status] !== newStatus) {
    throw new Error("Transition de statut invalide");
  }

  const { error } = await supabase
    .from("decisions")
    .update({ status: newStatus })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;

  revalidatePath(`/decisions/${id}`);
  revalidatePath("/decisions");
}

export async function unlinkDecision(formData: FormData) {
  const { supabase, orgId } = await requireOrgUser();

  const decisionId = String(formData.get("decision_id"));
  const relatedId = String(formData.get("related_id"));
  const relation = String(formData.get("relation"));

  // Vérifier que la décision source appartient à l'org
  const { data: decision } = await supabase
    .from("decisions")
    .select("id")
    .eq("id", decisionId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!decision) throw new Error("Décision introuvable");

  const { error } = await supabase
    .from("decision_links")
    .delete()
    .eq("decision_id", decisionId)
    .eq("related_decision_id", relatedId)
    .eq("relation", relation);
  if (error) throw error;

  revalidatePath(`/decisions/${decisionId}`);
  revalidatePath(`/decisions/${relatedId}`);
}
