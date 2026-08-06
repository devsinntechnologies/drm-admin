import { BASE_URL } from "@/lib/constant";

/** Collection routes that NestJS redirects unless a trailing slash is present. */
const COLLECTION_ROOTS = new Set(["products", "category", "ingredients"]);

/**
 * Builds a fully-qualified API URL with trailing slashes where the backend requires them.
 */
export function buildApiUrl(path: string): string {
  const base = BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const [pathname, search = ""] = normalized.split("?");
  const query = search ? `?${search}` : "";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 1 && COLLECTION_ROOTS.has(segments[0])) {
    return `${base}/${segments[0]}/${query}`;
  }

  return `${base}${pathname}${query}`;
}

export type ApiListResponse<T> = {
  data?: T[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export function unwrapApiData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload && (payload as { data?: T }).data !== undefined) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
