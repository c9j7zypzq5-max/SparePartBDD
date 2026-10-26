"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type FilterOption = { value: string; label: string; href: string };

/**
 * Liste déroulante appliquée dès le changement (navigation vers l'URL
 * précalculée de l'option). Sans JavaScript, le formulaire parent garde un
 * bouton de validation.
 */
export function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: FilterOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        // Remonté quand la page change de filtre : la valeur suit l'URL.
        key={value}
        name={name}
        defaultValue={value}
        aria-busy={pending}
        onChange={(e) => {
          const option = options.find((o) => o.value === e.target.value);
          if (option) startTransition(() => router.push(option.href, { scroll: false }));
        }}
        className={`max-w-[14rem] rounded-full border bg-white py-1.5 pl-3 pr-8 text-sm transition ${
          value ? "border-zinc-900 font-medium text-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
        } ${pending ? "opacity-60" : ""}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Panneau de filtres : toujours visible sur grand écran, repliable sur mobile. */
export function FiltersPanel({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="filtres-recherche"
        className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 sm:hidden"
      >
        Filtres et tri
        {activeCount > 0 && (
          <span className="rounded-full bg-zinc-900 px-1.5 text-xs font-semibold text-white">{activeCount}</span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      <div id="filtres-recherche" className={`${open ? "mt-3 flex" : "hidden"} flex-col gap-2.5 sm:mt-0 sm:flex`}>
        {children}
      </div>
    </div>
  );
}
