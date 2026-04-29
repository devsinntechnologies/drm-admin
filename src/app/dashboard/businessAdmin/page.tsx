"use client";

import Image from "next/image";
import { Suspense } from "react";
import { ShoppingBag, TriangleAlert, PieChart, Loader2, ShoppingCart, ReceiptText, CheckCircle2, Flame, Clock3, Printer } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

function DonutChart({ slices }: { slices: { color: string; value: number }[] }) {
  const stops: string[] = [];
  let current = 0;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  slices.forEach((slice) => {
    const start = (current / total) * 100;
    current += slice.value;
    const end = (current / total) * 100;
    stops.push(`${slice.color} ${start}% ${end}%`);
  });

  return (
    <div
      className="relative h-44 w-44 rounded-full"
      style={{ background: `conic-gradient(${stops.join(", ")})` }}
    >
      <div className="absolute inset-[30px] rounded-full bg-white" />
    </div>
  );
}

const topSelling = [
  { id: "1", name: "Biryani", stocks: 10, revenue: "PKR 0.00", img: "/business/pic1.jpeg" },
  { id: "2", name: "coke", stocks: 900, revenue: "PKR 888.00", img: "/business/pic2.jpeg" },
];

const recentOrders = [
  { id: "ord-1", label: "3", title: "6a55704b-aebc-4a41-ac6d-06490634ed41", ago: "0m", status: "OrderStatus.pending", user: "test" },
];

function DashboardStatic() {
  return (
    <AdminShell activeTab="dashboard">
      <section className="mx-auto max-w-[86rem] space-y-6 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="relative rounded-2xl bg-gradient-to-br from-violet-500 to-violet-400 p-8 text-white shadow-lg h-64 md:h-72 overflow-hidden">
            <div className="flex flex-col h-full justify-between">
              <div>
                <p className="text-sm opacity-90">Active Orders</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold">1</h3>
                <p className="mt-2 text-sm opacity-80">3 completed</p>
              </div>
            </div>
            <div className="absolute right-4 top-4 rounded-2xl bg-white/20 p-3">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="absolute right-2 top-2 text-white/10">
              <ShoppingBag className="h-28 w-28" strokeWidth={1.4} />
            </div>
          </article>

          <article className="relative rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-8 text-white shadow-lg h-64 md:h-72 overflow-hidden">
            <div className="flex flex-col h-full justify-between">
              <div>
                <p className="text-sm opacity-90">Low Stock Alerts</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold">2</h3>
                <p className="mt-2 text-sm opacity-80">Out of 8 products</p>
              </div>
            </div>
            <div className="absolute right-4 top-4 rounded-2xl bg-white/20 p-3">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <div className="absolute -right-8 -top-8 text-white/12">
              <TriangleAlert className="h-44 w-44" strokeWidth={1.2} />
            </div>
          </article>
        </div>

        <article className="rounded-2xl bg-white shadow-md overflow-hidden">
          <div className="flex items-start justify-between bg-[#f2ecf5] px-6 py-5 border-b">
            <div className="flex items-start gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#5b3fd1] text-white shadow-md">
                <PieChart className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-lg font-bold">Order Status</h4>
                <p className="text-sm text-gray-500">Current order distribution</p>
              </div>
            </div>
          </div>
          <div className="flex items-start justify-center gap-12 px-6 py-8">
            <div className="flex items-center gap-14">
              <DonutChart slices={[{ color: "#3b82f6", value: 1 }, { color: "#10b981", value: 1 }, { color: "#f59e0b", value: 1 }]} />
              <ul className="space-y-3">
                <li className="grid grid-cols-[12px_1fr_auto] items-center gap-3"><span className="h-3 w-3 rounded-sm bg-[#3b82f6] block" /> <span className="text-base text-[#111827]">New</span> <span className="font-bold text-xl text-[#111827]">1</span></li>
                <li className="grid grid-cols-[12px_1fr_auto] items-center gap-3"><span className="h-3 w-3 rounded-sm bg-[#10b981] block" /> <span className="text-base text-[#111827]">Preparing</span> <span className="font-bold text-xl text-[#111827]">1</span></li>
                <li className="grid grid-cols-[12px_1fr_auto] items-center gap-3"><span className="h-3 w-3 rounded-sm bg-[#f59e0b] block" /> <span className="text-base text-[#111827]">Ready</span> <span className="font-bold text-xl text-[#111827]">1</span></li>
                <li className="grid grid-cols-[12px_1fr_auto] items-center gap-3"><span className="h-3 w-3 rounded-sm bg-[#ef4444] block" /> <span className="text-base text-[#111827]">Delivered</span> <span className="font-bold text-xl text-[#111827]">0</span></li>
                <li className="grid grid-cols-[12px_1fr_auto] items-center gap-3"><span className="h-3 w-3 rounded-sm bg-[#8b5cf6] block" /> <span className="text-base text-[#111827]">Complete</span> <span className="font-bold text-xl text-[#111827]">0</span></li>
              </ul>
            </div>
          </div>
        </article>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-red-200 border-l-4 border-l-red-500">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-600">Total Orders</p>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-500">
                <ShoppingCart className="h-5 w-5" />
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-bold">3</h3>
            <p className="text-sm text-gray-400">All time orders</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-amber-200 border-l-4 border-l-amber-500">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-600">Pending Invoices</p>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-500">
                <ReceiptText className="h-5 w-5" />
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-bold">0</h3>
            <p className="text-sm text-gray-400">Awaiting payment</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-emerald-200 border-l-4 border-l-emerald-500">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-bold">66.7%</h3>
            <p className="text-sm text-gray-400">Orders completed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 pb-4 border-b px-6 pt-6 bg-emerald-50">
              <div className="h-10 w-10 rounded-xl bg-emerald-500 grid place-items-center text-white">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold">Top Selling Products</h4>
                <p className="text-sm text-gray-500">Best performers by revenue</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 px-6 pb-6">
              {topSelling.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-md bg-gray-100 relative">
                      <Image src={p.img} alt={p.name} fill sizes="56px" className="object-cover" />
                    </div>
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-gray-500">{p.stocks} stocks</div>
                    </div>
                  </div>
                  <div className="text-emerald-600 font-semibold">{p.revenue}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 pb-4 border-b px-6 pt-6 bg-[#edf3ff]">
              <div className="h-10 w-10 rounded-xl bg-[#3b82f6] grid place-items-center text-white">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold">Recent Orders</h4>
                <p className="text-sm text-gray-500">Latest order activity</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 px-6 pb-6">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border p-3 bg-[#f8fafc]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-violet-100 grid place-items-center text-violet-700">{o.label}</div>
                    <div>
                      <div className="font-semibold break-words">{o.title}</div>
                      <div className="text-sm text-gray-500">{o.ago}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold text-[#0f172a]">{o.user}</div>
                    <div className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-600 text-sm">{o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 text-white shadow-lg hover:bg-amber-600"
        >
          <Printer className="h-5 w-5" />
          <span className="text-lg font-semibold">Test Invoice Layout</span>
        </button>
      </section>
    </AdminShell>
  );
}

export default function BusinessAdminDashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" /></div>}>
      <DashboardStatic />
    </Suspense>
  );
}
