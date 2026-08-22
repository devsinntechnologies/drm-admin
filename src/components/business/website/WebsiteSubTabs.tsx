"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, FileText, Globe2, LayoutTemplate, Link2 } from "lucide-react";

type WebsiteSubTabsProps = {
  businessId: string;
};

function isOverview(pathname: string, base: string) {
  return pathname === base;
}

export function WebsiteSubTabs({ businessId }: WebsiteSubTabsProps) {
  const pathname = usePathname();
  const base = `/dashboard/superAdmin/businesses/${businessId}/website`;

  const tabs = [
    { key: "overview", label: "Overview", href: base, icon: Globe2, match: () => isOverview(pathname, base) },
    { key: "preview", label: "Preview", href: `${base}/preview`, icon: Eye, match: () => pathname.startsWith(`${base}/preview`) },
    { key: "pages", label: "Pages", href: `${base}/pages`, icon: FileText, match: () => pathname.startsWith(`${base}/pages`) },
    { key: "theme", label: "Theme", href: `${base}/theme`, icon: LayoutTemplate, match: () => pathname.startsWith(`${base}/theme`) },
    { key: "domain", label: "Domain", href: `${base}/domain`, icon: Link2, match: () => pathname.startsWith(`${base}/domain`) },
  ];

  return (
    <div>
      <p className="business-tab-level-label business-tab-level-label--sub">Website</p>
      <nav className="dn-tab-bar business-tab-bar--sub" aria-label="Website sections">
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