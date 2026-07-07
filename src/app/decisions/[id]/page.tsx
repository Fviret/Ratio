import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DecisionLinks, type LinkEntry } from "./decision-links";
import { DeleteDecisionButton } from "./delete-decision-button";
import { updateDecisionStatus } from "../actions";

const STATUS_ORDER = ["proposed", "decided", "revisited", "reversed"] as const;
type Status = (typeof STATUS_ORDER)[number];

const STATUS_LABELS: Record<Status, string> = {
  proposed: "Proposée",
  decided: "Décidée",
  revisited: "Revisitée",
  reversed: "Renversée",
};

const NEXT_LABEL: Partial<Record<Status, string>> = {
  proposed: "Passer en Décidée",
  decided: "Passer en Revisitée",
  revisited: "Passer en Renversée",
};

const NEXT_STATUS: Partial<Record<Status, Status>> = {
  proposed: "decided",
  decided: "revisited",
  revisited: "reversed",
};

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
  const [
    { data: fwdLinks, error: fwdError },
    { data: revLinks, error: revError },
  ] = await Promise.all([
    supabase
      .from("decision_links")
      .select("relation, related_decision_id")
      .eq("decision_id", id),
    supabase
      .from("decision_links")
      .select("relation, decision_id")
      .eq("related_decision_id", id),
  ]);
  if (fwdError) throw fwdError;
  if (revError) throw revError;

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

  const currentStatus = decision.status as Status;
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const nextStatus = NEXT_STATUS[currentStatus];

  return (
    <div className="mx-auto w-full max-w-2xl p-4 py-12 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{decision.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{STATUS_LABELS[currentStatus]}</Badge>
              <Link
                href={`/decisions/${id}/edit`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Modifier
              </Link>
              <DeleteDecisionButton id={id} />
            </div>
          </div>
          <CardDescription>
            {new Date(decision.created_at).toLocaleDateString("fr-FR")}
          </CardDescription>

          {/* Stepper */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center">
              {STATUS_ORDER.map((s, i) => {
                const done = i < currentIndex;
                const active = i === currentIndex;
                return (
                  <Fragment key={s}>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-semibold",
                          done && "border-primary bg-primary text-primary-foreground",
                          active && "border-primary bg-primary text-primary-foreground ring-2 ring-primary/25",
                          !done && !active && "border-muted-foreground/25 text-muted-foreground/40",
                        )}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      <span
                        className={cn(
                          "text-xs whitespace-nowrap",
                          (done || active) ? "font-medium" : "text-muted-foreground/40",
                        )}
                      >
                        {STATUS_LABELS[s]}
                      </span>
                    </div>
                    {i < STATUS_ORDER.length - 1 && (
                      <div
                        className={cn(
                          "mb-4 h-0.5 flex-1 mx-1",
                          i < currentIndex ? "bg-primary" : "bg-muted-foreground/20",
                        )}
                      />
                    )}
                  </Fragment>
                );
              })}
            </div>

            {nextStatus && (
              <form action={updateDecisionStatus}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value={nextStatus} />
                <button
                  type="submit"
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent/50"
                >
                  {NEXT_LABEL[currentStatus]}
                </button>
              </form>
            )}
          </div>
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
