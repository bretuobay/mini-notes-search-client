"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiError } from "../../lib/api/client";
import { StatsResponse } from "../../lib/api/types";
import ErrorBanner from "../components/ErrorBanner";

type StatsState = {
  data: StatsResponse | null;
  loading: boolean;
  error: { message: string; code?: string } | null;
};

function formatNumber(value?: number) {
  if (typeof value !== "number") {
    return "—";
  }
  return new Intl.NumberFormat().format(value);
}

function formatPercent(value?: number) {
  if (typeof value !== "number") {
    return "—";
  }
  return `${(value * 100).toFixed(1)}%`;
}

export default function StatsPage() {
  const [state, setState] = useState<StatsState>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchStats = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiClient.stats();
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? { message: err.message, code: err.code }
          : err instanceof Error
            ? { message: err.message }
            : { message: "Failed to load stats." };
      setState({ data: null, loading: false, error: message });
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchStats();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const lastIngest = (() => {
    if (!state.data?.last_ingest_at) {
      return null;
    }
    const parsed = new Date(state.data.last_ingest_at);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return {
      utc: parsed.toISOString(),
      local: parsed.toLocaleString(),
    };
  })();

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Stats
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Snapshot of the index.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
          System metrics and indexing activity will be summarized on this page.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchStats}
            className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={state.loading}
          >
            {state.loading ? "Refreshing…" : "Refresh stats"}
          </button>
          {state.error ? (
            <ErrorBanner
              message={
                state.error.code === "NETWORK_ERROR"
                  ? "Server not reachable. Check the base URL in Settings."
                  : state.error.message
              }
            />
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Docs</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>doc_count: {formatNumber(state.data?.doc_count)}</div>
            <div>index_epoch: {formatNumber(state.data?.index_epoch)}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Cache</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>cache_entries: {formatNumber(state.data?.cache_entries)}</div>
            <div>
              cache_hit_rate: {formatPercent(state.data?.cache_hit_rate)}
            </div>
            <div>cache_hits_total: {formatNumber(state.data?.cache_hits_total)}</div>
            <div>
              cache_misses_total: {formatNumber(state.data?.cache_misses_total)}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Search</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>searches_total: {formatNumber(state.data?.searches_total)}</div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ingest</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>
              ingest_runs_total: {formatNumber(state.data?.ingest_runs_total)}
            </div>
            <div>
              parse_failures_total: {formatNumber(state.data?.parse_failures_total)}
            </div>
            <div>
              index_failures_total: {formatNumber(state.data?.index_failures_total)}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Last ingest</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>UTC: {lastIngest?.utc ?? "—"}</div>
            <div>Local: {lastIngest?.local ?? "—"}</div>
          </div>
        </div>
      </div>
      {state.loading && !state.data ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="h-28 rounded-2xl border border-slate-200/70 bg-slate-100/70 animate-pulse"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
