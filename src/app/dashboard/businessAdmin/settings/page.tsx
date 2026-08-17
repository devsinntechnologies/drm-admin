"use client";

import { Settings } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage } from "@/components/admin/PortalPage";
import { BusinessWorkspaceSettings } from "@/components/business/BusinessWorkspaceSettings";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";

export default function WorkspaceSettingsPage() {
  const { businessId, businessName, templateConfig } = useBusinessTemplate();

  return (
    <AdminShell
      activeTab="settings"
      pageTitle="Settings"
      pageSubtitle="Theme, logo, and modules for this business"
      headerIcon={Settings}
    >
      <PortalPage>
        {businessId ? (
          <BusinessWorkspaceSettings
            businessId={businessId}
            businessName={businessName}
            templateConfig={templateConfig}
          />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Select a business to edit workspace settings.</p>
        )}
      </PortalPage>
    </AdminShell>
  );
}
