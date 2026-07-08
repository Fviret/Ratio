import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { DemoDecisionsList } from "./demo-decisions-list";

export const metadata: Metadata = { title: "Démo — Ratio" };

export default async function DemoPage() {
  const demoOrgId = process.env.DEMO_ORG_ID;
  if (!demoOrgId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-muted-foreground">
        Mode démo non configuré — <code className="ml-1">DEMO_ORG_ID</code> manquant.
      </div>
    );
  }

  const supabase = createAdminClient();
  const { data: decisions, error } = await supabase
    .from("decisions")
    .select("id, title, decider, status, created_at")
    .eq("org_id", demoOrgId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 py-12">
      <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
        <span className="font-semibold">Mode démo</span> — lecture seule ·{" "}
        <Link href="/login" className="underline underline-offset-2">
          Se connecter
        </Link>{" "}
        pour créer votre espace
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Décisions</h1>
      </div>

      <DemoDecisionsList decisions={decisions ?? []} />
    </div>
  );
}
