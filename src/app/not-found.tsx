import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-lg font-semibold">Page introuvable.</h2>
      <Link href="/" className={buttonVariants()}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
