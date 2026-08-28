"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Monitor, ScrollText, SlidersHorizontal } from "lucide-react";
import { appendBusinessId } from "@/lib/module-routes";

type SoftwareSubTabsProps = {
  businessId: string;
  basePath?: string;
  /** When true, appends ?businessId= to each tab href (business admin workspace). */
  appendBusinessQuery?: boolean;
};

export function SoftwareSubTabs({ businessId, basePath, appendBusinessQuery }: SoftwareSubTabsProps) {
  const pathname = usePathname();
  const base = basePath ?? `/dashboard/superAdmin/businesses/${businessId}/software`;

  const hrefFor = (segment: string) => {
    const path = `${base}/${segment}`;
    return appendBusinessQuery ? appendBusinessId(path, businessId) : path;
  };

  const tabs = [
    {
      key: "preview",
      label: "Preview",
      href: hrefFor("preview"),
      icon: Monitor,
      match: () => pathname.includes(`${base}/preview`) || pathname.endsWith("/software/preview"),
    },
    {
      key: "control",
      label: "Control",
      href: hrefFor("control"),
      icon: SlidersHorizontal,
      match: () =>
        pathname.includes(`${base}/control`) ||
        pathname.endsWith("/software/control") ||
        pathname.includes(`${base}/features`) ||
        pathname.includes(`${base}/roles`) ||
        pathname.includes(`${base}/settings`),
    },
    {
      key: "logs",
      label: "Logs",
      href: hrefFor("logs"),
      icon: ScrollText,
      match: () => pathname.includes(`${base}/logs`) || pathname.endsWith("/software/logs"),
    },
  ];

  return (
    <div>
      <p className="business-tab-level-label business-tab-level-label--sub">Software & Mobile</p>
      <nav className="dn-tab-bar business-tab-bar--sub" aria-label="Software sections">
        {tabs.map(({ key, label, href, icon: Icon, match }) => (
          <Link
            key={key}
            href={href}
            data-active={match() ? "true" : "false"}
            className="dn-tab"
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
