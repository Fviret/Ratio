import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Utilisateur connecté → dashboard
  if (user) redirect("/decisions");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-0 px-4">
      {/* Hero */}
      <section className="flex w-full max-w-2xl flex-col items-center gap-8 py-24 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Les décisions de votre équipe,<br />
            <span className="text-primary">retrouvables en 10 secondes.</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Ratio capture le <em>pourquoi</em> de chaque décision produit depuis
            vos threads Slack ou Teams — et le ressort quand un vieux débat est rouvert.
          </p>
        </div>

        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Demander une démo
        </Link>
      </section>

      {/* Bénéfices */}
      <section className="w-full max-w-2xl border-t border-border py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Zéro friction à la saisie</p>
            <p className="text-sm text-muted-foreground">
              Colle un thread — Ratio extrait la décision structurée en quelques secondes grâce à l&apos;IA.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Recherche en langage naturel</p>
            <p className="text-sm text-muted-foreground">
              Retrouve une décision par mots-clés, contexte ou décideur — même plusieurs mois après.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Historique des statuts</p>
            <p className="text-sm text-muted-foreground">
              Chaque décision trace son évolution : proposée → décidée → revisitée → renversée.
            </p>
          </div>
        </div>
      </section>

      {/* CTA secondaire */}
      <section className="w-full max-w-2xl border-t border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium underline underline-offset-4 hover:text-foreground">
            Connexion
          </Link>
        </p>
      </section>
    </main>
  );
}
