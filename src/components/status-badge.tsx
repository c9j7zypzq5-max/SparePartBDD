import { statusLabel } from "@/lib/format";

const STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  obsolete: "bg-orange-100 text-orange-800",
  unknown: "bg-zinc-100 text-zinc-600",
};

const SIZES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

/** Statut de fabrication : seul composant d'affichage, mêmes libellés et couleurs partout. */
export function StatusBadge({ status, size = "md" }: { status: string; size?: keyof typeof SIZES }) {
  const style = STYLES[status] ?? STYLES.unknown;
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full font-medium ${SIZES[size]} ${style}`}
    >
      {statusLabel(status)}
    </span>
  );
}
