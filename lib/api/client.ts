import {
  BASE_URL_STORAGE_KEY,
  DEFAULT_BASE_URL,
  ErrorPayload,
  IngestRequest,
  IngestResponse,
  ReindexResponse,
  SearchRequest,
  SearchResponse,
  StatsResponse,
} from "./types";

export class ApiError extends Error {
  code: string;
  details?: Record<string, unknown>;
  status?: number;

  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
    status?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

function isErrorPayload(payload: unknown): payload is ErrorPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const maybeError = payload as ErrorPayload;
  return (
    typeof maybeError.error?.code === "string" &&
    typeof maybeError.error?.message === "string"
  );
}

export function getStoredBaseUrl() {
  if (typeof window === "undefined") {
    return DEFAULT_BASE_URL;
  }
  try {
    const stored = window.localStorage.getItem(BASE_URL_STORAGE_KEY);
    return stored?.trim() ? stored : DEFAULT_BASE_URL;
  } catch {
    return DEFAULT_BASE_URL;
  }
}

export function setStoredBaseUrl(value: string) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(BASE_URL_STORAGE_KEY, value);
  } catch {
    // ignore storage failures
  }
}

async function parseBody<T>(response: Response): Promise<T | null> {
  if (response.status === 204) {
    return null;
  }
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; baseUrl?: string } = {}
): Promise<T> {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? getStoredBaseUrl());
  let response: Response;
  try {
    response = await fetch(`/api/proxy${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "x-base-url": baseUrl,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("Server not reachable.", "NETWORK_ERROR");
  }

  if (!response.ok) {
    const payload = await parseBody<ErrorPayload>(response);
    if (payload && isErrorPayload(payload)) {
      throw new ApiError(
        payload.error.message,
        payload.error.code,
        payload.error.details,
        response.status
      );
    }
    throw new ApiError(
      response.statusText || "Request failed",
      "HTTP_ERROR",
      undefined,
      response.status
    );
  }

  const data = await parseBody<T>(response);
  return (data ?? ({} as T)) as T;
}

export const apiClient = {
  search(body: SearchRequest, baseUrl?: string) {
    return request<SearchResponse>("/v1/search", {
      method: "POST",
      body,
      baseUrl,
    });
  },
  ingest(body: IngestRequest, baseUrl?: string) {
    return request<IngestResponse>("/v1/ingest", {
      method: "POST",
      body,
      baseUrl,
    });
  },
  reindex(baseUrl?: string) {
    return request<ReindexResponse>("/v1/reindex", {
      method: "POST",
      baseUrl,
    });
  },
  stats(baseUrl?: string) {
    return request<StatsResponse>("/v1/stats", {
      method: "GET",
      baseUrl,
    });
  },
};
