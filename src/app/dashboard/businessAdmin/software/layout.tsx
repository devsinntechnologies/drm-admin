"use client";

import { Suspense } from "react";
import { Smartphone } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Loading from "@/components/common/Loading";
import { PortalPage } from "@/components/admin/PortalPage";
import { SoftwareSubTabs } from "@/components/business/SoftwareSubTabs";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

function SoftwareLayoutContent({ children }: { children: React.ReactNode }) {
  const businessId = useActiveBusinessId();
  const { businessName } = useBusinessTemplate();

  return (
    <AdminShell
      activeTab="software"
      pageTitle="Software & Mobile"
      pageSubtitle={`Mobile app settings for ${businessName}`}
      headerIcon={Smartphone}
    >
      <PortalPage>
        {businessId ? (
          <>
            <div className="mb-5">
              <SoftwareSubTabs
                businessId={businessId}
                basePath="/dashboard/businessAdmin/software"
                appendBusinessQuery
              />
            </div>
            {children}
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Select a business to manage software settings.</p>
        )}
      </PortalPage>
    </AdminShell>
  );
}

export default function BusinessAdminSoftwareLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <SoftwareLayoutContent>{children}</SoftwareLayoutContent>
    </Suspense>
  );
}
