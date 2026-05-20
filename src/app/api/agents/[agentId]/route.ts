import { NextRequest } from "next/server";

const BACKEND = process.env.MARKETING_AGENTS_BACKEND_URL ?? "http://localhost:8001";

export async function POST(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const body = await req.json();
  // URL slug uses hyphens; Python backend uses underscores
  const backendId = params.agentId.replace(/-/g, "_");

  let backend: Response;
  try {
    backend = await fetch(`${BACKEND}/api/chat/${backendId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: "error", data: "Backend unavailable. Start the marketing-agents backend on port 8001." })}\n\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  if (!backend.ok || !backend.body) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", data: `Backend returned ${backend.status}` })}\n\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  return new Response(backend.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const backendId = params.agentId.replace(/-/g, "_");
  try {
    await fetch(`${BACKEND}/api/history/${backendId}`, { method: "DELETE" });
  } catch {
    // best-effort
  }
  return new Response(null, { status: 204 });
}
