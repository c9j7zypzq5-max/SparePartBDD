"use client";

import { useEffect, useId, useRef, useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./status-badge";
import { ClockIcon, CloseIcon, SearchIcon } from "./icons";
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

type Option = { href: string; term: string };

const VARIANTS = {
  hero: {
    input: "rounded-xl py-4 pl-5 pr-4 text-lg shadow-sm",
    button: "rounded-xl px-5 py-4 text-lg sm:px-7",
  },
  page: {
    input: "rounded-xl py-3 pl-4 pr-4 text-base shadow-sm",
    button: "rounded-xl px-4 py-3 sm:px-6",
  },
  header: {
    input: "rounded-lg bg-zinc-50 py-1.5 pl-3 pr-9 text-sm focus:bg-white",
    button: "",
  },
};

const searchHref = (term: string) => `/recherche?q=${encodeURIComponent(term)}`;

/**
 * Barre de recherche avec suggestions (combobox ARIA : le focus reste dans le
 * champ, les flèches parcourent les options via aria-activedescendant).
 * Champ vide : recherches récentes ; à partir de 2 caractères : suggestions.
 */
export function SearchBar({
  defaultValue = "",
  autoFocus = false,
  variant = "page",
  shortcut = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  variant?: keyof typeof VARIANTS;
  /** Raccourci clavier « / » pour placer le curseur dans le champ. */
  shortcut?: boolean;
}) {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();
  const typing = trimmed.length >= 2;
  const styles = VARIANTS[variant];

  // Navigation client vers une autre recherche (exemple, historique) : le
  // composant est conservé, le champ doit suivre la requête de la page.
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    setActiveIndex(-1);
    // La requête déjà affichée par la page de résultats ne redemande rien.
    if (!typing || trimmed === defaultValue.trim()) {
      setSuggestions([]);
      return;
    }
    // Chaque frappe annule la requête précédente : une réponse lente ne
    // remplace jamais les suggestions d'une saisie plus récente.
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { hits?: Suggestion[] } = await res.json();
        setSuggestions(data.hits ?? []);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, typing, defaultValue]);

  useEffect(() => {
    if (!shortcut) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  const options: Option[] = typing
    ? suggestions.length > 0
      ? [
          ...suggestions.map((s) => ({ href: s.url, term: trimmed })),
          { href: searchHref(trimmed), term: trimmed },
        ]
      : []
    : history.map((h) => ({ href: searchHref(h.term), term: h.term }));
  const listOpen = open && options.length > 0;
  const optionId = (i: number) => `${listboxId}-${i}`;

  function close() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function select(option: Option) {
    addSearchHistory(option.term);
    close();
  }

  function handleFocus() {
    setHistory(readSearchHistory());
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape" && listOpen) {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (options.length === 0) return;
      e.preventDefault();
      setOpen(true);
      const last = options.length - 1;
      // Boucle : au-delà de la dernière option on revient au champ (-1).
      setActiveIndex((i) =>
        e.key === "ArrowDown" ? (i >= last ? -1 : i + 1) : i <= -1 ? last : i - 1,
      );
    } else if (e.key === "Enter" && listOpen && activeIndex >= 0) {
      e.preventDefault();
      const option = options[activeIndex];
      select(option);
      router.push(option.href);
    }
  }

  function handleDeleteHistory(term: string) {
    removeSearchHistory(term);
    setHistory(readSearchHistory());
    inputRef.current?.focus();
  }

  const optionClass = (i: number) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm ${i === activeIndex ? "bg-blue-50" : "hover:bg-zinc-50"}`;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <Form
        action="/recherche"
        role="search"
        className="flex w-full gap-2"
        onSubmit={() => {
          if (trimmed) addSearchHistory(trimmed);
          close();
        }}
      >
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            required
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
            role="combobox"
            aria-label="Rechercher une pièce par référence ou par nom"
            aria-autocomplete="list"
            aria-expanded={listOpen}
            aria-controls={listboxId}
            aria-activedescendant={listOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            placeholder={
              variant === "header" ? "Rechercher une référence…" : "Référence ou nom de pièce…"
            }
            className={`peer w-full border border-zinc-300 bg-white text-zinc-900 transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none ${styles.input}`}
          />
          {variant === "header" && (
            <>
              <kbd className="pointer-events-none absolute right-9 top-1/2 hidden -translate-y-1/2 rounded border border-zinc-200 bg-white px-1.5 font-sans text-[11px] text-zinc-400 peer-placeholder-shown:lg:block peer-focus:hidden!">
                /
              </kbd>
              <button
                type="submit"
                aria-label="Rechercher"
                className="absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400 transition hover:text-zinc-700"
              >
                <SearchIcon />
              </button>
            </>
          )}
        </div>
        {variant !== "header" && (
          <button
            type="submit"
            className={`flex shrink-0 items-center gap-2 bg-blue-600 font-semibold text-white transition hover:bg-blue-700 ${styles.button}`}
          >
            <SearchIcon className="h-5 w-5 sm:hidden" />
            <span className="sr-only sm:not-sr-only">Rechercher</span>
          </button>
        )}
      </Form>

      {listOpen && (
        <div
          // Garde le focus dans le champ pendant un clic dans la liste (sinon
          // Safari ferme la liste avant que le clic n'atteigne le lien).
          onMouseDown={(e) => e.preventDefault()}
          className={`absolute z-40 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-lg ${
            variant === "header" ? "left-0 w-[min(28rem,calc(100vw-2rem))]" : "w-full"
          }`}
        >
          {!typing && (
            <p id={`${listboxId}-label`} className="px-4 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Recherches récentes
            </p>
          )}
          <ul
            role="listbox"
            id={listboxId}
            aria-label={typing ? "Suggestions" : undefined}
            aria-labelledby={typing ? undefined : `${listboxId}-label`}
          >
            {typing
              ? suggestions.map((s, i) => (
                  <li key={s.url} id={optionId(i)} role="option" aria-selected={i === activeIndex} className="border-b border-zinc-100">
                    <Link href={s.url} tabIndex={-1} onClick={() => select(options[i])} className={`${optionClass(i)} justify-between`}>
                      <span className="min-w-0">
                        <span className="block truncate">
                          <span className="font-mono font-semibold text-zinc-900">{s.referenceRaw}</span>{" "}
                          <span className="text-zinc-500">{s.manufacturerName}</span>
                        </span>
                        <span className="block truncate text-zinc-500">{s.name}</span>
                      </span>
                      <StatusBadge status={s.status} size="sm" />
                    </Link>
                  </li>
                ))
              : history.map((entry, i) => (
                  <li key={entry.term} id={optionId(i)} role="option" aria-selected={i === activeIndex} className="flex items-center border-b border-zinc-100 last:border-0">
                    <Link
                      href={searchHref(entry.term)}
                      tabIndex={-1}
                      onClick={() => select(options[i])}
                      className={`${optionClass(i)} min-w-0 flex-1 text-zinc-700`}
                    >
                      <ClockIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{entry.term}</span>
                    </Link>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => handleDeleteHistory(entry.term)}
                      className="shrink-0 px-3 py-2.5 text-zinc-300 transition hover:text-zinc-600"
                      aria-label={`Retirer « ${entry.term} » des recherches récentes`}
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
            {typing && (
              <li id={optionId(suggestions.length)} role="option" aria-selected={activeIndex === suggestions.length}>
                <Link
                  href={searchHref(trimmed)}
                  tabIndex={-1}
                  onClick={() => select(options[suggestions.length])}
                  className={`${optionClass(suggestions.length)} font-medium text-blue-700`}
                >
                  <SearchIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">Voir tous les résultats pour « {trimmed} »</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
      <p aria-live="polite" className="sr-only">
        {listOpen && typing ? `${suggestions.length} suggestion${suggestions.length > 1 ? "s" : ""}` : ""}
      </p>
    </div>
  );
}
