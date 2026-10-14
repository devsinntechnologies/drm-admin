/** Human-readable message from Nest / fetch error bodies (avoids toast "[object Object]"). */
export function formatApiErrorMessage(detail: unknown, fallback = "Request failed"): string {
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    return detail.map((x) => formatApiErrorMessage(x, "")).filter(Boolean).join(", ") || fallback;
  }
  if (detail && typeof detail === "object") {
    const obj = detail as Record<string, unknown>;
    if ("message" in obj) {
      const msg = formatApiErrorMessage(obj.message, "");
      if (msg) return msg;
    }
    if ("error" in obj) {
      const err = formatApiErrorMessage(obj.error, "");
      if (err) return err;
    }
  }
  return fallback;
}

export function parseApiErrorText(text: string, fallback: string): string {
  try {
    const parsed = JSON.parse(text);
    return formatApiErrorMessage(parsed.message ?? parsed.error ?? parsed, fallback);
  } catch {
    return text?.trim() || fallback;
  }
}
