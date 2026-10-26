export type WatchlistEntry = {
  reference: string;
  manufacturer: string;
  manufacturerSlug: string;
  partSlug: string;
  name: string;
  status: string;
  minPrice?: number;
  currency?: string;
  dateAdded: string;
  snapshotDate: string;
};

const STORAGE_KEY = "watchlist";

export function readWatchlist(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function writeWatchlist(entries: WatchlistEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function isInWatchlist(manufacturerSlug: string, partSlug: string): boolean {
  return readWatchlist().some(
    (e) => e.manufacturerSlug === manufacturerSlug && e.partSlug === partSlug,
  );
}

/** Ajoute les entrées absentes de la liste (sans retirer celles déjà suivies). Renvoie le nombre ajouté. */
export function addToWatchlist(entries: WatchlistEntry[]): number {
  const list = readWatchlist();
  const known = new Set(list.map((e) => `${e.manufacturerSlug}/${e.partSlug}`));
  const added = entries.filter((e) => {
    const key = `${e.manufacturerSlug}/${e.partSlug}`;
    if (known.has(key)) return false;
    known.add(key);
    return true;
  });
  if (added.length > 0) writeWatchlist([...list, ...added]);
  return added.length;
}

export function toggleWatchlist(entry: WatchlistEntry): boolean {
  const list = readWatchlist();
  const idx = list.findIndex(
    (e) => e.manufacturerSlug === entry.manufacturerSlug && e.partSlug === entry.partSlug,
  );
  if (idx !== -1) {
    list.splice(idx, 1);
    writeWatchlist(list);
    return false;
  }
  list.push(entry);
  writeWatchlist(list);
  return true;
}
