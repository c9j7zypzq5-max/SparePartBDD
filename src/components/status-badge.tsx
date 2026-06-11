const LABELS: Record<string, { text: string; className: string }> = {
  active: {
    text: "Encore fabriquée",
    className: "bg-green-100 text-green-800",
  },
  obsolete: {
    text: "Obsolète",
    className: "bg-orange-100 text-orange-800",
  },
  end_of_life: {
    text: "Fin de vie",
    className: "bg-red-100 text-red-800",
  },
  unknown: {
    text: "Statut inconnu",
    className: "bg-zinc-100 text-zinc-600",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const label = LABELS[status] ?? LABELS.unknown;
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${label.className}`}
    >
      {label.text}
    </span>
  );
}
