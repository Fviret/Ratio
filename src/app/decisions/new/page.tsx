import { createDecision } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewDecisionPage() {
  return (
    <div className="mx-auto max-w-2xl p-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle décision</CardTitle>
          <CardDescription>
            Colle ou résume une décision déjà prise — pas besoin qu&apos;elle
            soit parfaite, tu pourras y revenir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createDecision} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                Titre
              </label>
              <Input id="title" name="title" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="context" className="text-sm font-medium">
                Contexte — pourquoi maintenant ?
              </label>
              <Textarea id="context" name="context" rows={3} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="options" className="text-sm font-medium">
                Options envisagées (avantages / inconvénients)
              </label>
              <Textarea id="options" name="options" rows={3} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="decision_text" className="text-sm font-medium">
                Décision
              </label>
              <Textarea id="decision_text" name="decision_text" rows={2} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="rationale" className="text-sm font-medium">
                Rationale — le pourquoi
              </label>
              <Textarea id="rationale" name="rationale" rows={2} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="decider" className="text-sm font-medium">
                Décideur
              </label>
              <Input id="decider" name="decider" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="stakeholders" className="text-sm font-medium">
                Stakeholders (séparés par des virgules)
              </label>
              <Input id="stakeholders" name="stakeholders" />
            </div>

            <Button type="submit">Enregistrer</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
