"use client";

import Image from "next/image";
import {
  Activity,
  Award,
  BarChart3,
  Building2,
  DollarSign,
  PieChart,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useGetPlansQuery } from "@/hooks/usePlan";

const topBusinesses = [
  { rank: 1, name: "The Golden Spoon", orders: "1250 orders", revenue: "$125.0K", plan: "Enterprise", image: "/business/pic1.jpeg" },
  { rank: 2, name: "Pasta Palace", orders: "890 orders", revenue: "$89.0K", plan: "Premium", image: "/business/pic2.jpeg" },
  { rank: 3, name: "Sushi World", orders: "520 orders", revenue: "$67.0K", plan: "Premium", image: "/business/pic4.jpeg" },
  { rank: 4, name: "Burger Haven", orders: "650 orders", revenue: "$45.0K", plan: "Basic", image: "/business/pic3.jpeg" },
  { rank: 5, name: "Taco Fiesta", orders: "380 orders", revenue: "$32.0K", plan: "Basic", image: "/business/pic5.jpeg" },
];

export default function DashboardPage() {
  const { data, isLoading } = useGetPlansQuery();
  const stats = data?.stats;

  const summaryCards = [
    {
      title: "Total Plans",
      value: isLoading ? "..." : String(stats?.totalPlans ?? 0),
      sub: "Available subscription plans",
      bg: "from-[#0f172a] to-[#155e75]",
      icon: <Building2 className="h-5 w-5" strokeWidth={1.8} />,
      ghost: <Building2 className="h-20 w-20 opacity-30" strokeWidth={1.2} />,
    },
    {
      title: "Subscribed Businesses",
      value: isLoading ? "..." : String(stats?.subscribedBusinesses ?? 0),
      sub: "Businesses with active plans",
      bg: "from-[#065f46] to-[#10b981]",
      icon: <Users className="h-5 w-5" strokeWidth={1.8} />,
      ghost: <Users className="h-20 w-20 opacity-30" strokeWidth={1.2} />,
    },
    {
      title: "Total Orders",
      value: "3,690",
      sub: "◎ System-wide",
      bg: "from-[#1d4ed8] to-[#0ea5e9]",
      icon: <ReceiptText className="h-5 w-5" strokeWidth={1.8} />,
      ghost: <ReceiptText className="h-20 w-20 opacity-30" strokeWidth={1.2} />,
    },
    {
      title: "Total Revenue",
      value: "$358.0K",
      sub: "Across all businesses",
      bg: "from-[#b45309] to-[#ef4444]",
      icon: <DollarSign className="h-5 w-5" strokeWidth={1.8} />,
      ghost: <DollarSign className="h-20 w-20 opacity-30" strokeWidth={1.2} />,
    },
  ];

  return (
    <AdminShell activeTab="dashboard">
      <section className="mx-auto mb-5 grid max-w-7xl grid-cols-1 gap-4 rounded-3xl border border-white bg-[linear-gradient(120deg,rgba(255,255,255,0.82),rgba(240,249,255,0.72))] p-5 shadow-[0_18px_30px_rgba(15,23,42,0.09)] lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f766e]">Operational Snapshot</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#0f172a] lg:text-3xl">Control Center Dashboard</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#5b657a] lg:text-base">
            Monitor plan performance, track subscription health, and identify top-performing businesses at a glance.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Uptime", value: "99.9%" },
            { label: "Alerts", value: "2" },
            { label: "Live", value: "24" },
          ].map((mini) => (
            <article key={mini.label} className="rounded-2xl border border-[#dbe7f4] bg-white/80 p-3 text-center shadow-[0_8px_14px_rgba(15,23,42,0.07)]">
              <p className="text-xs font-medium text-[#64748b]">{mini.label}</p>
              <strong className="mt-1 block text-xl font-semibold text-[#0f172a]">{mini.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-4 grid max-w-7xl grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <article key={item.title} className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${item.bg} p-4 text-white shadow-[0_12px_24px_rgba(15,23,42,0.22)] transition duration-300 hover:-translate-y-1`}>
            <div className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-2xl border border-white/30 bg-white/20 text-white/95">{item.icon}</div>
            <div className="absolute -right-4 -top-1 text-white/10">{item.ghost}</div>
            <h4 className="relative z-1 text-sm font-medium lg:text-base">{item.title}</h4>
            <p className="relative z-1 mt-4 text-2xl font-semibold leading-none lg:mt-5 lg:text-3xl">{item.value}</p>
            <p className="relative z-1 mt-1.5 text-xs text-white/90 lg:text-sm">{item.sub}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto mb-4 grid max-w-7xl grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="overflow-hidden rounded-3xl border border-white bg-white/85 shadow-[0_12px_24px_rgba(10,17,31,0.08)]">
          <div className="flex min-h-16 items-center gap-4 bg-[linear-gradient(120deg,#e0f2fe_0%,#f0fdfa_100%)] px-6 py-4 lg:px-7">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#155e75] text-white">
              <BarChart3 className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-lg font-bold lg:text-xl">Revenue by Plan</h3>
              <p className="text-sm font-medium text-[#606a7f] lg:text-base">Performance across subscription tiers</p>
            </div>
          </div>
          <div className="px-6 pb-6 pt-5 lg:px-7">
            <div className="relative mt-2 h-75 rounded-2xl">
              <div className="absolute bottom-6 left-17.5 right-4 top-6">
                <div className="absolute inset-0 border-b-2 border-l-2 border-[#8f96a6]" />
                <div className="absolute left-0 right-0 top-0 border-t border-dashed border-[#d7dbe6]" />
                <div className="absolute left-0 right-0 top-[25%] border-t border-dashed border-[#d7dbe6]" />
                <div className="absolute left-0 right-0 top-[50%] border-t border-dashed border-[#d7dbe6]" />
                <div className="absolute left-0 right-0 top-[75%] border-t border-dashed border-[#d7dbe6]" />
                <div className="absolute bottom-0 left-0 right-0 border-t border-dashed border-[#d7dbe6]" />
              </div>
              <div className="absolute left-0 top-4 flex h-65 w-15 flex-col justify-between pr-2 text-right text-sm font-medium text-[#6b7280]">
                <span>160000</span>
                <span>120000</span>
                <span>80000</span>
                <span>40000</span>
                <span>0</span>
              </div>
              <div className="absolute bottom-6 left-17.5 right-4 flex h-65 items-end gap-6 px-4">
                <div className="h-[48%] flex-1 rounded-t-[10px] bg-[#626af0]" />
                <div className="h-[98%] flex-1 rounded-t-[10px] bg-[#626af0]" />
                <div className="h-[78%] flex-1 rounded-t-[10px] bg-[#626af0]" />
              </div>
              <div className="absolute bottom-0 left-17.5 right-4 flex justify-between px-4 text-center text-base font-medium text-[#667085]">
                <span className="flex w-full justify-center">Basic</span>
                <span className="flex w-full justify-center">Premium</span>
                <span className="flex w-full justify-center">Enterprise</span>
              </div>
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-white bg-white/85 shadow-[0_12px_24px_rgba(10,17,31,0.08)]">
          <div className="flex min-h-16 items-center gap-3 bg-[linear-gradient(120deg,#fff7ed_0%,#fefce8_100%)] px-5 py-3 lg:px-6">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#b45309] text-white shadow-sm">
              <PieChart className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827] lg:text-lg">Subscription Plans</h3>
              <p className="text-xs font-medium text-[#6b7280] lg:text-sm">Distribution by plan type</p>
            </div>
          </div>
          <div className="grid grid-cols-1 items-center gap-8 px-5 py-8 lg:grid-cols-[180px_1fr] lg:px-8">
            <div className="mx-auto h-40 w-40 rounded-full bg-[conic-gradient(transparent_0_8deg,#4181f7_8deg_135deg,transparent_135deg_145deg,#a056f7_145deg_265deg,transparent_265deg_275deg,#f7a009_275deg_352deg,transparent_352deg_360deg)] p-5.5">
              <div className="h-full w-full rounded-full bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]" />
            </div>
            <ul className="space-y-3 pr-4 text-sm font-medium text-[#374151] lg:text-[0.95rem]">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#4181f7]" />Basic</span>
                <strong className="text-[#111827]">2</strong>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#a056f7]" />Premium</span>
                <strong className="text-[#111827]">2</strong>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f7a009]" />Enterprise</span>
                <strong className="text-[#111827]">1</strong>
              </li>
            </ul>
          </div>
        </article>
      </section>

      <section className="mx-auto mb-4 grid max-w-7xl grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="overflow-hidden rounded-3xl border border-white bg-white/85 shadow-[0_12px_24px_rgba(10,17,31,0.08)]">
          <div className="flex min-h-16 items-center gap-4 bg-[linear-gradient(120deg,#dcfce7_0%,#ecfeff_100%)] px-6 py-4 lg:px-7">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0f766e] text-white">
              <Award className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-lg font-bold lg:text-xl">Top Performing Businesses</h3>
              <p className="text-sm font-medium text-[#606a7f] lg:text-base">Ranked by revenue</p>
            </div>
          </div>
          <div className="grid gap-3 p-4 lg:p-5">
            {topBusinesses.map((business) => (
              <article key={business.rank} className="grid grid-cols-[58px_1fr] gap-3 rounded-2xl border border-[#e4edf6] bg-[#f8fbff] p-3 lg:grid-cols-[64px_1fr_auto] lg:items-center">
                <div className="relative h-14.5 w-14.5 overflow-hidden rounded-xl bg-[#d7dbe4] lg:h-16 lg:w-16">
                  <Image src={business.image} alt={business.name} fill sizes="82px" className="object-cover" />
                  <span className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-[#f9a602] text-xs font-bold text-white">{business.rank}</span>
                </div>
                <div>
                  <h4 className="text-base font-bold lg:text-lg">{business.name}</h4>
                  <p className="mt-1 text-xs text-[#667085] lg:text-sm">{business.orders}</p>
                  <div className="mt-2 lg:hidden">
                    <strong className="block text-base text-[#07a34d]">{business.revenue}</strong>
                  </div>
                </div>
                <div className="hidden text-right lg:block">
                  <strong className="block text-lg text-[#07a34d]">{business.revenue}</strong>
                  <span className="inline-flex h-7 items-center rounded-full bg-[#02051f] px-3 text-xs font-bold text-white">{business.plan}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-white bg-white/85 shadow-[0_12px_24px_rgba(10,17,31,0.08)]">
          <div className="flex min-h-16 items-center gap-3 bg-[linear-gradient(120deg,#e0e7ff_0%,#f0f9ff_100%)] px-5 py-3 lg:px-6">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1d4ed8] text-white">
              <Activity className="h-4.5 w-4.5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-base font-bold lg:text-lg">Subscription Status</h3>
              <p className="text-xs font-medium text-[#606a7f] lg:text-sm">Current status overview</p>
            </div>
          </div>
          <div className="grid gap-4 p-5 lg:p-5">
            {[
              { label: "Active", value: "3 (60%)", color: "#12b981", width: "60%" },
              { label: "Inactive", value: "1 (20%)", color: "#6b7280", width: "20%" },
              { label: "Expired", value: "1 (20%)", color: "#ef4444", width: "20%" },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: row.color }} />
                <span className="text-sm font-semibold lg:text-base">{row.label}</span>
                <span className="text-sm font-bold lg:text-base">{row.value}</span>
                <div className="col-span-3 h-2 overflow-hidden rounded-full bg-[#e3e5ea]">
                  <span className="block h-full rounded-full" style={{ width: row.width, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-7xl rounded-3xl bg-linear-to-br from-[#0f172a] to-[#0f766e] p-4 shadow-[0_14px_26px_rgba(15,23,42,0.3)] lg:p-5">
        <h3 className="flex items-center gap-2 text-base font-medium text-[#f4f7ff] lg:text-lg">
          <ShieldCheck className="h-4.5 w-4.5" strokeWidth={1.8} />
          System Overview
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { value: "3", label: "Active Businesses" },
            { value: "$71600", label: "Avg Revenue/Business" },
            { value: "738", label: "Avg Orders/Business" },
            { value: "7", label: "Avg Users/Business" },
          ].map((stat) => (
            <article key={stat.label} className="rounded-2xl bg-white/15 p-3 text-center text-[#f2f5ff]">
              <strong className="text-2xl lg:text-3xl">{stat.value}</strong>
              <p className="mt-1 text-xs lg:text-sm">{stat.label}</p>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
