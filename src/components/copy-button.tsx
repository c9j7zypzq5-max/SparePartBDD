"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";

/** Copie une valeur (référence…) dans le presse-papiers, avec confirmation. */
export function CopyButton({ value, label = "Copier la référence" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, refus) : rien à faire.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={label}
      aria-label={label}
      className="no-print inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-800"
    >
      {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <CopyIcon />}
      <span aria-live="polite">{copied ? "Copiée" : "Copier"}</span>
    </button>
  );
}
