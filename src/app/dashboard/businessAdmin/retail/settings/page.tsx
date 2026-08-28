"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader } from "@/components/admin/PortalPage";
import { ControlSection } from "@/components/business/ControlSection";
import { SoftwareStaffOverview } from "@/components/business/SoftwareStaffOverview";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";

function RetailSettingsContent() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const businessId = useActiveBusinessId();
  const { templateConfig } = useBusinessTemplate();

  const { data: business, isLoading, isError } = useGetBusinessByIdQuery(businessId || "", {
    skip: !businessId,
  });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "settings") && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="settings" pageTitle="Settings" pageSubtitle="Business profile and staff overview">
      <PortalPage>
        <PortalPageHeader icon={Building2} title="Settings" subtitle="Your store's profile and team, at a glance" />

        {!businessId ? (
          <p className="text-sm text-[var(--text-muted)]">No business selected.</p>
        ) : isLoading ? (
          <Loading className="py-16" label="Loading settings…" />
        ) : isError || !business ? (
          <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-6 text-sm text-[#dc2626]">
            Could not load your business profile. Try refreshing the page.
          </div>
        ) : (
          <div className="space-y-6">
            <ControlSection
              index={0}
              title="Business profile"
              description="Contact and plan details for this business. To change these, contact support."
              icon={Building2}
            >
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Business name</dt>
                  <dd className="mt-0.5 text-sm text-[#0f172a]">{business.businessName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Plan</dt>
                  <dd className="mt-0.5 text-sm text-[#0f172a]">{business.planName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Address</dt>
                  <dd className="mt-0.5 text-sm text-[#0f172a]">{business.address || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Phone</dt>
                  <dd className="mt-0.5 text-sm text-[#0f172a]">{business.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Email</dt>
                  <dd className="mt-0.5 text-sm text-[#0f172a]">{business.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Owner</dt>
                  <dd className="mt-0.5 text-sm text-[#0f172a]">{business.ownerName || "—"}</dd>
                </div>
              </dl>
            </ControlSection>

            <SoftwareStaffOverview
              businessId={businessId}
              business={business}
              industryId={templateConfig?.industryId ?? "retail-store"}
              enabledModules={templateConfig?.enabledModules}
            />
          </div>
        )}
      </PortalPage>
    </AdminShell>
  );
}

export default function RetailSettingsPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <RetailSettingsContent />
    </Suspense>
  );
}
