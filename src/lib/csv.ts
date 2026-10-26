export type CsvValue = string | number | null | undefined;

/**
 * Cellule CSV échappée (RFC 4180). Une apostrophe neutralise les valeurs
 * qu'un tableur interpréterait comme une formule (=, +, -, @ en tête) :
 * protection contre l'injection CSV.
 */
export function csvCell(value: CsvValue): string {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const escaped = value.replace(/"/g, '""');
  return /^[=+\-@\t\r\n]/.test(value) ? `"'${escaped}"` : `"${escaped}"`;
}

/** BOM UTF-8 : sans lui, Excel ouvre le fichier en ANSI et casse les accents. */
export const UTF8_BOM = "\uFEFF";

export function toCsv(rows: CsvValue[][]): string {
  return UTF8_BOM + rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

/** Déclenche le téléchargement d'un fichier texte (navigateur uniquement). */
export function downloadTextFile(content: string, filename: string, type = "text/csv;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
