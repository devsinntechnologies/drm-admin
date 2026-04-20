"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CookingPot,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Table2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { useOrders, type OrderRecord } from "@/hooks/useOrders";
import { useProducts, type Product, type ProductVariant } from "@/hooks/useProducts";
import { useTables } from "@/hooks/useTables";

type OrderView = "new-order" | "active-orders";

type CartItem = {
  productId: string;
  variantId: string;
  variantName: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  image: string;
};

type KitchenLane = "new" | "cooking" | "ready";

function OrderItemThumbnail({ image, alt }: { image: string; alt: string }) {
  return (
    <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/70  shadow-[0_6px_14px_rgba(15,23,42,0.08)]">
      <Image src={image} alt={alt} fill sizes="48px" className="object-cover" />
    </div>
  );
}

function productImageUrl(imagePath?: string | null) {
  if (!imagePath) {
    return "/business/pic1.jpeg";
  }

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  return `https://vendor.umazing.shop/${imagePath}`;
}

function getDefaultVariant(product: Product): ProductVariant | null {
  if (!product.variants?.length) {
    return null;
  }

  return product.variants[0] ?? null;
}

function asNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildOrderInvoicePrintHtml(order: OrderRecord) {
  const itemsMarkup = order.Items.map((item) => {
    const unitPrice = asNumber(item.price);
    const lineTotal = asNumber(item.total);
    return `
      <tr>
        <td>${escapeHtml(item.productName)}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;">${unitPrice.toFixed(2)}</td>
        <td style="text-align:right;">${lineTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  const totalPrice = asNumber(order.totalPrice);
  const delivery = asNumber(order.deliveryCharges);
  const packing = asNumber(order.packagingPrice);

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${escapeHtml(order.orderNumber)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          h1 { margin: 0 0 4px; font-size: 20px; }
          .muted { color: #6b7280; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; font-size: 13px; }
          th { text-align: left; background: #f9fafb; }
          .totals { margin-top: 16px; margin-left: auto; width: 260px; }
          .totals div { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
          .grand { font-weight: 700; font-size: 15px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>Invoice</h1>
        <div class="muted">Order #${escapeHtml(order.orderNumber)}</div>
        <div class="muted">Table: ${escapeHtml(order.table || "Take Away")}</div>
        <div class="muted">Created: ${escapeHtml(new Date(order.createdAt).toLocaleString())}</div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Unit Price</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsMarkup}</tbody>
        </table>

        <div class="totals">
          <div><span>Subtotal</span><span>${totalPrice.toFixed(2)}</span></div>
          <div><span>Delivery</span><span>${delivery.toFixed(2)}</span></div>
          <div><span>Packaging</span><span>${packing.toFixed(2)}</span></div>
          <div class="grand"><span>Grand Total</span><span>${(totalPrice + delivery + packing).toFixed(2)}</span></div>
        </div>
      </body>
    </html>
  `;
}

function printHtmlWithIframe(html: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  iframe.srcdoc = html;

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  iframe.onload = () => {
    const printWindow = iframe.contentWindow;
    if (!printWindow) {
      cleanup();
      return;
    }

    printWindow.focus();
    printWindow.print();
    setTimeout(cleanup, 500);
  };

  document.body.appendChild(iframe);
}

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

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "ready" || normalized === "completed") {
    return "bg-[#16c964]";
  }

  if (normalized === "pending" || normalized === "preparing") {
    return "bg-[#ff7a00]";
  }

  if (normalized === "cancelled" || normalized === "failed") {
    return "bg-[#ef4444]";
  }

  return "bg-[#64748b]";
}

function normalizeKitchenLane(status: string): KitchenLane | null {
  const value = status.toLowerCase();
  if (["pending", "new", "placed"].includes(value)) {
    return "new";
  }

  if (["preparing", "cooking", "in_progress", "in-progress"].includes(value)) {
    return "cooking";
  }

  if (value === "ready") {
    return "ready";
  }

  return null;
}

function laneBadgeColor(lane: KitchenLane) {
  if (lane === "new") return "bg-[#ef4444]";
  if (lane === "cooking") return "bg-[#f97316]";
  return "bg-[#22c55e]";
}

function laneButtonClass(lane: KitchenLane) {
  if (lane === "new") return "bg-[#ef000f] hover:bg-[#d9000f]";
  if (lane === "cooking") return "bg-[#ff7300] hover:bg-[#e96800]";
  return "bg-[#17b74b] hover:bg-[#12963d]";
}

function laneTitle(lane: KitchenLane) {
  if (lane === "new") return "New Orders";
  if (lane === "cooking") return "Cooking";
  return "Ready";
}

function laneActionLabel(lane: KitchenLane) {
  if (lane === "new") return "Start Preparing";
  if (lane === "cooking") return "Mark as Ready";
  return "Order Served";
}

export default function OrdersPage() {
  const router = useRouter();
  const { role, token } = useAuth();
  const [view, setView] = useState<OrderView>("new-order");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryCharges, setDeliveryCharges] = useState("0");
  const [packagingPrice, setPackagingPrice] = useState("0");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>({});
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isKitchenRole, setIsKitchenRole] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProducts({ page: 1, limit: 100 });
  const {
    tables,
    loading: tablesLoading,
    error: tablesError,
  } = useTables({ page: 1, limit: 100 });
  const {
    createOrder,
    orders: activeOrders,
    loading: ordersLoading,
    error: ordersError,
    pagination: ordersPagination,
    actionLoading: createOrderLoading,
    updateOrderStatus,
  } = useOrders({ range: "day" });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? window.localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    if (currentRole !== "business_admin" && currentRole !== "kitchen" && currentRole !== "waiter") {
      router.replace("/dashboard");
      return;
    }

    setIsKitchenRole(currentRole === "kitchen");
    setIsAuthorized(true);
  }, [role, router]);

  const kitchenOrders = useMemo(
    () =>
      activeOrders
        .map((order) => {
          const lane = normalizeKitchenLane(order.status);
          return {
            ...order,
            lane,
          };
        })
        .filter((order) => order.lane !== null),
    [activeOrders],
  );

  const newOrders = useMemo(() => kitchenOrders.filter((order) => order.lane === "new"), [kitchenOrders]);
  const cookingOrders = useMemo(() => kitchenOrders.filter((order) => order.lane === "cooking"), [kitchenOrders]);
  const readyOrders = useMemo(() => kitchenOrders.filter((order) => order.lane === "ready"), [kitchenOrders]);

  async function moveKitchenOrder(orderId: string, lane: KitchenLane) {
    try {
      setUpdatingOrderId(orderId);
      let nextStatus = "cooking";
      let successMessage = "Order moved to cooking.";

      if (lane === "new") {
        nextStatus = "cooking";
        successMessage = "Order moved to cooking.";
      } else if (lane === "cooking") {
        nextStatus = "ready";
        successMessage = "Order marked as ready.";
      } else if (lane === "ready") {
        nextStatus = "served";
        successMessage = "Order served.";
      }

      await updateOrderStatus(orderId, nextStatus);
      toast.success(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update order status.";
      toast.error(message);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handleActiveOrderAction(orderId: string) {
    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus(orderId, "completed");

      const authToken = token || (typeof window !== "undefined" ? (localStorage.getItem("auth_token") || localStorage.getItem("token")) : null);
      if (!authToken) {
        throw new Error("No authentication token available");
      }

      const invoiceResponse = await fetch("https://vendor.umazing.shop/invoice", {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      if (!invoiceResponse.ok) {
        const text = await invoiceResponse.text();
        throw new Error(text || `Failed to create invoice: ${invoiceResponse.statusText}`);
      }

      toast.success("Order marked as completed and invoice created.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete order.";
      toast.error(message);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const activeProducts = useMemo(() => products.filter((item) => item.status === "ACTIVE"), [products]);

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    for (const product of activeProducts) {
      const name = product.category?.CategoryName;
      if (name) {
        categories.add(name);
      }
    }

    return ["All", ...Array.from(categories)];
  }, [activeProducts]);

  const visibleProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return activeProducts.filter((item) => {
      const categoryName = item.category?.CategoryName || "Uncategorized";
      const categoryMatches = selectedCategory === "All" || categoryName === selectedCategory;

      if (!categoryMatches) {
        return false;
      }

      if (!query) {
        return true;
      }

      const text = `${item.name} ${categoryName}`.toLowerCase();
      return text.includes(query);
    });
  }, [activeProducts, searchTerm, selectedCategory]);

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [cartItems],
  );

  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems],
  );

  const totalAmount = useMemo(() => {
    return subtotal + asNumber(deliveryCharges) + asNumber(packagingPrice);
  }, [deliveryCharges, packagingPrice, subtotal]);

  function updateQuantity(productId: string, variantId: string, delta: number) {
    setCartItems((prev) => {
      const next = prev
        .map((item) => {
          if (item.productId === productId && item.variantId === variantId) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);

      return next;
    });
  }

  function removeCartItem(productId: string, variantId: string) {
    setCartItems((prev) => prev.filter((item) => !(item.productId === productId && item.variantId === variantId)));
  }

  function onSelectVariant(productId: string, variantId: string) {
    setSelectedVariantByProduct((prev) => ({
      ...prev,
      [productId]: variantId,
    }));
  }

  function onAddToOrder(product: Product) {
    const chosenVariantId = selectedVariantByProduct[product.id] || getDefaultVariant(product)?.id;
    const selectedVariant = product.variants.find((variant) => variant.id === chosenVariantId) || getDefaultVariant(product);

    if (!selectedVariant) {
      toast.error(`No variant available for ${product.name}.`);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id && item.variantId === selectedVariant.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && item.variantId === selectedVariant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          variantId: selectedVariant.id,
          variantName: selectedVariant.name,
          name: product.name,
          category: product.category?.CategoryName || "Uncategorized",
          unitPrice: selectedVariant.price,
          quantity: 1,
          image: productImageUrl(product.image),
        },
      ];
    });
  }

  async function onCreateOrder() {
    if (!selectedTableId) {
      toast.error("Please select a table.");
      return;
    }

    if (!cartItems.length) {
      toast.error("Add at least one product to create an order.");
      return;
    }

    try {
      await createOrder({
        tableId: selectedTableId,
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        totalPrice: Number(totalAmount.toFixed(2)),
        deliveryCharges: asNumber(deliveryCharges),
        packagingPrice: asNumber(packagingPrice),
      });

      toast.success("Order created successfully.");
      setCartItems([]);
      setDeliveryCharges("0");
      setPackagingPrice("0");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create order.";
      toast.error(message);
    }
  }

  if (!isAuthorized) {
    return null;
  }

  if (isKitchenRole) {
    return (
      <main className="min-h-screen bg-[#f2f4f7] px-4 py-4 md:px-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <section className="rounded-2xl bg-[linear-gradient(90deg,#ff7300_0%,#ee0010_100%)] p-6 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-white/20">
                <CookingPot className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Kitchen Board</h1>
                <p className="text-sm text-white/90">{newOrders.length + cookingOrders.length + readyOrders.length} active orders • Keep cooking!</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-[#f1d4d6] bg-[#f6ecee] p-4 shadow-[0_6px_14px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ff2e3b] text-white"><Bell className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm text-[#4b5563]">New Orders</p>
                  <strong className="text-4xl font-bold text-[#111827]">{newOrders.length}</strong>
                </div>
              </div>
            </article>
            <article className="rounded-2xl border border-[#efdfcc] bg-[#f4efe7] p-4 shadow-[0_6px_14px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ff7300] text-white"><CookingPot className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm text-[#4b5563]">Cooking</p>
                  <strong className="text-4xl font-bold text-[#111827]">{cookingOrders.length}</strong>
                </div>
              </div>
            </article>
            <article className="rounded-2xl border border-[#d7e7de] bg-[#eaf4ef] p-4 shadow-[0_6px_14px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#14b84b] text-white"><CheckCircle2 className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm text-[#4b5563]">Ready</p>
                  <strong className="text-4xl font-bold text-[#111827]">{readyOrders.length}</strong>
                </div>
              </div>
            </article>
          </section>

          {ordersLoading ? (
            <article className="rounded-2xl bg-white p-5 text-sm text-[#64748b]">
              <div className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading kitchen orders...
              </div>
            </article>
          ) : null}

          {ordersError ? <article className="rounded-2xl bg-white p-5 text-sm text-[#dc2626]">{ordersError}</article> : null}

          {!ordersLoading && !ordersError ? (
            <section className="grid gap-4 lg:grid-cols-3">
              {([
                { lane: "new" as KitchenLane, data: newOrders },
                { lane: "cooking" as KitchenLane, data: cookingOrders },
                { lane: "ready" as KitchenLane, data: readyOrders },
              ]).map((group) => (
                <div key={group.lane} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-semibold text-[#111827]">{laneTitle(group.lane)}</h2>
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full px-2 py-1 text-xs font-bold text-white bg-[#ef4444]">{group.data.length}</span>
                  </div>

                  {group.data.length === 0 ? (
                    <article className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white/75 p-4 text-sm text-[#64748b]">No orders.</article>
                  ) : (
                    group.data.map((order) => (
                      <article key={order.id} className={`rounded-2xl border p-3 shadow-[0_6px_14px_rgba(15,23,42,0.08)] ${group.lane === "new" ? "border-[#f1d4d6] bg-[#f6ecee]" : group.lane === "cooking" ? "border-[#efdfcc] bg-[#f4efe7]" : "border-[#d7e7de] bg-[#eaf4ef]"}`}>
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-2xl font-bold text-[#111827]">{order.orderNumber}</h3>
                            <p className="text-lg text-[#6b7280]">{order.table || "Take Away"}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold text-white ${laneBadgeColor(group.lane)}`}>
                            <Clock3 className="mr-1 h-3.5 w-3.5" /> {formatElapsed(order.createdAt)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {order.Items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-white/80">
                                  <Image src={productImageUrl(item.image)} alt={item.productName} fill sizes="36px" className="object-cover" />
                                </div>
                                <span className="text-lg font-medium text-[#1f2937]">{item.productName}</span>
                              </div>
                              <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white ${laneBadgeColor(group.lane)}`}>
                                {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => moveKitchenOrder(order.id, group.lane)}
                          disabled={updatingOrderId === order.id}
                          className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed ${laneButtonClass(group.lane)}`}
                        >
                          {updatingOrderId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {laneActionLabel(group.lane)}
                        </button>
                      </article>
                    ))
                  )}
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <AdminShell activeTab="orders">
      <main className="min-h-screen  ">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[28px] border border-[#bfd4f2] bg-white/75 p-2 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <Link
                href="/"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe7f4] bg-white text-[#1E365B] transition hover:bg-[#f8fbff]"
                aria-label="Back to roles"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Restaurant Manager</p>
                <h1 className="text-lg font-semibold text-[#0f172a] sm:text-xl">Business Admin Orders</h1>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setView("new-order")}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition ${
                  view === "new-order"
                    ? "bg-[linear-gradient(120deg,#1E365B_0%,#3f51f2_100%)] text-white shadow-[0_10px_20px_rgba(29,78,216,0.22)]"
                    : "border border-[#d7e6f5] bg-white text-[#334155] hover:bg-[#f8fbff]"
                }`}
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                New Order
              </button>

              <button
                type="button"
                onClick={() => setView("active-orders")}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition ${
                  view === "active-orders"
                    ? "bg-[linear-gradient(120deg,#16a34a_0%,#0f9d58_100%)] text-white shadow-[0_10px_20px_rgba(22,163,74,0.22)]"
                    : "border border-[#d7e6f5] bg-white text-[#334155] hover:bg-[#f8fbff]"
                }`}
              >
                <ClipboardCountBadge count={ordersPagination.total} active={view === "active-orders"} />
                Active Orders
              </button>
            </div>
          </div>
        </header>

        {view === "new-order" ? (
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.9fr)]">
            <div className="space-y-5">
              <article className="rounded-[28px] border border-white bg-[linear-gradient(180deg,#eaf2ff_0%,#f4f8ff_100%)] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#3b82f6] text-white shadow-[0_10px_18px_rgba(59,130,246,0.22)]">
                    <Table2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#1f2937]">Select Table</h2>
                    <p className="text-sm text-[#64748b]">Assign the order to a dining area</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#d9e5f4] bg-white px-4 py-3 text-sm shadow-[0_6px_14px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between gap-3">
                    <select
                      value={selectedTableId}
                      onChange={(event) => setSelectedTableId(event.target.value)}
                      className="h-8 w-full appearance-none bg-transparent text-[#334155] outline-none"
                    >
                      <option value="">Choose a table...</option>
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.tableNumber} ({table.status})
                        </option>
                      ))}
                    </select>
                    {tablesLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#94a3b8]" /> : <ChevronDown className="h-4 w-4 text-[#94a3b8]" />}
                  </div>
                  {tablesError ? <p className="mt-2 text-xs text-[#dc2626]">{tablesError}</p> : null}
                </div>
              </article>

              <article className="rounded-[28px] border border-white bg-white/90 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1f2937]">Menu Items</h2>
                    <p className="text-sm text-[#667085]">{activeProducts.length} active items available</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                    <Store className="h-3.5 w-3.5" />
                    Business-admin view
                  </span>
                </div>

                <div className="mt-5 flex h-12 items-center gap-3 rounded-2xl border border-[#edf2f7] bg-[#f8fafc] px-4 text-[#94a3b8]">
                  <Search className="h-5 w-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search menu items..."
                    className="w-full bg-transparent text-sm text-[#64748b] outline-none"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {categoryOptions.map((category) => {
                    const active = selectedCategory === category;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
                          active
                            ? category === "All"
                              ? "border-transparent bg-[linear-gradient(120deg,#ff7a00_0%,#ff5d00_100%)] text-white"
                              : "border-[#1E365B] bg-[#1E365B] text-white"
                            : "border-[#dbe5f0] bg-white text-[#334155] hover:bg-[#f8fbff]"
                        }`}
                      >
                        {category === "Main Course" ? <UtensilsCrossed className="h-4 w-4" /> : null}
                        {category === "Appetizer" ? <CookingPot className="h-4 w-4" /> : null}
                        {category === "Dessert" ? <CircleDollarSign className="h-4 w-4" /> : null}
                        {category}
                      </button>
                    );
                  })}
                </div>

                {productsError ? <p className="mt-4 text-sm text-[#dc2626]">{productsError}</p> : null}

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleProducts.map((item) => {
                    const defaultVariant = getDefaultVariant(item);
                    const selectedVariantId = selectedVariantByProduct[item.id] || defaultVariant?.id || "";
                    const selectedVariant = item.variants.find((variant) => variant.id === selectedVariantId) || defaultVariant;
                    const isLowStock = (selectedVariant?.inStock ?? item.inStock) <= 5;

                    return (
                    <article
                      key={`${item.name}-${item.price}`}
                      className="group relative overflow-hidden rounded-[22px] border border-[#d7e8d8] bg-[#0f172a] shadow-[0_12px_24px_rgba(15,23,42,0.16)]"
                    >
                      <div className="relative h-38">
                        <Image src={productImageUrl(item.image)} alt={item.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.1)_0%,rgba(15,23,42,0.2)_42%,rgba(15,23,42,0.85)_100%)]" />
                        {selectedVariant ? (
                          <span className="absolute left-3 top-3 rounded-full bg-[#16a34a] px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(22,163,74,0.24)]">
                            {selectedVariant.name}
                          </span>
                        ) : null}
                        {selectedVariant ? (
                          <span className="absolute right-3 top-3 rounded-full bg-[#ff6a00] px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(255,106,0,0.24)]">
                            {isLowStock ? `Low: ${selectedVariant.inStock}` : `${selectedVariant.inStock} in stock`}
                          </span>
                        ) : null}

                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold">{item.name}</h3>
                            <p className="text-xs text-white/80">{item.category?.CategoryName || "Uncategorized"}</p>
                          </div>
                          <span className="rounded-xl bg-[#ff6a00] px-3 py-1.5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(255,106,0,0.24)]">
                            {selectedVariant ? selectedVariant.price.toFixed(2) : item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-2 bg-[#0b1220] p-3">
                        <select
                          value={selectedVariantId}
                          onChange={(event) => onSelectVariant(item.id, event.target.value)}
                          className="h-9 rounded-xl border border-[#334155] bg-[#0f172a] px-2 text-sm text-white outline-none"
                        >
                          {item.variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.name} - {variant.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => onAddToOrder(item)}
                          disabled={!item.variants.length}
                          className="inline-flex h-9 items-center justify-center rounded-xl bg-[linear-gradient(120deg,#16a34a_0%,#22c55e_100%)] px-3 text-sm font-semibold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Add to order
                        </button>
                      </div>
                    </article>
                  );})}
                </div>

                {!productsLoading && !visibleProducts.length ? (
                  <p className="mt-4 text-sm text-[#64748b]">No active products found for this filter.</p>
                ) : null}
              </article>
            </div>

            <aside className="rounded-[28px] border border-[#c8ead7] bg-white/95 shadow-[0_16px_34px_rgba(15,23,42,0.1)]">
              <div className="flex items-center justify-between rounded-t-[28px] bg-[linear-gradient(120deg,#0dbf5f_0%,#14b8a6_100%)] px-5 py-4 text-white">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <h2 className="text-base font-semibold">Order Summary</h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#15803d]">{totalItems} items</span>
              </div>

              <div className="space-y-3 p-4">
                {cartItems.map((item) => (
                  <article key={`${item.productId}-${item.variantId}`} className="rounded-[22px] border border-[#bef0ce] bg-white p-3 shadow-[0_10px_20px_rgba(15,23,42,0.05)]">
                    <div className="flex items-start gap-3">
                      <OrderItemThumbnail image={item.image} alt={item.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-[#1f2937]">{item.name}</h3>
                            <p className="text-xs text-[#667085]">{item.category} - {item.variantName}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.productId, item.variantId)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#334155] transition hover:bg-[#f1f5f9]"
                            aria-label={`Remove ${item.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateQuantity(item.productId, item.variantId, -1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#fecaca] text-[#ef4444]"> <Minus className="h-4 w-4" /> </button>
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#eafaf1] px-2 text-sm font-semibold text-[#15803d]">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.productId, item.variantId, 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#bbf7d0] text-[#16a34a]"> <Plus className="h-4 w-4" /> </button>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-[#94a3b8]">
                              <span className="rounded-md bg-[#f6f7fb] px-2 py-1 text-sm font-medium text-[#334155]">{item.unitPrice.toFixed(2)}</span>
                              <span>each</span>
                            </div>
                            <p className="mt-1 text-right text-xs text-[#64748b]">Total</p>
                            <strong className="text-base font-semibold text-[#16a34a]">{(item.unitPrice * item.quantity).toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}

                {!cartItems.length ? <p className="text-sm text-[#64748b]">No items in order yet.</p> : null}
              </div>

              <div className="border-t border-[#d6efe0] bg-[linear-gradient(180deg,#fbfffc_0%,#f7fffb_100%)] p-4">
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-xs text-[#64748b]">
                    Delivery Charges
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryCharges}
                      onChange={(event) => setDeliveryCharges(event.target.value)}
                      className="h-9 rounded-lg border border-[#d6e5d8] px-2 text-sm text-[#1f2937] outline-none"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-[#64748b]">
                    Packaging Price
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={packagingPrice}
                      onChange={(event) => setPackagingPrice(event.target.value)}
                      className="h-9 rounded-lg border border-[#d6e5d8] px-2 text-sm text-[#1f2937] outline-none"
                    />
                  </label>
                </div>

                <div className="rounded-3xl border border-[#fcd9bd] bg-[linear-gradient(180deg,#fff8f1_0%,#fffdf8_100%)] p-4 shadow-[0_10px_20px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center justify-between text-sm text-[#667085]">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm text-[#667085]">
                    <span>Total Amount</span>
                    <span>Items</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <strong className="text-3xl font-semibold tracking-tight text-[#ff6a00]">{totalAmount.toFixed(2)}</strong>
                    <strong className="text-2xl font-semibold text-[#1f2937]">{totalItems}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCreateOrder}
                  disabled={createOrderLoading}
                  className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(120deg,#0dbf5f_0%,#0ea65b_100%)] text-lg font-semibold text-white shadow-[0_14px_28px_rgba(13,191,95,0.28)] transition hover:-translate-y-px"
                >
                  {createOrderLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  {createOrderLoading ? "Creating..." : "Place Order Now"}
                </button>
              </div>
            </aside>
          </section>
        ) : (
          <section className="space-y-4">
            {ordersLoading ? (
              <article className="rounded-[28px] border border-white bg-white/95 p-6 text-sm text-[#64748b] shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                <div className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading active orders...
                </div>
              </article>
            ) : null}

            {!ordersLoading && ordersError ? (
              <article className="rounded-[28px] border border-white bg-white/95 p-6 text-sm text-[#dc2626] shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                {ordersError}
              </article>
            ) : null}

            {!ordersLoading && !ordersError && !activeOrders.filter((o) => o.status.toLowerCase() !== "completed").length ? (
              <article className="rounded-[28px] border border-white bg-white/95 p-6 text-sm text-[#64748b] shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                No active orders found for today.
              </article>
            ) : null}

            {!ordersLoading && !ordersError
              ? activeOrders.filter((order) => order.status.toLowerCase() !== "completed").map((order) => (
              <article
                key={order.id}
                className="rounded-[28px] border border-white bg-white/95 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
              >
                <div className={`h-full rounded-[22px] border-l-4 ${getStatusTone(order.status)} bg-white px-4 py-3`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                        <CookingPot className="h-4.5 w-4.5 text-[#ff6a00]" />
                        <span>{order.orderNumber}</span>
                        <ChevronDown className="h-4 w-4 text-[#94a3b8]" />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748b]">
                        <span className="inline-flex items-center gap-1.5">
                          <Store className="h-4 w-4" />
                          {order.table || "Take Away"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4" />
                          {formatElapsed(order.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        {order.Items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm text-[#1f2937]">
                            <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[#e5edf5]">
                              <Image
                                src={productImageUrl(item.image)}
                                alt={item.productName}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                            <span className="font-medium">
                              {item.quantity}x {item.productName}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-[#94a3b8]">Total Amount</p>
                        <strong className="text-3xl font-semibold text-[#16a34a]">{Number(order.totalPrice).toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-4 lg:items-end">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white ${getStatusTone(order.status)}`}>
                        {order.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleActiveOrderAction(order.id)}
                        disabled={updatingOrderId === order.id}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(120deg,#16a34a_0%,#22c55e_100%)] px-4 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(22,163,74,0.2)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#cbd5e1] disabled:hover:translate-y-0"
                      >
                        {updatingOrderId === order.id ? (
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        )}
                        Completed
                      </button>
                    </div>
                  </div>
                </div>
              </article>
              ))
              : null}
          </section>
        )}

        {/* <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e6f5] bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:bg-[#f8fbff]"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            Logout
          </button>
        </div> */}
      </div>
    </main>
    </AdminShell>
  );
}

function ClipboardCountBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-white text-[#16a34a]" : "bg-[#ef4444] text-white"}`}>
      {count}
    </span>
  );
}
