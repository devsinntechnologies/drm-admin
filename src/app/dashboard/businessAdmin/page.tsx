"use client";

import Image from "next/image";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  TriangleAlert,
  PieChart,
  ShoppingCart,
  ReceiptText,
  CheckCircle2,
  Flame,
  Clock3,
  Utensils,
  LayoutDashboard,
} from "lucide-react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import {
  PortalPage,
  PortalPageHeader,
  PortalStatCard,
  PortalCard,
} from "@/components/admin/PortalPage";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useInvoices } from "@/hooks/useInvoices";
import { BASE_URL } from "@/lib/constant";

function formatElapsed(isoDate: string) {
  const createdAt = new Date(isoDate).getTime();
  if (!Number.isFinite(createdAt)) return "--";
  const totalMinutes = Math.floor((Date.now() - createdAt) / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function DonutChart({ slices }: { slices: { color: string; value: number }[] }) {
  const stops: string[] = [];
  let current = 0;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;

  slices.forEach((slice) => {
    const start = (current / total) * 100;
    current += slice.value;
    const end = (current / total) * 100;
    stops.push(`${slice.color} ${start}% ${end}%`);
  });

  return (
    <div className="relative h-44 w-44 rounded-full" style={{ background: `conic-gradient(${stops.join(", ")})` }}>
      <div className="absolute inset-[30px] rounded-full bg-white shadow-inner" />
    </div>
  );
}

function DashboardStatic() {
  const { orders, loading: ordersLoading } = useOrders({ range: "day" });
  const { products, loading: productsLoading } = useProducts({ page: 1, limit: 100 });
  const { invoices } = useInvoices({ page: 1, limit: 100 });

  const dashboardMetrics = useMemo(() => {
    const activeOrders = orders.filter(
      (o) => !["completed", "delivered"].includes(o.status?.toLowerCase() || ""),
    );
    const completedOrders = orders.filter(
      (o) => o.status?.toLowerCase() === "completed" || o.status?.toLowerCase() === "delivered",
    );
    const totalOrdersCount = orders.length;
    const completionRate = totalOrdersCount > 0 ? Math.round((completedOrders.length / totalOrdersCount) * 100) : 0;

    const lowStockProducts = products.filter((p) => {
      const stock = typeof p.inStock === "number" ? p.inStock : 0;
      return stock < 10 && p.status === "ACTIVE";
    });
    const totalProductsCount = products.filter((p) => p.status === "ACTIVE").length;

    const pendingInvoicesCount = invoices.filter((inv) => inv.status?.toLowerCase() === "pending").length;

    const newOrders = orders.filter((o) => ["pending", "new", "placed"].includes(o.status?.toLowerCase() || "")).length;
    const preparingOrders = orders.filter((o) =>
      ["preparing", "cooking", "in_progress", "in-progress"].includes(o.status?.toLowerCase() || ""),
    ).length;
    const readyOrders = orders.filter((o) => o.status?.toLowerCase() === "ready").length;

    const orderStatusSlices = [
      { color: "#0050F8", value: newOrders || 1 },
      { color: "#001840", value: preparingOrders || 1 },
      { color: "#14b8a6", value: readyOrders || 1 },
    ];

    const topSellingProducts = products
      .filter((p) => p.status === "ACTIVE")
      .sort((a, b) => (b.variants?.[0]?.price || 0) - (a.variants?.[0]?.price || 0))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        stocks: p.inStock || 0,
        revenue: `PKR ${((p.variants?.[0]?.price || 0) * (p.inStock || 0)).toFixed(2)}`,
        img: p.image ? (p.image.startsWith("http") ? p.image : `${BASE_URL}/${p.image}`) : null,
      }));

    const recentOrdersDisplay = orders.slice(0, 5).map((order, index) => ({
      id: order.id,
      label: String(index + 1),
      title: order.orderNumber || "N/A",
      ago: formatElapsed(order.createdAt),
      status: order.status?.toLowerCase() || "pending",
      user: order.table || "Self Pickup",
    }));

    return {
      activeOrdersCount: activeOrders.length,
      completedOrdersCount: completedOrders.length,
      totalOrdersCount,
      completionRate,
      lowStockCount: lowStockProducts.length,
      totalProductsCount,
      pendingInvoicesCount,
      orderStatusSlices,
      topSellingProducts,
      recentOrdersDisplay,
    };
  }, [orders, products, invoices]);

  return (
    <AdminShell activeTab="dashboard">
      <PortalPage>
        <PortalPageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          subtitle="Today's operational overview for your restaurant"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="portal-gradient-card bg-gradient-to-br from-[#001840] to-[#0050F8] min-h-[200px] flex flex-col justify-between">
            <div className="relative z-10 flex items-start justify-between">
              <p className="text-sm font-medium text-white/80">Active Orders</p>
              <div className="rounded-xl bg-white/15 p-2.5">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-4xl font-bold">{dashboardMetrics.activeOrdersCount}</h3>
              <p className="mt-2 text-sm text-white/75">{dashboardMetrics.completedOrdersCount} completed today</p>
            </div>
          </article>

          <article className="portal-gradient-card bg-gradient-to-br from-[#0f766e] to-[#14b8a6] min-h-[200px] flex flex-col justify-between">
            <div className="relative z-10 flex items-start justify-between">
              <p className="text-sm font-medium text-white/80">Low Stock Alerts</p>
              <div className="rounded-xl bg-white/15 p-2.5">
                <TriangleAlert className="h-5 w-5" />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-4xl font-bold">{dashboardMetrics.lowStockCount}</h3>
              <p className="mt-2 text-sm text-white/75">Out of {dashboardMetrics.totalProductsCount} active products</p>
            </div>
          </article>
        </div>

        <PortalCard title="Order Status" subtitle="Current order distribution" icon={PieChart}>
          <div className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-14">
            <DonutChart slices={dashboardMetrics.orderStatusSlices} />
            <ul className="space-y-3">
              {[
                { color: "#0050F8", label: "New" },
                { color: "#001840", label: "Preparing" },
                { color: "#14b8a6", label: "Ready" },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm font-semibold text-[#334155]">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </PortalCard>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PortalStatCard label="Total Orders" value={dashboardMetrics.totalOrdersCount} icon={ShoppingCart} tone="primary" />
          <PortalStatCard label="Pending Invoices" value={dashboardMetrics.pendingInvoicesCount} icon={ReceiptText} tone="secondary" />
          <PortalStatCard label="Completion Rate" value={`${dashboardMetrics.completionRate}%`} icon={CheckCircle2} tone="accent" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PortalCard title="Top Products" subtitle="Best performers by revenue" icon={Flame}>
            {productsLoading ? (
              <Loading size="sm" />
            ) : dashboardMetrics.topSellingProducts.length > 0 ? (
              <div className="space-y-3">
                {dashboardMetrics.topSellingProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fbff] p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-[#dbe4ef] bg-white">
                        {p.img ? (
                          <Image src={p.img} alt={p.name} fill sizes="56px" className="object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center">
                            <Utensils className="h-6 w-6 text-[#94a3b8]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-[#0f172a]">{p.name}</div>
                        <div className="text-sm text-[#64748b]">{p.stocks} in stock</div>
                      </div>
                    </div>
                    <div className="font-bold text-[#0050F8]">{p.revenue}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-[#64748b] py-8">No products yet</p>
            )}
          </PortalCard>

          <PortalCard title="Recent Orders" subtitle="Latest order activity" icon={Clock3}>
            {ordersLoading ? (
              <Loading size="sm" />
            ) : dashboardMetrics.recentOrdersDisplay.length > 0 ? (
              <div className="space-y-3">
                {dashboardMetrics.recentOrdersDisplay.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fbff] p-4 transition hover:border-[#c7d7f5]">
                    <div className="flex items-center gap-4">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-[#eef3ff] text-sm font-bold text-[#001840]">{o.label}</div>
                      <div>
                        <div className="font-semibold text-[#0f172a]">{o.title}</div>
                        <div className="text-sm text-[#64748b]">{o.ago}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#334155]">{o.user}</span>
                      <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-[#64748b] py-8">No orders today</p>
            )}
          </PortalCard>
        </div>
      </PortalPage>
    </AdminShell>
  );
}

export default function BusinessAdminDashboard() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <DashboardStatic />
    </Suspense>
  );
}
