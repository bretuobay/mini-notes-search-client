"use client";

import { useMemo, useState } from "react";
import { ApiError, getStoredBaseUrl } from "../../lib/api/client";
import ErrorBanner from "../components/ErrorBanner";
import { UploadResponse } from "../../lib/api/types";

const ALLOWED_EXTENSIONS = [".fyi", ".md", ".notes"];

type UploadStatus =
  | "queued"
  | "invalid"
  | "uploading"
  | "uploaded"
  | "ingesting"
  | "indexed"
  | "failed";

type UploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
  message?: string;
};

function getExtension(name: string) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

const STATUS_STYLES: Record<UploadStatus, string> = {
  queued: "border-slate-200 bg-slate-50 text-slate-600",
  invalid: "border-amber-200 bg-amber-50 text-amber-700",
  uploading: "border-sky-200 bg-sky-50 text-sky-700",
  uploaded: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ingesting: "border-indigo-200 bg-indigo-50 text-indigo-700",
  indexed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function UploadPage() {
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(
    null
  );
  const [uploadUnsupported, setUploadUnsupported] = useState(false);

  const summary = useMemo(() => {
    const counts: Record<UploadStatus, number> = {
      queued: 0,
      invalid: 0,
      uploading: 0,
      uploaded: 0,
      ingesting: 0,
      indexed: 0,
      failed: 0,
    };
    queue.forEach((item) => {
      counts[item.status] += 1;
    });
    return { total: queue.length, counts };
  }, [queue]);

  const updateItems = (ids: string[], patch: Partial<UploadItem>) => {
    setQueue((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, ...patch } : item
      )
    );
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    setError(null);
    setNotice(null);
    const items: UploadItem[] = Array.from(files).map((file) => {
      const ext = getExtension(file.name);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return {
          id: crypto.randomUUID(),
          file,
          status: "invalid",
          message: `Unsupported file type (${ext || "unknown"}).`,
        };
      }
      return {
        id: crypto.randomUUID(),
        file,
        status: "queued",
      };
    });
    setQueue((prev) => [...items, ...prev]);

    const validItems = items.filter((item) => item.status === "queued");
    if (validItems.length > 0) {
      void uploadFiles(validItems);
    }
  };

  const uploadFiles = async (items: UploadItem[]) => {
    const baseUrl = getStoredBaseUrl().replace(/\/+$/, "");
    const tasks = items.map(async (item) => {
      updateItems([item.id], { status: "uploading", message: undefined });
      const formData = new FormData();
      formData.append("file", item.file, item.file.name);
      let response: Response;
      try {
        response = await fetch(`/api/proxy/v1/upload`, {
          method: "POST",
          headers: {
            "x-base-url": baseUrl,
          },
          body: formData,
        });
      } catch {
        throw new ApiError("Server not reachable.", "NETWORK_ERROR");
      }

      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          setNotice(
            "Upload endpoint not available. The server must expose /v1/upload to accept files."
          );
          setUploadUnsupported(true);
          updateItems([item.id], {
            status: "failed",
            message: "Server does not support /v1/upload.",
          });
          return;
        }
        const text = await response.text();
        throw new Error(text || "Upload failed.");
      }

      const payload = (await response
        .clone()
        .json()
        .catch(() => null)) as UploadResponse | null;

      const ingest = payload?.ingest;
      if (ingest) {
        const failed =
          (ingest.failed ?? 0) +
          (ingest.parse_failed ?? 0) +
          (ingest.index_failed ?? 0);
        if (failed > 0) {
          updateItems([item.id], {
            status: "failed",
            message: ingest.errors?.join(", ") || "Ingest failed.",
          });
          return;
        }
        updateItems([item.id], {
          status: "indexed",
          message: `Indexed ${ingest.indexed ?? 0}, updated ${ingest.updated ?? 0}.`,
        });
        return;
      }

      updateItems([item.id], {
        status: "uploaded",
        message: "Upload succeeded.",
      });
    });

    try {
      await Promise.all(tasks);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? { message: err.message, code: err.code }
          : err instanceof Error
            ? { message: err.message }
            : { message: "Upload failed." };
      setError(message);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Upload
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Add new notes for indexing.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
          Drag files or pick from disk. Upload validation and status tracking
          will appear here.
        </p>
      </div>
      {notice ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          {notice}
        </div>
      ) : null}
      {error ? (
        <ErrorBanner
          message={
            error.code === "NETWORK_ERROR"
              ? "Server not reachable. Check the base URL in Settings."
              : error.message
          }
        />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Upload files</h2>
          <p className="mt-2 text-sm text-slate-500">
            Accepted: {ALLOWED_EXTENSIONS.join(", ")}.
          </p>
          {uploadUnsupported ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Direct uploads are not supported by your server. Use “Ingest by
              path” below instead.
            </div>
          ) : null}
          <label
            className={`mt-5 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center text-sm transition ${
              dragActive
                ? "border-slate-400 bg-slate-50 text-slate-700"
                : "border-slate-200 text-slate-500"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              handleFiles(event.dataTransfer.files);
            }}
          >
            <input
              type="file"
              multiple
              className="hidden"
              accept={ALLOWED_EXTENSIONS.join(",")}
              disabled={uploadUnsupported}
              onChange={(event) => handleFiles(event.target.files)}
            />
            <span className="text-base font-semibold text-slate-900">
              Drop files here
            </span>
            <span className="mt-2 text-sm text-slate-500">
              or click to browse.
            </span>
          </label>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
          <p className="mt-2 text-sm text-slate-500">
            {summary.total} file{summary.total === 1 ? "" : "s"} in queue.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
            {Object.entries(summary.counts).map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2"
              >
                <div className="font-semibold text-slate-900">{value}</div>
                <div className="uppercase tracking-[0.18em] text-slate-400">
                  {key}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Upload queue</h2>
        <p className="mt-2 text-sm text-slate-500">
          Pending, processing, and completed uploads.
        </p>
        <div className="mt-4 space-y-3">
          {queue.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              No files uploaded yet.
            </div>
          ) : null}
          {queue.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item.file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(item.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${STATUS_STYLES[item.status]}`}
                >
                  {item.status}
                </span>
                {item.message ? (
                  <span className="text-xs text-slate-500">
                    {item.message}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
