"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  CircleDollarSign,
  Loader2,
  PieChart,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const fallbackTopSellingProducts = [
  { rank: 1, name: "Pasta Carbonara", sold: "2 units sold", revenue: "$29.98", image: "/business/pic1.jpeg", quantity: 2, revenueRaw: 29.98 },
  { rank: 2, name: "Margherita Pizza", sold: "2 units sold", revenue: "$25.98", image: "/business/pic2.jpeg", quantity: 2, revenueRaw: 25.98 },
  { rank: 3, name: "Chocolate Cake", sold: "3 units sold", revenue: "$20.97", image: "/business/pic3.jpeg", quantity: 3, revenueRaw: 20.97 },
  { rank: 4, name: "Grilled Salmon", sold: "1 units sold", revenue: "$18.99", image: "/business/pic4.jpeg", quantity: 1, revenueRaw: 18.99 },
  { rank: 5, name: "Tiramisu", sold: "2 units sold", revenue: "$15.98", image: "/business/pic5.jpeg", quantity: 2, revenueRaw: 15.98 },
];

const fallbackRecentOrders = [
  { table: "Patio 3", time: "3h ago", amount: "$36.96", status: "Ready" },
  { table: "Table 5", time: "8h ago", amount: "$34.97", status: "New" },
  { table: "Table 12", time: "3h ago", amount: "$48.97", status: "Preparing" },
];

const fallbackLowStockItems = [
  { name: "Chocolate Cake", left: "6 left", price: "$6.99", image: "/business/pic3.jpeg" },
  { name: "Chicken Wings", left: "6 left", price: "$10.99", image: "/business/pic2.jpeg" },
];

type DashboardFullResponse = {
  revenue?: {
    daily?: { paid?: number; pending?: number; total?: number };
    monthly?: { paid?: number; pending?: number; total?: number };
    last30Days?: { paid?: number; pending?: number; total?: number };
  };
  invoices?: { totalPending?: number; pendingAmount?: number };
  orders?: {
    activeOrders?: number;
    totalOrdersDaily?: number;
    totalOrdersMonthly?: number;
    completedOrdersMonthly?: number;
  };
  graph?: {
    statusCount?: {
      newOrder?: number;
      preparing?: number;
      ready?: number;
      delivering?: number;
      completed?: number;
    };
    topSellingProducts?: Array<{
      productid: string;
      name: string;
      quantity: number;
      revenue: number;
    }>;
  };
  recentOrders?: Array<{
    orderNumber: string;
    status: string;
    totalPrice: number;
  }>;
};

function formatMoney(value: number) {
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompactMoney(value: number) {
  return `${Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

function toTitleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function DashboardContent() {
  const [dashboardData, setDashboardData] = useState<DashboardFullResponse | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const activeBusinessId = useActiveBusinessId();
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentRole = role || localStorage.getItem("roleName") || localStorage.getItem("auth_role");
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    const isBusinessRole = currentRole === "business_admin" || currentRole === "super_admin";
    if (!isBusinessRole) {
      router.replace("/dashboard");
      return;
    }

    const controller = new AbortController();

    async function fetchDashboardData() {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");

      if (!token || !activeBusinessId) {
        setLoadingDashboard(false);
        return;
      }

      try {
        const response = await fetch(
          `https://vendor.umazing.shop/dashboard/full?businessId=${encodeURIComponent(activeBusinessId)}`,
          {
            method: "GET",
            headers: {
              accept: "*/*",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }

        const data = (await response.json()) as DashboardFullResponse;
        setDashboardData(data);
      } catch {
        setDashboardData(null);
      } finally {
        setLoadingDashboard(false);
      }
    }

    fetchDashboardData();

    return () => controller.abort();
  }, [activeBusinessId]);

  const dailyPaid = dashboardData?.revenue?.daily?.paid ?? 0;
  const dailyTotal = dashboardData?.revenue?.daily?.total ?? 0;
  const monthlyTotal = dashboardData?.revenue?.monthly?.total ?? 0;
  const activeOrders = dashboardData?.orders?.activeOrders ?? 0;
  const completedMonthly = dashboardData?.orders?.completedOrdersMonthly ?? 0;
  const totalOrdersMonthly = dashboardData?.orders?.totalOrdersMonthly ?? 0;
  const totalOrdersDaily = dashboardData?.orders?.totalOrdersDaily ?? 0;
  const pendingInvoices = dashboardData?.invoices?.totalPending ?? 0;
  const pendingInvoicesAmount = dashboardData?.invoices?.pendingAmount ?? 0;

  const completionRate = totalOrdersMonthly > 0 ? (completedMonthly / totalOrdersMonthly) * 100 : 0;

  const orderStatus = [
    { label: "New", count: dashboardData?.graph?.statusCount?.newOrder ?? 0, color: "#3b82f6" },
    { label: "Preparing", count: dashboardData?.graph?.statusCount?.preparing ?? 0, color: "#f59e0b" },
    { label: "Ready", count: dashboardData?.graph?.statusCount?.ready ?? 0, color: "#8b5cf6" },
    { label: "Delivered", count: dashboardData?.graph?.statusCount?.delivering ?? 0, color: "#10b981" },
    { label: "Complete", count: dashboardData?.graph?.statusCount?.completed ?? 0, color: "#0f766e" },
  ];

  const topSellingProducts = useMemo(() => {
    const products = dashboardData?.graph?.topSellingProducts ?? [];
    if (products.length === 0) {
      return fallbackTopSellingProducts;
    }

    return products.map((item, index) => ({
      rank: index + 1,
      name: item.name,
      sold: `${item.quantity} units sold`,
      revenue: formatMoney(item.revenue),
      image: `/business/pic${(index % 5) + 1}.jpeg`,
      quantity: item.quantity,
      revenueRaw: item.revenue,
    }));
  }, [dashboardData]);

  const recentOrders = useMemo(() => {
    const orders = dashboardData?.recentOrders ?? [];
    if (orders.length === 0) {
      return fallbackRecentOrders;
    }

    return orders.slice(0, 5).map((item) => ({
      table: item.orderNumber,
      time: "Latest",
      amount: formatMoney(item.totalPrice),
      status: toTitleCase(item.status),
    }));
  }, [dashboardData]);

  const lowStockItems = useMemo(() => {
    const products = dashboardData?.graph?.topSellingProducts ?? [];
    if (products.length === 0) {
      return fallbackLowStockItems;
    }

    return products.slice(0, 2).map((item, index) => ({
      name: item.name,
      left: `${item.quantity} sold`,
      price: formatMoney(item.revenue),
      image: `/business/pic${(index % 5) + 1}.jpeg`,
    }));
  }, [dashboardData]);

  const totalStockUnits = topSellingProducts.reduce((sum, product) => sum + product.quantity, 0);
  const avgOrderValue = totalOrdersMonthly > 0 ? monthlyTotal / totalOrdersMonthly : 0;

  return (
    <AdminShell activeTab="dashboard">
      <section className="mx-auto max-w-7xl space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Total Revenue",
              value: loadingDashboard ? "..." : formatMoney(dailyPaid),
              sub: `From ${completedMonthly} paid invoices`,
              icon: <CircleDollarSign className="h-4 w-4" />,
              bg: "from-[#00b45e] to-[#00a76f]",
            },
            {
              title: "Today's Revenue",
              value: loadingDashboard ? "..." : formatMoney(dailyTotal),
              sub: `${totalOrdersDaily} orders today`,
              icon: <TrendingUp className="h-4 w-4" />,
              bg: "from-[#3b82f6] to-[#4f46e5]",
            },
            {
              title: "Active Orders",
              value: loadingDashboard ? "..." : String(activeOrders),
              sub: `${completedMonthly} completed`,
              icon: <ReceiptText className="h-4 w-4" />,
              bg: "from-[#a855f7] to-[#db2777]",
            },
            {
              title: "Low Stock Alerts",
              value: loadingDashboard ? "..." : String(lowStockItems.length),
              sub: `${lowStockItems.length} tracked products`,
              icon: <AlertTriangle className="h-4 w-4" />,
              bg: "from-[#f97316] to-[#ef4444]",
            },
          ].map((card) => (
            <article key={card.title} className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${card.bg} p-4 text-white shadow-[0_10px_24px_rgba(15,23,42,0.22)]`}>
              <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-xl bg-white/18">{card.icon}</div>
              <p className="text-xs font-medium text-white/80">{card.title}</p>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              <p className="mt-1 text-xs text-white/85">{card.sub}</p>
            </article>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { title: "Total Orders", value: loadingDashboard ? "..." : String(totalOrdersMonthly), sub: "All time orders", icon: <ReceiptText className="h-3.5 w-3.5" />, tone: "#3b82f6" },
            { title: "Pending Invoices", value: loadingDashboard ? "..." : String(pendingInvoices), sub: "Awaiting payment", icon: <Bell className="h-3.5 w-3.5" />, tone: "#f59e0b" },
            { title: "Completion Rate", value: loadingDashboard ? "..." : `${completionRate.toFixed(1)}%`, sub: "Orders completed", icon: <ShieldCheck className="h-3.5 w-3.5" />, tone: "#22c55e" },
          ].map((stat) => (
            <article key={stat.title} className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-[#64748b]">{stat.title}</p>
                <span className="grid h-6 w-6 place-items-center rounded-md text-white" style={{ background: stat.tone }}>{stat.icon}</span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-[#0f172a]">{stat.value}</p>
              <p className="mt-1 text-xs text-[#64748b]">{stat.sub}</p>
            </article>
          ))}
        </div>

        <article className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_10px_20px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3 border-b border-[#edf2f7] bg-[#f2f4fb] px-4 py-3">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#6366f1] text-white"><BarChart3 className="h-3.5 w-3.5" /></span>
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a]">Revenue Trend</h3>
              <p className="text-xs text-[#64748b]">Last 7 days performance</p>
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="relative h-56 rounded-xl border border-[#e5e7eb] bg-[#fcfcff]">
              <div className="absolute inset-0 grid grid-cols-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="border-r border-dashed border-[#e2e8f0]" />
                ))}
              </div>
              <div className="absolute inset-0 grid grid-rows-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="border-b border-dashed border-[#e2e8f0]" />
                ))}
              </div>
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path d="M 0 94 L 72 94 C 82 94, 86 93, 90 78 C 93 62, 96 40, 100 24 L 100 100 L 0 100 Z" fill="url(#revArea)" />
                <path d="M 0 94 L 72 94 C 82 94, 86 93, 90 78 C 93 62, 96 40, 100 24" fill="none" stroke="#6366f1" strokeWidth="1.1" />
              </svg>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[11px] text-[#64748b]">
                {['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_10px_20px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3 border-b border-[#edf2f7] bg-[#f7f0ff] px-4 py-3">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#a855f7] text-white"><PieChart className="h-3.5 w-3.5" /></span>
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a]">Order Status</h3>
              <p className="text-xs text-[#64748b]">Current order distribution</p>
            </div>
          </div>
          <div className="grid gap-3 px-4 py-4 sm:grid-cols-[180px_1fr] sm:items-center">
            <div className="mx-auto h-32 w-32 rounded-full bg-[conic-gradient(#3b82f6_0_34%,#f59e0b_34%_67%,#8b5cf6_67%_100%)] p-4">
              <div className="h-full w-full rounded-full bg-white" />
            </div>
            <ul className="space-y-2 text-sm">
              {orderStatus.map((s) => (
                <li key={s.label} className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[#334155]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
                  <span className="font-semibold text-[#111827]">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_10px_20px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3 border-b border-[#edf2f7] bg-[#ecfdf3] px-4 py-3">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#16a34a] text-white"><Award className="h-3.5 w-3.5" /></span>
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a]">Top Selling Products</h3>
              <p className="text-xs text-[#64748b]">Best performers by revenue</p>
            </div>
          </div>
          <div className="space-y-2 px-4 py-3">
            {topSellingProducts.map((item) => (
              <div key={item.rank} className="grid grid-cols-[auto_36px_1fr_auto] items-center gap-2 rounded-xl bg-[#f8fafc] p-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#f59e0b] text-[10px] font-semibold text-white">{item.rank}</span>
                <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-[#e2e8f0]">
                  <Image src={item.image} alt={item.name} fill sizes="36px" className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{item.name}</p>
                  <p className="text-[11px] text-[#64748b]">{item.sold}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#16a34a]">{item.revenue}</p>
                  <p className="text-[10px] text-[#94a3b8]">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_10px_20px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3 border-b border-[#edf2f7] bg-[#edf3ff] px-4 py-3">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#3b82f6] text-white"><Activity className="h-3.5 w-3.5" /></span>
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a]">Recent Orders</h3>
              <p className="text-xs text-[#64748b]">Latest order activity</p>
            </div>
          </div>
          <div className="space-y-2 px-4 py-3">
            {recentOrders.map((item, index) => (
              <div key={`${item.table}-${item.time}-${index}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl bg-[#f8fafc] p-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#60a5fa] text-[11px] font-semibold text-white">{item.table.split(" ")[1]}</span>
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{item.table}</p>
                  <p className="text-[11px] text-[#64748b]">{item.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#111827]">{item.amount}</p>
                  <p className="text-[10px] text-[#64748b]">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#fecaca] bg-white shadow-[0_10px_20px_rgba(15,23,42,0.08)]">
          <div className="border-b border-[#fde2e2] bg-[#fff7f5] px-4 py-3">
            <h3 className="text-sm font-semibold text-[#b91c1c]">Low Stock Products - Action Required!</h3>
            <p className="text-xs text-[#9f1239]">These items need immediate restocking</p>
          </div>
          <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
            {lowStockItems.map((item, index) => (
              <article key={`${item.name}-${index}`} className="rounded-xl border border-[#fed7aa] bg-[#fffaf5] p-2">
                <div className="grid grid-cols-[40px_1fr] gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[#fdba74]">
                    <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{item.name}</p>
                    <div className="mt-1 inline-flex items-center gap-2 text-[10px]">
                      <span className="rounded-full bg-[#ef4444] px-2 py-0.5 font-semibold text-white">{item.left}</span>
                      <span className="text-[#64748b]">{item.price}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-linear-to-r from-[#4f46e5] via-[#7c3aed] to-[#9333ea] p-4 text-white shadow-[0_12px_24px_rgba(79,70,229,0.3)]">
          <h3 className="text-sm font-semibold">Quick Overview</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Products", value: loadingDashboard ? "..." : String(topSellingProducts.length) },
              { label: "Total Stock Units", value: loadingDashboard ? "..." : String(totalStockUnits) },
              { label: "Inventory Value", value: loadingDashboard ? "..." : formatCompactMoney(pendingInvoicesAmount) },
              { label: "Avg. Order Value", value: loadingDashboard ? "..." : avgOrderValue.toFixed(2) },
            ].map((metric) => (
              <div key={metric.label} className="rounded-xl bg-white/12 p-3 text-center">
                <p className="text-xl font-semibold">{metric.value}</p>
                <p className="mt-1 text-[11px] text-white/85">{metric.label}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}

export default function BusinessAdminDashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
