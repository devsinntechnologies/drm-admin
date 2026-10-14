export const STAFF_REALTIME_EVENTS = {
  SELF_ORDERS_CHANGED: "drm:self-orders-changed",
  /** Full refetch (fallback). */
  ORDERS_CHANGED: "drm:orders-changed",
  /** Inline merge from socket payload (pause, resume, edits). */
  ORDERS_PATCH: "drm:orders-patch",
  INVOICES_CHANGED: "drm:invoices-changed",
  PRINTERS_CHANGED: "drm:printers-changed",
} as const;

export function emitStaffRealtime(event: string, detail?: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(event, { detail }));
}
