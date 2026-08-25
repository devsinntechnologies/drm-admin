"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, FormField, portalInputClass, portalPanelClass, portalPanelMutedClass, portalBtnPrimaryClass } from "@/components/admin/PortalPage";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { apiClient } from "@/lib/api-client";
import { getStoredAuthToken } from "@/lib/utils";

interface Dashboard {
  todaySales: number;
  totalTransactions: number;
  grossProfit: number;
  linesWithoutCost?: number;
  lowStockCount: number;
  lowStockProducts: Array<{ productId: string; productName: string; inStock: number }>;
  pendingPurchases: number;
}

interface ProfitAndLoss {
  revenue: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  expensesByCategory: Array<{ category: string; total: number }>;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function ReportsContent() {
  const router = useRouter();
  const { role, token: reduxToken } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const businessId = useActiveBusinessId();
  const token = reduxToken || getStoredAuthToken();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [pnl, setPnl] = useState<ProfitAndLoss | null>(null);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "reports") && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const loadDashboard = useCallback(async () => {
    if (!businessId) return;
    try {
      const data = await apiClient.get<Dashboard>("/retail/reports/dashboard", token, businessId);
      setDashboard(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load dashboard");
    }
  }, [businessId, token]);

  const loadPnl = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await apiClient.get<ProfitAndLoss>(
        `/retail/reports/profit-and-loss?fromDate=${fromDate}&toDate=${toDate}`,
        token,
        businessId,
      );
      setPnl(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load profit & loss");
    } finally {
      setLoading(false);
    }
  }, [businessId, token, fromDate, toDate]);

  useEffect(() => {
    if (isAuthorized) {
      loadDashboard();
      loadPnl();
    }
  }, [isAuthorized, loadDashboard, loadPnl]);

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="reports" pageTitle="Reports" pageSubtitle="Sales, profit, and stock at a glance">
      <PortalPage>
        <PortalPageHeader icon={BarChart3} title="Store Reports" subtitle="Today's performance and profit & loss" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Today's Sales" value={`Rs ${Number(dashboard?.todaySales ?? 0).toLocaleString()}`} />
          <StatCard label="Transactions" value={String(dashboard?.totalTransactions ?? 0)} />
          <StatCard label="Gross Profit" value={`Rs ${Number(dashboard?.grossProfit ?? 0).toLocaleString()}`} />
          {dashboard?.linesWithoutCost ? (
            <p className="col-span-full text-xs text-[var(--text-muted)]">
              {dashboard.linesWithoutCost} sale line(s) today excluded from gross profit (no cost price set).
            </p>
          ) : null}
          <StatCard label="Low Stock Items" value={String(dashboard?.lowStockCount ?? 0)} />
          <StatCard label="Pending Purchases" value={String(dashboard?.pendingPurchases ?? 0)} />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className={portalPanelClass}>
            <h3 className="mb-4 text-lg font-bold text-[var(--text-primary)]">Low Stock Products</h3>
            {dashboard?.lowStockProducts?.length ? (
              <div className="space-y-2">
                {dashboard.lowStockProducts.map((product) => (
                  <div key={product.productId} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{product.productName}</p>
                    <p className="text-sm font-bold text-amber-500">{product.inStock} left</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">Nothing running low</p>
            )}
          </div>

          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-muted,#f8fafc)] p-6">
            <h3 className="mb-4 text-lg font-bold">Profit &amp; Loss</h3>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <FormField label="From">
                <input type="date" className={portalInputClass} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </FormField>
              <FormField label="To">
                <input type="date" className={portalInputClass} value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </FormField>
            </div>
            <button onClick={loadPnl} disabled={loading} className={`mb-4 ${portalBtnPrimaryClass} !w-auto px-5 py-2.5`}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Refresh
            </button>
            {pnl ? (
              <div className="space-y-2 text-sm text-[var(--text-primary)]">
                <div className="flex justify-between"><span>Revenue (net of refunds)</span><span className="font-bold">Rs {Number(pnl.revenue).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Gross Profit</span><span className="font-bold">Rs {Number(pnl.grossProfit).toLocaleString()}</span></div>
                <p className="text-xs text-[var(--text-muted)]">
                  Gross profit includes only lines with an assigned cost price. Variant sales use variant cost only.
                </p>
                <div className="flex justify-between"><span>Total Expenses</span><span className="font-bold text-red-600">-Rs {Number(pnl.totalExpenses).toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-[var(--border-subtle)] pt-2 text-base"><span className="font-bold">Net Profit</span><span className="font-bold">Rs {Number(pnl.netProfit).toLocaleString()}</span></div>
                {pnl.expensesByCategory?.length ? (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">Expenses by category</p>
                    {pnl.expensesByCategory.map((row) => (
                      <div key={row.category} className="flex justify-between capitalize">
                        <span>{row.category}</span>
                        <span>Rs {Number(row.total).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">No data for this period</p>
            )}
          </div>
        </div>
      </PortalPage>
    </AdminShell>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <ReportsContent />
    </Suspense>
  );
}
