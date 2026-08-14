export const STAFF_REALTIME_EVENTS = {
  SELF_ORDERS_CHANGED: "drm:self-orders-changed",
  ORDERS_CHANGED: "drm:orders-changed",
} as const;

export function emitStaffRealtime(event: string, detail?: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(event, { detail }));
}
