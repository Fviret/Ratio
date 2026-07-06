import { notFound } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, orgId } = await requireOrgUser();

  const { data: decision, error } = await supabase
    .from("decisions")
    .select(
      "title, status, context, options_json, decision_text, rationale, decider, stakeholders, created_at",
    )
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) throw error;
  if (!decision) notFound();

  const options = (decision.options_json as { notes?: string } | null)?.notes;

  return (
    <div className="mx-auto max-w-2xl p-4 py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{decision.title}</CardTitle>
            <Badge variant="secondary">{decision.status}</Badge>
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
            label="Stakeholders"
            value={decision.stakeholders?.join(", ")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
