import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Bienvenue" };
import { createOrganization } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (existingUserError) throw existingUserError;
  if (existingUser?.org_id) redirect("/");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Créer une organisation</CardTitle>
          <CardDescription>
            Tu es la première personne à te connecter — crée l&apos;espace de
            ton équipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createOrganization} className="flex flex-col gap-4">
            <Input name="name" required placeholder="Nom de l'organisation" />
            <Button type="submit">Créer</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
