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
  ChevronUp,
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
  RotateCcw,
  Eye,
  Package,
  Printer,
  Pause,
  Trash,
  Trash2,
  History,
  Save,
  Pencil,
  Armchair,
  ShoppingBag,
  ClipboardList,
  RotateCw,
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
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import InvoiceReceipt, { InvoicePrintButton } from "@/components/common/InvoiceReceipt";
import { useAuth } from "@/hooks/useAuth";
import { useCategories, type CategoryRecord } from "@/hooks/useCategories";
import { useOrders, type OrderRecord } from "@/hooks/useOrders";
import { useProducts, type Product, type ProductVariant } from "@/hooks/useProducts";
import { useTables } from "@/hooks/useTables";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";
import { cn, buildOrderPatchItem, buildOrderRemoveItem, isUuid } from "@/lib/utils";
import { SelfOrderRequestsPanel } from "@/components/orders/SelfOrderRequestsPanel";

const CustomTrashIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="9.5" y="4" width="5" height="3" rx="1" />
    <rect x="6" y="7" width="12" height="2.5" rx="1" />
    <path d="M7 10.5h10v8.5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8.5z" />
  </svg>
);

type PageView = "list" | "create";

interface HeldOrder {
  id: string;
  items: any[];
  delivery: string;
  packaging: string;
  override: number;
  productOverrides: Record<string, string>;
  timestamp: number;
}

interface EditableOrderItem {
  orderItemId?: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  image?: string | null;
  action?: "add" | "update";
}

interface OrderDetailsState {
  orderId: string;
  orderNumber: string;
  table: string | null;
  status: string;
  totalPrice: string;
  deliveryCharges: string;
  packagingPrice: string;
  Items: OrderRecord["Items"];
}

function productImageUrl(imagePath?: string | null) {
  if (!imagePath) return "/business/pic1.jpeg";
  return imagePath.startsWith("http") ? imagePath : `${BASE_URL}/${imagePath}`;
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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showVariantDialog, setShowVariantDialog] = useState(false);

  // Create Order State
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [deliveryCharges, setDeliveryCharges] = useState<string>("");
  const [packagingCharges, setPackagingCharges] = useState<string>("");
  const [overridePrice, setOverridePrice] = useState(0);
  const [productOverrides, setProductOverrides] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetailsState | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("");
  const [editingItems, setEditingItems] = useState<EditableOrderItem[]>([]);
  const [removedEditingItems, setRemovedEditingItems] = useState<string[]>([]);
  const [editingDeliveryCharges, setEditingDeliveryCharges] = useState(0);
  const [editingPackagingCharges, setEditingPackagingCharges] = useState(0);
  const [editingOverridePrice, setEditingOverridePrice] = useState(0);

  // Held Orders State
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [removedOrderIds, setRemovedOrderIds] = useState<Record<string, boolean>>({});

  const { products, loading: productsLoading, refetch: refetchProducts } = useProducts({ page: 1, limit: 100 });
  const { categories: allCategories } = useCategories({ page: 1, limit: 100 });
  const { orders, loading: ordersLoading, fetchOrders, updateOrderStatus, updateOrderById, createOrder, getOrderById, actionLoading } = useOrders({ range: "day" });
  const { tables, loading: tablesLoading } = useTables({ page: 1, limit: 100 });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    if (!(role || storedRole)) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
    }
  }, [role, router]);

  // Listen for orders marked served from kitchen page
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { orderId } = customEvent.detail || {};
      if (orderId) {
        setRemovedOrderIds(prev => ({ ...prev, [orderId]: true }));
      }
    };

    window.addEventListener("order:served", handler as EventListener);
    return () => {
      window.removeEventListener("order:served", handler as EventListener);
    };
  }, []);

  const activeProducts = useMemo(() => products.filter(p => p.status === "ACTIVE"), [products]);
  const categories = useMemo<CategoryRecord[]>(() => {
    const seen = new Set<string>();
    return allCategories
      .filter((category) => {
        const name = category.CategoryName?.trim();
        if (!name || seen.has(name.toLowerCase())) return false;
        seen.add(name.toLowerCase());
        return true;
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.CategoryName.localeCompare(b.CategoryName));
  }, [allCategories]);

  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchCat = selectedCategory === "All" || p.category?.CategoryName === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeProducts, selectedCategory, searchTerm]);

  const cartProductIds = useMemo(
    () => Array.from(new Set(cartItems.filter(i => i.quantity > 0).map(i => i.productId))),
    [cartItems],
  );
  const productsInCart = useMemo(
    () => activeProducts.filter(p => cartProductIds.includes(p.id)),
    [activeProducts, cartProductIds],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems],
  );
  const cartQuantityTotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems],
  );
  const numericDelivery = parseFloat(deliveryCharges || "0") || 0;
  const numericPackaging = parseFloat(packagingCharges || "0") || 0;
  const productsTotal = useMemo(() => {
    const productIds = Array.from(new Set(cartItems.map(i => i.productId)));
    return productIds.reduce((sum, pid) => {
      const baseTotal = cartItems
        .filter(i => i.productId === pid)
        .reduce((a, b) => a + (Number(b.price) * Number(b.quantity)), 0);
      const overrideStr = productOverrides[pid];
      const overrideNum = overrideStr !== undefined && overrideStr !== "" ? parseFloat(overrideStr as string) : NaN;
      const productTotal = Number.isFinite(overrideNum) ? overrideNum : baseTotal;
      return sum + productTotal;
    }, 0);
  }, [cartItems, productOverrides]);
  const grandTotal = productsTotal + numericDelivery + numericPackaging + overridePrice;

  const editingSubtotal = useMemo(
    () => editingItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [editingItems],
  );
  const editingGrandTotal = editingSubtotal + editingDeliveryCharges + editingPackagingCharges + editingOverridePrice;
  const visibleOrders = useMemo(
    () => orders.filter((order) => String(order.status).toUpperCase() !== "COMPLETED"),
    [orders],
  );

  const displayedOrders = useMemo(
    () => visibleOrders.filter(order => !removedOrderIds[order.id]),
    [visibleOrders, removedOrderIds],
  );
  const takeAwayTable = useMemo(
    () => tables.find((table) => table.tableNumber === "take away" || table.tableNumber === "takeaway" || table.tableNumber === "take-away"),
    [tables],
  );
  const diningTables = useMemo(
    () => tables.filter((table) => table.id !== takeAwayTable?.id),
    [tables, takeAwayTable],
  );

  const getProductDefaultVariant = (product: Product) =>
    product.variants?.find((variant) => isUuid(variant.id)) ?? null;

  const getProductVariantsForUi = (product: Product): ProductVariant[] => {
    const realVariants = (product.variants ?? []).filter((variant) => isUuid(variant.id));
    if (realVariants.length > 0) return realVariants;
    return [{
      id: "",
      name: "Regular",
      price: product.price || 0,
      inStock: product.inStock ?? 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }];
  };

  const buildPatchItemsFromEditingState = () => {
    const updatedItems = editingItems.map((item) => {
      const product = activeProducts.find((p) => p.id === item.productId);
      return buildOrderPatchItem(
        {
          orderItemId: item.orderItemId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          action: item.action ?? (item.orderItemId ? "update" : "add"),
        },
        product?.variants,
      );
    });

    const removedItems = removedEditingItems.map((orderItemId) => buildOrderRemoveItem(orderItemId));
    return [...updatedItems, ...removedItems];
  };

  const selectedEditingProduct = useMemo(
    () => activeProducts.find((product) => product.id === selectedProductId) ?? null,
    [activeProducts, selectedProductId],
  );

  const addProductToEditingOrder = (product: Product, variant?: ProductVariant | null) => {
    const realVariants = getProductVariantsForUi(product);
    const selectedVariant = variant ?? realVariants[0];
    if (!selectedVariant) {
      toast.error("Unable to add this product");
      return;
    }

    const lineVariantId = isUuid(selectedVariant.id) ? selectedVariant.id : "";

    setEditingItems((prev) => {
      const existing = prev.find(
        (item) => item.productId === product.id && item.variantId === lineVariantId,
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && item.variantId === lineVariantId
            ? {
              ...item,
              quantity: item.quantity + 1,
              action: (item.action === "add" ? "add" : "update") as EditableOrderItem["action"],
            }
            : item,
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          variantId: lineVariantId,
          productName: product.name,
          variantName: selectedVariant.name,
          price: selectedVariant.price ?? product.price ?? 0,
          quantity: 1,
          image: product.image,
          action: "add" as const,
        },
      ];
    });
  };

  const openVariantDialogForProduct = (product: Product) => {
    const realVariants = (product.variants ?? []).filter((variant) => isUuid(variant.id));
    if (realVariants.length === 0) {
      addProductToEditingOrder(product);
      return;
    }
    if (realVariants.length === 1) {
      addProductToEditingOrder(product, realVariants[0]);
      return;
    }
    setSelectedProductId(product.id);
    setShowVariantDialog(true);
  };

  const closeVariantDialog = () => {
    setShowVariantDialog(false);
    setSelectedProductId(null);
  };

  const updateEditingItemQty = (productId: string, variantId: string, delta: number) => {
    setEditingItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId && item.variantId === variantId
            ? {
              ...item,
              quantity: Math.max(0, item.quantity + delta),
              action: (item.action === "add" ? "add" : "update") as EditableOrderItem["action"],
            }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const syncEditingStateFromOrder = (order: OrderRecord) => {
    setEditingOrderId(order.id);
    setEditingOrder(order);
    setEditingStatus(order.status || "PENDING");
    setEditingDeliveryCharges(Number(order.deliveryCharges || 0));
    setEditingPackagingCharges(Number(order.packagingPrice || 0));
    setEditingOverridePrice(0);
    setEditingItems(
      (order.Items || []).map((item) => ({
        orderItemId: item.id,
        productId: item.productId,
        variantId: isUuid(item.variant?.id) ? item.variant!.id : "",
        productName: item.productName,
        variantName: item.variant?.name || "Default",
        price: Number(item.price),
        quantity: item.quantity,
        image: item.image || null,
      })),
    );
  };

  const removeEditingItem = (productId: string, variantId: string) => {
    setEditingItems((prev) => {
      const itemToRemove = prev.find((item) => item.productId === productId && item.variantId === variantId);
      if (itemToRemove?.orderItemId) {
        setRemovedEditingItems((removedPrev) => Array.from(new Set([...removedPrev, itemToRemove.orderItemId!])));
      }
      return prev.filter((item) => !(item.productId === productId && item.variantId === variantId));
    });
  };

  const handleHoldOrder = () => {
    if (cartItems.length === 0) return;
    const newHeld: HeldOrder = {
      id: `Held Order #${heldOrders.length + 1}`,
      items: [...cartItems],
      delivery: deliveryCharges,
      packaging: packagingCharges,
      override: overridePrice,
      productOverrides: { ...productOverrides },
      timestamp: Date.now(),
    };
    setHeldOrders(prev => [...prev, newHeld]);
    setCartItems([]);
    setDeliveryCharges("");
    setPackagingCharges("");
    setOverridePrice(0);
    setProductOverrides({});
    toast.success("Order moved to queue");
  };

  const handleResumeOrder = (held: HeldOrder) => {
    setCartItems(held.items);
    setDeliveryCharges(held.delivery);
    setPackagingCharges(held.packaging);
    setOverridePrice(held.override);
    setProductOverrides(held.productOverrides);
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
      });
      return items.filter(item => item.quantity > 0);
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

  const finalizeCreateOrder = async (tableId?: string) => {
    if (cartItems.length === 0) return toast.error("Add items first");
    if (!tableId) return toast.error("Select a table first");

    const isUuid = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      );

    const toastId = toast.loading("Placing order...");
    try {
      const payload = {
        tableId,
        items: cartItems
          .filter((i) => i.quantity > 0)
          .map((i) => {
            const item: {
              productId: string;
              quantity: number;
              price: number;
              variantId?: string;
            } = {
              productId: i.productId,
              quantity: i.quantity,
              price: i.price,
            };
            // API requires a real UUID when product has variants; omit otherwise
            if (i.variantId && isUuid(i.variantId)) {
              item.variantId = i.variantId;
            }
            return item;
          }),
        totalPrice: grandTotal,
        deliveryCharges: numericDelivery,
        packagingPrice: numericPackaging,
      };
      await createOrder(payload);
      toast.success("Order placed successfully", { id: toastId });
      setCartItems([]);
      setView("list");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to place order",
        { id: toastId },
      );
    }
  };

  const refetch = () => fetchOrders(1);

  const invoiceSubTotal = useMemo(
    () => orderDetails?.Items.reduce((acc, item) => acc + Number(item.total || item.price || 0), 0) || 0,
    [orderDetails],
  );

  const invoiceDelivery = Number(orderDetails?.deliveryCharges || 0);
  const invoicePackaging = Number(orderDetails?.packagingPrice || 0);
  const invoiceNetAmount = Number(orderDetails?.totalPrice || 0);

  const handleCompleteAndPrint = async () => {
    if (!orderDetails?.orderId) return;

    const toastId = toast.loading("Completing order...");
    try {
      await updateOrderStatus(orderDetails.orderId, "COMPLETED");
      toast.success("Order completed", { id: toastId });
      if (typeof window !== "undefined") {
        window.print();
      }
      setShowOrderDetailsDialog(false);
      setOrderDetails(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to complete order", { id: toastId });
    }
  };

  const orderDetailsDialog = (
    <Dialog
      open={showOrderDetailsDialog}
      onOpenChange={(open) => {
        setShowOrderDetailsDialog(open);
        if (!open) {
          setOrderDetails(null);
        }
      }}
    >
      <DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-2xl border border-[#dbe4ef] bg-[#f8fbff] p-0 shadow-[0_24px_56px_rgba(15,23,42,0.18)] print:shadow-none">
        <DialogTitle className="sr-only">Order Invoice</DialogTitle>
        {orderDetails ? (
          <div>
            <div className="border-b border-[#dbe4ef] bg-white px-6 py-4 print:hidden">
              <button
                type="button"
                onClick={() => void handleCompleteAndPrint()}
                disabled={actionLoading}
                className="dn-btn dn-btn-primary w-full !h-auto !flex-col !gap-1 !py-4"
              >
                <span className="inline-flex items-center gap-2 text-base">
                  {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
                  Complete &amp; Print
                </span>
                <span className="text-xs font-medium opacity-90">Finalize order and print receipt</span>
              </button>
            </div>

            <div className="p-6" id="order-invoice-print-area">
              <InvoiceReceipt
                orderNumber={orderDetails.orderNumber}
                tableLabel={orderDetails.table || "Take Away"}
                items={orderDetails.Items.map((item) => ({
                  id: item.id,
                  productName: item.productName,
                  quantity: item.quantity,
                  price: item.price,
                  total: item.total,
                  variantName: item.variant?.name,
                }))}
                subtotal={invoiceSubTotal}
                deliveryCharges={invoiceDelivery}
                packagingPrice={invoicePackaging}
                total={invoiceNetAmount}
                status={orderDetails.status}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-[#dbe4ef] bg-white px-6 py-4 print:hidden">
              <button
                type="button"
                onClick={() => setShowOrderDetailsDialog(false)}
                className="dn-btn dn-btn-outline"
              >
                Close
              </button>
              <InvoicePrintButton onClick={() => window.print()} label="Print Only" />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );

  const variantPickerDialog = (
    <Dialog
      open={showVariantDialog && !!selectedEditingProduct}
      onOpenChange={(open) => {
        if (!open) {
          closeVariantDialog();
        }
      }}
    >
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-[32px] border border-[#e6eef3] bg-white shadow-2xl">
        <DialogTitle className="sr-only">
          {selectedEditingProduct ? `Select a variant for ${selectedEditingProduct.name}` : "Select product variant"}
        </DialogTitle>
        {selectedEditingProduct ? (
          <div className="overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="relative bg-[#001840] px-6 pb-16 pt-6">


              <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
                <Image
                  src={productImageUrl(selectedEditingProduct.image)}
                  alt={selectedEditingProduct.name}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="px-6 pb-6 pt-5">
              <div className="text-center">
                <h3 className="text-2xl font-black uppercase text-[#2a2a2a]">{selectedEditingProduct.name}</h3>
                <div className="mt-3 inline-flex rounded-full bg-[#EEF3FF] px-4 py-1 text-[11px] font-black uppercase tracking-[0.3em] text-[#001840]">
                  Select preferred variant
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {selectedEditingProduct.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => {
                      addProductToEditingOrder(selectedEditingProduct, variant);
                      closeVariantDialog();
                    }}
                    className="flex w-full items-center justify-between rounded-[20px] bg-[#ffffff]  border border-[#ffffff]  px-4 py-4 text-left shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fff1f0] text-[#ef4444]">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      <span className="text-lg font-black uppercase text-[#2b2b2b]">{variant.name}</span>
                    </div>
                    <span className="text-lg font-black text-[#001840]">Rs {variant.price}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );

  const openEditOrder = async (orderId: string) => {
    setExpandedOrderId(orderId);
    setEditingOrder(null);
    setEditingStatus("");
    setEditingItems([]);
    setRemovedEditingItems([]);
    setEditingDeliveryCharges(0);
    setEditingPackagingCharges(0);
    setEditingOverridePrice(0);

    const toastId = toast.loading("Loading order details...");
    try {
      const order = await getOrderById(orderId);
      syncEditingStateFromOrder(order);
      toast.dismiss(toastId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load order", { id: toastId });
      setEditingOrderId(null);
      setExpandedOrderId(null);
    }
  };

  const collapseOrderEditor = () => {
    setExpandedOrderId(null);
    setEditingOrderId(null);
    setEditingOrder(null);
    setEditingStatus("");
    setEditingItems([]);
    setRemovedEditingItems([]);
    setEditingDeliveryCharges(0);
    setEditingPackagingCharges(0);
    setEditingOverridePrice(0);
  };

  const openOrderDetails = async (orderId: string) => {
    setOrderDetails(null);
    setShowOrderDetailsDialog(true);
    const toastId = toast.loading("Loading order details...");
    try {
      const order = await getOrderById(orderId);
      setOrderDetails({
        orderId: order.id,
        orderNumber: order.orderNumber,
        table: order.table,
        status: order.status,
        totalPrice: order.totalPrice,
        deliveryCharges: order.deliveryCharges,
        packagingPrice: order.packagingPrice,
        Items: order.Items,
      });
      toast.dismiss(toastId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load order", { id: toastId });
      setShowOrderDetailsDialog(false);
    }
  };

  const saveOrderChanges = async () => {
    if (!editingOrderId) {
      toast.error("Select an order first");
      return;
    }

    const toastId = toast.loading("Saving order changes...");
    try {
      await updateOrderById(editingOrderId, {
        items: buildPatchItemsFromEditingState(),
        deliveryCharges: editingDeliveryCharges,
        packagingPrice: editingPackagingCharges,
      });
      toast.success("Order updated successfully", { id: toastId });
      setEditingOrderId(null);
      setEditingOrder(null);
      setEditingItems([]);
      setRemovedEditingItems([]);
      setShowOrderDetailsDialog(false);
      setOrderDetails(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update order", { id: toastId });
    }
  };

  const completeEditOrder = async () => {
    if (!editingOrderId) {
      toast.error("Select an order first");
      return;
    }

    const toastId = toast.loading("Completing order...");
    try {
      await updateOrderById(editingOrderId, {
        items: buildPatchItemsFromEditingState(),
        deliveryCharges: editingDeliveryCharges,
        packagingPrice: editingPackagingCharges,
      });

      await updateOrderStatus(editingOrderId, "COMPLETED");

      const completedOrder = await getOrderById(editingOrderId);
      setOrderDetails({
        orderId: completedOrder.id,
        orderNumber: completedOrder.orderNumber,
        table: completedOrder.table,
        status: completedOrder.status,
        totalPrice: completedOrder.totalPrice,
        deliveryCharges: completedOrder.deliveryCharges,
        packagingPrice: completedOrder.packagingPrice,
        Items: completedOrder.Items,
      });
      setShowOrderDetailsDialog(true);
      collapseOrderEditor();
      toast.success("Order completed successfully", { id: toastId });
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to complete order", { id: toastId });
    }
  };


  if (view === "create") {
    return (
      <AdminShell activeTab="orders">
        <main className="-mx-4 -mb-8 -mt-2 flex min-h-[calc(100dvh-7.25rem)] flex-col gap-3 overflow-visible px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:-mb-11 lg:px-10 xl:h-[calc(100dvh-6.75rem)] xl:min-h-0 xl:overflow-hidden">
          <button
            type="button"
            onClick={() => setView("list")}
            className="dn-btn dn-btn-primary !h-12 shrink-0 !rounded-2xl !text-base w-full sm:w-auto sm:self-start !px-5"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2]" />
            Active Orders
          </button>

          <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
            {/* Left: Products (scrollable) */}
            <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] xl:min-h-0 xl:w-[58%] xl:flex-none">
              <div className="shrink-0 space-y-3 border-b border-[#edf2f7] px-4 py-3 sm:px-5">
                <label className="relative block space-y-1.5">
                  <span className="block text-sm font-semibold text-[#64748b]">Search</span>
                  <span className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search products..."
                      className="h-11 w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] pl-10 pr-4 text-sm font-medium outline-none focus:border-[#0050F8] focus:ring-2 focus:ring-[#0050F8]/20"
                    />
                  </span>
                </label>

                <div className="dn-tab-bar !rounded-2xl !gap-2 !py-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("All")}
                    data-active={selectedCategory === "All" ? "true" : "false"}
                    className="dn-tab shrink-0 !h-10"
                  >
                    <Package className="h-4 w-4" />
                    All
                  </button>

                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.CategoryName)}
                      data-active={selectedCategory === category.CategoryName ? "true" : "false"}
                      className="dn-tab shrink-0 !h-10 !px-3"
                    >
                      <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md bg-[#f8fafc]">
                        {category.image ? (
                          <Image src={productImageUrl(category.image)} alt={category.CategoryName} fill className="object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-[10px] font-bold text-[#001840]">
                            {category.CategoryName.slice(0, 1)}
                          </span>
                        )}
                      </span>
                      <span className="max-w-[110px] truncate">{category.CategoryName}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
                {filteredProducts.length === 0 ? (
                  <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-[#d7e1ed] bg-[#f8fafc] text-center">
                    <p className="text-sm font-semibold text-[#64748b]">No products available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {filteredProducts.map((product) => {
                      const variants =
                        product.variants && product.variants.length > 0
                          ? product.variants
                          : [{
                              id: "",
                              name: "Regular",
                              price: product.price || 0,
                              inStock: 1,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            }];
                      const inCart = cartProductIds.includes(product.id);
                      const productQty = cartItems
                        .filter((i) => i.productId === product.id)
                        .reduce((sum, i) => sum + i.quantity, 0);

                      return (
                        <div
                          key={product.id}
                          className={cn(
                            "flex h-[360px] flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition",
                            inCart
                              ? "border-[#001840] shadow-[0_10px_24px_rgba(0,24,64,0.12)]"
                              : "border-[#e8eef5] hover:border-[#c7d4e6]",
                          )}
                        >
                          <div className="relative h-36 w-full shrink-0 bg-[#f1f5f9]">
                            <Image src={productImageUrl(product.image)} alt={product.name} fill className="object-cover" />
                            {productQty > 0 && (
                              <span className="absolute right-3 top-3 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#001840] px-2 text-sm font-bold text-white shadow-md">
                                {productQty}
                              </span>
                            )}
                          </div>

                          <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
                            <div className="shrink-0">
                              <h3 className="truncate text-base font-bold text-[#0f172a]">{product.name}</h3>
                              <p className="mt-0.5 text-xs font-medium text-[#64748b]">
                                Tap a size to add
                              </p>
                            </div>

                            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-0.5">
                              {variants.map((v) => {
                                const qty =
                                  cartItems.find(
                                    (i) => i.productId === product.id && i.variantId === v.id,
                                  )?.quantity || 0;

                                return (
                                  <div
                                    key={v.id || `${product.id}-regular`}
                                    className={cn(
                                      "flex items-center gap-2 rounded-xl border px-2 py-1.5",
                                      qty > 0
                                        ? "border-[#0050F8]/35 bg-[#EEF3FF]"
                                        : "border-[#e2e8f0] bg-[#f8fafc]",
                                    )}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleAddToCart(product, v as ProductVariant)}
                                      className="min-w-0 flex-1 text-left"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-sm font-semibold uppercase tracking-wide text-[#0f172a]">
                                          {v.name}
                                        </span>
                                        <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-bold text-[#0050F8] shadow-sm">
                                          Rs {v.price}
                                        </span>
                                      </div>
                                    </button>

                                    {qty > 0 ? (
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateQty(product.id, v.id, -1)}
                                          className="grid h-8 w-8 place-items-center rounded-lg border border-[#d7e1ed] bg-white text-[#001840]"
                                          aria-label={`Decrease ${v.name}`}
                                        >
                                          <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="w-6 text-center text-sm font-bold text-[#001840]">{qty}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleAddToCart(product, v as ProductVariant)}
                                          className="grid h-8 w-8 place-items-center rounded-lg bg-[#001840] text-white"
                                          aria-label={`Increase ${v.name}`}
                                        >
                                          <Plus className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleAddToCart(product, v as ProductVariant)}
                                        className="grid h-8 w-8 place-items-center rounded-lg bg-[#001840] text-white"
                                        aria-label={`Add ${v.name}`}
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Order Summary (fixed panel) */}
            <div className="flex max-xl:min-h-[520px] min-h-0 w-full flex-col overflow-hidden rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] xl:w-[42%] xl:shrink-0">
              <div className="flex shrink-0 items-center justify-between gap-3 bg-[#001840] px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-lg font-bold">Order Summary</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                    {cartQuantityTotal} items
                  </span>
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleHoldOrder}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 hover:bg-white/25"
                      title="Hold order"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  )}
                  {heldOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsQueueOpen(true)}
                      className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/15 hover:bg-white/25"
                      title="Held queue"
                    >
                      <History className="h-4 w-4" />
                      <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-black text-[#001840]">
                        {heldOrders.length}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 hover:bg-white/25"
                    title="Clear cart"
                  >
                    <CustomTrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8fafc] p-4">
                {cartQuantityTotal === 0 ? (
                  <div className="flex h-full min-h-[180px] flex-col items-center justify-center py-10 text-center">
                    <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#EEF3FF] text-[#0050F8]">
                      <ShoppingCart className="h-8 w-8" />
                    </div>
                    <p className="text-base font-semibold text-[#0f172a]">Your order is empty</p>
                    <p className="mt-1 text-sm text-[#64748b]">Tap a product size to add it here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {productsInCart.map((product) => {
                      const lines = cartItems.filter(
                        (i) => i.productId === product.id && i.quantity > 0,
                      );
                      if (lines.length === 0) return null;

                      const baseTotal = lines.reduce(
                        (a, b) => a + Number(b.price) * Number(b.quantity),
                        0,
                      );
                      const overrideStr = productOverrides[product.id];
                      const overrideNum =
                        overrideStr !== undefined && overrideStr !== ""
                          ? parseFloat(overrideStr as string)
                          : NaN;
                      const productTotal = Number.isFinite(overrideNum) ? overrideNum : baseTotal;

                      return (
                        <div
                          key={product.id}
                          className="rounded-2xl border border-[#e2e8f0] bg-white p-3.5 shadow-sm"
                        >
                          <div className="mb-3 flex items-start gap-3">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                              <Image
                                src={productImageUrl(product.image)}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="truncate text-sm font-bold text-[#0f172a]">
                                  {product.name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCartItems((prev) =>
                                      prev.filter((i) => i.productId !== product.id),
                                    )
                                  }
                                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f1f5f9] text-[#64748b] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                                  aria-label={`Remove ${product.name}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="mt-0.5 text-xs font-medium text-[#94a3b8]">
                                {lines.length} size{lines.length > 1 ? "s" : ""} selected
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {lines.map((line) => (
                              <div
                                key={`${line.productId}-${line.variantId}`}
                                className="flex items-center justify-between gap-2 rounded-xl bg-[#f8fafc] px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#0f172a]">
                                    {line.variantName}
                                  </p>
                                  <p className="text-xs font-medium text-[#0050F8]">
                                    Rs {line.price} each
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateQty(line.productId, line.variantId, -1)
                                    }
                                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#d7e1ed] bg-white text-[#001840]"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-8 text-center text-base font-bold text-[#001840]">
                                    {line.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const variant = product.variants?.find(
                                        (v) => v.id === line.variantId,
                                      ) ?? {
                                        id: line.variantId,
                                        name: line.variantName,
                                        price: line.price,
                                        inStock: 1,
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString(),
                                      };
                                      handleAddToCart(product, variant as ProductVariant);
                                    }}
                                    className="grid h-9 w-9 place-items-center rounded-xl bg-[#001840] text-white"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-[#edf2f7] pt-3">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-semibold text-[#64748b]">Override</label>
                              <div className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1">
                                <span className="text-xs font-medium text-[#94a3b8]">Rs</span>
                                <input
                                  type="number"
                                  step="1"
                                  value={
                                    productOverrides[product.id] ??
                                    String(Math.round(baseTotal))
                                  }
                                  onChange={(e) =>
                                    setProductOverrides((prev) => ({
                                      ...prev,
                                      [product.id]: e.target.value,
                                    }))
                                  }
                                  className="w-16 bg-transparent text-sm font-bold outline-none"
                                />
                              </div>
                            </div>
                            <span className="text-lg font-bold text-[#001840]">
                              Rs {productTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {cartQuantityTotal > 0 && (
                <div className="shrink-0 border-t border-[#e2e8f0] bg-white">
                  <div className="border-b border-[#e2e8f0] px-4 py-3">
                    <details className="group rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-[#475569]">
                          <Plus className="h-4 w-4 rounded-full border border-[#94a3b8] p-0.5" />
                          Extra charges (optional)
                        </span>
                        <ChevronDown className="h-4 w-4 text-[#64748b] transition group-open:rotate-180" />
                      </summary>
                      <div className="mt-3 space-y-3 border-t border-[#e2e8f0] pt-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-[#334155]">Delivery</span>
                          <div className="flex items-center gap-1 rounded-xl border border-[#e2e8f0] bg-white px-2 py-1.5">
                            <span className="text-xs text-[#94a3b8]">Rs</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={deliveryCharges}
                              onChange={(e) => setDeliveryCharges(e.target.value)}
                              className="w-16 bg-transparent text-sm font-bold outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-[#334155]">Packing</span>
                          <div className="flex items-center gap-1 rounded-xl border border-[#e2e8f0] bg-white px-2 py-1.5">
                            <span className="text-xs text-[#94a3b8]">Rs</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={packagingCharges}
                              onChange={(e) => setPackagingCharges(e.target.value)}
                              className="w-16 bg-transparent text-sm font-bold outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>

                  <div className="px-4 py-4">
                    <div className="mb-4 rounded-2xl border border-[#dbe7ff] bg-[#EEF3FF] p-4">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-[#64748b]">Items ({cartQuantityTotal})</span>
                        <span className="font-bold text-[#334155]">Rs {productsTotal.toFixed(0)}</span>
                      </div>
                      {numericDelivery > 0 && (
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-[#64748b]">Delivery</span>
                          <span className="font-semibold text-[#334155]">Rs {numericDelivery}</span>
                        </div>
                      )}
                      {numericPackaging > 0 && (
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-[#64748b]">Packing</span>
                          <span className="font-semibold text-[#334155]">Rs {numericPackaging}</span>
                        </div>
                      )}
                      <div className="mt-3 flex items-end justify-between border-t border-[#c7d7f5] pt-3">
                        <span className="text-sm font-bold uppercase tracking-wide text-[#001840]">
                          Grand Total
                        </span>
                        <span className="text-2xl font-bold text-[#001840]">
                          Rs {grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={actionLoading}
                      className="dn-btn dn-btn-primary w-full !h-14 !rounded-2xl !text-lg"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-6 w-6" />
                      )}
                      Place Order Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Held Orders Dialog */}
          <Dialog open={isQueueOpen} onOpenChange={setIsQueueOpen}>
            <DialogContent className="max-w-xl p-0 rounded-t-[20px] border-none overflow-hidden bg-[#f8fafc] shadow-2xl">
              <DialogHeader className="bg-[#001840] px-7 py-5 text-[#ffffff] relative">
                <div className="flex items-center gap-4">
                  <History className="h-5 w-5" />
                  <DialogTitle className="text-xl text-[#ffffff] font-black">Held Orders Queue</DialogTitle>
                </div>
                <button onClick={() => setIsQueueOpen(false)} className="absolute top-5 right-8 bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
                  <X className="h-5 w-5" />
                </button>
              </DialogHeader>
              <div className="p-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {heldOrders.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 font-bold">No orders in queue</div>
                ) : (
                  heldOrders.map((held) => (
                    <div key={held.id} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex items-center justify-between group hover:border-[#001840]/20 transition">
                      <div>
                        <h4 className="font-bold text-lg text-[#111827]">{held.id}</h4>
                        <div className="flex items-center gap-4 mt-2 text-gray-400  text-md">
                          <span className="flex items-center gap-1"><ShoppingCart className="h-4 w-4 text-[#ef4444]" /> {held.items.length} Items</span>
                          <span className="flex items-center gap-1"><Table2 className="h-4 w-4 text-orange-400" /> Table: None</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setHeldOrders(prev => prev.filter(o => o.id !== held.id))}
                          className="bg-red-100 text-red-500 p-3 rounded-2xl hover:bg-red-100 transition opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleResumeOrder(held)}
                          className="bg-[#001840] text-[#ffffff] px-6 py-3 rounded-2xl font-black text-md shadow-lg hover:bg-[#00122E] transition"
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

          {/* Table Selection Dialog */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="max-w-[96vw] md:max-w-6xl p-0 rounded-[22px] border-none overflow-hidden bg-[#ebeff0] shadow-[0_24px_70px_rgba(0,0,0,0.28)] [&>button]:hidden">
              <DialogHeader className="bg-[#001840] px-4 py-4 md:px-6 text-[#ffffff] relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 shrink-0">
                      <UtensilsCrossed className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <DialogTitle className="flex items-center gap-2 text-[22px] leading-tight font-extrabold text-[#ffffff]">
                        <span className="text-[18px] font-bold text-white/95">کہاں سروس کریں؟</span>
                        <span>Where to serve?</span>
                      </DialogTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/90">
                      <Table2 className="h-3 w-3" />
                      Tap to select
                    </span>
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/18 text-[#ffffff] transition hover:bg-white/28"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </DialogHeader>

              <div className="px-4 py-5 md:px-6 md:py-6">
                <div className="mb-5 space-y-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8f9aa3]">Quick Service</div>

                  {takeAwayTable ? (
                    <button
                      type="button"
                      onClick={() => {
                        void finalizeCreateOrder(takeAwayTable.id);
                        setShowConfirmDialog(false);
                      }}
                      className="w-full rounded-[16px] bg-[#fd6000] px-4 py-5 md:px-6 md:py-6 text-left text-[#ffffff] transition hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/24 shrink-0">
                            <ShoppingBag className="h-6 w-6" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[30px] leading-none font-extrabold tracking-tight">Self Pickup / Take Away</p>
                            <p className="mt-1 text-sm font-semibold text-white/90">Quick order without table service</p>
                          </div>
                        </div>
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/22 text-white/90 text-5xl">›</span>
                      </div>
                    </button>
                  ) : (
                    <div className="rounded-[16px] border border-dashed border-gray-300 bg-white px-4 py-5 text-sm font-semibold text-gray-500">
                      No take away table found in tables API.
                    </div>
                  )}

                  <div className="pt-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#8f9aa3]">Dining Tables</div>
                </div>

                {tablesLoading ? (
                  <Loading />
                ) : diningTables.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500 font-bold">
                    No tables found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 max-h-[58vh] overflow-y-auto pr-1 custom-scrollbar">
                    {diningTables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => {
                          void finalizeCreateOrder(table.id);
                          setShowConfirmDialog(false);
                        }}
                        className="group rounded-[18px] border-2 border-[#c7d7f5] bg-[#EEF3FF] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#0050F8]"
                      >
                        <div className="flex min-h-[210px] flex-col items-center justify-between rounded-[14px]   px-3 py-4">
                          <Armchair className="h-6 w-6 text-[#0050F8]" />
                          <p className="text-6xl leading-none font-black tracking-tight text-[#001840] drop-shadow-[0_3px_6px_rgba(0,24,64,0.22)]">
                            {table.tableNumber}
                          </p>
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0050F8]">Tap to select</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {orderDetailsDialog}

          {variantPickerDialog}

          <div className="fixed bottom-6 right-6 z-50 print:hidden">
            <button type="button" onClick={() => refetch()} className="dn-btn dn-btn-primary !h-[50px] !w-[50px] !rounded-xl !p-0">
              <RotateCw className={cn("h-6 w-6", ordersLoading && "animate-spin")} />
            </button>
          </div>
        </main>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeTab="orders">
      <main className="w-full space-y-8 bg-[#f8fafc] min-h-[calc(100vh-80px)]">
        <SelfOrderRequestsPanel onApproved={refetch} />

        {displayedOrders.length > 0 && (
          <button
            onClick={() => setView("create")}
            className="dn-btn dn-btn-primary w-full !h-auto !py-5 !rounded-2xl !text-2xl"
          >
            <Plus className="h-6 w-6 rounded-full border-2 border-white/80" /> Create New Order
          </button>
        )}

        {ordersLoading && !orders.length ? (
          <Loading size="lg" />
        ) : displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] bg-transparent py-20 px-4">
            <div className="mb-4 text-[#a1a1aa]">
              <ClipboardList className="w-24 h-24 stroke-[2]" />
            </div>
            <p className="text-[20px] text-[#9ca3af] font-medium mb-5">
              No active orders found
            </p>
            <button
              onClick={() => setView("create")}
              className="dn-btn dn-btn-primary !h-auto !px-6 !py-2.5 !text-[17px]"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" /> Create Your Order
            </button>
          </div>
        ) : (
          <div className="space-y-8 pb-20  mx-20">
            {displayedOrders.map((order) => {
              const isTakeAway = String(order.table || "").toLowerCase().includes("take");
              const cardBg = isTakeAway ? "bg-[#f8f2e8]" : "bg-[#EEF3FF]";
              const cardBorder = isTakeAway ? "border-[#ffb347]" : "border-[#c7d7f5]";
              const priceChipBg = "bg-[#EEF3FF]";
              const priceChipText = "text-[#001840]";

              return (
                <div key={order.id} className="relative rounded-[20px]  transition-all duration-500">
                  <div className={cn("absolute left-0 top-0 bottom-0 w-3 rounded-l-[60px]", isTakeAway ? "bg-[#ff9900]" : "bg-[#9e9e9e]")} />

                  <div className={cn("p-5 sm:p-6 rounded-[12px] border-2 shadow-md", cardBg, cardBorder)}>
                    <div className="flex items-start justify-between gap-4 mb-4 sm:mb-6">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <h2 className="text-[#001840] font-black text-lg sm:text-2xl tracking-tight">{order.orderNumber}</h2>
                        <span className={cn("px-3 py-1 rounded-xl text-2xl font-black bg-[#EEF3FF] border shadow-lg", priceChipText, "border-[#c7d7f5]")}>Rs. {Number(order.totalPrice)}</span>
                        <h3 className="text-[#0050F8] font-black text-5xl sm:text-4xl tracking-tight">{order.table || "Take Away"}</h3>
                      </div>
                      <button type="button" onClick={() => void openOrderDetails(order.id)} className="bg-[#EEF3FF] p-2.5 rounded-xl text-[#0050F8] shadow-sm hover:bg-[#e8effe] transition" aria-label="Open order details"><Eye className="h-6 w-6" /></button>
                    </div>

                    <div className="flex items-center gap-6 text-gray-600 text-lg font-bold mb-5 sm:mb-6">
                      <span className="flex items-center gap-2"><Store className="h-5 w-5 text-gray-400" /> {order.table || "test"}</span>
                      <span className="flex text-[#9e9e9e] items-center gap-2"><Clock3 className="h-5 w-5 text-gray-400" /> {formatElapsed(order.createdAt)}</span>
                    </div>

                    {!expandedOrderId && (
                      <div className="flex flex-wrap gap-4 mb-5 sm:mb-6">
                        {order.Items.slice(0, 3).map((item) => (
                          <div key={item.id} className="bg-white rounded-2xl border-2 border-[#c7d7f5] p-3.5 flex items-center gap-4 pr-6 relative shadow-sm transition hover:scale-[1.02] min-w-[270px]">
                            <div className="relative h-18 w-18 rounded-[18px] overflow-hidden shadow-md border-2 border-white shrink-0">
                              <Image src={productImageUrl(item.image)} alt={item.productName} fill className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-base text-[#111827] truncate">{item.productName}</h4>
                              <p className="text-[#001840] font-black text-base mt-2">Rs. {item.total}</p>
                            </div>
                            <span className="absolute top-3 right-3 bg-[#eef3ff] text-[#0050F8] px-3 py-1 rounded-full text-xs font-black shadow-sm">x{item.quantity}</span>
                          </div>
                        ))}
                        {order.Items.length > 3 && (
                          <div className="bg-white/55 backdrop-blur rounded-full px-6 py-3 flex items-center text-sm font-black text-gray-600 border border-white/70">+{order.Items.length - 3} more</div>
                        )}
                      </div>
                    )}

                    <div className="flex items-end justify-between gap-4 border-t border-white/40 pt-5 sm:pt-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Amount</p>
                        <p className="text-3xl sm:text-4xl font-black text-[#001840]">Rs {order.totalPrice}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            if (expandedOrderId === order.id) {
                              collapseOrderEditor();
                              return;
                            }
                            void openEditOrder(order.id);
                          }}
                          className="flex items-center gap-2 text-[#0050F8] font-semibold text-xl px-4 py-2 transition hover:bg-white/35 rounded-2xl"
                        >
                          {expandedOrderId === order.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          {expandedOrderId === order.id ? "Order Details" : "Edit Order"}
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                          className="dn-btn dn-btn-secondary !rounded-full !px-8 !py-4 !text-lg"
                        >
                          <CheckCircle2 className="h-6 w-6" /> Complete
                        </button>
                        {/* {!expandedOrderId && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                            className="bg-[#0a9954] text-[#ffffff] px-8 py-4 rounded-full font-black text-lg flex items-center gap-3 shadow-lg hover:bg-[#0a874a] transition"
                          >
                            <CheckCircle2 className="h-6 w-6" /> Complete
                          </button>
                        )} */}
                      </div>
                    </div>

                    {expandedOrderId === order.id && editingOrderId === order.id && editingOrder && (
                      <div className="mt-10 pt-8 border-t border-white/40 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between mb-6 gap-4">
                          <div className="flex items-center gap-3 text-gray-700 font-black text-xl">
                            <Pencil className="h-5 w-5 text-[#111827]" /> Edit Order
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={saveOrderChanges}
                              disabled={actionLoading}
                              className="bg-[#ef2f1f] text-[#ffffff] px-10 py-3 rounded-2xl font-black text-lg shadow-xl flex items-center gap-3 hover:bg-[#dc2626] transition hover:-translate-y-1 disabled:opacity-60"
                            >
                              {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                              Save Changes
                            </button>

                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr] items-start">
                          <div className="bg-[#f6f6f6] rounded-[16px] p-4 border border-[#e6e6e6] shadow-none">
                            <h4 className="flex items-center gap-3 font-medium text-gray-700 mb-4 text-base">
                              <UtensilsCrossed className="h-5 w-5 text-[#ef2f1f]" /> Current Items
                            </h4>
                            <div className="space-y-4">
                              {editingItems.length === 0 ? (
                                <div className="rounded-[20px] border border-dashed border-gray-200 bg-white p-8 text-center font-bold text-gray-400">
                                  No items in this order
                                </div>
                              ) : (
                                editingItems.map((item) => (
                                  <div key={`${item.productId}-${item.variantId}`} className="bg-white rounded-[16px] p-3.5 flex items-center gap-4 border border-[#f0f0f0] shadow-none">
                                    <div className="relative h-20 w-20 rounded-[12px] overflow-hidden border border-[#f0f0f0] bg-[#f3f3f3] shrink-0">
                                      <Image src={productImageUrl(item.image)} alt={item.productName} fill className="object-cover" />
                                      <span className="absolute top-1 right-1 bg-[#001840] text-[#ffffff] text-xs font-black w-6 h-6 flex items-center justify-center rounded-full">{item.quantity}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-black text-[#111827] text-base truncate">{item.productName}</h5>
                                      <div className="mt-2 text-[#001840] font-black text-sm leading-none">
                                        <span className="block text-gray-500 font-semibold text-xs uppercase tracking-widest">Total</span>
                                        <span className="block mt-1">Rs {item.price * item.quantity}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                      <div className="flex items-center gap-2 bg-gray-50 rounded-full p-2">
                                        <button onClick={() => updateEditingItemQty(item.productId, item.variantId, -1)} className="h-8 w-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition"><Minus className="h-4 w-4" /></button>
                                        <span className="font-black text-xl w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => updateEditingItemQty(item.productId, item.variantId, 1)} className="h-8 w-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition"><Plus className="h-4 w-4" /></button>
                                      </div>
                                      <button onClick={() => removeEditingItem(item.productId, item.variantId)} className="text-[#ef4444] text-lg font-black px-4 hover:underline transition">× Remove</button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="flex-1">
                            {productsLoading ? (
                              <Loading />
                            ) : (
                              <div className="rounded-[20px] border border-[#e2e8f0] bg-[#EEF3FF] p-4">
                                <h4 className="flex items-center gap-3 font-medium text-gray-700 mb-4 text-base">
                                  <Plus className="h-6 w-6 text-[#001840]" /> Add More Products
                                </h4>
                                <div className="flex flex-wrap gap-4 pb-4">
                                  {categories.map((category) => (
                                    <button
                                      key={category.id}
                                      onClick={() => setSelectedCategory(category.CategoryName)}
                                      className={cn(
                                        "rounded-2xl font-black transition whitespace-nowrap shadow-sm border-2 overflow-hidden text-left px-3 py-3",
                                        selectedCategory === category.CategoryName
                                          ? "bg-[#001840] border-[#001840] text-[#ffffff]"
                                          : "bg-white border-gray-200 text-black hover:border-gray-300"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#f8fafc] border border-[#eef2f7]">
                                          {category.image ? (
                                            <Image src={productImageUrl(category.image)} alt={category.CategoryName} fill className="object-cover" />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-[#fde68a] text-[#92400e] text-sm font-black">
                                              {category.CategoryName.slice(0, 1).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                        <span className="truncate text-sm max-w-[80px]">{category.CategoryName}</span>
                                      </div>
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => setSelectedCategory("All")}
                                    className={cn(
                                      "rounded-2xl font-black transition whitespace-nowrap shadow-sm border-2 overflow-hidden text-left px-4 py-3",
                                      selectedCategory === "All"
                                        ? "bg-[#001840] border-[#001840] text-[#ffffff]"
                                        : "bg-white border-gray-200 text-black hover:border-gray-300"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 shrink-0">
                                        <Package className="h-5 w-5" />
                                      </span>
                                      <span>All</span>
                                    </div>
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 xl:grid-cols-3 gap-6 pr-1 mt-2">
                                  {filteredProducts.length === 0 ? (
                                    <div className="col-span-full flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-white/70 bg-white text-center shadow-sm">
                                      <div>
                                        <p className="text-xl font-black text-gray-500">No products added</p>
                                        <p className="mt-2 text-sm font-semibold text-gray-400">Try another category filter</p>
                                      </div>
                                    </div>
                                  ) : filteredProducts.map((product) => {
                                    const alreadyAdded = editingItems.some((item) => item.productId === product.id);
                                    return (
                                      <button
                                        key={product.id}
                                        onClick={() => openVariantDialogForProduct(product)}
                                        className={cn(
                                          "bg-white rounded-[40px] overflow-hidden border-2 transition-all duration-300 text-left group shadow-lg hover:shadow-2xl hover:-translate-y-1",
                                          alreadyAdded ? "border-[#001840]" : "border-transparent hover:border-[#001840]"
                                        )}
                                      >
                                        <div className="relative aspect-[4/3] w-full overflow-hidden">
                                          <Image src={productImageUrl(product.image)} alt={product.name} fill className="object-cover transition duration-700 group-hover:scale-110" />
                                        </div>
                                        <div className="p-6">
                                          <div className="flex items-start justify-between gap-2 mb-4">
                                            <h6 className="font-black text-sm truncate">{product.name}</h6>
                                            {alreadyAdded && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">Added</span>}
                                          </div>
                                          {product.variants.map((variant) => (
                                            <div key={variant.id} className="flex justify-between text-[11px] font-black mb-1.5">
                                              <span className="text-gray-400">{variant.name}</span>
                                              <span className="text-[#001840]">Rs. {variant.price}</span>
                                            </div>
                                          ))}
                                          <div className="mt-4 rounded-2xl bg-[#f8fafc] px-3 py-2 text-center text-xs font-black uppercase tracking-[0.25em] text-[#001840]">
                                            Tap to add
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="fixed bottom-8 right-12 z-50 print:hidden">
          <button type="button" onClick={() => refetch()} className="dn-btn dn-btn-primary !h-[50px] !w-[50px] !rounded-xl !p-0">
            <RotateCw className={cn("h-6 w-6", ordersLoading && "animate-spin")} />
          </button>
        </div>
      </main>

      {orderDetailsDialog}

      {variantPickerDialog}
    </AdminShell>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <OrdersContent />
    </Suspense>
  );
}
