/** Small fetch wrapper for the /api routes — throws readable errors. */
export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response body
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return (data ?? {}) as T;
}

export const post = <T = unknown>(url: string, body?: unknown) =>
  api<T>(url, { method: "POST", body: JSON.stringify(body ?? {}) });

export const put = <T = unknown>(url: string, body?: unknown) =>
  api<T>(url, { method: "PUT", body: JSON.stringify(body ?? {}) });

export const patch = <T = unknown>(url: string, body?: unknown) =>
  api<T>(url, { method: "PATCH", body: JSON.stringify(body ?? {}) });
