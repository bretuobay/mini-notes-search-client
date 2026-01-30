# Mini-Notes-Search Client (PoC)

Next.js + Tailwind web client for NoteSearch Server.

## Requirements

- Node.js 18+
- NoteSearch Server running locally (default: `http://127.0.0.1:8080`)

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Configure server URL

Use the **Settings** page to set the server base URL. If the URL is not localhost, the UI shows a warning.

## API assumptions (v0.1)

The client expects the following endpoints on the server:

- `POST /v1/ingest`
- `POST /v1/search`
- `POST /v1/reindex`
- `GET /v1/stats`

For uploads, the client expects a server endpoint that accepts multipart file uploads (recommended `POST /v1/upload`). If not available, the Upload page will show a blocking notice.

## PoC scope

- Search UI + results display
- Upload flow (dependent on server support)
- Stats + reindex controls
- Tailwind styling for quick demo polish
