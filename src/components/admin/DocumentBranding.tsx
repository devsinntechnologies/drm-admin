"use client";

import { useEffect } from "react";

export const DEFAULT_PORTAL_TITLE = "DigiNizam Admin";
export const DEFAULT_PORTAL_ICON = "/logo-mark.svg";

function upsertIconLink(rel: string, href: string) {
  document.querySelectorAll(`link[rel="${rel}"]`).forEach((node) => node.remove());
  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  if (href.startsWith("data:image")) {
    link.type = href.slice(5).split(";")[0] || "image/png";
  } else if (!href.endsWith(".svg")) {
    link.type = "image/png";
  }
  document.head.appendChild(link);
}

/** Browser tab title + favicon. Driven by the business logo/name from admin. */
export function applyDocumentBranding(title: string, faviconUrl?: string | null) {
  if (typeof document === "undefined") return;
  document.title = title.trim() || DEFAULT_PORTAL_TITLE;
  const href = faviconUrl?.trim() || DEFAULT_PORTAL_ICON;
  upsertIconLink("icon", href);
  upsertIconLink("shortcut icon", href);
  upsertIconLink("apple-touch-icon", href);
}

export function DocumentBranding({
  title,
  faviconUrl,
}: {
  title: string;
  faviconUrl?: string | null;
}) {
  useEffect(() => {
    applyDocumentBranding(title, faviconUrl);
  }, [title, faviconUrl]);

  return null;
}
