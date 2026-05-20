import type { MetaCredentials } from "@/types/meta";

const META_BASE = "https://graph.facebook.com/v19.0";

export async function metaFetch<T>(
  path: string,
  creds: MetaCredentials,
  options?: {
    method?: "GET" | "POST" | "DELETE";
    body?: Record<string, unknown>;
    params?: Record<string, string>;
  }
): Promise<T> {
  const method = options?.method ?? "GET";
  const url = new URL(`${META_BASE}/${path}`);

  if (method === "GET") {
    url.searchParams.set("access_token", creds.access_token);
    if (options?.params) {
      for (const [k, v] of Object.entries(options.params)) {
        url.searchParams.set(k, v);
      }
    }
  }

  const init: RequestInit = { method };

  if (method === "POST" || method === "DELETE") {
    const payload: Record<string, unknown> = {
      ...(options?.body ?? {}),
      access_token: creds.access_token,
    };
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(payload);
  }

  const res = await fetch(url.toString(), init);
  const json = (await res.json()) as { error?: { message: string; type: string } } & T;

  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Meta API error ${res.status}`);
  }

  return json;
}
