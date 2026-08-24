"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, FormField, portalInputClass } from "@/components/admin/PortalPage";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useRetailResource } from "@/hooks/useRetailResource";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { apiClient } from "@/lib/api-client";
import { getStoredAuthToken } from "@/lib/utils";
import { useDashboardRefresh } from "@/contexts/DashboardRefreshContext";

interface SaleItem {
  id: string;
  productName: string;
  quantity: number;
  returnedQuantity: number;
  unitPrice: number;
}

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  items: SaleItem[];
}

interface ReturnRecord {
  id: string;
  refundAmount: number;
  reason?: string | null;
  createdAt: string;
  sale?: { saleNumber: string };
}

function ReturnsContent() {
  const router = useRouter();
  const { role, token: reduxToken } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const businessId = useActiveBusinessId();
  const token = reduxToken || getStoredAuthToken();
  const { bumpDashboardRefresh } = useDashboardRefresh();

  const { items: sales } = useRetailResource<Sale>("/retail/pos/sales");
  const { items: returns, loading, error, refresh } = useRetailResource<ReturnRecord>("/retail/returns");

  const [saleId, setSaleId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "returns") && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const selectedSale = useMemo(() => sales.find((sale) => sale.id === saleId) ?? null, [sales, saleId]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSale) {
      toast.error("Select a sale first");
      return;
    }
    const returnItems = selectedSale.items
      .map((item) => ({ saleItemId: item.id, quantity: Number(quantities[item.id] || 0) }))
      .filter((line) => line.quantity > 0);

    if (!returnItems.length) {
      toast.error("Enter a return quantity for at least one item");
      return;
    }

    const toastId = toast.loading("Processing return...");
    setSubmitting(true);
    try {
      await apiClient.post(
        "/retail/returns",
        { saleId: selectedSale.id, items: returnItems, reason: reason.trim() || undefined },
        token,
        businessId,
      );
      toast.success("Return processed and stock restored", { id: toastId });
      setSaleId("");
      setQuantities({});
      setReason("");
      await refresh(1);
      bumpDashboardRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process return", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="returns" pageTitle="Returns" pageSubtitle="Process customer returns and restock items">
      <PortalPage>
        <PortalPageHeader icon={Undo2} title="Returns" subtitle="Refund items from a past sale" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-muted,#f8fafc)] p-6">
            <h3 className="mb-6 text-lg font-bold">New Return</h3>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField label="Sale" required>
                <select
                  className={portalInputClass}
                  value={saleId}
                  onChange={(e) => {
                    setSaleId(e.target.value);
                    setQuantities({});
                  }}
                >
                  <option value="">Select a sale</option>
                  {sales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.saleNumber} · Rs {Number(sale.totalAmount).toLocaleString()}
                    </option>
                  ))}
                </select>
              </FormField>

              {selectedSale ? (
                <div className="space-y-3">
                  <span className="block text-sm font-semibold text-[var(--text-muted,#64748b)]">Items to return</span>
                  {selectedSale.items.map((item) => {
                    const remaining = item.quantity - item.returnedQuantity;
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] p-3">
                        <div>
                          <p className="text-sm font-semibold">{item.productName}</p>
                          <p className="text-xs text-[var(--text-muted)]">{remaining} of {item.quantity} returnable</p>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          disabled={remaining <= 0}
                          className="w-20 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm"
                          value={quantities[item.id] ?? ""}
                          onChange={(e) => setQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <FormField label="Reason">
                <input className={portalInputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Damaged, wrong size, etc." />
              </FormField>

              <button
                type="submit"
                disabled={submitting || !selectedSale}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#001840] py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Process Return
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Recent Returns</h3>
            {loading ? (
              <Loading size="sm" />
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : returns.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">No returns yet</p>
            ) : (
              <div className="space-y-3">
                {returns.map((ret) => (
                  <div key={ret.id} className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] p-4">
                    <div>
                      <p className="text-sm font-bold">{ret.sale?.saleNumber ?? "Sale"}</p>
                      <p className="text-xs text-[var(--text-muted)]">{ret.reason || "No reason given"}</p>
                    </div>
                    <p className="text-sm font-bold text-red-600">-Rs {Number(ret.refundAmount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PortalPage>
    </AdminShell>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <ReturnsContent />
    </Suspense>
  );
}
