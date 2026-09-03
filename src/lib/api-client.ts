/**
 * Client-side API helper for calling /api/master
 * Replaces direct Server Action calls from client components
 * (Required for Cloudflare Pages Edge Runtime compatibility)
 */

export async function apiGet(resource: string, params?: Record<string, string>): Promise<any> {
  const url = new URL("/api/master", window.location.origin);
  url.searchParams.set("resource", resource);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || "Request gagal");
  }
  return res.json();
}

export async function apiPost(
  action: string,
  options?: { data?: any; id?: string; params?: Record<string, any> }
): Promise<any> {
  const res = await fetch("/api/master", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...options }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || "Request gagal");
  }
  return res.json();
}
