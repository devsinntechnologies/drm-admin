import { BASE_URL } from "@/lib/constant";

/** Turn a stored logo/image path, filename, or data URL into a browser-usable src. */
export function resolveMediaUrl(path?: string | null, folder = "logos"): string | null {
  if (!path?.trim()) return null;
  const value = path.trim();
  if (value.startsWith("data:") || value.startsWith("blob:") || /^https?:\/\//i.test(value)) {
    return value;
  }

  const cleaned = value.replace(/^\/+/, "");
  if (cleaned.startsWith("uploads/")) {
    return `${BASE_URL.replace(/\/$/, "")}/${cleaned}`;
  }

  return `${BASE_URL.replace(/\/$/, "")}/uploads/${folder}/${cleaned}`;
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
