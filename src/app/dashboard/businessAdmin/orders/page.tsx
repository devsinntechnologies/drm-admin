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
  Trash2,
  History,
  Save,
  Pencil,
  Armchair,
  ShoppingBag,
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
import { useAuth } from "@/hooks/useAuth";
import { useCategories, type CategoryRecord } from "@/hooks/useCategories";
import { useOrders, type OrderRecord } from "@/hooks/useOrders";
import { useProducts, type Product, type ProductVariant } from "@/hooks/useProducts";
import { useTables } from "@/hooks/useTables";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";
import { cn } from "@/lib/utils";

type PageView = "list" | "create";

interface HeldOrder {
  id: string;
  items: any[];
  delivery: number;
  packaging: number;
  override: number;
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
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [packagingCharges, setPackagingCharges] = useState(0);
  const [overridePrice, setOverridePrice] = useState(0);
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

  const { products, loading: productsLoading } = useProducts({ page: 1, limit: 100 });
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

  const cartProductIds = useMemo(() => Array.from(new Set(cartItems.map(i => i.productId))), [cartItems]);
  const productsInCart = useMemo(() => activeProducts.filter(p => cartProductIds.includes(p.id)), [activeProducts, cartProductIds]);

  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);
  const cartQuantityTotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const grandTotal = subtotal + deliveryCharges + packagingCharges + overridePrice;

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

  const getProductDefaultVariant = (product: Product) => product.variants?.[0] ?? null;

  const selectedEditingProduct = useMemo(
    () => activeProducts.find((product) => product.id === selectedProductId) ?? null,
    [activeProducts, selectedProductId],
  );

  const addProductToEditingOrder = (product: Product, variant?: ProductVariant | null) => {
    const selectedVariant = variant ?? getProductDefaultVariant(product);
    if (!selectedVariant) {
      toast.error("This product has no variants");
      return;
    }

    setEditingItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id && item.variantId === selectedVariant.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && item.variantId === selectedVariant.id
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
          variantId: selectedVariant.id,
          productName: product.name,
          variantName: selectedVariant.name,
          price: selectedVariant.price,
          quantity: 1,
          image: product.image,
          action: "add" as const,
        },
      ];
    });
  };

  const openVariantDialogForProduct = (product: Product) => {
    if (!product.variants?.length) {
      toast.error("This product has no variants");
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
        variantId: item.variant?.id || item.id,
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
        setRemovedEditingItems((removedPrev) => Array.from(new Set([...removedPrev, itemToRemove.orderItemId!] )));
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
      });
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
        quantity: 0,
        image: productImageUrl(product.image)
      }];
    });
  };

  const finalizeCreateOrder = async (tableId?: string) => {
    if (cartItems.length === 0) return toast.error("Add items first");
    if (!tableId) return toast.error("Select a table first");

    const toastId = toast.loading("Placing order...");
    try {
      const payload = {
        tableId,
        items: cartItems.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity, price: i.price })),
        totalPrice: grandTotal,
        deliveryCharges,
        packagingPrice: packagingCharges,
      };
      await createOrder(payload);
      toast.success("Order placed successfully", { id: toastId });
      setCartItems([]);
      setView("list");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order", { id: toastId });
    }
  };

  const refetch = () => fetchOrders(1);

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
      <DialogContent className="max-w-3xl p-0 rounded-[12px] border-none overflow-hidden bg-transparent shadow-2xl">
        <DialogTitle className="sr-only">
          Order Details
        </DialogTitle>
        <div className="bg-white rounded-[12px] overflow-hidden shadow-lg">
          <div className="bg-white p-6">
            <div className="flex items-center justify-end">
              {/* <button onClick={() => setShowOrderDetailsDialog(false)} className="text-gray-400 bg-white p-2 rounded-full hover:bg-gray-50">
                <X className="h-5 w-5" />
              </button> */}
            </div>
          </div>

          <div className="px-6 pb-6">
            <button className="w-full bg-[#0f9d58] text-[#ffffff] py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-3">
              <Printer className="h-5 w-5" />
              Complete & Print
            </button>
          </div>

                    {orderDetails ? (
                      <div className="p-6">
                        <div className="mt-6 space-y-2 text-sm">
                          <div className="flex justify-between text-gray-500"><span>Sub-Total</span><span>Rs {orderDetails.Items.reduce((a,b) => a + Number(b.total || 0), 0)}</span></div>
                          <div className="flex justify-between text-gray-500"><span>Delivery Charges</span><span>Rs {orderDetails.deliveryCharges || 0}</span></div>
                          <div className="flex justify-between text-gray-500"><span>Packaging Fee</span><span>Rs {orderDetails.packagingPrice || 0}</span></div>
                        </div>

                        <div className="mt-6 rounded-xl bg-[#ef4444] text-[#ffffff] p-4 flex items-center justify-between">
                          <span className="font-black uppercase">Net Amount</span>
                          <span className="font-black text-xl">Rs {orderDetails.totalPrice}</span>
                        </div>

                        <div className="mt-4 text-xs text-gray-400">
                          <p>Contact Information:</p>
                          <p className="font-black text-gray-700">0300-4153368</p>
                          <p className="font-black text-gray-700">0335-4153368</p>
                        </div>
                      </div>
                    ) : null}
                </div>
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
            <div className="relative bg-[#0f9d58] px-6 pb-16 pt-6">
              

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
                <div className="mt-3 inline-flex rounded-full bg-[#eefaf3] px-4 py-1 text-[11px] font-black uppercase tracking-[0.3em] text-[#0f9d58]">
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
                    <span className="text-lg font-black text-[#0f9d58]">Rs {variant.price}</span>
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
      const updatedItems = editingItems.map((item) => ({
        id: item.orderItemId,
        action: item.action ?? (item.orderItemId ? "update" : "add"),
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      }));

      const removedItems = removedEditingItems.map((orderItemId) => ({
        id: orderItemId,
        action: "remove" as const,
        productId: "",
        variantId: "",
        quantity: 0,
        price: 0,
      }));

      await updateOrderById(editingOrderId, {
        status: editingStatus || editingOrder?.status || "PENDING",
        items: [...updatedItems, ...removedItems],
        totalPrice: editingGrandTotal,
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
      const updatedItems = editingItems.map((item) => ({
        id: item.orderItemId,
        action: item.action ?? (item.orderItemId ? "update" : "add"),
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      }));

      const removedItems = removedEditingItems.map((orderItemId) => ({
        id: orderItemId,
        action: "remove" as const,
        productId: "",
        variantId: "",
        quantity: 0,
        price: 0,
      }));

      await updateOrderById(editingOrderId, {
        status: "COMPLETED",
        items: [...updatedItems, ...removedItems],
        totalPrice: editingGrandTotal,
        deliveryCharges: editingDeliveryCharges,
        packagingPrice: editingPackagingCharges,
      });

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
        <main className="min-h-[calc(100vh-80px)] overflow-visible bg-white flex flex-col">
          {/* Green Header */}
         
            <button onClick={() => setView("list")} 
            className="bg-[#0C9E58] flex items-center justify-center gap-4 h-16 text-[#ffffff] font-bold text-lg">
              <ArrowLeft className="h-6 w-6" /> Active Orders
            </button>
        

          <div className="flex-1 flex items-start">
            {/* Left Column: Products */}
            <div className="w-[60%] flex flex-col bg-[#f8fafc] border-r border-gray-100">
              <div className="p-6 pb-0 flex-shrink-0">
                <div className="flex flex-wrap gap-4 pb-4">
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className={cn(
                      "rounded-2xl font-black transition whitespace-nowrap shadow-sm border-2 overflow-hidden text-left px-4 py-3",
                      selectedCategory === "All"
                        ? "bg-[#ef4444] border-[#ef4444] text-[#ffffff]"
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

                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.CategoryName)}
                      className={cn(
                        "rounded-2xl font-black transition whitespace-nowrap shadow-sm border-2 overflow-hidden text-left px-3 py-3",
                        selectedCategory === category.CategoryName
                          ? "bg-[#ef4444] border-[#ef4444] text-[#ffffff]"
                          : "bg-white border-gray-200 text-black hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#f8fafc] border border-[#eef2f7]">
                          {category.image ? (
                            <Image src={productImageUrl(category.image)} alt={category.CategoryName} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-[#92400e] text-sm font-black">
                              {category.CategoryName.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="truncate text-sm max-w-[80px]">
                          {category.CategoryName}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 p-6 pt-2">
                {filteredProducts.length === 0 ? (
                  <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-gray-200 bg-white text-center">
                    <p className="text-sm font-semibold text-gray-500">No products available</p>
                  </div>
                ) : (
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
                        <div className="relative w-full h-72 lg:h-80">
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
                )}
              </div>
            </div>

            {/* Right Column: Summary */}
            <div className="w-[40%] flex flex-col bg-[#f0fdf4] p-4 rounded-[20px] border border-[#dff7e9] relative">
              <div className="bg-[#0f9d58] rounded-t-[16px] p-5 flex-shrink-0 flex items-center justify-between text-[#ffffff] shadow-lg">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="font-black text-lg">Order Summary</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-white text-[#0f9d58] px-3 py-0.5 rounded-full text-xs font-black">{cartItems.length} items</span>
                  {cartItems.length > 0 && (
                    <button onClick={handleHoldOrder} className="bg-white p-1.5 text-[#448aff] font-bold rounded-xl hover:bg-white transition"><Pause className="h-4 w-4" /></button>
                  )}
                  {heldOrders.length > 0 && (
                    <button onClick={() => setIsQueueOpen(true)} className="bg-orange-400 text-[#ffffff] p-1.5 rounded-xl hover:bg-orange-500 transition shadow-sm relative"><History className="h-4 w-4" /><span className="absolute -top-1 -right-1 bg-white text-orange-500 text-[8px] font-black w-3 h-3 flex items-center justify-center rounded-full shadow-sm">{heldOrders.length}</span></button>
                  )}
                  <button onClick={() => setCartItems([])} className="bg-white p-1.5 rounded-xl text-[#ef4444] hover:bg-white/30 transition"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="flex-1 bg-transparent p-4 relative">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-gray-200 py-8">
                    <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
                    <p className="font-black text-lg text-gray-400">Your Order is Empty</p>
                    <p className="text-xs font-bold text-gray-400">Add items from the menu</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {productsInCart.map(product => (
                      <div key={product.id} className="bg-white rounded-2xl p-4 border border-[#dff7e9] shadow-sm animate-in fade-in zoom-in duration-300">
                        <div className="flex gap-4 mb-4">
                          <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                            <Image src={productImageUrl(product.image)} alt="selected" fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-xl truncate">{product.name}</h4>
                              <button onClick={() => setCartItems(prev => prev.filter(i => i.productId !== product.id))} className="text-gray-300 hover:text-gray-500 p-1"><X className="h-6 w-6" /></button>
                            </div>
                            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Configure variants</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {product.variants.map(v => {
                            const currentQty = cartItems.find(i => i.productId === product.id && i.variantId === v.id)?.quantity || 0;
                            return (
                              <div key={v.id} className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700">{v.name} <span className="text-[#ef4444] font-black">(Rs {v.price})</span></span>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => handleUpdateQty(product.id, v.id, -1)} className="h-9 w-9 rounded-xl border-2 border-[#ef4444] text-[#ef4444] flex items-center justify-center transition active:scale-90 shadow-sm"><Minus className="h-4 w-4" /></button>
                                  <span className="font-black text-lg min-w-[20px] text-center">{currentQty}</span>
                                  <button onClick={() => handleAddToCart(product, v)} className="h-9 w-9 rounded-xl bg-[#dcfce7] border-2 border-[#16a34a] text-[#16a34a] flex items-center justify-center transition active:scale-90 shadow-sm"><Plus className="h-4 w-4" /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-5 pt-5 border-t border-dashed border-[#e6f6ea] flex items-center justify-between">
                           <label className="text-lg font-semibold text-gray-400 uppercase tracking-wider">Override</label>
                           <div className="flex items-center gap-2">
                             <span className="text-gray-400 font-bold text-lg">Rs</span>
                             <input type="number" defaultValue={0} className="w-16 bg-gray-200 rounded-lg p-2 text-md font-black outline-none text-left border" />
                           </div>
                        </div>
                        <div className="text-right mt-2">
                           <span className="text-[#0f9d58] font-black text-lg">Rs {cartItems.filter(i => i.productId === product.id).reduce((a,b) => a + (b.price * b.quantity), 0)}</span>
                        </div>
                      </div>
                    ))}

                    {/* (duplicate Extra Charges removed - using the separate card below) */}
                  </div>
                )}
              </div>

              {/* Extra Charges (separate card) */}
              {cartItems.length > 0 && (
                <div className="p-4">
                  <div className="bg-white rounded-2xl p-4 border border-[#eef6ee] shadow-sm">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer py-2">
                        <div className="flex items-center gap-3 font-black text-gray-400 uppercase tracking-widest text-[14px]"><Plus className="h-8 w-8 bg-gray-50 text-gray-600 p-1 rounded-full border border-gray-600" /> Extra Charges (optional)</div>
                        <ChevronDown className="h-4 w-4 text-gray-300 transition group-open:rotate-180" />
                      </summary>
                      <div className="pt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm"><Store className="h-6 w-7 text-orange-400" /></div>
                            <span className="text-lg font-black text-gray-700">Delivery Charge</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-bold text-gray-400">Rs</span>
                            <input type="number" value={deliveryCharges} onChange={(e) => setDeliveryCharges(Number(e.target.value))} className="w-16 bg-gray-200 rounded-lg p-2 text-md font-black outline-none text-left border" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm"><Package className="h-5 w-5 text-gray-400" /></div>
                            <span className="text-lg font-black text-gray-700">Packing / Box Charge</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-bold text-gray-400">Rs</span>
                            <input type="number" value={packagingCharges} onChange={(e) => setPackagingCharges(Number(e.target.value))} className="w-16 bg-gray-200 rounded-lg p-2 text-md font-black outline-none text-left border" />
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              )}

              {cartItems.length > 0 && (
                 <div className="bg-[#f0fdf4] p-6 pt-0 rounded-b-[32px] flex-shrink-0">
                   <div className="bg-[#fff6ed] rounded-3xl p-6 border border-[#ffa218] shadow-inner">
                     <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 border-b-3 border-[#ffa218] pb-2">
                        <span className="uppercase tracking-widest">items ({cartItems.length} )</span>
                        <span className="text-gray-400">Rs {subtotal}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-black text-[#dd3a0f] uppercase tracking-tighter">Grand Total</span>
                        <span className="text-lg font-black text-[#dd3a0f] tracking-tight">Rs {grandTotal}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={actionLoading || cartQuantityTotal === 0}
                      className={cartQuantityTotal > 0 ? "w-full py-5 mt-4 rounded-[32px] font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition active:scale-95 bg-[#0f9d58] text-[#ffffff] hover:bg-[#0b8a4a]" : "w-full py-5 mt-4 rounded-[32px] font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition active:scale-95 bg-[#e5e7eb] text-gray-400 cursor-not-allowed"}
                    >
                      {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-6 w-6" />}
                      Place Order Now
                    </button>
                </div>
              )}
            </div>
          </div>

          {/* Held Orders Dialog */}
          <Dialog open={isQueueOpen} onOpenChange={setIsQueueOpen}>
            <DialogContent className="max-w-md p-0 rounded-[40px] border-none overflow-hidden bg-[#f8fafc] shadow-2xl">
              <DialogHeader className="bg-[#0f9d58] p-8 text-[#ffffff] relative">
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
                          className="bg-[#0f9d58] text-[#ffffff] px-8 py-3 rounded-2xl font-black text-lg shadow-lg hover:bg-[#0b8a4a] transition"
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
              <DialogHeader className="bg-[#009447] px-4 py-4 md:px-6 text-[#ffffff] relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#009447] shrink-0">
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
                      className="w-full rounded-[16px] bg-gradient-to-r from-[#fd6000] to-[#d72600] px-4 py-5 md:px-6 md:py-6 text-left text-[#ffffff] shadow-[0_10px_26px_rgba(255,89,0,0.35)] transition hover:-translate-y-0.5"
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
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-[#0f9d58]" />
                  </div>
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
                        className="group rounded-[18px] border-2 border-[#62c2a3] bg-gradient-to-br from-[#d8ece8] to-[#bddfd7] p-3 text-left shadow-[0_8px_22px_rgba(2,106,82,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(2,106,82,0.2)]"
                      >
                        <div className="flex min-h-[210px] flex-col items-center justify-between rounded-[14px]   px-3 py-4">
                          <Armchair className="h-6 w-6 text-[#2aa47a]" />
                          <p className="text-6xl leading-none font-black tracking-tight text-[#008257] drop-shadow-[0_3px_6px_rgba(0,130,87,0.22)]">
                            {table.tableNumber}
                          </p>
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0f8660]">Tap to select</span>
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

          <div className="fixed bottom-6 right-6 z-50">
            <button onClick={() => refetch()} className="bg-[#ef4444] text-[#ffffff] p-4 rounded-[20px] shadow-2xl transition hover:scale-110 active:scale-90">
              <RotateCcw className={cn("h-6 w-6", ordersLoading && "animate-spin")} />
            </button>
          </div>
        </main>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeTab="orders">
      <main className="w-full space-y-8 bg-[#f8fafc] min-h-[calc(100vh-80px)]">
        <button 
          onClick={() => setView("create")}
          className="w-full bg-[#0B9D58] text-[#ffffff] py-5 rounded-3xl  text-xl flex items-center justify-center gap-3 shadow-xl transition hover:bg-[#0B9D58] hover:-translate-y-1 active:translate-y-0"
        >
          <Plus className="h-7 w-7" /> Create New Order
        </button>

        {ordersLoading && !orders.length ? (
          <div className="flex justify-center py-32"><Loader2 className="h-12 w-12 animate-spin text-[#0f9d58]" /></div>
        ) : (
          <div className="space-y-8 pb-20">
            {displayedOrders.map((order) => {
              const isTakeAway = String(order.table || "").toLowerCase().includes("take");
              const cardBg = isTakeAway ? "bg-[#f8f2e8]" : "bg-[#c5f7cf]";
              const cardBorder = isTakeAway ? "border-[#ffb347]" : "border-[#9ed7ad]";
              const priceChipBg = "bg-[#d8f4e0]";
              const priceChipText = "text-[#0f7d5f]";

              return (
                <div key={order.id} className="relative rounded-[24px] overflow-visible transition-all duration-500">
                  <div className={cn("absolute left-0 top-0 bottom-0 w-2 rounded-l-[24px]", isTakeAway ? "bg-[#ff9800]" : "bg-[#ff6f61]")} />

                  <div className={cn("p-5 sm:p-6 rounded-[24px] border shadow-sm", cardBg, cardBorder)}>
                    <div className="flex items-start justify-between gap-4 mb-4 sm:mb-6">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <h2 className="text-[#ef2f1f] font-black text-2xl sm:text-3xl tracking-tight">{order.orderNumber}</h2>
                        <span className={cn("px-4 py-1.5 rounded-2xl text-sm font-black border shadow-sm", priceChipBg, priceChipText, "border-[#9ed7ad]")}>Rs. {order.totalPrice}</span>
                        <h3 className="text-[#ef2f1f] font-black text-4xl sm:text-5xl tracking-tight capitalize">{order.table || "Take Away"}</h3>
                      </div>
                      <button type="button" onClick={() => void openOrderDetails(order.id)} className="bg-[#ffd9cf] p-2.5 rounded-xl text-[#ef2f1f] shadow-sm hover:bg-[#ffd1c2] transition" aria-label="Open order details"><Eye className="h-5 w-5" /></button>
                    </div>

                    <div className="flex items-center gap-6 text-gray-600 text-sm font-bold mb-5 sm:mb-6">
                      <span className="flex items-center gap-2"><Store className="h-5 w-5 text-gray-400" /> {order.table || "test"}</span>
                      <span className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-gray-400" /> {formatElapsed(order.createdAt)}</span>
                    </div>

                    {!expandedOrderId && (
                      <div className="flex flex-wrap gap-4 mb-5 sm:mb-6">
                        {order.Items.slice(0, 3).map((item) => (
                          <div key={item.id} className="bg-white rounded-[26px] border-2 border-[#ff5f57] p-3.5 flex items-center gap-4 pr-6 relative shadow-sm transition hover:scale-[1.02] min-w-[270px]">
                            <div className="relative h-18 w-18 rounded-[18px] overflow-hidden shadow-md border-2 border-white shrink-0">
                              <Image src={productImageUrl(item.image)} alt={item.productName} fill className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-base text-[#111827] truncate">{item.productName}</h4>
                              <p className="text-[#0f9d58] font-black text-base mt-2">Rs. {item.total}</p>
                            </div>
                            <span className="absolute top-3 right-3 bg-[#ffe7e4] text-[#ef4444] px-3 py-1 rounded-full text-xs font-black shadow-sm">x{item.quantity}</span>
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
                        <p className="text-3xl sm:text-4xl font-black text-[#0b7d57]">Rs {order.totalPrice}</p>
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
                          className="flex items-center gap-2 text-[#ef2f1f] font-normal text-xl px-4 py-2 transition hover:bg-white/35 rounded-2xl"
                        >
                          {expandedOrderId === order.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          {expandedOrderId === order.id ? "Order Details" : "Edit Order"}
                        </button>
                        <button
                            onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                            className="bg-[#0a9954] text-[#ffffff] px-8 py-4 rounded-full font-black text-lg flex items-center gap-3 shadow-lg hover:bg-[#0a874a] transition"
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
                                      <span className="absolute top-1 right-1 bg-[#ef4444] text-[#ffffff] text-xs font-black w-6 h-6 flex items-center justify-center rounded-full">{item.quantity}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-black text-[#111827] text-base truncate">{item.productName}</h5>
                                      <div className="mt-2 text-[#0f9d58] font-black text-sm leading-none">
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
                              <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-[#0f9d58]" /></div>
                            ) : (
                              <div className="rounded-[20px] border border-[#cfe8d4] bg-[#c5f7cf] p-4">
                                <h4 className="flex items-center gap-3 font-medium text-gray-700 mb-4 text-base">
                                  <Plus className="h-6 w-6 text-[#0f9d58]" /> Add More Products
                                </h4>
                                <div className="flex flex-wrap gap-4 pb-4">
                                  {categories.map((category) => (
                                    <button
                                      key={category.id}
                                      onClick={() => setSelectedCategory(category.CategoryName)}
                                      className={cn(
                                        "rounded-2xl font-black transition whitespace-nowrap shadow-sm border-2 overflow-hidden text-left px-3 py-3",
                                        selectedCategory === category.CategoryName
                                          ? "bg-[#ef4444] border-[#ef4444] text-[#ffffff]"
                                          : "bg-white border-gray-200 text-black hover:border-gray-300"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#f8fafc] border border-[#eef2f7]">
                                          {category.image ? (
                                            <Image src={productImageUrl(category.image)} alt={category.CategoryName} fill className="object-cover" />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-[#92400e] text-sm font-black">
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
                                        ? "bg-[#ef4444] border-[#ef4444] text-[#ffffff]"
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
                                          alreadyAdded ? "border-[#0f9d58]" : "border-transparent hover:border-[#0f9d58]"
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
                                              <span className="text-[#0f9d58]">Rs. {variant.price}</span>
                                            </div>
                                          ))}
                                          <div className="mt-4 rounded-2xl bg-[#f0fdf4] px-3 py-2 text-center text-xs font-black uppercase tracking-[0.25em] text-[#0f9d58]">
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

        <div className="fixed bottom-12 right-12">
          <button onClick={() => refetch()} className="bg-[#ef4444] text-[#ffffff] p-6 rounded-[32px] shadow-[0_20px_50px_rgba(239,68,68,0.5)] transition hover:scale-110 active:scale-90">
            <RotateCcw className={cn("h-8 w-8", ordersLoading && "animate-spin")} />
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#0f9d58]" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
