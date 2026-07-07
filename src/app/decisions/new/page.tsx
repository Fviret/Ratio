import { requireOrgUser } from "@/lib/auth";
import { NewDecisionForm } from "./new-decision-form";

export default async function NewDecisionPage() {
  await requireOrgUser();

  return <NewDecisionForm />;
}
