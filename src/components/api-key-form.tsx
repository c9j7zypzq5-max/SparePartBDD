"use client";

import { useState } from "react";
import { PLANS } from "@/lib/plans";

type Step = "idle" | "loading" | "done" | "error";

interface KeyResult {
  key:    string;
  plan:   string;
  quota:  number;
}

export function ApiKeyForm() {
  const [email,   setEmail]   = useState("");
  const [plan,    setPlan]    = useState<"free" | "pro" | "enterprise">("free");
  const [step,    setStep]    = useState<Step>("idle");
  const [result,  setResult]  = useState<KeyResult | null>(null);
  const [copied,  setCopied]  = useState(false);
  const [errMsg,  setErrMsg]  = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStep("loading");
    setErrMsg("");

    try {
      if (plan === "free") {
        const res = await fetch("/api/developers/keys", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) { setStep("error"); setErrMsg(data.error ?? "Erreur inconnue"); return; }
        setResult({ key: data.key, plan: "free", quota: data.quota });
        setStep("done");
      } else {
        const res = await fetch("/api/stripe/checkout", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email, plan }),
        });
        const data = await res.json();
        if (!res.ok) { setStep("error"); setErrMsg(data.error ?? "Erreur inconnue"); return; }
        window.location.href = data.url;
      }
    } catch {
      setStep("error");
      setErrMsg("Erreur réseau. Réessayez.");
    }
  }

  function copyKey() {
    if (!result) return;
    navigator.clipboard.writeText(result.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (step === "done" && result) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-6">
        <p className="font-semibold text-green-900">Votre clé API est prête !</p>
        <p className="mt-1 text-sm text-green-800">
          Copiez-la maintenant — elle ne sera plus affichée.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-lg border border-green-300 bg-white px-3 py-2 font-mono text-sm text-zinc-800">
            {result.key}
          </code>
          <button
            onClick={copyKey}
            className="shrink-0 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800"
          >
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
        <p className="mt-3 text-xs text-green-700">
          Plan : <strong>{result.plan}</strong> · {result.quota.toLocaleString()} req/mois
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@entreprise.com"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Plan</label>
        <div className="grid grid-cols-3 gap-2">
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                plan === p.id
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {p.name}
              {p.price != null && (
                <span className="block text-xs font-normal">
                  {p.price === 0 ? "Gratuit" : `${p.price} €/mois`}
                </span>
              )}
              {p.price == null && <span className="block text-xs font-normal">Sur devis</span>}
            </button>
          ))}
        </div>
      </div>

      {step === "error" && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={step === "loading"}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {step === "loading"
          ? "Création en cours…"
          : plan === "free"
            ? "Obtenir ma clé gratuite"
            : `Passer au plan ${plan === "pro" ? "Pro" : "Enterprise"} →`}
      </button>
    </form>
  );
}
