"use client";

import Image from "next/image";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { ShoppingBag, TriangleAlert, PieChart, Loader2, ShoppingCart, ReceiptText, CheckCircle2, Flame, Clock3, Printer, Utensils } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useInvoices } from "@/hooks/useInvoices";

function formatElapsed(isoDate: string) {
  const createdAt = new Date(isoDate).getTime();
  if (!Number.isFinite(createdAt)) {
    return "--";
  }

  const diffMs = Math.max(0, Date.now() - createdAt);
  const totalMinutes = Math.floor(diffMs / 60000);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function DonutChart({ slices }: { slices: { color: string; value: number }[] }) {
  const stops: string[] = [];
  const segments: { start: number; end: number; value: number }[] = [];
  let current = 0;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  slices.forEach((slice) => {
    const start = (current / total) * 100;
    current += slice.value;
    const end = (current / total) * 100;
    stops.push(`${slice.color} ${start}% ${end}%`);
    segments.push({ start, end, value: slice.value });
  });

  return (
    <div
      className="relative h-44 w-44 rounded-full"
      style={{ background: `conic-gradient(${stops.join(", ")})` }}
    >
      {segments.map((segment, index) => {
        if (segment.value <= 0) return null;
        // Use fixed angles so labels are placed at left-top, top, right-top
        const fixedAngles = [90, -160, -20];
        const angle = fixedAngles[index] ?? ((segment.start + segment.end) / 2 / 100) * 360 - 90;
        const radian = (angle * Math.PI) / 180;
        const baseRadius = 66;
        const radiusTweaks = [8, 2, 8];
        const labelRadius = baseRadius + (radiusTweaks[index] ?? 0);
        const x = Math.cos(radian) * labelRadius;
        const y = Math.sin(radian) * labelRadius;

        const baseTransforms = [
          "translate(0%, -120%)",
          "translate(-0%, 10%)",
          "translate(-300%, -60%)",
        ];
        const baseTransform = baseTransforms[index] ?? "translate(-50%, -50%)";

        return (
          <span
            key={`${segment.start}-${segment.end}-${index}`}
            className="absolute left-1/2 top-1/2 text-sm font-extrabold leading-none text-white"
            style={{ transform: `${baseTransform} translate(${x}px, ${y}px)` }}
          >
            {segment.value}
          </span>
        );
      })}
      <div className="absolute inset-[30px] rounded-full bg-white" />
    </div>
  );
}

function DashboardStatic() {
  const { orders, loading: ordersLoading } = useOrders({ range: "day" });
  const { products, loading: productsLoading } = useProducts({ page: 1, limit: 100 });
  const { invoices } = useInvoices({ page: 1, limit: 100 });

  // Calculate all dashboard metrics dynamically
  const dashboardMetrics = useMemo(() => {
    // Active orders (not completed/delivered)
    const activeOrders = orders.filter(
      (o) => !["completed", "delivered"].includes(o.status?.toLowerCase() || "")
    );
    const activeOrdersCount = activeOrders.length;

    // Completed orders
    const completedOrders = orders.filter(
      (o) => o.status?.toLowerCase() === "completed" || o.status?.toLowerCase() === "delivered"
    );
    const completedOrdersCount = completedOrders.length;

    // Total orders
    const totalOrdersCount = orders.length;

    // Completion rate
    const completionRate =
      totalOrdersCount > 0
        ? Math.round((completedOrdersCount / totalOrdersCount) * 100)
        : 0;

    // Low stock products (assuming inStock < 10 is low)
    const lowStockProducts = products.filter((p) => {
      const stock = typeof p.inStock === "number" ? p.inStock : 0;
      return stock < 10 && p.status === "ACTIVE";
    });
    const lowStockCount = lowStockProducts.length;
    const totalProductsCount = products.filter((p) => p.status === "ACTIVE").length;

    // Pending invoices
    const pendingInvoices = invoices.filter(
      (inv) => inv.status?.toLowerCase() === "pending"
    );
    const pendingInvoicesCount = pendingInvoices.length;

    // Order status distribution
    const newOrders = orders.filter(
      (o) =>
        ["pending", "new", "placed"].includes(o.status?.toLowerCase() || "")
    ).length;
    const preparingOrders = orders.filter(
      (o) =>
        [
          "preparing",
          "cooking",
          "in_progress",
          "in-progress",
        ].includes(o.status?.toLowerCase() || "")
    ).length;
    const readyOrders = orders.filter(
      (o) => o.status?.toLowerCase() === "ready"
    ).length;

    const orderStatusSlices = [
      { color: "#3b82f6", value: newOrders || 1 },
      { color: "#10b981", value: preparingOrders || 1 },
      { color: "#f59e0b", value: readyOrders || 1 },
    ];

    // Top selling products (sorted by price descending, top 5)
    const topSellingProducts = products
      .filter((p) => p.status === "ACTIVE")
      .sort((a, b) => {
        const priceA = a.variants?.[0]?.price || 0;
        const priceB = b.variants?.[0]?.price || 0;
        return priceB - priceA;
      })
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        stocks: p.inStock || 0,
        revenue: `PKR ${((p.variants?.[0]?.price || 0) * (p.inStock || 0)).toFixed(2)}`,
        img: p.image && !p.image.startsWith("http") ? `https://drm.devsinntechnologies.com/${p.image}` : p.image || null,
      }));

    // Recent orders display
    const recentOrdersDisplay = orders
      .slice(0, 5)
      .map((order, index) => ({
        id: order.id,
        label: String(index + 1),
        title: order.orderNumber || "N/A",
        ago: formatElapsed(order.createdAt),
        status: `OrderStatus.${order.status?.toLowerCase() || "pending"}`,
        user: order.table || "Self Pickup",
      }));

    return {
      activeOrdersCount,
      completedOrdersCount,
      totalOrdersCount,
      completionRate,
      lowStockCount,
      totalProductsCount,
      pendingInvoicesCount,
      orderStatusSlices,
      topSellingProducts,
      recentOrdersDisplay,
    };
  }, [orders, products, invoices]);
  return (
    <AdminShell activeTab="dashboard">
      <section className="w-full space-y-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="relative rounded-2xl bg-gradient-to-br from-violet-500 to-violet-400 p-6 md:p-8 text-[#ffffff] shadow-lg h-[280px] md:h-[360px] overflow-hidden">
            <div className="flex flex-col h-full justify-between">
              <div>
                <p className="text-sm opacity-90">Active Orders</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold">{dashboardMetrics.activeOrdersCount}</h3>
                <p className="mt-2 text-sm opacity-80">{dashboardMetrics.completedOrdersCount} completed</p>
              </div>
            </div>
            <div className="absolute right-3 top-3 rounded-xl bg-white/20 p-2 md:p-2.5">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div className="absolute right-1 top-1 text-[#ffffff]/8">
              <ShoppingBag className="h-20 w-20" strokeWidth={1.3} />
            </div>
          </article>

          <article className="relative rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 md:p-8 text-[#ffffff] shadow-lg h-[380px] md:h-[360px] overflow-hidden">
            <div className="flex flex-col h-full justify-between">
              <div>
                <p className="text-sm opacity-90">Low Stock Alerts</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold">{dashboardMetrics.lowStockCount}</h3>
                <p className="mt-2 text-sm opacity-80">Out of {dashboardMetrics.totalProductsCount} products</p>
              </div>
            </div>
            <div className="absolute right-3 top-3 rounded-xl bg-white/20 p-2 md:p-2.5">
              <TriangleAlert className="h-4 w-4" />
            </div>
            <div className="absolute right-1 top-1 text-[#ffffff]/10">
              <TriangleAlert className="h-24 w-24" strokeWidth={1.2} />
            </div>
          </article>
        </div>

        <article className="rounded-2xl bg-white shadow-md overflow-hidden">
          <div className="flex items-start justify-between bg-[#f2ecf5] px-6 py-5 border-b">
            <div className="flex items-start gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#5b3fd1] text-[#ffffff] shadow-md">
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
              <DonutChart slices={dashboardMetrics.orderStatusSlices} />
              <ul className="space-y-3">
                <li className="grid grid-cols-[12px_1fr] items-center gap-3"><span className="h-3 w-3 rounded-sm bg-[#3b82f6] block" /> <span className="text-base text-[#111827]">New</span></li>
                <li className="grid grid-cols-[12px_1fr] items-center gap-3"><span className="h-3 w-3 rounded-sm bg-[#10b981] block" /> <span className="text-base text-[#111827]">Preparing</span></li>
                <li className="grid grid-cols-[12px_1fr] items-center gap-3"><span className="h-3 w-3 rounded-sm bg-[#f59e0b] block" /> <span className="text-base text-[#111827]">Ready</span></li>
                <li className="grid grid-cols-[12px_1fr] items-center gap-3"><span className="h-3 w-3 rounded-sm bg-[#ef4444] block" /> <span className="text-base text-[#111827]">Delivered</span></li>
                <li className="grid grid-cols-[12px_1fr] items-center gap-3"><span className="h-3 w-3 rounded-sm bg-[#8b5cf6] block" /> <span className="text-base text-[#111827]">Complete</span></li>
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
            <h3 className="mt-4 text-2xl font-bold">{dashboardMetrics.totalOrdersCount}</h3>
            <p className="text-sm text-gray-400">All time orders</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-amber-200 border-l-4 border-l-amber-500">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-600">Pending Invoices</p>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-500">
                <ReceiptText className="h-5 w-5" />
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-bold">{dashboardMetrics.pendingInvoicesCount}</h3>
            <p className="text-sm text-gray-400">Awaiting payment</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-emerald-200 border-l-4 border-l-emerald-500">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-bold">{dashboardMetrics.completionRate}%</h3>
            <p className="text-sm text-gray-400">Orders completed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-start">
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden h-fit">
            <div className="flex items-center gap-4 px-6 py-5 bg-[#f0fdf4] border-b border-gray-200">
              <div className="h-12 w-12 rounded-xl bg-[#10b981] grid place-items-center text-white">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#111827]">Top Selling Products</h4>
                <p className="text-sm text-gray-500 font-medium">Best performers by revenue</p>
              </div>
            </div>
            <div className="p-6">
              {productsLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl p-4 bg-[#fafafa] border border-gray-200 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gray-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-gray-200 rounded"></div>
                          <div className="h-3 w-16 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : dashboardMetrics.topSellingProducts.length > 0 ? (
                <div className="space-y-3">
                  {dashboardMetrics.topSellingProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl p-4 bg-[#fafafa] border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 overflow-hidden rounded-xl bg-white border border-gray-200 relative flex items-center justify-center">
                          {p.img ? (
                            <Image src={p.img} alt={p.name} fill sizes="56px" className="object-cover" />
                          ) : (
                            <Utensils className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[#111827] text-base">{p.name}</div>
                          <div className="text-sm text-gray-500 font-medium">{p.stocks} stocks</div>
                        </div>
                      </div>
                      <div className="text-[#10b981] font-bold text-base">{p.revenue}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden h-fit">
            <div className="flex items-center gap-4 px-6 py-5 bg-[#eff6ff] border-b border-blue-100">
              <div className="h-12 w-12 rounded-2xl bg-[#3b82f6] grid place-items-center text-[#ffffff] shadow-sm">
                <Clock3 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#111827]">Recent Orders</h4>
                <p className="text-sm text-gray-500 font-medium">Latest order activity</p>
              </div>
            </div>
            <div className="p-6">
              {ordersLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl p-4 bg-[#f8fafc] border border-gray-50 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-50"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded"></div>
                          <div className="h-3 w-20 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : dashboardMetrics.recentOrdersDisplay.length > 0 ? (
                <div className="space-y-3">
                  {dashboardMetrics.recentOrdersDisplay.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between rounded-2xl p-4 bg-[#f8fafc] border border-gray-50 transition hover:border-blue-100">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-50 grid place-items-center text-blue-600 font-black text-lg shadow-sm border border-blue-100">{o.label}</div>
                        <div>
                          <div className="font-bold text-[#111827] break-words">{o.title}</div>
                          <div className="text-sm text-gray-500 font-medium">{o.ago}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-black text-[#111827]">{o.user}</div>
                        <div className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-wider">{o.status.split('.').pop()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/businessAdmin/invoice-test"
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 text-white shadow-lg hover:bg-amber-600 transition"
        >
          <Printer className="h-5 w-5 text-white" />
          <span className="text-lg font-semibold text-white">Test Invoice Layout</span>
        </Link>
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
