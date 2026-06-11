"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900"
      aria-label="Imprimer la fiche"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M4 2a1 1 0 0 0-1 1v1H2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 0 0-1-1H4Zm8 3H4V3h8v2ZM4 9a1 1 0 0 0-1 1v3h10v-3a1 1 0 0 0-1-1H4Zm1 2h6v1H5v-1Z" clipRule="evenodd" />
      </svg>
      Imprimer la fiche
    </button>
  );
}
