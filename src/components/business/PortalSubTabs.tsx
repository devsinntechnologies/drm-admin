"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Monitor } from "lucide-react";

type PortalSubTabsProps = {
  businessId: string;
};

export function PortalSubTabs({ businessId }: PortalSubTabsProps) {
  const pathname = usePathname();
  const base = `/dashboard/superAdmin/businesses/${businessId}/portal`;

  // "Appearance" used to live here as its own form (BusinessWorkspaceSettings)
  // editing the exact same template-config record that Software & Mobile ->
  // Control also edits -- two forms over one record, which is exactly the kind
  // of duplicate control surface this was merged out of. Theme/logo/module
  // settings now live in one place: Software & Mobile -> Control.
  const tabs = [
    { key: "preview", label: "Preview", href: `${base}/preview`, icon: Monitor, match: () => pathname.startsWith(`${base}/preview`) },
    { key: "features", label: "Features", href: `${base}/features`, icon: LayoutDashboard, match: () => pathname.startsWith(`${base}/features`) },
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
