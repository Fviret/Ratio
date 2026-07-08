import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = {
  proposed: "Proposée",
  decided: "Décidée",
  revisited: "Revisitée",
  reversed: "Renversée",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const demoOrgId = process.env.DEMO_ORG_ID;
  if (!demoOrgId) return { title: "Démo" };
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("decisions")
    .select("title")
    .eq("id", id)
    .eq("org_id", demoOrgId)
    .maybeSingle();
  return { title: data?.title ?? "Décision" };
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default async function DemoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const demoOrgId = process.env.DEMO_ORG_ID;
  if (!demoOrgId) notFound();

  const supabase = createAdminClient();
  const { data: decision, error } = await supabase
    .from("decisions")
    .select(
      "title, status, context, options_json, decision_text, rationale, decider, stakeholders, decided_at, created_at",
    )
    .eq("id", id)
    .eq("org_id", demoOrgId)
    .maybeSingle();

  if (error) throw error;
  if (!decision) notFound();

  const options = (decision.options_json as { notes?: string } | null)?.notes;

  return (
    <div className="mx-auto w-full max-w-2xl p-4 py-12 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/demo" className="text-sm text-muted-foreground hover:text-foreground">
          ← Décisions
        </Link>
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          Mode démo ·{" "}
          <Link href="/login" className="underline underline-offset-2">
            Se connecter
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{decision.title}</CardTitle>
            <Badge variant="secondary">
              {STATUS_LABELS[decision.status] ?? decision.status}
            </Badge>
          </div>
          <CardDescription>
            {new Date(decision.created_at).toLocaleDateString("fr-FR")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Contexte" value={decision.context} />
          <Field label="Options envisagées" value={options} />
          <Field label="Décision" value={decision.decision_text} />
          <Field label="Rationale" value={decision.rationale} />
          <Field label="Décideur" value={decision.decider} />
          <Field
            label="Parties prenantes"
            value={decision.stakeholders?.join(", ")}
          />
          <Field
            label="Date de décision"
            value={
              decision.decided_at
                ? new Date(decision.decided_at).toLocaleDateString("fr-FR")
                : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
