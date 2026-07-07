import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { supabase, orgId } = await requireOrgUser();
  const { data } = await supabase
    .from("decisions")
    .select("title")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();
  return { title: data ? `Modifier — ${data.title}` : "Modifier" };
}
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateDecision } from "../../actions";

export default async function EditDecisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, orgId } = await requireOrgUser();

  const { data: decision, error } = await supabase
    .from("decisions")
    .select(
      "title, context, options_json, decision_text, rationale, decider, stakeholders",
    )
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) throw error;
  if (!decision) notFound();

  const options = (decision.options_json as { notes?: string } | null)?.notes ?? "";

  return (
    <div className="mx-auto w-full max-w-2xl p-4 py-12 flex flex-col gap-6">
      <Link
        href={`/decisions/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Retour à la décision
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Modifier la décision</CardTitle>
          <CardDescription>
            Mets à jour les champs puis enregistre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateDecision} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={id} />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                Titre
              </label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={decision.title}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="context" className="text-sm font-medium">
                Contexte — pourquoi maintenant ?
              </label>
              <Textarea
                id="context"
                name="context"
                rows={3}
                defaultValue={decision.context ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="options" className="text-sm font-medium">
                Options envisagées (avantages / inconvénients)
              </label>
              <Textarea
                id="options"
                name="options"
                rows={3}
                defaultValue={options}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="decision_text" className="text-sm font-medium">
                Décision
              </label>
              <Textarea
                id="decision_text"
                name="decision_text"
                rows={2}
                defaultValue={decision.decision_text ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="rationale" className="text-sm font-medium">
                Rationale — le pourquoi
              </label>
              <Textarea
                id="rationale"
                name="rationale"
                rows={2}
                defaultValue={decision.rationale ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="decider" className="text-sm font-medium">
                Décideur
              </label>
              <Input
                id="decider"
                name="decider"
                defaultValue={decision.decider ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="stakeholders" className="text-sm font-medium">
                Stakeholders (séparés par des virgules)
              </label>
              <Input
                id="stakeholders"
                name="stakeholders"
                defaultValue={decision.stakeholders?.join(", ") ?? ""}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className={buttonVariants()}
              >
                Enregistrer
              </button>
              <Link
                href={`/decisions/${id}`}
                className={buttonVariants({ variant: "outline" })}
              >
                Annuler
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
