"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";
import { getStoredAuthToken } from "@/lib/utils";

export type WebsiteStatus =
  | "provisioning"
  | "ready"
  | "published"
  | "unpublished"
  | "failed";

export type CustomDomainStatus =
  | "none"
  | "pending"
  | "verifying"
  | "connected"
  | "failed";

export interface WebsiteDnsInstructions {
  cname: { type: string; host: string | null; value: string };
  txt: { type: string; host: string | null; value: string };
  http: { path: string; value: string | null | undefined };
}

export interface WebsiteRecord {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  subdomain: string;
  defaultUrl: string;
  publicUrl: string;
  customDomain?: string | null;
  customDomainStatus: CustomDomainStatus;
  verificationToken?: string;
  status: WebsiteStatus;
  themeName?: string | null;
  publishedAt?: string | null;
  lastError?: string | null;
  createdAt?: string;
  updatedAt?: string;
  dns?: WebsiteDnsInstructions;
}

export interface WebsitePageRecord {
  id: number;
  name: string;
  url: string;
  isPublished: boolean;
  indexed?: boolean;
}

export interface WebsiteThemeRecord {
  name: string;
  label: string;
  summary: string;
  previewUrl?: string;
  installed: boolean;
  active: boolean;
}

export interface WebsiteMenuRecord {
  id: number;
  name: string;
  url: string;
  parentId?: number | null;
}

function getAuthToken(reduxToken: string | null) {
  if (reduxToken) return reduxToken;
  return getStoredAuthToken();
}

function parseApiError(text: string, fallback: string) {
  try {
    const parsed = JSON.parse(text);
    let detail = parsed.message || parsed.error || text;
    if (typeof detail === "object" && detail?.message) detail = detail.message;
    if (Array.isArray(detail)) detail = detail.join(", ");
    return typeof detail === "string" ? detail : fallback;
  } catch {
    return text || fallback;
  }
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseApiError(text, fallback));
  }
  return response.json();
}

function unwrap<T>(json: { data?: T } | T): T {
  if (json && typeof json === "object" && "data" in json && json.data !== undefined) {
    return json.data as T;
  }
  return json as T;
}

function appendBusinessId(url: URL, businessId: string | null) {
  if (businessId) {
    url.searchParams.set("businessId", businessId);
  }
}

export function useWebsite(explicitBusinessId?: string) {
  const { token: reduxToken } = useAuth();
  const activeBusinessId = useActiveBusinessId();
  const businessId = explicitBusinessId || activeBusinessId;
  const [website, setWebsite] = useState<WebsiteRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async <T,>(path: string, init?: RequestInit, fallback = "Website request failed") => {
      const token = getAuthToken(reduxToken);
      if (!token) throw new Error("No authentication token available");
      const url = new URL(`${BASE_URL}${path}`);
      appendBusinessId(url, businessId);
      const response = await fetch(url.toString(), {
        ...init,
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...(init?.headers || {}),
        },
      });
      const json = await readJson<{ data?: T } | T>(response, fallback);
      return unwrap<T>(json);
    },
    [businessId, reduxToken],
  );

  const fetchWebsite = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<WebsiteRecord>("/websites", { method: "GET" }, "Failed to load website");
      setWebsite(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load website";
      if (message.toLowerCase().includes("not found")) {
        setWebsite(null);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchWebsite();
  }, [fetchWebsite]);

  const createWebsite = useCallback(async () => {
    setActionLoading(true);
    try {
      const data = await request<WebsiteRecord>("/websites", { method: "POST" }, "Failed to create website");
      setWebsite(data);
      return data;
    } finally {
      setActionLoading(false);
    }
  }, [request]);

  const retryWebsite = useCallback(async () => {
    setActionLoading(true);
    try {
      const data = await request<WebsiteRecord>("/websites/retry", { method: "POST" }, "Failed to retry website");
      setWebsite(data);
      return data;
    } finally {
      setActionLoading(false);
    }
  }, [request]);

  const updateWebsite = useCallback(
    async (payload: { name?: string; published?: boolean }) => {
      setActionLoading(true);
      try {
        const data = await request<WebsiteRecord>(
          "/websites",
          { method: "PATCH", body: JSON.stringify(payload) },
          "Failed to update website",
        );
        setWebsite(data);
        return data;
      } finally {
        setActionLoading(false);
      }
    },
    [request],
  );

  const listPages = useCallback(
    () => request<WebsitePageRecord[]>("/websites/pages", { method: "GET" }, "Failed to load pages"),
    [request],
  );

  const createPage = useCallback(
    (name: string, addMenu = true) =>
      request<WebsitePageRecord[]>(
        "/websites/pages",
        { method: "POST", body: JSON.stringify({ name, addMenu }) },
        "Failed to create page",
      ),
    [request],
  );

  const updatePage = useCallback(
    (id: number, payload: { name?: string; isPublished?: boolean }) =>
      request<WebsitePageRecord[]>(
        `/websites/pages/${id}`,
        { method: "PATCH", body: JSON.stringify(payload) },
        "Failed to update page",
      ),
    [request],
  );

  const deletePage = useCallback(
    (id: number) =>
      request<WebsitePageRecord[]>(`/websites/pages/${id}`, { method: "DELETE" }, "Failed to delete page"),
    [request],
  );

  const listThemes = useCallback(
    () => request<WebsiteThemeRecord[]>("/websites/themes", { method: "GET" }, "Failed to load themes"),
    [request],
  );

  const applyTheme = useCallback(
    async (themeName: string) => {
      const data = await request<WebsiteRecord>(
        "/websites/themes/apply",
        { method: "POST", body: JSON.stringify({ themeName }) },
        "Failed to apply theme",
      );
      setWebsite(data);
      return data;
    },
    [request],
  );

  const listMenus = useCallback(
    () => request<WebsiteMenuRecord[]>("/websites/menus", { method: "GET" }, "Failed to load menus"),
    [request],
  );

  const openBuilder = useCallback(
    () => request<{ url: string; expiresAt: string }>("/websites/editor-session", { method: "GET" }, "Failed to open builder"),
    [request],
  );

  const attachDomain = useCallback(
    async (domain: string) => {
      const data = await request<WebsiteRecord>(
        "/websites/domain",
        { method: "POST", body: JSON.stringify({ domain }) },
        "Failed to connect domain",
      );
      setWebsite(data);
      return data;
    },
    [request],
  );

  const verifyDomain = useCallback(async () => {
    const data = await request<WebsiteRecord>("/websites/domain/verify", { method: "POST" }, "Failed to verify domain");
    setWebsite(data);
    return data;
  }, [request]);

  const removeDomain = useCallback(async () => {
    const data = await request<WebsiteRecord>("/websites/domain", { method: "DELETE" }, "Failed to remove domain");
    setWebsite(data);
    return data;
  }, [request]);

  return {
    website,
    loading,
    actionLoading,
    error,
    businessId,
    fetchWebsite,
    createWebsite,
    retryWebsite,
    updateWebsite,
    listPages,
    createPage,
    updatePage,
    deletePage,
    listThemes,
    applyTheme,
    listMenus,
    openBuilder,
    attachDomain,
    verifyDomain,
    removeDomain,
  };
}
