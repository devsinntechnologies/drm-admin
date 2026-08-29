"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Smartphone } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Loading from "@/components/common/Loading";
import { PortalPage } from "@/components/admin/PortalPage";
import { SoftwareSubTabs } from "@/components/business/SoftwareSubTabs";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { canManageSoftwareAndWebsite, normalizePortalRole } from "@/lib/role-access";
import { workspaceHomePath } from "@/lib/pharmacy-role-nav";

function SoftwareLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuth();
  const businessId = useActiveBusinessId();
  const { businessName } = useBusinessTemplate();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const storedRole =
      typeof window !== "undefined"
        ? localStorage.getItem("roleName") ??
          localStorage.getItem("auth_role") ??
          localStorage.getItem("role")
        : null;
    const currentRole = normalizePortalRole(role ?? storedRole);
    const impersonatedBusinessId = searchParams.get("businessId") || businessId;

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    if (!canManageSoftwareAndWebsite(currentRole)) {
      router.replace(workspaceHomePath(currentRole, impersonatedBusinessId));
      return;
    }

    if (currentRole === "super_admin" && !impersonatedBusinessId) {
      router.replace("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [role, router, searchParams, businessId]);

  if (!isAuthorized) {
    return <Loading fullScreen />;
  }

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
