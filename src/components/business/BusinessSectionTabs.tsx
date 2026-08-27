"use client";

import Link from "next/link";
import { Globe2, LayoutDashboard, Settings2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type BusinessSection = "website" | "portal" | "software" | "profile";

type BusinessSectionTabsProps = {
  businessId: string;
  active: BusinessSection;
  className?: string;
};

const TABS: Array<{
  key: BusinessSection;
  label: string;
  icon: typeof Globe2;
  href: (base: string) => string;
}> = [
  { key: "website", label: "Website", icon: Globe2, href: (base) => `${base}/website` },
  { key: "portal", label: "Portal", icon: LayoutDashboard, href: (base) => `${base}/portal` },
  { key: "software", label: "Software & Mobile", icon: Smartphone, href: (base) => `${base}/software` },
  { key: "profile", label: "Profile", icon: Settings2, href: (base) => base },
];

export function BusinessSectionTabs({ businessId, active, className }: BusinessSectionTabsProps) {
  const base = `/dashboard/superAdmin/businesses/${businessId}`;

  return (
    <div>
      <p className="business-tab-level-label">Area</p>
      <nav className={cn("dn-tab-bar business-tab-bar--primary", className)} aria-label="Business sections">
      {TABS.map(({ key, label, icon: Icon, href }) => {
        const isActive = active === key;
        return (
          <Link
            key={key}
            href={href(base)}
            data-active={isActive ? "true" : "false"}
            className="dn-tab"
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        );
      })}
      </nav>
    </div>
  );
}

export function OpenPortalButton({
  businessId,
  className,
}: {
  businessId: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        window.open(
          `${window.location.origin}/dashboard/businessAdmin?businessId=${businessId}`,
          "_blank",
          "noopener,noreferrer",
        )
      }
      className={cn(
        "dn-btn dn-btn-primary inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm",
        className,
      )}
    >
      Open portal
    </button>
  );
}
