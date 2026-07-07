import type { Metadata } from "next";
import { requireOrgUser } from "@/lib/auth";
import { NewDecisionForm } from "./new-decision-form";

export const metadata: Metadata = { title: "Nouvelle décision" };

export default async function NewDecisionPage() {
  await requireOrgUser();

  return <NewDecisionForm />;
}
