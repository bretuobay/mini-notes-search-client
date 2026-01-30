"use client";

import { useMemo, useState } from "react";
import { apiClient, ApiError } from "../lib/api/client";
import { SearchResponse } from "../lib/api/types";
import ErrorBanner from "./components/ErrorBanner";

const LIMIT_OPTIONS = [10, 20, 50];
const SOURCE_STYLES: Record<string, string> = {
  cache: "border-emerald-200 bg-emerald-50 text-emerald-700",
  index: "border-sky-200 bg-sky-50 text-sky-700",
};

function getSourceStyle(source?: string) {
  if (!source) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  return SOURCE_STYLES[source] ?? "border-slate-200 bg-slate-50 text-slate-600";
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(20);
  const [tagsAny, setTagsAny] = useState("");
  const [pathPrefix, setPathPrefix] = useState("");
  const [fuzzy, setFuzzy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(
    null
  );
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const parsedTags = useMemo(() => {
    return tagsAny
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }, [tagsAny]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      setError({ message: "Enter a search query." });
      setResults(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.search({
        q: query.trim(),
        limit,
        filters:
          parsedTags.length || pathPrefix.trim()
            ? {
                tags_any: parsedTags.length ? parsedTags : undefined,
                path_prefix: pathPrefix.trim() || undefined,
              }
            : undefined,
        options: { fuzzy },
        cache: true,
      });
      setResults(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ message: err.message, code: err.code });
      } else if (err instanceof Error) {
        setError({ message: err.message });
      } else {
        setError({ message: "Search failed." });
      }
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const hits = results?.hits ?? [];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Search
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Find your notes instantly.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
          This is the search workspace. Query your notes, filter by tags, and
          preview results once the API is connected.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.05fr_1.3fr]">
        <form
          onSubmit={handleSearch}
          className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Search panel
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Build a query and refine results.
              </p>
            </div>
            <button
              type="submit"
              className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Query
              </label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Search your notes"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Limit
                </label>
                <select
                  value={limit}
                  onChange={(event) => setLimit(Number(event.target.value))}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  {LIMIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Tags (any)
                </label>
                <input
                  value={tagsAny}
                  onChange={(event) => setTagsAny(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="research, audio, book"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Path prefix
                </label>
                <input
                  value={pathPrefix}
                  onChange={(event) => setPathPrefix(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="/notes/projects"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setFuzzy((prev) => !prev)}
                className={`flex h-10 w-16 items-center rounded-full border px-1 transition ${
                  fuzzy
                      ? "border-slate-900 bg-slate-900"
                      : "border-slate-200 bg-slate-100"
                }`}
              >
                  <span
                    className={`h-7 w-7 rounded-full bg-white transition ${
                      fuzzy ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Fuzzy</p>
                  <p className="text-xs text-slate-500">
                    Match approximate terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {error ? (
            <div className="mt-4">
              <ErrorBanner
                message={
                  error.code === "NETWORK_ERROR"
                    ? "Server not reachable. Check the base URL in Settings."
                    : error.message
                }
              />
            </div>
          ) : null}
        </form>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Results</h2>
              <p className="mt-2 text-sm text-slate-500">
                {hits.length
                  ? `${hits.length} result${hits.length === 1 ? "" : "s"}`
                  : "No results yet."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDebug((prev) => !prev)}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:text-slate-600"
            >
              {showDebug ? "Hide debug" : "Show debug"}
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="h-16 rounded-xl border border-slate-200/70 bg-slate-100/70 animate-pulse"
                  />
                ))}
              </div>
            ) : null}
            {!loading && hits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                Run a query to see results.
              </div>
            ) : null}
            {hits.map((hit) => (
              <div
                key={`${hit.doc_id}-${hit.path}`}
                className="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {hit.title || hit.path}
                    </p>
                    <p className="text-xs text-slate-500">{hit.path}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {typeof hit.score === "number" ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                        score {hit.score.toFixed(3)}
                      </span>
                    ) : null}
                    {(hit.source || results?.source) ? (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${getSourceStyle(
                          (hit.source || results?.source)?.toString()
                        )}`}
                      >
                        {(hit.source || results?.source)?.toString()}
                      </span>
                    ) : null}
                  </div>
                </div>
                {hit.snippet ? (
                  <p className="mt-3 text-sm text-slate-600">
                    {hit.snippet}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          {showDebug && results ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              <div>cache_key: {results.cache_key ?? "—"}</div>
              <div>index_epoch: {results.index_epoch ?? "—"}</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
