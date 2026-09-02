"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  CircleDollarSign,
  Server,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage } from "@/components/admin/PortalPage";
import { ActivityFeed, type ActivityItem } from "@/components/design-system/ActivityFeed";
import { Breadcrumbs } from "@/components/design-system/Breadcrumbs";
import { MetricCard } from "@/components/design-system/MetricCard";
import { PLATFORM_INDUSTRY_DISTRIBUTION } from "@/lib/industry-preview-profiles";
import { useGetBusinessesQuery } from "@/hooks/useBusiness";
import { useGetPlansQuery } from "@/hooks/usePlan";
import { useAuth } from "@/hooks/useAuth";

const ACTIVITY: ActivityItem[] = [
  { id: "1", title: "New business registered", description: "Metro Retail Co. joined the platform", time: "4m ago", type: "business" },
  { id: "2", title: "Subscription upgraded", description: "HealthFirst Clinic moved to Enterprise", time: "18m ago", type: "subscription" },
  { id: "3", title: "User registered", description: "New admin user for Apex Logistics", time: "42m ago", type: "user" },
  { id: "4", title: "Payment received", description: "Rs 45,000 — Premium plan renewal", time: "1h ago", type: "payment" },
  { id: "5", title: "System event", description: "Scheduled backup completed successfully", time: "2h ago", type: "system" },
];

function PlatformConsoleContent() {
  const { token } = useAuth();
  const { data: planData, isLoading: plansLoading } = useGetPlansQuery(undefined, {
    skip: !token,
  });
  const { data: businessData, isLoading: businessesLoading } = useGetBusinessesQuery(
    { page: 1 },
    { skip: !token },
  );
  const stats = planData && !Array.isArray(planData) ? planData.stats : undefined;
  const totalBusinesses = businessData?.pagination?.total ?? 0;

  return (
    <AdminShell activeTab="dashboard">
      <PortalPage>
        <Breadcrumbs
          items={[{ label: "Platform", href: "/dashboard/superAdmin" }, { label: "Console" }]}
          className="mb-2"
        />

        <div className="mb-6 flex justify-end">
          <Link href="/dashboard/superAdmin/businesses" className="dn-btn dn-btn-primary h-[44px] rounded-xl px-4 text-sm">
            Manage Businesses
          </Link>
        </div>

        {/* Business metrics */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#64748b]">Business Metrics</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <MetricCard label="Total Businesses" value={businessesLoading ? "…" : totalBusinesses} icon={Building2} />
            <MetricCard label="Active" value={businessesLoading ? "…" : Math.max(0, totalBusinesses - 2)} delta="+4 this week" icon={Zap} tone="success" />
            <MetricCard label="Trial" value="8" sub="14-day trials" icon={Users} tone="info" />
            <MetricCard label="Inactive" value="3" icon={Building2} />
            <MetricCard label="Suspended" value="1" tone="warning" icon={Building2} />
            <MetricCard label="Pending Approval" value="2" sub="Awaiting review" icon={UserPlus} />
          </div>
        </section>

        {/* Revenue metrics */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#64748b]">Revenue Metrics</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="MRR" value="Rs 842K" delta="+12.4% vs last month" icon={CircleDollarSign} tone="primary" />
            <MetricCard label="ARR" value="Rs 10.1M" delta="+18% YoY" icon={TrendingUp} tone="primary" />
            <MetricCard label="Renewal Rate" value="94.2%" delta="Above target" icon={Activity} tone="success" />
            <MetricCard label="Churn Rate" value="2.1%" delta="-0.4% improvement" icon={TrendingUp} />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* User metrics */}
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#64748b]">User Metrics</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Total Users" value="1,248" icon={Users} />
                <MetricCard label="Active Users" value="986" delta="79% active rate" icon={Users} tone="success" />
                <MetricCard label="New Users" value="42" sub="This week" icon={UserPlus} tone="info" />
                <MetricCard label="Returning" value="68%" icon={Activity} />
              </div>
            </section>

            {/* Industry distribution */}
            <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
              <h2 className="text-sm font-bold text-[#0f172a]">Industry Distribution</h2>
              <p className="mt-0.5 text-xs text-[#64748b]">Businesses across supported verticals</p>
              <div className="mt-5 grid gap-6 lg:grid-cols-[180px_1fr]">
                <div className="relative mx-auto h-40 w-40">
                  <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" aria-hidden>
                    {(() => {
                      const total = PLATFORM_INDUSTRY_DISTRIBUTION.reduce((s, d) => s + d.value, 0);
                      const r = 58;
                      const c = 2 * Math.PI * r;
                      let offset = 0;
                      return PLATFORM_INDUSTRY_DISTRIBUTION.map((slice) => {
                        const dash = (slice.value / total) * c;
                        const el = (
                          <circle
                            key={slice.label}
                            cx={80}
                            cy={80}
                            r={r}
                            fill="none"
                            stroke={slice.color}
                            strokeWidth={22}
                            strokeDasharray={`${dash} ${c - dash}`}
                            strokeDashoffset={-offset}
                          />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-[26px] flex flex-col items-center justify-center rounded-full bg-[#f8fafc] text-center">
                    <span className="text-xl font-bold text-[#0f172a]">{totalBusinesses || 100}</span>
                    <span className="text-[10px] font-semibold uppercase text-[#94a3b8]">Businesses</span>
                  </div>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {PLATFORM_INDUSTRY_DISTRIBUTION.map((item) => (
                    <li key={item.label} className="flex items-center justify-between rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3 py-2 text-sm">
                      <span className="flex items-center gap-2 font-medium text-[#475569]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.label}
                      </span>
                      <strong className="text-[#0f172a]">{item.value}%</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Platform health */}
            <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
              <h2 className="text-sm font-bold text-[#0f172a]">Platform Health</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "API Status", value: "Operational", ok: true },
                  { label: "Server Status", value: "Healthy", ok: true },
                  { label: "Storage Usage", value: "62%", ok: true },
                  { label: "Active Sessions", value: "248", ok: true },
                  { label: "Failed Jobs", value: "3", ok: false },
                  { label: "Queue Health", value: "Normal", ok: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg border border-[#f1f5f9] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-[#94a3b8]" />
                      <span className="text-sm text-[#64748b]">{row.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${row.ok ? "text-[#059669]" : "text-[#d97706]"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Activity feed */}
          <aside className="rounded-xl border border-[#e2e8f0] bg-white p-5">
            <h2 className="text-sm font-bold text-[#0f172a]">Activity Feed</h2>
            <p className="mt-0.5 text-xs text-[#64748b]">Recent platform events</p>
            <ActivityFeed items={ACTIVITY} className="mt-4" />
            <div className="mt-4 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 text-center">
              <p className="text-xs text-[#64748b]">Subscription plans available</p>
              <p className="mt-1 text-2xl font-bold text-[#0f172a]">
                {plansLoading ? "…" : String(stats?.totalPlans ?? 0)}
              </p>
            </div>
          </aside>
        </div>
      </PortalPage>
    </AdminShell>
  );
}

export default function SuperAdminDashboard() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <PlatformConsoleContent />
    </Suspense>
  );
}
