const STORAGE_KEY = "compare_list";
const MAX_ITEMS = 3;

export type CompareEntry = {
  referenceRaw: string;
  name: string;
  manufacturerName: string;
  manufacturerSlug: string;
  slug: string;
  status: string;
};

export function readCompareList(): CompareEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function writeCompareList(entries: CompareEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function isInCompareList(manufacturerSlug: string, slug: string): boolean {
  return readCompareList().some((e) => e.manufacturerSlug === manufacturerSlug && e.slug === slug);
}

export function toggleCompare(entry: CompareEntry): "added" | "removed" | "full" {
  const list = readCompareList();
  const idx = list.findIndex((e) => e.manufacturerSlug === entry.manufacturerSlug && e.slug === entry.slug);
  if (idx !== -1) {
    list.splice(idx, 1);
    writeCompareList(list);
    window.dispatchEvent(new Event("compare-change"));
    return "removed";
  }
  if (list.length >= MAX_ITEMS) return "full";
  list.push(entry);
  writeCompareList(list);
  window.dispatchEvent(new Event("compare-change"));
  return "added";
}

export function clearCompareList(): void {
  writeCompareList([]);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("compare-change"));
}
