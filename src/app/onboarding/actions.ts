"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name })
    .select("id")
    .single();
  if (orgError) throw orgError;

  const { error: userError } = await supabase.from("users").upsert({
    id: user.id,
    email: user.email,
    org_id: org.id,
    role: "owner",
  });
  if (userError) throw userError;

  redirect("/");
}

export async function joinOrganization(formData: FormData) {
  const orgId = String(formData.get("org_id") ?? "");
  if (!orgId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("users").upsert({
    id: user.id,
    email: user.email,
    org_id: orgId,
    role: "member",
  });
  if (error) throw error;

  redirect("/");
}
