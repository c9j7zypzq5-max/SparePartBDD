"use client";

import { useState } from "react";

export function SuggestionForm({ defaultReference = "" }: { defaultReference?: string }) {
  const [reference, setReference] = useState(defaultReference);
  const [manufacturer, setManufacturer] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.trim(), manufacturer: manufacturer.trim() }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="font-medium text-green-800">Suggestion envoyée, merci !</p>
        <p className="mt-1 text-sm text-green-700">
          Nous examinerons l&apos;ajout de cette référence au catalogue.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
      <p className="font-medium text-zinc-800">
        Vous ne trouvez pas cette référence ?
      </p>
      <p className="mt-1 text-sm text-zinc-600">
        Suggérez-la, nous l&apos;ajouterons au catalogue.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap gap-3">
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Référence"
          required
          className="flex-1 min-w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
        />
        <input
          type="text"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          placeholder="Fabricant (optionnel)"
          className="flex-1 min-w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading" || !reference.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {status === "loading" ? "Envoi…" : "Suggérer"}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-600">Une erreur est survenue, veuillez réessayer.</p>
      )}
    </div>
  );
}
