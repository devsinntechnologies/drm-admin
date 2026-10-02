"use client";

import { useEffect } from "react";

export const DEFAULT_PORTAL_TITLE = "DigiNizam Admin";
export const DEFAULT_PORTAL_ICON = "/logo-mark.svg";

function upsertIconLink(rel: string, href: string) {
  // Next/React owns metadata links. Removing them breaks later route commits
  // when React tries to reconcile the detached nodes (removeChild errors).
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
  if (href.startsWith("data:image")) {
    link.type = href.slice(5).split(";")[0] || "image/png";
  } else if (href.split(/[?#]/)[0].endsWith(".svg")) {
    link.type = "image/svg+xml";
  } else {
    link.type = "image/png";
  }
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
