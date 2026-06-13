"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  readSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  type SearchHistoryEntry,
} from "@/lib/search-history";

interface Suggestion {
  name: string;
  referenceRaw: string;
  manufacturerName: string;
  status: string;
  url: string;
}

export function SearchBar({
  defaultValue = "",
  autoFocus = false,
  large = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  large?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2 || q === defaultValue) {
      setSuggestions([]);
      setActiveIndex(-1);
      if (focused) setHistory(readSearchHistory());
      return;
    }
    setHistory([]);
    setActiveIndex(-1);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data.hits ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, defaultValue, focused]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleFocus() {
    setFocused(true);
    if (query.trim().length < 2) {
      setHistory(readSearchHistory());
      setOpen(true);
    }
  }

  function handleBlur() {
    setFocused(false);
  }

  function handleDeleteHistory(term: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    removeSearchHistory(term);
    setHistory(readSearchHistory());
  }

  function handleSubmit() {
    if (query.trim()) addSearchHistory(query.trim());
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const showSug = open && suggestions.length > 0 && query.trim().length >= 2;
    const showHist = open && query.trim().length < 2 && history.length > 0;
    const items = showSug ? suggestions : showHist ? history : [];
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (showSug) {
        const s = suggestions[activeIndex];
        addSearchHistory(query.trim());
        setOpen(false);
        setActiveIndex(-1);
        router.push(s.url);
      } else if (showHist) {
        const h = history[activeIndex];
        addSearchHistory(h.term);
        setOpen(false);
        setActiveIndex(-1);
        router.push(`/recherche?q=${encodeURIComponent(h.term)}`);
      }
    }
  }

  const showHistory = open && query.trim().length < 2 && history.length > 0;
  const showSuggestions = open && suggestions.length > 0 && query.trim().length >= 2;

  const inputSize = large ? "px-5 py-4 text-lg" : "px-4 py-3 text-base";
  const buttonSize = large ? "px-7 py-4 text-lg" : "px-6 py-3";

  return (
    <div ref={containerRef} className="relative w-full">
      <form action="/recherche" method="get" className="flex w-full gap-2" onSubmit={handleSubmit}>
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          required
          autoComplete="off"
          placeholder="Référence (ex : 6ES7214-1AG40, PWR-C1-715WAC) ou nom de pièce…"
          className={`w-full rounded-xl border border-zinc-300 bg-white text-zinc-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none ${inputSize}`}
        />
        <button
          type="submit"
          className={`shrink-0 rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 ${buttonSize}`}
        >
          Rechercher
        </button>
      </form>

      {showHistory && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-lg">
          <li className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Recherches récentes
          </li>
          {history.map((entry, i) => (
            <li key={entry.term} className="border-b border-zinc-100 last:border-0">
              <div className={`flex items-center justify-between gap-2 px-4 py-2.5 ${i === activeIndex ? "bg-blue-50" : "hover:bg-zinc-50"}`}>
                <Link
                  href={`/recherche?q=${encodeURIComponent(entry.term)}`}
                  className="flex min-w-0 flex-1 items-center gap-2 text-sm text-zinc-700"
                  onClick={() => { addSearchHistory(entry.term); setOpen(false); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-zinc-400">
                    <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">{entry.term}</span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => handleDeleteHistory(entry.term, e)}
                  className="shrink-0 p-1 text-zinc-300 transition hover:text-zinc-600"
                  aria-label="Supprimer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showSuggestions && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-lg">
          {suggestions.map((s, i) => (
            <li key={s.url} className="border-b border-zinc-100 last:border-0">
              <Link
                href={s.url}
                className={`flex items-center justify-between gap-3 px-4 py-3 ${i === activeIndex ? "bg-blue-50" : "hover:bg-blue-50"}`}
                onClick={() => { addSearchHistory(query.trim()); setOpen(false); }}
              >
                <span className="min-w-0">
                  <span className="block truncate font-mono text-sm font-medium text-zinc-900">
                    {s.manufacturerName} {s.referenceRaw}
                  </span>
                  <span className="block truncate text-sm text-zinc-500">
                    {s.name}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === "obsolete"
                      ? "bg-red-100 text-red-700"
                      : s.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {s.status === "obsolete"
                    ? "Obsolète"
                    : s.status === "active"
                      ? "Fabriquée"
                      : "?"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
