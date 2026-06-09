export function SearchBar({
  defaultValue = "",
  autoFocus = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  return (
    <form action="/recherche" method="get" className="flex w-full gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        required
        placeholder="Référence OEM (ex : 00754870, 11427953129) ou nom de pièce…"
        className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
      >
        Rechercher
      </button>
    </form>
  );
}
