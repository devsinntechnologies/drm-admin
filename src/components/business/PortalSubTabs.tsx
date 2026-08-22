"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Monitor, Paintbrush } from "lucide-react";

type PortalSubTabsProps = {
  businessId: string;
};

export function PortalSubTabs({ businessId }: PortalSubTabsProps) {
  const pathname = usePathname();
  const base = `/dashboard/superAdmin/businesses/${businessId}/portal`;

  const tabs = [
    { key: "preview", label: "Preview", href: `${base}/preview`, icon: Monitor, match: () => pathname.startsWith(`${base}/preview`) },
    { key: "features", label: "Features", href: `${base}/features`, icon: LayoutDashboard, match: () => pathname.startsWith(`${base}/features`) },
    { key: "settings", label: "Appearance", href: `${base}/settings`, icon: Paintbrush, match: () => pathname.startsWith(`${base}/settings`) },
  ];

  return (
    <div>
      <p className="business-tab-level-label business-tab-level-label--sub">Portal</p>
      <nav className="dn-tab-bar business-tab-bar--sub" aria-label="Portal sections">
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
