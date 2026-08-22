import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_INTERNAL_URL || "http://localhost:5001/api/v1";

async function proxy(
  req: NextRequest,
  params: { path: string[] },
  method: string
) {
  const endpoint = "/" + params.path.join("/") + (req.nextUrl.pathname.endsWith("/") ? "/" : "") + req.nextUrl.search;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // Forward the API key from the client request
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  try {
    const opts: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(15000),
    };
    if (method !== "GET" && method !== "HEAD") {
      try {
        opts.body = JSON.stringify(await req.json());
      } catch {}
    }
    const res = await fetch(`${API_URL}${endpoint}`, opts);
    const body = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "application/json";
    return new Response(body, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (e: any) {
    return NextResponse.json(
      { detail: e.message || "Failed to reach bot API" },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params, "GET");
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params, "POST");
}
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params, "PATCH");
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params, "DELETE");
}