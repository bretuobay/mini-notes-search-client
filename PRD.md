# Product Requirements Document (PRD): NoteSearch Web Client (Next.js)

## 1. Product Summary

A **Next.js web client** for NoteSearch that lets users:

1. upload `.fyi`, `.md`, and `.notes` files (single or bulk),
2. send them to the Go NoteSearch Server for parsing + indexing,
3. search notes and view results.

The app is **local-first** and typically connects to a server running on the user’s machine or LAN.

---

## 2. Goals

### Primary goals

- Simple upload flow for supported note files
- Reliable ingestion status + error reporting per file
- Fast search UI with clear results (title/path/snippet)
- Smooth “search again” experience (server cache should make repeats fast)

### Secondary goals

- Manage collections (folders/projects) for uploads
- Show server stats (doc count, cache hit rate)
- Basic UX polish: progress bars, toasts, empty states

---

## 3. Non-goals

- User accounts, auth, payments (v0.1)
- Collaborative multi-user editing
- Advanced query DSL in UI (v0.1)
- Full offline mode in browser (server must be reachable)

---

## 4. Target Users

- Developers and learners running the NoteSearch Server locally
- Anyone with local notes who wants fast search without SaaS services

---

## 5. User Stories

1. **Upload notes**
   - As a user, I can upload many files at once and see progress.

2. **Ingest feedback**
   - As a user, I can see which files were indexed, skipped, or failed, with reasons.

3. **Search notes**
   - As a user, I can search and quickly see relevant matches.

4. **Open source file**
   - As a user, I can copy the file path and optionally open it (where allowed).

5. **Reindex**
   - As a user, I can trigger a full reindex if things get out of sync.

6. **See stats**
   - As a user, I can see doc count and whether results came from cache or index.

---

## 6. UX Requirements

### Pages / Screens

1. **Home / Search**

- Search bar with submit on Enter
- Results list showing:
  - title
  - file path
  - score (optional)
  - snippet (optional)
  - “source: cache/index” badge (from server response)

- Filters (v0.1 minimal):
  - limit (10/20/50)
  - tags any (optional)
  - path prefix / collection (optional)
  - fuzzy (toggle, default off; maps to server `options.fuzzy`)

- Recent searches (client-side only)

2. **Upload**

- Drag-and-drop + file picker
- Supports multiple files
- Shows per-file status: queued → uploading → indexed/skipped/failed
- Allows retry failed files

3. **Settings**

- Server base URL (default `http://127.0.0.1:8080`)
- Upload constraints display (max file size, supported extensions)
- Reindex button (danger zone)
  - Shows warning about cache flush on reindex

4. **Stats**

- Fetch `/v1/stats` and display key metrics

### UX constraints

- Must handle 100s of files without freezing the UI
- Upload progress must be visible (aggregate and per file)
- Clear error messages

---

## 7. Server Integration Requirements

### Assumed server endpoints (from server spec)

- `POST /v1/ingest`
- `POST /v1/search`
- `POST /v1/reindex`
- `GET /v1/stats`

### Base URL + config

- Default bind on server: `127.0.0.1:8080` (overridable by env/flags)
- Client must allow users to set base URL and persist it locally
- If non-localhost, show a warning banner (notes may traverse the network)

### Upload mechanism

Because `/v1/ingest` currently expects roots on disk, the client needs **one of these** server capabilities:

**Option A (recommended): Add `POST /v1/upload`**

- Client uploads files as `multipart/form-data`
- Server writes them into its data directory / “uploads” area
- Server parses + indexes immediately (or queues)

**Option B: Add `POST /v1/ingest/files`**

- Client sends files (multipart)
- Server parses content directly without storing files permanently (still should support stable doc IDs)

**PRD requirement:** The web client requires a server endpoint that accepts direct file uploads.
If you implement Option A, the client will use:

- `POST /v1/upload` (multipart)
- then optionally call `POST /v1/ingest` referencing the server-side upload folder

### Search response rendering

Client must display:

- `hits[]` list fields: doc_id, score, path, title (and snippet if available)
- `source` (cache/index) clearly
- `index_epoch` when present (useful for debugging and cache freshness)

### Server error contract

Server errors follow a consistent payload:

```json
{
  "error": {
    "code": "INVALID_ARGUMENT|NOT_FOUND|INTERNAL|PARSE_ERROR|INDEX_ERROR|CACHE_ERROR",
    "message": "human readable",
    "details": { "any": "json" }
  }
}
```

Client must normalize all errors to show:
- user-friendly message
- optional details (expandable)
- per-file errors surfaced for ingest

---

## 8. Functional Requirements

### FR-1 File Upload

- Accept `.fyi`, `.md`, `.notes`
- Support multi-file upload
- Validate extensions client-side before upload
- File size limit configurable (default 10MB/file)

### FR-2 Ingestion

- After upload, trigger server ingest flow
- Display ingestion summary: indexed/updated/skipped/failed/parse_failed/index_failed
- Display per-file errors from server response (path + code + message)
- Allow dry-run toggle (optional v0.1) to validate inputs without indexing

### FR-3 Search

- Search input + results list
- Provide “source badge” for cache/index
- Show cache key and epoch in a collapsible “debug” area (optional)
- Allow pagination via “Load more” (increase limit; v0.1 can requery)

### FR-4 Reindex

- Button to trigger `/v1/reindex`
- Must display warning modal (rebuild + cache cleared)
- Show success/failure + updated epoch + cache_cleared flag

### FR-5 Stats

- Poll or refresh manually
- Display doc_count, index_epoch, cache entries, cache hit rate, total searches
- Display last_ingest_at (UTC) with local time conversion

---

## 9. Non-Functional Requirements

### Performance

- First meaningful paint < 2s on local machine
- Search UI should feel instant; handle fast repeated queries smoothly

### Reliability

- Retry uploads on network failure
- Graceful handling when server is offline:
  - show “server not reachable” banner
  - provide settings link to update base URL
  - show server default bind in message (`127.0.0.1:8080`)

### Security

- v0.1: no auth, but:
  - default server URL is localhost
  - warn user if connecting to non-localhost URL (“You may be sending notes over the network”)

---

## 10. Data Handling (Client)

Stored locally in browser (localStorage or indexedDB):

- server base URL
- recent searches (last 20)
- last ingestion summary (optional)
- last successful `index_epoch` (optional, for debug display)

No note content stored client-side beyond what user uploads and results returned.

---

## 11. Technical Requirements (Next.js)

### Stack

- Next.js (App Router)
- TypeScript
- Fetch API client with a small wrapper:
  - baseURL
  - typed request/response
  - error normalization into `ApiError`

### Components

- `UploadDropzone`
- `UploadQueueList`
- `SearchBar`
- `SearchResultsList`
- `ServerStatusBanner`
- `SettingsForm`

### API client typing (must)

Maintain strict request/response types aligned with server JSON.

#### Request/response contracts (v0.1)

**Ingest**

Request:
```json
{
  "roots": ["/abs/path/to/notes"],
  "extensions": [".fyi", ".md", ".notes"],
  "mode": "incremental|full",
  "dry_run": false
}
```

Response:
```json
{
  "indexed": 12,
  "updated": 3,
  "skipped": 120,
  "failed": 1,
  "parse_failed": 1,
  "index_failed": 0,
  "index_epoch": 43,
  "errors": [
    { "path": "/abs/path/x.fyi", "code": "PARSE_ERROR", "message": "..." }
  ]
}
```

**Search**

Request:
```json
{
  "q": "lsm compaction",
  "limit": 10,
  "filters": {
    "tags_any": ["db", "storage"],
    "path_prefix": "/abs/path/to/notes"
  },
  "options": {
    "fuzzy": false
  },
  "cache": true
}
```

Response:
```json
{
  "source": "cache",
  "cache_key": "srch:9c1d...e3",
  "index_epoch": 43,
  "hits": [
    { "doc_id": 10, "score": 1.23, "path": "/abs/a.fyi", "title": "LSM notes" }
  ]
}
```

**Reindex**

Response:
```json
{
  "indexed": 135,
  "failed": 0,
  "index_epoch": 44,
  "cache_cleared": true
}
```

**Stats**

Response:
```json
{
  "doc_count": 135,
  "index_epoch": 44,
  "cache_entries": 220,
  "cache_hit_rate": 0.71,
  "searches_total": 120,
  "cache_hits_total": 80,
  "cache_misses_total": 40,
  "ingest_runs_total": 3,
  "parse_failures_total": 2,
  "index_failures_total": 1,
  "last_ingest_at": "2026-01-30T12:34:56Z"
}
```

---

## 12. Acceptance Criteria (MVP)

- User can upload supported files and see ingestion results
- User can search and see results with cache/index source and optional cache key
- Server offline state handled gracefully
- Reindex works from UI
- Stats displayed

---

## 13. Future Enhancements

- File browser + collections
- Tag management UI
- Snippet highlighting
- Real-time indexing status (server-sent events)
- Query suggestions/autocomplete (using MiniSearchDB data)
- “Open result” action (server-side helper to open path or show line excerpt)

---

If you want, I can also give you:

- the **exact proposed `/v1/upload` endpoint spec** (multipart form fields + JSON response),
- a **UI wireframe outline** (components and layout),
- or a **Next.js folder skeleton + typed API client** (concise).
