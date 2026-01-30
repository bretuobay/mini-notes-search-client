export const DEFAULT_BASE_URL = "http://127.0.0.1:8080";
export const BASE_URL_STORAGE_KEY = "notesearch.baseUrl";

export type ErrorCode =
  | "INVALID_ARGUMENT"
  | "NOT_FOUND"
  | "INTERNAL"
  | "PARSE_ERROR"
  | "INDEX_ERROR"
  | "CACHE_ERROR"
  | string;

export type ErrorPayload = {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type SearchRequest = {
  q: string;
  limit?: number;
  filters?: {
    tags_any?: string[];
    path_prefix?: string;
  };
  options?: {
    fuzzy?: boolean;
  };
  cache?: boolean;
};

export type SearchHit = {
  doc_id: string;
  score?: number;
  path: string;
  title?: string;
  snippet?: string;
  source?: "cache" | "index" | string;
};

export type SearchResponse = {
  hits: SearchHit[];
  source?: "cache" | "index" | string;
  cache_key?: string;
  index_epoch?: number;
};

export type IngestRequest = {
  roots?: string[];
  extensions?: string[];
  mode?: "incremental" | "full" | string;
  dry_run?: boolean;
};

export type IngestFileResult = {
  path: string;
  status:
    | "indexed"
    | "updated"
    | "skipped"
    | "failed"
    | "parse_failed"
    | "index_failed"
    | string;
  code?: ErrorCode;
  message?: string;
};

export type IngestResponse = {
  indexed?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
  parse_failed?: number;
  index_failed?: number;
  index_epoch?: number;
  errors?: string[];
  summary?: {
    indexed?: number;
    updated?: number;
    skipped?: number;
    failed?: number;
    parse_failed?: number;
    index_failed?: number;
    total?: number;
  };
  files?: IngestFileResult[];
};

export type ReindexResponse = {
  index_epoch?: number;
  cache_cleared?: boolean;
};

export type StatsResponse = {
  doc_count?: number;
  index_epoch?: number;
  cache_entries?: number;
  cache_hit_rate?: number;
  searches_total?: number;
  cache_hits_total?: number;
  cache_misses_total?: number;
  ingest_runs_total?: number;
  parse_failures_total?: number;
  index_failures_total?: number;
  last_ingest_at?: string;
};

export type UploadResponse = {
  path: string;
  filename: string;
  size: number;
  ingest?: {
    indexed?: number;
    updated?: number;
    skipped?: number;
    failed?: number;
    parse_failed?: number;
    index_failed?: number;
    index_epoch?: number;
    errors?: string[];
  };
};
