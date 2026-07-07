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
import { DecisionLinks, type LinkEntry } from "./decision-links";

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
      "title, status, context, options_json, decision_text, rationale, decider, stakeholders, source_raw, decided_at, created_at",
    )
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) throw error;
  if (!decision) notFound();

  // Liens dans les deux sens
  const [{ data: fwdLinks }, { data: revLinks }] = await Promise.all([
    supabase
      .from("decision_links")
      .select("relation, related_decision_id")
      .eq("decision_id", id),
    supabase
      .from("decision_links")
      .select("relation, decision_id")
      .eq("related_decision_id", id),
  ]);

  const allRelatedIds = [
    ...(fwdLinks?.map((l) => l.related_decision_id) ?? []),
    ...(revLinks?.map((l) => l.decision_id) ?? []),
  ];

  const relatedDecisionsMap = new Map<string, { title: string }>();
  if (allRelatedIds.length > 0) {
    const { data: related } = await supabase
      .from("decisions")
      .select("id, title")
      .in("id", allRelatedIds)
      .eq("org_id", orgId);
    related?.forEach((d) => relatedDecisionsMap.set(d.id, d));
  }

  const links: LinkEntry[] = [
    ...(fwdLinks?.map((l) => ({
      sourceId: id,
      targetId: l.related_decision_id,
      relation: l.relation,
      relatedId: l.related_decision_id,
      relatedTitle: relatedDecisionsMap.get(l.related_decision_id)?.title ?? "Décision inconnue",
      direction: "forward" as const,
    })) ?? []),
    ...(revLinks?.map((l) => ({
      sourceId: l.decision_id,
      targetId: id,
      relation: l.relation,
      relatedId: l.decision_id,
      relatedTitle: relatedDecisionsMap.get(l.decision_id)?.title ?? "Décision inconnue",
      direction: "reverse" as const,
    })) ?? []),
  ];

  const options = (decision.options_json as { notes?: string } | null)?.notes;

  return (
    <div className="mx-auto w-full max-w-2xl p-4 py-12 flex flex-col gap-6">
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
          <Field label="Thread source" value={decision.source_raw} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Décisions liées</CardTitle>
        </CardHeader>
        <CardContent>
          <DecisionLinks decisionId={id} links={links} />
        </CardContent>
      </Card>
    </div>
  );
}
