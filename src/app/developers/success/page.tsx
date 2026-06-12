import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Abonnement activé — SparePartSearch" };

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="text-5xl">🎉</div>
      <h1 className="mt-4 text-2xl font-bold">Abonnement activé !</h1>
      <p className="mt-3 text-zinc-600">
        Votre clé API a été activée. Un email de confirmation vous a été envoyé
        par Stripe avec les détails de votre abonnement.
      </p>
      <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        La clé elle-même vous a été transmise à la création du compte. Si vous
        l'avez perdue, contactez-nous pour la régénérer.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/developers"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          ← Documentation API
        </Link>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
