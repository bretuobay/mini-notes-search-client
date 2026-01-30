import { DEFAULT_BASE_URL } from "../../../../lib/api/types";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-connection",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
];

function getTargetUrl(request: Request, path: string[]) {
  const baseUrl = request.headers.get("x-base-url")?.trim() || DEFAULT_BASE_URL;
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.length ? `/${path.join("/")}` : "";
  return `${normalizedBase}${normalizedPath}`;
}

function buildHeaders(request: Request) {
  const headers = new Headers(request.headers);
  headers.delete("x-base-url");
  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));
  return headers;
}

async function proxy(request: Request, path: string[]) {
  const targetUrl = getTargetUrl(request, path);
  const init: RequestInit = {
    method: request.method,
    headers: buildHeaders(request),
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    // Required for streaming request bodies in Node runtime.
    // @ts-expect-error - duplex is not yet in TS RequestInit.
    init.duplex = "half";
  }

  const response = await fetch(targetUrl, init);
  const body = await response.arrayBuffer();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function getPath(params: Promise<{ path?: string[] }>) {
  const resolved = await params;
  return resolved.path ?? [];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, await getPath(params));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, await getPath(params));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, await getPath(params));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, await getPath(params));
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, await getPath(params));
}
