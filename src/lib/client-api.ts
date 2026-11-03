// Sends JSON requests from the browser and returns a simple result.
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; fields: string[] };

export const NETWORK_ERROR = "network";

/** Calls an API route. Connection failures come back as a normal result. */
export async function sendJson<T = Record<string, never>>(
  url: string,
  method: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) return { ok: true, data };
    return { ok: false, error: data.error ?? "SERVER", fields: data.fields ?? [] };
  } catch {
    return { ok: false, error: NETWORK_ERROR, fields: [] };
  }
}
