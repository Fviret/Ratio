import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("users")
    .select("org_id, organizations (name)")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!profile?.org_id) redirect("/onboarding");

  const orgName = (
    profile.organizations as unknown as { name: string } | null
  )?.name;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <p className="text-sm text-muted-foreground">
        Connecté en tant que <span className="font-medium">{user.email}</span>{" "}
        — organisation <span className="font-medium">{orgName}</span>
      </p>
      <Link href="/decisions" className={buttonVariants()}>
        Voir les décisions
      </Link>
      <form action={signOut}>
        <Button variant="outline" type="submit">
          Se déconnecter
        </Button>
      </form>
    </div>
  );
}
