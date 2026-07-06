import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOrganization, joinOrganization } from "./actions";
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

  const { data: organizations, error: organizationsError } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");
  if (organizationsError) throw organizationsError;

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

      {organizations && organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rejoindre une organisation existante</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={joinOrganization} className="flex flex-col gap-4">
              <select
                name="org_id"
                required
                className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="outline">
                Rejoindre
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
