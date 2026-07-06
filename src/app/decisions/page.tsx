import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

      {!decisions || decisions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune décision enregistrée pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {decisions.map((decision) => (
            <Link key={decision.id} href={`/decisions/${decision.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{decision.title}</CardTitle>
                    <Badge variant="secondary">{decision.status}</Badge>
                  </div>
                  {decision.decider && (
                    <CardDescription>
                      Décidé par {decision.decider}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {new Date(decision.created_at).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
