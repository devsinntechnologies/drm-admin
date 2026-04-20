"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  Building2,
  CircleDollarSign,
  DollarSign,
  PieChart,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { useGetPlansQuery } from "@/hooks/usePlan";

const topBusinesses = [
  { rank: 1, name: "The Golden Spoon", orders: "1250 orders", revenue: "125.0K", plan: "Enterprise", image: "/business/pic1.jpeg" },
  { rank: 2, name: "Pasta Palace", orders: "890 orders", revenue: "89.0K", plan: "Premium", image: "/business/pic2.jpeg" },
  { rank: 3, name: "Sushi World", orders: "520 orders", revenue: "67.0K", plan: "Premium", image: "/business/pic4.jpeg" },
  { rank: 4, name: "Burger Haven", orders: "650 orders", revenue: "45.0K", plan: "Basic", image: "/business/pic3.jpeg" },
  { rank: 5, name: "Taco Fiesta", orders: "380 orders", revenue: "32.0K", plan: "Basic", image: "/business/pic5.jpeg" },
];

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

function BusinessAdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardFullResponse | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const controller = new AbortController();

    async function fetchDashboardData() {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const businessId = localStorage.getItem("businessId");

      if (!token || !businessId) {
        setLoadingDashboard(false);
        return;
      }

      try {
        const response = await fetch(
          `https://vendor.umazing.shop/dashboard/full?businessId=${encodeURIComponent(businessId)}`,
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
  }, []);

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
            {recentOrders.map((item) => (
              <div key={`{item.table}-{item.time}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl bg-[#f8fafc] p-3">
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
            {lowStockItems.map((item) => (
              <article key={item.name} className="rounded-xl border border-[#fed7aa] bg-[#fffaf5] p-2">
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

function SuperAdminDashboard() {
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
      value: "358.0K",
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E365B]">Operational Snapshot</p>
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
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1E365B] text-white">
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

      <section className="mx-auto max-w-7xl rounded-3xl bg-linear-to-br from-[#0f172a] to-[#1E365B] p-4 shadow-[0_14px_26px_rgba(15,23,42,0.3)] lg:p-5">
        <h3 className="flex items-center gap-2 text-base font-medium text-[#f4f7ff] lg:text-lg">
          <ShieldCheck className="h-4.5 w-4.5" strokeWidth={1.8} />
          System Overview
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { value: "3", label: "Active Businesses" },
            { value: "71600", label: "Avg Revenue/Business" },
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

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (currentRole === "kitchen" || currentRole === "waiter") {
      router.replace("/dashboard/orders");
    }
  }, [role, router]);

  const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
  const currentRole = role ?? storedRole;

  if (currentRole === "business_admin") {
    return <BusinessAdminDashboard />;
  }

  return <SuperAdminDashboard />;
}
