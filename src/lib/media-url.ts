import { BASE_URL } from "@/lib/constant";

const LEGACY_API_HOSTS = [
  "http://127.0.0.1:6000",
  "http://localhost:6000",
  "http://127.0.0.1:4000",
  "http://localhost:4000",
  "http://10.0.2.2:4000",
  "https://drm.devsinntechnologies.com",
  "https://vendor.umazing.shop",
];

function apiBase(): string {
  return BASE_URL.replace(/\/$/, "");
}

/** Mobile / cached configs may store absolute localhost URLs — rewrite to active API base. */
export function rewriteLegacyMediaHost(url: string): string {
  for (const host of LEGACY_API_HOSTS) {
    if (url.startsWith(host)) {
      const rest = url.slice(host.length);
      return `${apiBase()}${rest.startsWith("/") ? rest : `/${rest}`}`;
    }
  }
  return url;
}

/** Turn a stored logo/image path, filename, or data URL into a browser-usable src. */
export function resolveMediaUrl(path?: string | null, folder = "logos"): string | null {
  if (!path?.trim()) return null;
  const value = path.trim();
  if (value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }
  if (/^https?:\/\//i.test(value)) {
    return rewriteLegacyMediaHost(value);
  }

  const cleaned = value.replace(/^\/+/, "");
  const base = apiBase();

  if (cleaned.startsWith("uploads/")) {
    return `${base}/${cleaned}`;
  }

  if (cleaned.includes("product-") || cleaned.includes("table-")) {
    return `${base}/uploads/${cleaned}`;
  }

  if (cleaned.startsWith("logos/") || cleaned.includes("logo-")) {
    return `${base}/uploads/${cleaned.startsWith("logos/") ? cleaned : `logos/${cleaned}`}`;
  }

  return `${base}/uploads/${folder}/${cleaned}`;
}

export function businessInitials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "B";
  return parts
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
