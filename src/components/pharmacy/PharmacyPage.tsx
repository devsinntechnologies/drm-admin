"use client";

import type { LucideIcon } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import {
  PortalEmptyState,
  PortalErrorAlert,
  PortalPage,
} from "@/components/admin/PortalPage";
import { Button } from "@/components/ui/button";

export function PharmacyPage({
  moduleId,
  icon: Icon,
  title,
  subtitle,
  actions,
  loading,
  error,
  children,
}: {
  moduleId: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <AdminShell
      activeTab={moduleId}
      pageTitle={title}
      pageSubtitle={subtitle}
      headerActions={actions}
      headerIcon={Icon}
    >
      <PortalPage>
        {headerActionsMobile(actions)}
        {error ? <PortalErrorAlert message={error} /> : null}
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : (
          children
        )}
      </PortalPage>
    </AdminShell>
  );
}

function headerActionsMobile(actions?: React.ReactNode) {
  if (!actions) return null;
  return <div className="flex flex-wrap items-center justify-end gap-2 sm:hidden">{actions}</div>;
}

export { PortalEmptyState, Button };
