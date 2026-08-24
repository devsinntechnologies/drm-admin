"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, PackagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, FormField, portalInputClass } from "@/components/admin/PortalPage";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useRetailResource } from "@/hooks/useRetailResource";
import { useProducts } from "@/hooks/useProducts";
import { apiClient } from "@/lib/api-client";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { getStoredAuthToken } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  supplier?: Supplier;
  items: PurchaseOrderItem[];
}

type Line = { productId: string; quantity: string; unitCost: string };

function PurchasesContent() {
  const router = useRouter();
  const { role, token: reduxToken } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const businessId = useActiveBusinessId();
  const token = reduxToken || getStoredAuthToken();

  const { items: suppliers } = useRetailResource<Supplier>("/retail/suppliers");
  const { products } = useProducts({ limit: 200 });
  const {
    items: orders,
    loading,
    error,
    refresh,
  } = useRetailResource<PurchaseOrder>("/retail/purchases");

  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: "1", unitCost: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "purchases") && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const addLine = () => setLines((prev) => [...prev, { productId: "", quantity: "1", unitCost: "" }]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));
  const updateLine = (index: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supplierId) {
      toast.error("Select a supplier");
      return;
    }
    const validLines = lines.filter((line) => line.productId && Number(line.quantity) > 0 && line.unitCost !== "");
    if (!validLines.length) {
      toast.error("Add at least one valid line item");
      return;
    }

    const toastId = toast.loading("Creating purchase order...");
    setSubmitting(true);
    try {
      await apiClient.post(
        "/retail/purchases",
        {
          supplierId,
          items: validLines.map((line) => ({
            productId: line.productId,
            quantity: Number(line.quantity),
            unitCost: Number(line.unitCost),
          })),
        },
        token,
        businessId,
      );
      toast.success("Purchase order created", { id: toastId });
      setSupplierId("");
      setLines([{ productId: "", quantity: "1", unitCost: "" }]);
      await refresh(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create purchase order", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const receiveOrder = async (id: string) => {
    const toastId = toast.loading("Receiving stock...");
    setReceivingId(id);
    try {
      await apiClient.patch(`/retail/purchases/${id}/receive`, {}, token, businessId);
      toast.success("Stock received and inventory updated", { id: toastId });
      await refresh(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to receive purchase order", { id: toastId });
    } finally {
      setReceivingId(null);
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="purchases" pageTitle="Purchases" pageSubtitle="Order stock from suppliers and receive it into inventory">
      <PortalPage>
        <PortalPageHeader icon={PackagePlus} title="Purchase Orders" subtitle="Restock your store and track pending orders" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-muted,#f8fafc)] p-6">
            <h3 className="mb-6 text-lg font-bold">New Purchase Order</h3>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField label="Supplier" required>
                <select className={portalInputClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="space-y-3">
                <span className="block text-sm font-semibold text-[var(--text-muted,#64748b)]">Items</span>
                {lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2">
                    <select
                      className={portalInputClass}
                      value={line.productId}
                      onChange={(e) => updateLine(index, { productId: e.target.value })}
                    >
                      <option value="">Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      className={portalInputClass}
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, { quantity: e.target.value })}
                    />
                    <input
                      type="number"
                      min={0}
                      className={portalInputClass}
                      placeholder="Cost/unit"
                      value={line.unitCost}
                      onChange={(e) => updateLine(index, { unitCost: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="flex items-center justify-center rounded-xl border border-[var(--border-subtle)] px-3 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLine}
                  className="flex items-center gap-1 text-sm font-semibold text-[#0050F8]"
                >
                  <Plus className="h-4 w-4" /> Add item
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#001840] py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create Purchase Order
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Purchase Orders</h3>
            {loading ? (
              <Loading size="sm" />
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : orders.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">No purchase orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-[var(--border-subtle)] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{order.poNumber}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {order.supplier?.name ?? "Supplier"} · {order.items?.length ?? 0} item(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">Rs {Number(order.totalAmount).toLocaleString()}</p>
                        <span
                          className={`text-xs font-semibold capitalize ${
                            order.status === "received" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                    {order.status !== "received" && order.status !== "cancelled" ? (
                      <button
                        onClick={() => receiveOrder(order.id)}
                        disabled={receivingId === order.id}
                        className="mt-3 rounded-xl bg-[#0050F8] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {receivingId === order.id ? "Receiving..." : "Mark as received"}
                      </button>
                    ) : null}
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

export default function PurchasesPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <PurchasesContent />
    </Suspense>
  );
}
