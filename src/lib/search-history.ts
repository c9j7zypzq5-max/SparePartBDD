const STORAGE_KEY = "search_history";
const MAX_ENTRIES = 5;

export type SearchHistoryEntry = {
  term: string;
  timestamp: number;
};

export function readSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addSearchHistory(term: string): void {
  const trimmed = term.trim();
  if (!trimmed) return;
  const history = readSearchHistory().filter((e) => e.term !== trimmed);
  history.unshift({ term: trimmed, timestamp: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
}

export function removeSearchHistory(term: string): void {
  const history = readSearchHistory().filter((e) => e.term !== term);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
