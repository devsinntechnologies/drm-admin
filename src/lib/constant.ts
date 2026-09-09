export const BASE_URL = (() => {
  const configured = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://vendor.umazing.shop"
  ).replace(/\/+$/, "");

  // Absolute remote/local API
  if (/^https?:\/\//i.test(configured)) {
    return configured;
  }

  // Relative same-origin proxy (e.g. "/backend") — required for `new URL(...)` callers
  const path = configured.startsWith("/") ? configured : `/${configured}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return `http://127.0.0.1:3000${path}`;
})();

/** Socket.IO needs a direct Nest URL (Next rewrites don't proxy WS well). */
export const SOCKET_URL = (
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (BASE_URL.includes("/backend") ? "http://127.0.0.1:6000" : BASE_URL)
).replace(/\/+$/, "");
