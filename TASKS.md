# Mini-Notes-Search Client (PoC) — LLM Execution Tasks

This task list is designed for LLM coding agents. Each task should be completed in order, with small, reviewable commits.

Assumptions:
- App Router + TypeScript + Tailwind.
- Server base URL defaults to `http://127.0.0.1:8080`.
- PoC scope prioritizes working UX over production hardening.

---

## Task 1 — Project scaffold + Tailwind setup

**Goal:** Create a minimal Next.js app with Tailwind and a basic layout shell.

**Steps:**
1. Initialize Next.js app in `mini-notes-search-client` (App Router, TS).
2. Install and configure Tailwind.
3. Add base layout with top nav and main content slot.
4. Add a simple theme (light background, cards, subtle gradients).

**Deliverables:**
- `app/layout.tsx`, `app/page.tsx` present.
- Tailwind config + globals set.

---

## Task 2 — Core UI shell + routing

**Goal:** Add basic pages and navigation.

**Steps:**
1. Create routes: `/` (Search), `/upload`, `/stats`, `/settings`.
2. Implement a shared `AppShell` with nav links.
3. Add placeholder sections for each page.

**Deliverables:**
- Working navigation between pages.
- Consistent layout across routes.

---

## Task 3 — Typed API client (server contract)

**Goal:** Create a small typed client aligned to PRD responses.

**Steps:**
1. Add `lib/api/types.ts` with request/response types for ingest, search, reindex, stats, error.
2. Add `lib/api/client.ts` with:
   - base URL from localStorage (fallback default)
   - `ApiError` normalization using server error format
3. Implement methods: `search`, `ingest`, `reindex`, `stats`.

**Deliverables:**
- `lib/api/types.ts`
- `lib/api/client.ts`

---

## Task 4 — Settings page (server URL + warnings)

**Goal:** Allow configuring server base URL, with localhost warning.

**Steps:**
1. Add settings form to set base URL.
2. Persist to localStorage.
3. Show banner if URL is not localhost.

**Deliverables:**
- Functional settings page with saved URL.

---

## Task 5 — Search page MVP

**Goal:** Implement search UI + results rendering.

**Steps:**
1. Build Search Bar with:
   - query input
   - limit select (10/20/50)
   - tags_any input (comma-separated)
   - path_prefix input
   - fuzzy toggle
2. Call `POST /v1/search`.
3. Render results list: title, path, score, source badge.
4. Add optional “debug” section for cache_key + index_epoch.

**Deliverables:**
- Functional search page, fast feedback, empty states.

---

## Task 6 — Upload page (PoC workflow)

**Goal:** Provide upload UI and show per-file statuses.

**Steps:**
1. Build drag/drop + file picker component.
2. Validate extensions `.fyi`, `.md`, `.notes`.
3. Implement upload mechanism (PoC placeholder if server lacks `/v1/upload`):
   - If `/v1/upload` exists: send multipart.
   - Else: show blocking notice explaining server requirement.
4. Trigger ingest flow after upload (or show “needs server support”).
5. Render per-file status and summary counts.

**Deliverables:**
- Upload page with queue UI + ingestion summary.

---

## Task 7 — Stats page

**Goal:** Display server stats.

**Steps:**
1. Fetch `GET /v1/stats`.
2. Render key metrics:
   - doc_count, index_epoch
   - cache_entries, cache_hit_rate
   - searches_total, cache_hits_total, cache_misses_total
   - ingest_runs_total, parse_failures_total, index_failures_total
   - last_ingest_at (UTC + local time)

**Deliverables:**
- Stats page with cards and basic formatting.

---

## Task 8 — Reindex action

**Goal:** Provide safe reindex flow.

**Steps:**
1. Add “Reindex” button on Settings page.
2. Confirmation modal (warning: rebuild + cache cleared).
3. Call `POST /v1/reindex`.
4. Show success/failure toast + updated epoch + cache_cleared.

**Deliverables:**
- Working reindex flow with clear user feedback.

---

## Task 9 — Error handling + offline states

**Goal:** Consistent error UX across all pages.

**Steps:**
1. Centralize error banner component.
2. Show “server not reachable” banner when fetch fails.
3. Ensure per-file errors are visible on upload.

**Deliverables:**
- Unified error handling and offline banner.

---

## Task 10 — UX polish (Tailwind)

**Goal:** Quick styling pass for PoC.

**Steps:**
1. Add consistent spacing, cards, and typography scale.
2. Add badges for cache/index.
3. Add load states (skeletons or spinners).
4. Ensure mobile layout works.

**Deliverables:**
- Polished, usable UI for demos.

---

## Task 11 — Final pass / smoke tests

**Goal:** Verify flows and fix obvious issues.

**Steps:**
1. Run the app locally.
2. Check each route renders with mock server or actual server.
3. Fix obvious layout, type, or runtime errors.

**Deliverables:**
- PoC ready to demo.
