import type { Metadata } from "next";
import Link from "next/link";
import { UsageDashboard } from "@/components/usage-dashboard";

export const metadata: Metadata = {
  title: "Suivi d'usage API — SparePartSearch",
  description: "Consultez votre consommation de requêtes API en temps réel.",
  robots: { index: false },
};

export default function UsagePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Suivi d'usage API</h1>
      <p className="mt-2 text-zinc-600">
        Entrez votre clé API pour consulter votre consommation. La clé n'est
        envoyée qu'à notre serveur et la consultation ne décompte aucune requête.
      </p>
      <div className="mt-8">
        <UsageDashboard />
      </div>
      <p className="mt-8 text-sm text-zinc-500">
        Pas encore de clé ?{" "}
        <Link href="/developers" className="font-medium text-blue-600 hover:underline">
          Obtenir une clé API →
        </Link>
      </p>
    </div>
  );
}
