import type { Metadata } from "next";
import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { DecisionsList } from "./decisions-list";

export const metadata: Metadata = { title: "Décisions" };

export default async function DecisionsPage() {
  const { supabase, orgId } = await requireOrgUser();

  const { data: decisions, error } = await supabase
    .from("decisions")
    .select("id, title, decider, status, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Décisions</h1>
        <Link href="/decisions/new" className={buttonVariants()}>
          Nouvelle décision
        </Link>
      </div>
      <DecisionsList decisions={decisions ?? []} />
    </div>
  );
}
