"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  Store as StoreIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useOrders, type OrderRecord } from "@/hooks/useOrders";
import { useProducts, type Product, type ProductVariant } from "@/hooks/useProducts";
import { useTables } from "@/hooks/useTables";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
<<<<<<< Updated upstream
=======
import { BASE_URL } from "@/lib/constant";
import { cn } from "@/lib/utils";
>>>>>>> Stashed changes

type PageView = "list" | "create";

interface HeldOrder {
  id: string;
  items: any[];
  delivery: number;
  packaging: number;
  override: number;
  timestamp: number;
}

function productImageUrl(imagePath?: string | null) {
<<<<<<< Updated upstream
  if (!imagePath) {
    return "/business/pic1.jpeg";
  }

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  return `${BASE_URL}/${imagePath}`;
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
=======
  if (!imagePath) return "/business/pic1.jpeg";
  return imagePath.startsWith("http") ? imagePath : `${BASE_URL}/${imagePath}`;
>>>>>>> Stashed changes
}

function formatElapsed(isoDate: string) {
  const createdAt = new Date(isoDate).getTime();
  if (!Number.isFinite(createdAt)) return "--";
  const totalMinutes = Math.floor((Date.now() - createdAt) / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m ago`;
  return `${Math.floor(totalMinutes / 60)}h ago`;
}

function OrdersContent() {
  const router = useRouter();
  const { role, token } = useAuth();
  const activeBusinessId = useActiveBusinessId();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  
  const [view, setView] = useState<PageView>("list");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
<<<<<<< Updated upstream
  const [deliveryCharges, setDeliveryCharges] = useState("0");
  const [packagingPrice, setPackagingPrice] = useState("0");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>({});
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isKitchenRole, setIsKitchenRole] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isOrderTypeDialogOpen, setIsOrderTypeDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<"take-away" | "dine-in" | null>(null);
  const [lastOutOfStockToastProductId, setLastOutOfStockToastProductId] = useState<string | null>(null);
=======
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Create Order State
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [packagingCharges, setPackagingCharges] = useState(0);
  const [overridePrice, setOverridePrice] = useState(0);
  
  // Held Orders State
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
>>>>>>> Stashed changes

  const { products, loading: productsLoading } = useProducts({ page: 1, limit: 100 });
  const { orders, loading: ordersLoading, fetchOrders, updateOrderStatus, createOrder, actionLoading } = useOrders({ range: "day" });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    if (!(role || storedRole)) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
    }
  }, [role, router]);

<<<<<<< Updated upstream
    const isStaffRole = currentRole === "business_admin" || currentRole === "kitchen" || currentRole === "waiter";
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;

    if (!isStaffRole && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }

    setIsKitchenRole(currentRole === "kitchen");
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

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

    const toastId = toast.loading("Updating order status...");
    try {
      await updateOrderStatus(orderId, nextStatus);
      toast.success(successMessage, { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update order status.";
      toast.error(message, { id: toastId });
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handleActiveOrderAction(orderId: string) {
    const toastId = toast.loading("Completing order...");
    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus(orderId, "completed");

      const authToken = token || (typeof window !== "undefined" ? (localStorage.getItem("auth_token") || localStorage.getItem("token")) : null);
      if (!authToken) {
        throw new Error("No authentication token available");
      }

      const url = new URL(`${BASE_URL}/invoice`);
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const invoiceResponse = await fetch(url.toString(), {
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

      toast.success("Order marked as completed and invoice created.", { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete order.";
      toast.error(message, { id: toastId });
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
=======
  const activeProducts = useMemo(() => products.filter(p => p.status === "ACTIVE"), [products]);
  const categories = useMemo(() => {
    const cats = new Set<string>();
    activeProducts.forEach(p => p.category?.CategoryName && cats.add(p.category.CategoryName));
    return ["All", ...Array.from(cats)];
>>>>>>> Stashed changes
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchCat = selectedCategory === "All" || p.category?.CategoryName === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeProducts, selectedCategory, searchTerm]);

  const cartProductIds = useMemo(() => Array.from(new Set(cartItems.map(i => i.productId))), [cartItems]);
  const productsInCart = useMemo(() => activeProducts.filter(p => cartProductIds.includes(p.id)), [activeProducts, cartProductIds]);

  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);
  const grandTotal = subtotal + deliveryCharges + packagingCharges + overridePrice;

  const handleHoldOrder = () => {
    if (cartItems.length === 0) return;
    const newHeld: HeldOrder = {
      id: `Held Order #${heldOrders.length + 1}`,
      items: [...cartItems],
      delivery: deliveryCharges,
      packaging: packagingCharges,
      override: overridePrice,
      timestamp: Date.now(),
    };
    setHeldOrders(prev => [...prev, newHeld]);
    setCartItems([]);
    setDeliveryCharges(0);
    setPackagingCharges(0);
    setOverridePrice(0);
    toast.success("Order moved to queue");
  };

  const handleResumeOrder = (held: HeldOrder) => {
    setCartItems(held.items);
    setDeliveryCharges(held.delivery);
    setPackagingCharges(held.packaging);
    setOverridePrice(held.override);
    setHeldOrders(prev => prev.filter(o => o.id !== held.id));
    setIsQueueOpen(false);
  };

  const handleUpdateQty = (prodId: string, varId: string, delta: number) => {
    setCartItems(prev => {
      const items = prev.map(item => {
        if (item.productId === prodId && item.variantId === varId) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
      return items;
    });
  };

  const handleAddToCart = (product: Product, variant: ProductVariant) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id && item.variantId === variant.id);
      if (existing) {
        return prev.map(item => item.productId === product.id && item.variantId === variant.id 
          ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variantName: variant.name,
        price: variant.price,
        quantity: 1,
        image: productImageUrl(product.image)
      }];
    });
  };

<<<<<<< Updated upstream
  async function onCreateOrder() {
    if (!cartItems.length) {
      toast.error("Add at least one product to create an order.");
      return;
    }

    setIsOrderTypeDialogOpen(true);
    setOrderType(null); // Reset for new selection
  }

  async function finalizeOrder() {
    if (orderType === "dine-in" && !selectedTableId) {
      toast.error("Please select a table for Dine In.");
      return;
    }

    const toastId = toast.loading("Creating order...");
    try {
      await createOrder({
        tableId: orderType === "dine-in" ? selectedTableId : undefined,
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        totalPrice: Number(totalAmount.toFixed(2)),
        deliveryCharges: asNumber(deliveryCharges),
        packagingPrice: asNumber(packagingPrice),
=======
  const finalizeCreateOrder = async () => {
    if (cartItems.length === 0) return toast.error("Add items first");
    const toastId = toast.loading("Placing order...");
    try {
      await createOrder({
        items: cartItems.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity, price: i.price })),
        totalPrice: grandTotal,
        deliveryCharges,
        packagingPrice: packagingCharges,
>>>>>>> Stashed changes
      });
      toast.success("Order placed successfully", { id: toastId });
      setCartItems([]);
<<<<<<< Updated upstream
      setDeliveryCharges("0");
      setPackagingPrice("0");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create order.";
      toast.error(message, { id: toastId });
=======
      setView("list");
      refetch();
    } catch (err) {
      toast.error("Failed to place order", { id: toastId });
>>>>>>> Stashed changes
    }
  };

  const refetch = () => fetchOrders(1);

  if (view === "create") {
    return (
      <AdminShell activeTab="orders">
        <main className="h-[calc(100vh-80px)] overflow-hidden bg-white flex flex-col">
          {/* Green Header */}
          <header className="bg-[#0f9d58] h-16 flex-shrink-0 flex items-center justify-center relative shadow-md z-10">
            <button onClick={() => setView("list")} className="absolute left-6 text-white flex items-center gap-2 font-black px-4 py-2 rounded-2xl border border-white/30 hover:bg-white/10 transition">
              <ArrowLeft className="h-4 w-4" /> Active Orders
            </button>
            <h1 className="text-white font-black text-xl tracking-tight">Active Orders</h1>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Products */}
            <div className="w-[60%] flex flex-col bg-[#f8fafc] border-r border-gray-100">
              <div className="p-6 pb-0 flex-shrink-0">
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition whitespace-nowrap shadow-sm border-2",
                        selectedCategory === cat ? "bg-[#ef4444] border-[#ef4444] text-white" : "bg-white border-transparent text-gray-400 hover:border-gray-200"
                      )}
                    >
                      {cat === "All" ? <Package className="h-5 w-5" /> : <CookingPot className="h-5 w-5" />}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
                <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => {
                        // When product is clicked, ensure it's "selectable" even if not added yet
                        // or just rely on the summary showing all cart products
                        const existing = cartItems.find(i => i.productId === product.id);
                        if (!existing && product.variants?.length > 0) {
                          handleAddToCart(product, product.variants[0]);
                        }
                      }}
                      className={cn(
                        "bg-white rounded-[40px] overflow-hidden border-2 transition text-left group shadow-sm flex flex-col",
                        cartProductIds.includes(product.id) ? "border-[#0f9d58]" : "border-transparent hover:border-gray-100"
                      )}
                    >
                      <div className="relative aspect-[4/3] w-full">
                        <Image src={productImageUrl(product.image)} alt={product.name} fill className="object-cover" />
                      </div>
                      <div className="p-5">
                        <h3 className="font-black text-lg text-[#111827] mb-3 truncate">{product.name}</h3>
                        <div className="space-y-1.5">
                          {product.variants?.map(v => (
                            <div key={v.id} className="flex justify-between text-[10px] font-black">
                              <span className="text-gray-400 uppercase tracking-wider">{v.name}</span>
                              <span className="text-[#0f9d58]">Rs. {v.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Summary */}
            <div className="w-[40%] flex flex-col bg-[#f0fdf4] p-6 relative">
              <div className="bg-[#0f9d58] rounded-t-[32px] p-5 flex-shrink-0 flex items-center justify-between text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="font-black text-lg">Order Summary</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-white text-[#0f9d58] px-3 py-0.5 rounded-full text-xs font-black">{cartItems.length} items</span>
                  <button 
                    onClick={handleHoldOrder}
                    disabled={cartItems.length === 0}
                    className="bg-white/20 p-1.5 rounded-xl hover:bg-white/30 transition disabled:opacity-50"
                  >
                    <Pause className="h-4 w-4" />
                  </button>
                  {heldOrders.length > 0 && (
                    <button 
                      onClick={() => setIsQueueOpen(true)}
                      className="bg-orange-400 text-white p-1.5 rounded-xl hover:bg-orange-500 transition shadow-sm relative"
                    >
                      <History className="h-4 w-4" />
                      <span className="absolute -top-1 -right-1 bg-white text-orange-500 text-[8px] font-black w-3 h-3 flex items-center justify-center rounded-full shadow-sm">{heldOrders.length}</span>
                    </button>
                  )}
                  <button onClick={() => setCartItems([])} className="bg-white/20 p-1.5 rounded-xl hover:bg-white/30 transition"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="flex-1 bg-white p-6 overflow-y-auto custom-scrollbar shadow-sm relative">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-200">
                    <ShoppingCart className="h-24 w-24 mb-6 opacity-20" />
                    <p className="font-black text-xl text-gray-300">Your Order is Empty</p>
                    <p className="text-sm font-bold text-gray-300">Add items from the menu</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {productsInCart.map(product => (
                      <div key={product.id} className="bg-[#f0fdf4] rounded-[32px] p-5 border border-[#0f9d58]/20 animate-in fade-in zoom-in duration-300">
                        <div className="flex gap-4 mb-5">
                          <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                            <Image 
                              src={productImageUrl(product.image)} 
                              alt="selected" fill className="object-cover" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-base truncate">{product.name}</h4>
                              <button onClick={() => {
                                setCartItems(prev => prev.filter(i => i.productId !== product.id));
                              }} className="text-gray-300 hover:text-gray-500 p-1">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Configure variants</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {product.variants.map(v => {
                            const currentQty = cartItems.find(i => i.productId === product.id && i.variantId === v.id)?.quantity || 0;
                            return (
                              <div key={v.id} className="flex items-center justify-between">
                                <span className="text-xs font-black text-gray-700">{v.name} <span className="text-[#ef4444]">(Rs {v.price})</span></span>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => handleUpdateQty(product.id, v.id, -1)} className="h-9 w-9 rounded-xl border-2 border-[#ef4444] text-[#ef4444] flex items-center justify-center transition active:scale-90 shadow-sm"><Minus className="h-4 w-4" /></button>
                                  <span className="font-black text-lg min-w-[20px] text-center">{currentQty}</span>
                                  <button onClick={() => handleAddToCart(product, v)} className="h-9 w-9 rounded-xl bg-[#dcfce7] border-2 border-[#16a34a] text-[#16a34a] flex items-center justify-center transition active:scale-90 shadow-sm"><Plus className="h-4 w-4" /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-5 pt-5 border-t border-dashed border-[#0f9d58]/20 flex items-center justify-between">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Override</label>
                           <div className="flex items-center gap-2">
                             <span className="text-gray-400 font-bold text-xs uppercase">Rs</span>
                             <input type="number" defaultValue={0} className="w-16 bg-white rounded-lg p-1.5 text-xs font-black outline-none text-right border" />
                           </div>
                        </div>
                        <div className="text-right mt-2">
                           <span className="text-[#0f9d58] font-black text-lg">Rs {cartItems.filter(i => i.productId === product.id).reduce((a,b) => a + (b.price * b.quantity), 0)}</span>
                        </div>
                      </div>
                    ))}

                    <div className="space-y-4">
                       <details className="group">
                         <summary className="flex items-center justify-between cursor-pointer py-2 border-b border-gray-100">
                           <div className="flex items-center gap-3 font-black text-gray-400 uppercase tracking-widest text-[10px]">
                             <Plus className="h-4 w-4 bg-gray-50 text-gray-400 p-1 rounded-full" /> Extra Charges (optional)
                           </div>
                           <ChevronDown className="h-4 w-4 text-gray-300 transition group-open:rotate-180" />
                         </summary>
                         <div className="pt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                           <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                             <div className="flex items-center gap-3">
                               <div className="bg-white p-2 rounded-lg shadow-sm"><Store className="h-4 w-4 text-orange-400" /></div>
                               <span className="text-xs font-black text-gray-700">Delivery Charge</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Rs</span>
                               <input type="number" value={deliveryCharges} onChange={(e) => setDeliveryCharges(Number(e.target.value))} className="w-16 bg-transparent text-right font-black text-sm outline-none" />
                             </div>
                           </div>
                           <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                             <div className="flex items-center gap-3">
                               <div className="bg-white p-2 rounded-lg shadow-sm"><Package className="h-4 w-4 text-gray-400" /></div>
                               <span className="text-xs font-black text-gray-700">Packing / Box Charge</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Rs</span>
                               <input type="number" value={packagingCharges} onChange={(e) => setPackagingCharges(Number(e.target.value))} className="w-16 bg-transparent text-right font-black text-sm outline-none" />
                             </div>
                           </div>
                         </div>
                       </details>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Footer */}
              <div className="bg-white p-6 pt-0 rounded-b-[32px] flex-shrink-0">
                 <div className="bg-[#fff9f0] rounded-3xl p-6 border border-orange-100 shadow-inner">
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 border-b border-orange-100/50 pb-2">
                      <span className="uppercase tracking-widest">Subtotal ({cartItems.length} items)</span>
                      <span className="text-[#111827]">Rs {subtotal}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-black text-[#ef4444] uppercase tracking-tighter">Grand Total</span>
                      <span className="text-4xl font-black text-[#ef4444] tracking-tight">Rs {grandTotal}</span>
                    </div>
                  </div>

                  <button 
                    onClick={finalizeCreateOrder}
                    disabled={cartItems.length === 0 || actionLoading}
                    className={cn(
                      "w-full py-5 mt-4 rounded-[32px] font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition active:scale-95",
                      cartItems.length > 0 ? "bg-[#0f9d58] text-white hover:bg-[#0b8a4a]" : "bg-[#e5e7eb] text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-6 w-6" />}
                    {cartItems.length > 0 ? "Confirm & Place Order" : "Select items to order"}
                  </button>
              </div>
            </div>
          </div>

          {/* Held Orders Dialog */}
          <Dialog open={isQueueOpen} onOpenChange={setIsQueueOpen}>
            <DialogContent className="max-w-md p-0 rounded-[40px] border-none overflow-hidden bg-[#f8fafc] shadow-2xl">
              <DialogHeader className="bg-[#0f9d58] p-8 text-white relative">
                <div className="flex items-center gap-4">
                  <History className="h-8 w-8" />
                  <DialogTitle className="text-3xl font-black">Held Orders Queue</DialogTitle>
                </div>
                <button onClick={() => setIsQueueOpen(false)} className="absolute top-8 right-8 bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
                  <X className="h-5 w-5" />
                </button>
              </DialogHeader>
              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {heldOrders.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 font-bold">No orders in queue</div>
                ) : (
                  heldOrders.map((held) => (
                    <div key={held.id} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex items-center justify-between group hover:border-[#0f9d58]/20 transition">
                      <div>
                        <h4 className="font-black text-xl text-[#111827]">{held.id}</h4>
                        <div className="flex items-center gap-4 mt-2 text-gray-400 font-bold text-sm">
                           <span className="flex items-center gap-1"><ShoppingCart className="h-4 w-4 text-[#ef4444]" /> {held.items.length} Items</span>
                           <span className="flex items-center gap-1"><Table2 className="h-4 w-4 text-orange-400" /> Table: None</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setHeldOrders(prev => prev.filter(o => o.id !== held.id))}
                          className="bg-red-50 text-red-500 p-3 rounded-2xl hover:bg-red-100 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleResumeOrder(held)}
                          className="bg-[#0f9d58] text-white px-8 py-3 rounded-2xl font-black text-lg shadow-lg hover:bg-[#0b8a4a] transition"
                        >
                          Resume
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <div className="fixed bottom-6 right-6 z-50">
            <button onClick={() => refetch()} className="bg-[#ef4444] text-white p-4 rounded-[20px] shadow-2xl transition hover:scale-110 active:scale-90">
              <RotateCcw className={cn("h-6 w-6", ordersLoading && "animate-spin")} />
            </button>
          </div>
        </main>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeTab="orders">
      <main className="mx-auto max-w-7xl p-8 space-y-8 bg-[#f8fafc] min-h-[calc(100vh-80px)]">
        <button 
          onClick={() => setView("create")}
          className="w-full bg-[#0f9d58] text-white py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-xl transition hover:bg-[#0b8a4a] hover:-translate-y-1 active:translate-y-0"
        >
          <Plus className="h-7 w-7" /> Create New Order
        </button>

<<<<<<< Updated upstream
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setView("new-order")}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition ${view === "new-order"
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
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition ${view === "active-orders"
                    ? "bg-[linear-gradient(120deg,#16a34a_0%,#0f9d58_100%)] text-white shadow-[0_10px_20px_rgba(22,163,74,0.22)]"
                    : "border border-[#d7e6f5] bg-white text-[#334155] hover:bg-[#f8fbff]"
                    }`}
                >
                  <ClipboardCountBadge count={pagination.total} active={view === "active-orders"} />
                  Active Orders
                </button>
              </div>
            </div>
          </header>

          {view === "new-order" ? (
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.9fr)]">
              <div className="space-y-5">


                <article className="rounded-[28px] border border-white bg-white/90 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1f2937]">Menu Items</h2>
                      <p className="text-sm text-[#667085]">{activeProducts.length} active items available</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                      <StoreIcon className="h-3.5 w-3.5" />
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
                          className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${active
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
                    {visibleProducts.map((item, index) => {
                      const defaultVariant = getDefaultVariant(item);
                      const selectedVariantId = selectedVariantByProduct[item.id] || defaultVariant?.id || "";
                      const selectedVariant = item.variants.find((variant) => variant.id === selectedVariantId) || defaultVariant;
                      const isOutOfStock = item.inStock <= 0;
                      const isLowStock = !isOutOfStock && item.inStock <= 5;

                      return (
                        <article
                          key={`${item.id}-${index}`}
                          onMouseEnter={() => handleOutOfStockHover(item)}
                          onMouseLeave={() => {
                            if (item.inStock <= 0) {
                              setLastOutOfStockToastProductId(null);
                            }
                          }}
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
                            {isOutOfStock ? (
                              <span className="absolute right-3 top-3 rounded-full bg-[#ef4444] px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(239,68,68,0.24)]">
                                Out of stock
                              </span>
                            ) : selectedVariant ? (
                              <span className="absolute right-3 top-3 rounded-full bg-[#ff6a00] px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(255,106,0,0.24)]">
                                {isLowStock ? `Low: ${item.inStock}` : `${item.inStock} in stock`}
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
                              disabled={isOutOfStock}
                              className="h-9 rounded-xl border border-[#334155] bg-[#0f172a] px-2 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                              disabled={isOutOfStock}
                              className="inline-flex h-9 items-center justify-center rounded-xl bg-[linear-gradient(120deg,#16a34a_0%,#22c55e_100%)] px-3 text-sm font-semibold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isOutOfStock ? "Out of stock" : "Add to order"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
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
=======
        {ordersLoading && !orders.length ? (
          <div className="flex justify-center py-32"><Loader2 className="h-12 w-12 animate-spin text-[#0f9d58]" /></div>
        ) : (
          <div className="space-y-8 pb-20">
            {orders.filter(o => o.status !== "COMPLETED").map(order => (
              <div key={order.id} className="relative rounded-[48px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none transition-all duration-500">
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#f97316]" />
                
                <div className="bg-[#bbf7d0] p-8 pl-12">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-[#ef4444] font-black text-2xl tracking-tighter">{order.orderNumber}</h2>
                      <span className="bg-[#dcfce7] text-[#166534] px-4 py-1.5 rounded-2xl text-sm font-black border border-[#166534]/10 shadow-sm">Rs. {order.totalPrice}</span>
                      <h3 className="text-[#ef4444] font-black text-6xl ml-6 drop-shadow-sm">{order.table || "Take Away"}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="bg-white/80 backdrop-blur p-3 rounded-2xl text-[#ef4444] border-2 border-white shadow-md hover:bg-white transition"><Eye className="h-6 w-6" /></button>
                      {expandedOrderId === order.id && (
                        <>
                          <button 
                            onClick={() => setExpandedOrderId(null)}
                            className="flex items-center gap-2 text-gray-500 font-black text-sm px-4 py-2 hover:bg-black/5 rounded-xl transition"
                          >
                            <ChevronUp className="h-5 w-5" /> Order Details
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                            className="bg-[#0f9d58] text-white px-8 py-3 rounded-2xl font-black text-lg flex items-center gap-2 shadow-xl hover:bg-[#0b8a4a] transition"
                          >
                            <CheckCircle2 className="h-6 w-6" /> Complete
                          </button>
                        </>
                      )}
>>>>>>> Stashed changes
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-gray-500 text-sm font-bold mb-8">
                    <span className="flex items-center gap-2"><Store className="h-5 w-5 text-gray-400" /> {order.table || "test"}</span>
                    <span className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-gray-400" /> {formatElapsed(order.createdAt)}</span>
                  </div>

                  {!expandedOrderId && (
                    <div className="flex flex-wrap gap-4 mb-8">
                      {order.Items.slice(0, 3).map(item => (
                        <div key={item.id} className="bg-white rounded-[32px] border-2 border-[#ef4444] p-4 flex items-center gap-4 pr-8 relative shadow-sm transition hover:scale-105">
                          <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                            <Image src={productImageUrl(item.image)} alt={item.productName} fill className="object-cover" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-[#111827]">{item.productName}</h4>
                            <p className="text-[#0f9d58] font-black text-sm">Rs. {item.total}</p>
                          </div>
                          <span className="absolute -top-2 -right-2 bg-[#ef4444] text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">x{item.quantity}</span>
                        </div>
                      ))}
                      {order.Items.length > 3 && (
                        <div className="bg-white/40 backdrop-blur rounded-full px-6 py-3 flex items-center text-sm font-black text-gray-500 border border-white/60">+{order.Items.length - 3} more</div>
                      )}
                    </div>
                  )}

                  <div className="flex items-end justify-between border-t border-black/5 pt-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Amount Payable</p>
                      <div className="flex gap-3 mb-3">
                        <span className="bg-[#fee2e2] text-[#ef4444] px-3 py-1 rounded-xl text-[10px] font-black border border-[#ef4444]/10">Delivery: Rs {order.deliveryCharges || 0}</span>
                        <span className="bg-[#fff7ed] text-[#f97316] px-3 py-1 rounded-xl text-[10px] font-black border border-[#f97316]/10">Pkg: Rs {order.packagingPrice || 0}</span>
                      </div>
<<<<<<< Updated upstream
                    </div>
                  </article>
                ))
                : null}
              {!ordersLoading && pagination.last_page > 1 ? (
                <section className="flex items-center justify-between rounded-2xl border border-[#e3e7f0] bg-white p-4">
                  <div className="text-sm text-[#667085]">
                    Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} total orders)
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fetchOrders(pagination.page - 1)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f0] bg-white px-3 py-2 text-sm font-medium text-[#222] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => fetchOrders(pagination.page + 1)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f0] bg-white px-3 py-2 text-sm font-medium text-[#222] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={pagination.page === pagination.last_page}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              ) : null}
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
=======
                      <p className="text-[#0f9d58] font-black text-5xl tracking-tighter">Rs {order.totalPrice}</p>
                    </div>

                    {!expandedOrderId && (
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setExpandedOrderId(order.id)}
                          className="flex items-center gap-3 text-[#ef4444] font-black text-xl px-6 py-3 transition hover:bg-black/5 rounded-2xl border-2 border-transparent hover:border-[#ef4444]/10"
                        >
                          <ChevronDown className="h-6 w-6" /> Edit Order
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                          className="bg-[#0f9d58] text-white px-10 py-4 rounded-[24px] font-black text-xl flex items-center gap-3 shadow-2xl hover:bg-[#0b8a4a] transition hover:-translate-y-1"
                        >
                          <CheckCircle2 className="h-7 w-7" /> Complete
                        </button>
                      </div>
                    )}
                  </div>

                  {expandedOrderId === order.id && (
                    <div className="mt-10 pt-10 border-t-4 border-white/50 animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-3 text-gray-700 font-black text-xl">
                           <X className="h-6 w-6 rotate-45 text-[#ef4444]" /> Edit Order
                         </div>
                         <button className="bg-[#ef4444] text-white px-12 py-4 rounded-[28px] font-black text-lg shadow-2xl flex items-center gap-3 hover:bg-[#dc2626] transition hover:-translate-y-1">
                           <Save className="h-5 w-5" /> Save Changes
                         </button>
                      </div>

                      <div className="flex gap-10">
                        <div className="w-[45%] bg-white/50 rounded-[48px] p-8 border-4 border-white shadow-inner">
                          <h4 className="flex items-center gap-3 font-black text-gray-500 mb-8 uppercase tracking-widest text-sm">
                            <UtensilsCrossed className="h-6 w-6 text-[#ef4444]" /> Current Items
                          </h4>
                          <div className="space-y-6">
                            {order.Items.map(item => (
                              <div key={item.id} className="bg-white rounded-[32px] p-5 flex items-center gap-5 border border-black/5 shadow-md transition hover:translate-x-1">
                                <div className="relative h-20 w-20 rounded-[20px] overflow-hidden border-4 border-white shadow-xl">
                                  <Image src={productImageUrl(item.image)} alt={item.productName} fill className="object-cover" />
                                  <span className="absolute top-0 right-0 bg-[#ef4444] text-white text-xs font-black w-7 h-7 flex items-center justify-center rounded-bl-[20px]">{item.quantity}</span>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-black text-[#111827] text-lg">{item.productName}</h5>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="text-gray-400 font-bold text-sm">Rs <span className="bg-gray-50 px-3 py-1 rounded-xl text-[#111827]">{item.price}</span></span>
                                    <span className="text-[#0f9d58] font-black text-sm ml-3">Total: Rs {item.total}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 rounded-[20px] p-2">
                                  <button className="h-9 w-9 rounded-xl border-2 bg-white flex items-center justify-center text-gray-400 shadow-sm active:scale-90 transition"><Minus className="h-4 w-4" /></button>
                                  <span className="font-black text-xl w-6 text-center">{item.quantity}</span>
                                  <button className="h-9 w-9 rounded-xl border-2 bg-white flex items-center justify-center text-gray-400 shadow-sm active:scale-90 transition"><Plus className="h-4 w-4" /></button>
                                </div>
                                <button className="text-[#ef4444] text-xs font-black px-4 hover:underline transition">× Remove</button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1">
                           <h4 className="flex items-center gap-3 font-black text-gray-500 mb-8 uppercase tracking-widest text-sm">
                             <Plus className="h-6 w-6 text-[#0f9d58]" /> Add More Items
                           </h4>
                           
                           <div className="flex gap-4 mb-8">
                              <button className="bg-[#ef4444] text-white px-10 py-4 rounded-[28px] font-black flex items-center gap-3 text-sm shadow-xl hover:-translate-y-1 transition"><Package className="h-5 w-5" /> desi</button>
                              <button className="bg-white text-gray-500 px-10 py-4 rounded-[28px] font-black flex items-center gap-3 text-sm border-2 border-transparent shadow-md transition hover:bg-gray-50 hover:border-gray-100"><ShoppingCart className="h-5 w-5" /> All</button>
                           </div>

                           <div className="grid grid-cols-2 gap-6">
                              {activeProducts.slice(0, 2).map(p => (
                                <button key={p.id} className="bg-white rounded-[40px] overflow-hidden border-2 border-transparent hover:border-[#0f9d58] transition-all duration-300 text-left group shadow-lg hover:shadow-2xl hover:-translate-y-1">
                                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                                    <Image src={productImageUrl(p.image)} alt={p.name} fill className="object-cover transition duration-700 group-hover:scale-110" />
                                  </div>
                                  <div className="p-6">
                                    <h6 className="font-black text-sm mb-4 truncate">{p.name}</h6>
                                    {p.variants.map(v => (
                                      <div key={v.id} className="flex justify-between text-[11px] font-black mb-1.5">
                                        <span className="text-gray-400">{v.name}</span>
                                        <span className="text-[#0f9d58]">Rs. {v.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </button>
                              ))}
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="fixed bottom-12 right-12">
          <button onClick={() => refetch()} className="bg-[#ef4444] text-white p-6 rounded-[32px] shadow-[0_20px_50px_rgba(239,68,68,0.5)] transition hover:scale-110 active:scale-90">
            <RotateCcw className={cn("h-8 w-8", ordersLoading && "animate-spin")} />
          </button>
>>>>>>> Stashed changes
        </div>
      </main>
    </AdminShell>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#0f9d58]" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
