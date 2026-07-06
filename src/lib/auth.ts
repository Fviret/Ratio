import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireOrgUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!profile?.org_id) redirect("/onboarding");

  return { supabase, user, orgId: profile.org_id as string };
}
