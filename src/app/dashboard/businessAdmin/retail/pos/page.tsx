"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, portalInputClass, portalSearchClass } from "@/components/admin/PortalPage";
import InvoiceReceipt, { InvoicePrintButton } from "@/components/common/InvoiceReceipt";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useProducts, type Product, type ProductVariant } from "@/hooks/useProducts";
import { useRetailResource } from "@/hooks/useRetailResource";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { apiClient } from "@/lib/api-client";
import { getStoredAuthToken } from "@/lib/utils";

type CartLine = {
  lineKey: string;
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  maxStock?: number | null;
};

type RetailSaleItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variantId?: string | null;
};

type RetailSaleReceipt = {
  id: string;
  saleNumber: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: RetailSaleItem[];
};

function parseVariantName(productName: string): { name: string; variantName?: string } {
  const match = productName.match(/^(.+?) \((.+)\)$/);
  if (!match) return { name: productName };
  return { name: match[1], variantName: match[2] };
}

function lineKey(productId: string, variantId?: string) {
  return `${productId}:${variantId ?? "base"}`;
}

type RetailCustomer = { id: string; name: string; phone?: string | null };

function PosContent() {
  const router = useRouter();
  const { role, token: reduxToken } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const businessId = useActiveBusinessId();
  const token = reduxToken || getStoredAuthToken();

  const { products, loading: productsLoading } = useProducts({ limit: 200 });
  const { items: customers } = useRetailResource<RetailCustomer>("/retail/customers");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [taxAmount, setTaxAmount] = useState("0");
  const [customerId, setCustomerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<RetailSaleReceipt | null>(null);
  const [variantPicker, setVariantPicker] = useState<Product | null>(null);

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

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "ACTIVE"),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return activeProducts;
    return activeProducts.filter((product) => product.name.toLowerCase().includes(query));
  }, [activeProducts, search]);

  const addToCart = (product: Product, variant?: ProductVariant) => {
    const activeVariants = (product.variants ?? []).filter((v) => v.inStock > 0 || v.inStock == null);
    if (activeVariants.length > 0 && !variant) {
      setVariantPicker(product);
      return;
    }

    const variantId = variant?.id;
    const key = lineKey(product.id, variantId);
    const unitPrice = Number(variant?.price ?? product.price) || 0;
    const maxStock = variant?.inStock ?? product.inStock;
    const displayName = variant ? product.name : product.name;
    const variantName = variant?.name;

    setCart((prev) => {
      const existing = prev.find((line) => line.lineKey === key);
      if (existing) {
        const nextQty = existing.quantity + 1;
        if (maxStock != null && nextQty > maxStock) {
          toast.error(`Only ${maxStock} in stock`);
          return prev;
        }
        return prev.map((line) => (line.lineKey === key ? { ...line, quantity: nextQty } : line));
      }
      if (maxStock != null && maxStock < 1) {
        toast.error("Out of stock");
        return prev;
      }
      return [
        ...prev,
        {
          lineKey: key,
          productId: product.id,
          variantId,
          name: displayName,
          variantName,
          unitPrice,
          quantity: 1,
          maxStock,
        },
      ];
    });
    setVariantPicker(null);
  };

  const updateQuantity = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.lineKey !== key) return line;
          const nextQty = line.quantity + delta;
          if (nextQty <= 0) return line;
          if (line.maxStock != null && nextQty > line.maxStock) {
            toast.error(`Only ${line.maxStock} in stock`);
            return line;
          }
          return { ...line, quantity: nextQty };
        })
        .filter((line) => line.quantity > 0),
    );
  };

  const removeLine = (key: string) => setCart((prev) => prev.filter((line) => line.lineKey !== key));

  const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const total = Math.max(0, subtotal - (Number(discountAmount) || 0) + (Number(taxAmount) || 0));

  const checkout = async () => {
    if (!cart.length) {
      toast.error("Cart is empty");
      return;
    }
    const toastId = toast.loading("Processing sale...");
    setSubmitting(true);
    try {
      const sale = await apiClient.post<RetailSaleReceipt>(
        "/retail/pos/checkout",
        {
          items: cart.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
          discountAmount: Number(discountAmount) || 0,
          taxAmount: Number(taxAmount) || 0,
          paymentMethod,
          ...(customerId ? { customerId } : {}),
        },
        token,
        businessId,
      );
      toast.success(`Sale ${sale.saleNumber} completed`, { id: toastId });
      setReceipt(sale);
      setCart([]);
      setDiscountAmount("0");
      setTaxAmount("0");
      setCustomerId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const productStockLabel = (product: Product) => {
    const variants = product.variants ?? [];
    if (variants.length > 0) {
      const total = variants.reduce((sum, v) => sum + (Number(v.inStock) || 0), 0);
      return `${variants.length} variant${variants.length === 1 ? "" : "s"} · ${total} in stock`;
    }
    return product.inStock != null ? `${product.inStock} in stock` : "No stock tracking";
  };

  const productPriceLabel = (product: Product) => {
    const variants = product.variants ?? [];
    if (variants.length > 0) {
      const prices = variants.map((v) => Number(v.price) || 0).filter((p) => p > 0);
      if (!prices.length) return `Rs ${Number(product.price).toLocaleString()}`;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? `Rs ${min.toLocaleString()}` : `Rs ${min.toLocaleString()} – ${max.toLocaleString()}`;
    }
    return `Rs ${Number(product.price).toLocaleString()}`;
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="pos" pageTitle="Point of Sale" pageSubtitle="Ring up sales and take payment">
      <PortalPage>
        <PortalPageHeader icon={ShoppingCart} title="Point of Sale" subtitle="Search products, pick variants, and check out" />
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
                    <span className="mt-1 text-xs text-[var(--text-muted)]">{productPriceLabel(product)}</span>
                    <span className="mt-1 text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                      {productStockLabel(product)}
                    </span>
                    {(product.variants?.length ?? 0) > 0 ? (
                      <span className="mt-2 text-[10px] font-semibold text-[#0050F8]">Tap to choose variant</span>
                    ) : null}
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
                  <div key={line.lineKey} className="flex items-center justify-between rounded-xl bg-white p-3">
                    <div>
                      <p className="text-sm font-semibold">{line.name}</p>
                      {line.variantName ? (
                        <p className="text-xs text-[#0050F8]">{line.variantName}</p>
                      ) : null}
                      <p className="text-xs text-[var(--text-muted)]">Rs {line.unitPrice.toLocaleString()} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(line.lineKey, -1)} className="rounded-full border p-1">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{line.quantity}</span>
                      <button onClick={() => updateQuantity(line.lineKey, 1)} className="rounded-full border p-1">
                        <Plus className="h-3 w-3" />
                      </button>
                      <button onClick={() => removeLine(line.lineKey)} className="ml-1 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 space-y-3 border-t border-[var(--border-subtle)] pt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Customer</label>
                <select
                  className={`${portalInputClass} w-48`}
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Walk-in customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.phone ? ` · ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>
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
                <label className="text-sm font-semibold">Tax</label>
                <input
                  type="number"
                  min={0}
                  className="w-24 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
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
            </div>
          </div>
        </div>
      </PortalPage>

      <Dialog open={!!variantPicker} onOpenChange={(open) => !open && setVariantPicker(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle className="flex items-center justify-between">
            <span>Choose variant — {variantPicker?.name}</span>
            <button type="button" onClick={() => setVariantPicker(null)} className="rounded-full p-1 hover:bg-[#f1f5f9]">
              <X className="h-4 w-4" />
            </button>
          </DialogTitle>
          <div className="mt-4 space-y-2">
            {(variantPicker?.variants ?? []).map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => variantPicker && addToCart(variantPicker, variant)}
                disabled={variant.inStock != null && variant.inStock < 1}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--border-subtle)] px-4 py-3 text-left transition hover:border-[#0050F8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="font-semibold">{variant.name}</span>
                <span className="text-sm text-[var(--text-muted)]">
                  Rs {Number(variant.price).toLocaleString()}
                  {variant.inStock != null ? ` · ${variant.inStock} left` : ""}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!receipt} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent className="max-w-lg p-0">
          <DialogTitle className="sr-only">Sale receipt</DialogTitle>
          {receipt ? (
            <div className="p-4">
              <InvoiceReceipt
                orderNumber={receipt.saleNumber}
                date={new Date(receipt.createdAt).toLocaleString("en-GB")}
                status="paid"
                subtotal={Number(receipt.subtotal)}
                total={Number(receipt.totalAmount)}
                items={receipt.items.map((item, index) => {
                  const parsed = parseVariantName(item.productName);
                  return {
                    id: item.id ?? String(index),
                    productName: parsed.name,
                    variantName: parsed.variantName,
                    quantity: item.quantity,
                    price: Number(item.unitPrice),
                    total: Number(item.lineTotal),
                  };
                })}
              />
              <div className="mt-4 flex justify-end gap-2 px-2 pb-2">
                <InvoicePrintButton onClick={() => window.print()} />
                <button
                  type="button"
                  className="rounded-xl border px-4 py-2 text-sm font-semibold"
                  onClick={() => setReceipt(null)}
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
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
