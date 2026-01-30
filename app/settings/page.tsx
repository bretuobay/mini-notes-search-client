"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_BASE_URL,
  BASE_URL_STORAGE_KEY,
} from "../../lib/api/types";
import { apiClient, ApiError, getStoredBaseUrl, setStoredBaseUrl } from "../../lib/api/client";

function isLocalhost(url: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

export default function SettingsPage() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [showReindexModal, setShowReindexModal] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [reindexMessage, setReindexMessage] = useState<string | null>(null);

  useEffect(() => {
    setBaseUrl(getStoredBaseUrl());
  }, []);

  const showWarning = useMemo(() => {
    if (!baseUrl) {
      return false;
    }
    return !isLocalhost(baseUrl);
  }, [baseUrl]);

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!baseUrl.trim()) {
      setStatus("error");
      return;
    }
    setStoredBaseUrl(baseUrl.trim());
    setStatus("saved");
    window.setTimeout(() => setStatus("idle"), 2000);
  };

  const handleReindex = async () => {
    setReindexing(true);
    setReindexMessage(null);
    try {
      const result = await apiClient.reindex();
      const epoch =
        typeof result.index_epoch === "number"
          ? `epoch ${result.index_epoch}`
          : "new epoch";
      const cache = result.cache_cleared ? "cache cleared" : "cache retained";
      setReindexMessage(`Reindex complete (${epoch}, ${cache}).`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Reindex failed.";
      setReindexMessage(message);
    } finally {
      setReindexing(false);
      setShowReindexModal(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Settings
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Configure your server connection.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
          Set the base URL for the search server and manage reindex actions.
        </p>
      </div>
      {showWarning ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong className="font-semibold">Heads up:</strong> You are connecting
          to a non-localhost server. Notes may travel over the network.
        </div>
      ) : null}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-900">Server URL</h2>
        <p className="mt-2 text-sm text-slate-500">
          Stored in localStorage as <code>{BASE_URL_STORAGE_KEY}</code>.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={baseUrl}
            onChange={(event) => {
              setBaseUrl(event.target.value);
              setStatus("idle");
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            placeholder={DEFAULT_BASE_URL}
            spellCheck={false}
          />
          <button
            type="submit"
            className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Save
          </button>
        </div>
        <div className="mt-3 text-sm">
          {status === "saved" ? (
            <span className="text-emerald-600">Saved.</span>
          ) : null}
          {status === "error" ? (
            <span className="text-rose-600">Enter a valid URL.</span>
          ) : null}
        </div>
      </form>
      <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Reindex</h2>
        <p className="mt-2 text-sm text-slate-500">
          Rebuilds the entire index and clears the cache. Use if results look out
          of sync.
        </p>
        <button
          type="button"
          onClick={() => setShowReindexModal(true)}
          className="mt-4 h-11 rounded-xl border border-rose-200 px-5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={reindexing}
        >
          {reindexing ? "Reindexing…" : "Reindex now"}
        </button>
        {reindexMessage ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {reindexMessage}
          </div>
        ) : null}
      </div>
      {showReindexModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">
              Confirm reindex
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              This will rebuild the index and clear the cache. Searches may be
              slower until it completes.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReindexModal(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={reindexing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReindex}
                className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={reindexing}
              >
                {reindexing ? "Reindexing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
