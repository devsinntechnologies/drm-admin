"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, portalInputClass, portalSearchClass } from "@/components/admin/PortalPage";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useProducts } from "@/hooks/useProducts";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { apiClient } from "@/lib/api-client";
import { getStoredAuthToken } from "@/lib/utils";

type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  maxStock?: number | null;
};

function PosContent() {
  const router = useRouter();
  const { role, token: reduxToken } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const businessId = useActiveBusinessId();
  const token = reduxToken || getStoredAuthToken();

  const { products, loading: productsLoading } = useProducts({ limit: 200 });
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{ saleNumber: string; totalAmount: number } | null>(null);

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "pos") && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => product.name.toLowerCase().includes(query));
  }, [products, search]);

  const addToCart = (product: (typeof products)[number]) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: Number(product.price) || 0,
          quantity: 1,
          maxStock: product.inStock,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => (line.productId === productId ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0),
    );
  };

  const removeLine = (productId: string) => setCart((prev) => prev.filter((line) => line.productId !== productId));

  const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const total = Math.max(0, subtotal - (Number(discountAmount) || 0));

  const checkout = async () => {
    if (!cart.length) {
      toast.error("Cart is empty");
      return;
    }
    const toastId = toast.loading("Processing sale...");
    setSubmitting(true);
    try {
      const sale = await apiClient.post<{ saleNumber: string; totalAmount: number }>(
        "/retail/pos/checkout",
        {
          items: cart.map((line) => ({ productId: line.productId, quantity: line.quantity, unitPrice: line.unitPrice })),
          discountAmount: Number(discountAmount) || 0,
          paymentMethod,
        },
        token,
        businessId,
      );
      toast.success(`Sale ${sale.saleNumber} completed`, { id: toastId });
      setLastReceipt(sale);
      setCart([]);
      setDiscountAmount("0");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="pos" pageTitle="Point of Sale" pageSubtitle="Ring up sales and take payment">
      <PortalPage>
        <PortalPageHeader icon={ShoppingCart} title="Point of Sale" subtitle="Search products, build the cart, and check out" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm">
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                className={portalSearchClass}
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {productsLoading ? (
              <Loading size="sm" />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex flex-col items-start rounded-2xl border border-[var(--border-subtle)] p-4 text-left transition hover:border-[#0050F8] hover:shadow-sm"
                  >
                    <span className="text-sm font-bold">{product.name}</span>
                    <span className="mt-1 text-xs text-[var(--text-muted)]">Rs {Number(product.price).toLocaleString()}</span>
                    <span className="mt-1 text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                      {product.inStock != null ? `${product.inStock} in stock` : "No stock tracking"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-muted,#f8fafc)] p-6">
            <h3 className="mb-4 text-lg font-bold">Cart</h3>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="py-10 text-center text-sm text-[var(--text-muted)]">Cart is empty</p>
              ) : (
                cart.map((line) => (
                  <div key={line.productId} className="flex items-center justify-between rounded-xl bg-white p-3">
                    <div>
                      <p className="text-sm font-semibold">{line.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">Rs {line.unitPrice.toLocaleString()} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(line.productId, -1)} className="rounded-full border p-1">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{line.quantity}</span>
                      <button onClick={() => updateQuantity(line.productId, 1)} className="rounded-full border p-1">
                        <Plus className="h-3 w-3" />
                      </button>
                      <button onClick={() => removeLine(line.productId)} className="ml-1 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 space-y-3 border-t border-[var(--border-subtle)] pt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Discount</label>
                <input
                  type="number"
                  min={0}
                  className="w-24 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Payment</label>
                <select className={`${portalInputClass} w-40`} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="mobile_wallet">Mobile wallet</option>
                </select>
              </div>
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>Rs {total.toLocaleString()}</span>
              </div>
              <button
                onClick={checkout}
                disabled={submitting || !cart.length}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#001840] py-3.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Complete Sale
              </button>
              {lastReceipt ? (
                <p className="text-center text-xs text-[var(--text-muted)]">
                  Last sale: {lastReceipt.saleNumber} · Rs {Number(lastReceipt.totalAmount).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </PortalPage>
    </AdminShell>
  );
}

export default function PosPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <PosContent />
    </Suspense>
  );
}
