"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage } from "@/components/admin/PortalPage";
import { BusinessTemplatePreview } from "@/components/business/BusinessTemplatePreview";
import { BusinessWorkspaceSettings } from "@/components/business/BusinessWorkspaceSettings";
import { ActivityFeed } from "@/components/design-system/ActivityFeed";
import { Breadcrumbs } from "@/components/design-system/Breadcrumbs";
import {
  getBusinessProfile,
  getIndustryLabel,
  type BusinessProfileConfig,
} from "@/lib/business-profile";
import { getIndustryPreviewProfile } from "@/lib/industry-preview-profiles";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { useWebsite } from "@/hooks/useWebsite";
import { cn } from "@/lib/utils";

function BusinessProfileContent() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: business, isLoading, isError } = useGetBusinessByIdQuery(id, { skip: !id });
  const { website } = useWebsite(id);
  const [profile, setProfile] = useState<BusinessProfileConfig | null>(null);

  useEffect(() => {
    if (!id || !business) return;
    const templateConfig = business.templateConfig;
    if (templateConfig) {
      setProfile({
        industryId: templateConfig.industryId,
        primaryColor: templateConfig.primaryColor,
        secondaryColor: templateConfig.secondaryColor,
        themeMode: templateConfig.themeMode,
        typography: "Poppins",
        layoutStyle: "comfortable",
      });
      return;
    }
    setProfile(getBusinessProfile(id, business.businessName));
  }, [id, business]);

  const preview = useMemo(
    () => (profile ? getIndustryPreviewProfile(profile.industryId) : null),
    [profile],
  );

  if (!id) {
    return (
      <AdminShell activeTab="businesses">
        <p className="text-[#64748b]">Invalid business ID.</p>
      </AdminShell>
    );
  }

  if (isLoading || !profile) {
    return (
      <AdminShell activeTab="businesses">
        <Loading className="py-20" />
      </AdminShell>
    );
  }

  if (isError || !business) {
    return (
      <AdminShell activeTab="businesses">
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-6 text-[#dc2626]">
          Business not found.
          <Link href="/dashboard/superAdmin/businesses" className="ml-2 font-semibold underline">
            Back to businesses
          </Link>
        </div>
      </AdminShell>
    );
  }

  const stats = [
    { label: "Employees", value: "24" },
    { label: "Customers", value: "1,102" },
    { label: "Orders", value: "738" },
    { label: "Revenue", value: "Rs 358K" },
    { label: "Products", value: preview?.dashboardMetrics[0]?.value ?? "—" },
    { label: "Branches", value: "2" },
  ];

  return (
    <AdminShell activeTab="businesses">
      <PortalPage>
        <Breadcrumbs
          items={[
            { label: "Platform", href: "/dashboard/superAdmin" },
            { label: "Businesses", href: "/dashboard/superAdmin/businesses" },
            { label: business.businessName },
          ]}
          className="mb-4"
        />

        {/* Business profile */}
        <section className="mb-6 rounded-xl border border-[#e2e8f0] bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-[#64748b]">
                {getIndustryLabel(profile.industryId)} · {business.planName} Plan
                {business.templateConfig
                  ? ` · ${business.templateConfig.enabledModules.length} modules · ${business.templateConfig.dashboardCards.length} KPI cards`
                  : null}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold capitalize",
                    business.status?.toLowerCase() === "active"
                      ? "border-[#bbf7d0] bg-[#ecfdf5] text-[#059669]"
                      : "border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]",
                  )}
                >
                  Status: {business.status}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b]">
                  <Calendar className="h-3.5 w-3.5" />
                  Created {new Date(business.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/superAdmin/businesses")}
                className="dn-btn dn-btn-outline h-10 rounded-xl px-4 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() =>
                  window.open(`${window.location.origin}/dashboard/businessAdmin?businessId=${id}`, "_blank", "noopener,noreferrer")
                }
                className="dn-btn dn-btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"
              >
                Open Workspace <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MapPin, text: business.address },
              { icon: Mail, text: business.email },
              { icon: Phone, text: business.phone },
              { icon: User, text: business.ownerName },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#475569]"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#94a3b8]" />
                <span className="truncate">{text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#001840] text-white">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0f172a]">DigiNizam Website</h2>
                <p className="mt-1 text-sm text-[#64748b]">
                  {website
                    ? `${website.status} · ${website.publicUrl}`
                    : "No website yet. Open the workspace to create one."}
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/businessAdmin/website?businessId=${id}`}
              className="dn-btn dn-btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"
            >
              Manage website <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <BusinessTemplatePreview profile={profile} businessName={business.businessName} className="mb-6" />

        {business.templateConfig ? (
          <div className="mb-6">
            <BusinessWorkspaceSettings
              businessId={id}
              businessName={business.businessName}
              templateConfig={business.templateConfig}
              onDraftChange={(draft) =>
                setProfile((current) =>
                  current
                    ? {
                        ...current,
                        primaryColor: draft.primaryColor,
                        secondaryColor: draft.secondaryColor,
                        themeMode: draft.themeMode,
                      }
                    : current,
                )
              }
            />
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
              <h2 className="mb-3 text-sm font-bold text-[#0f172a]">Business Statistics</h2>
              <div className="grid grid-cols-2 gap-2">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">{s.label}</p>
                    <p className="text-sm font-bold text-[#0f172a]">{s.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0f172a]">
                <Users className="h-4 w-4 text-[#0050f8]" />
                Recent Activity
              </h2>
              <ActivityFeed
                items={[
                  {
                    id: "1",
                    title: "Profile viewed",
                    description: "Super admin opened business profile",
                    time: "Just now",
                    type: "system",
                  },
                  {
                    id: "2",
                    title: "Theme updated",
                    description: `${getIndustryLabel(profile.industryId)} template applied`,
                    time: "2m ago",
                    type: "business",
                  },
                  {
                    id: "3",
                    title: "Subscription active",
                    description: `${business.planName} plan is active`,
                    time: "1d ago",
                    type: "subscription",
                  },
                ]}
              />
          </section>
        </div>
      </PortalPage>
    </AdminShell>
  );
}

export default function BusinessProfilePage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <BusinessProfileContent />
    </Suspense>
  );
}
