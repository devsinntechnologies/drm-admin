"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  ExternalLink,
  Mail,
  MapPin,
  Palette,
  Phone,
  User,
  Users,
} from "lucide-react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage } from "@/components/admin/PortalPage";
import { BusinessTemplatePreview } from "@/components/business/BusinessTemplatePreview";
import { ActivityFeed } from "@/components/design-system/ActivityFeed";
import { Breadcrumbs } from "@/components/design-system/Breadcrumbs";
import {
  getBusinessProfile,
  getIndustryLabel,
  saveBusinessProfile,
  type BusinessProfileConfig,
} from "@/lib/business-profile";
import { getIndustryPreviewProfile } from "@/lib/industry-preview-profiles";
import { INDUSTRY_TEMPLATES } from "@/templates/industries";
import { ACCENT_COLORS, colorsFromAccent } from "@/templates/modules";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import type { AccentColor } from "@/templates/types";
import { cn } from "@/lib/utils";

function BusinessProfileContent() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: business, isLoading, isError } = useGetBusinessByIdQuery(id, { skip: !id });
  const [profile, setProfile] = useState<BusinessProfileConfig | null>(null);

  useEffect(() => {
    if (!id || !business) return;
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

  function updateProfile(next: Partial<BusinessProfileConfig>) {
    const merged = { ...profile!, ...next };
    setProfile(merged);
    saveBusinessProfile(id, merged);
  }

  function applyIndustry(industryId: string) {
    const template = INDUSTRY_TEMPLATES.find((t) => t.id === industryId);
    const colors = template ? colorsFromAccent(template.theme.accent) : colorsFromAccent("blue");
    updateProfile({
      industryId,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
    });
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

        {/* Business profile header */}
        <section className="portal-header mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="portal-icon-box shrink-0">
                <Building2 className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-[#0f172a] lg:text-2xl">
                  {business.businessName}
                </h1>
                <p className="mt-1 text-sm text-[#64748b]">
                  {getIndustryLabel(profile.industryId)} · {business.planName} Plan
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
                onClick={() => window.open(`/dashboard/businessAdmin?businessId=${id}`, "_blank")}
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

        <BusinessTemplatePreview profile={profile} businessName={business.businessName} className="mb-6" />

        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          {/* Theme panel */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#0050f8]" />
                <h2 className="text-sm font-bold text-[#0f172a]">Theme & Branding</h2>
              </div>

              <label className="mb-3 block text-xs font-semibold text-[#64748b]">Industry Template</label>
              <select
                value={profile.industryId}
                onChange={(e) => applyIndustry(e.target.value)}
                className="portal-input mb-4"
              >
                {INDUSTRY_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
                <option value="gym">Gym & Fitness</option>
                <option value="clinic">Healthcare Clinic</option>
                <option value="real-estate">Real Estate</option>
                <option value="logistics">Logistics</option>
                <option value="education">Education</option>
                <option value="agency">Agency</option>
              </select>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-[#64748b]">
                  Primary
                  <input
                    type="color"
                    value={profile.primaryColor}
                    onChange={(e) => updateProfile({ primaryColor: e.target.value })}
                    className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-[#e2e8f0]"
                  />
                </label>
                <label className="block text-xs font-semibold text-[#64748b]">
                  Secondary
                  <input
                    type="color"
                    value={profile.secondaryColor}
                    onChange={(e) => updateProfile({ secondaryColor: e.target.value })}
                    className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-[#e2e8f0]"
                  />
                </label>
              </div>

              <p className="mb-2 text-xs font-semibold text-[#64748b]">Quick presets</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
                  const preset = ACCENT_COLORS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        updateProfile({
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary,
                        })
                      }
                      className="h-7 w-7 rounded-md border border-[#e2e8f0]"
                      style={{ backgroundColor: preset.primary }}
                      title={preset.label}
                    />
                  );
                })}
              </div>

              <div className="mt-4 flex gap-2">
                {(["light", "dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateProfile({ themeMode: mode })}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize ${
                      profile.themeMode === mode
                        ? "border-[#001840] bg-[#001840] text-white"
                        : "border-[#e2e8f0] bg-white text-[#64748b]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </section>

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
