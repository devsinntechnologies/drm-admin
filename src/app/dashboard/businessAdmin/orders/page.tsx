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

  const { products, loading: productsLoading } = useProducts({ page: 1, limit: 100 });
  const { orders, loading: ordersLoading, fetchOrders, updateOrderStatus, updateOrderById, createOrder, getOrderById, actionLoading } = useOrders({ range: "day" });
  const { tables, loading: tablesLoading } = useTables({ page: 1, limit: 100 });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    if (!(role || storedRole)) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
    }
  }, [role, router]);

  const activeProducts = useMemo(() => products.filter(p => p.status === "ACTIVE"), [products]);
  const categories = useMemo(() => {
    const cats = new Set<string>();
    activeProducts.forEach(p => p.category?.CategoryName && cats.add(p.category.CategoryName));
    return ["All", ...Array.from(cats)];
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

  const editingSubtotal = useMemo(
    () => editingItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [editingItems],
  );
  const editingGrandTotal = editingSubtotal + editingDeliveryCharges + editingPackagingCharges + editingOverridePrice;
  const visibleOrders = useMemo(
    () => orders.filter((order) => String(order.status).toUpperCase() !== "COMPLETED"),
    [orders],
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

  const addProductToEditingOrder = (product: Product) => {
    const variant = getProductDefaultVariant(product);
    if (!variant) {
      toast.error("This product has no variants");
      return;
    }

    setEditingItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id && item.variantId === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && item.variantId === variant.id
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
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          price: variant.price,
          quantity: 1,
          image: product.image,
          action: "add" as const,
        },
      ];
    });
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
        <div className="bg-white rounded-[12px] overflow-hidden shadow-lg">
          <div className="bg-white p-6">
            <div className="flex items-center justify-end">
              {/* <button onClick={() => setShowOrderDetailsDialog(false)} className="text-gray-400 bg-white p-2 rounded-full hover:bg-gray-50">
                <X className="h-5 w-5" />
              </button> */}
            </div>
          </div>

          <div className="px-6 pb-6">
            <button className="w-full bg-[#0f9d58] text-white py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-3">
              <Printer className="h-5 w-5" />
              Complete & Print
            </button>
          </div>

          <div className="p-6 bg-white">
            <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
              {!orderDetails ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-[#0f9d58]" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 font-black uppercase tracking-widest">Invoice To:</p>
                    <h3 className="text-2xl font-black mt-2">Order #{orderDetails.orderNumber}</h3>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className="grid grid-cols-12 gap-4 items-center border-b pb-3">
                      <div className="col-span-7 text-sm font-black text-gray-700">Item Description</div>
                      <div className="col-span-2 text-sm font-black text-gray-700 text-center">QTY</div>
                      <div className="col-span-3 text-sm font-black text-gray-700 text-right">TOTAL</div>
                    </div>

                    <div className="mt-3 space-y-3">
                      {orderDetails.Items.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-white p-2 rounded-md">
                          <div className="col-span-7 flex items-center gap-3">
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden border">
                              <Image src={productImageUrl(item.image)} alt={item.productName} fill className="object-cover" />
                            </div>
                            <div>
                              <p className="font-black text-sm">{item.productName}</p>
                              <p className="text-xs text-gray-400">{item.variant?.name || "Default"}</p>
                            </div>
                          </div>
                          <div className="col-span-2 text-center font-black">x{item.quantity}</div>
                          <div className="col-span-3 text-right font-black">Rs {item.total}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-500"><span>Sub-Total</span><span>Rs {orderDetails.Items.reduce((a,b) => a + Number(b.total || 0), 0)}</span></div>
                      <div className="flex justify-between text-gray-500"><span>Delivery Charges</span><span>Rs {orderDetails.deliveryCharges || 0}</span></div>
                      <div className="flex justify-between text-gray-500"><span>Packaging Fee</span><span>Rs {orderDetails.packagingPrice || 0}</span></div>
                    </div>

                    <div className="mt-6 rounded-xl bg-[#ef4444] text-white p-4 flex items-center justify-between">
                      <span className="font-black uppercase">Net Amount</span>
                      <span className="font-black text-xl">Rs {orderDetails.totalPrice}</span>
                    </div>

                    <div className="mt-4 text-xs text-gray-400">
                      <p>Contact Information:</p>
                      <p className="font-black text-gray-700">0300-4153368</p>
                      <p className="font-black text-gray-700">0335-4153368</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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


  if (view === "create") {
    return (
      <AdminShell activeTab="orders">
        <main className="h-[calc(100vh-80px)] overflow-hidden bg-white flex flex-col">
          {/* Green Header */}
         
            <button onClick={() => setView("list")} 
            className="bg-[#0C9E58] flex items-center justify-center gap-4 h-16 text-white font-bold text-lg">
              <ArrowLeft className="h-6 w-6" /> Active Orders
            </button>
        

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
                        selectedCategory === cat ? "bg-[#0C9E58] border-[#0C9E58] text-white" : "bg-white border-transparent text-gray-400 hover:border-gray-200"
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
                    onClick={() => setShowConfirmDialog(true)}
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

          {/* Table Selection Dialog */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="max-w-6xl p-0 rounded-[40px] border-none overflow-hidden bg-[#f8fafc] shadow-2xl">
              <DialogHeader className="bg-[#0f9d58] p-8 text-white relative">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <DialogTitle className="text-3xl text-white">Where to serve?</DialogTitle>
                    <p className="mt-1 text-sm text-white/80">Select a table to place this order</p>
                  </div>
                  {/* <button onClick={() => setShowConfirmDialog(false)} className="rounded-full bg-white/20 p-2 transition hover:bg-white/30">
                    <X className="h-5 w-5" />
                  </button> */}
                </div>
              </DialogHeader>

              <div className="p-8">
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-[#9ca3af]">
                    <ShoppingCart className="h-4 w-4" />
                    Quick Service
                  </div>

                  {takeAwayTable ? (
                    <button
                      type="button"
                      onClick={() => {
                        void finalizeCreateOrder(takeAwayTable.id);
                        setShowConfirmDialog(false);
                      }}
                      className="w-full rounded-[18px] bg-gradient-to-r from-[#ff8a00] to-[#ff3d00] px-5 py-4 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/20">
                            <ShoppingCart className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-lg font-black leading-none">Self Pickup / Take Away</p>
                            <p className="mt-1 text-xs font-semibold text-white/80">Quick order without table service</p>
                          </div>
                        </div>
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white/90">→</span>
                      </div>
                    </button>
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-gray-200 bg-white px-5 py-4 text-sm font-semibold text-gray-400">
                      No take away table found in tables API.
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-[#9ca3af]">
                    <Table2 className="h-4 w-4" />
                    Dining Tables
                  </div>
                </div>

                {tablesLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-[#0f9d58]" />
                  </div>
                ) : diningTables.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400 font-bold">
                    No tables found
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                    {diningTables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => {
                          void finalizeCreateOrder(table.id);
                          setShowConfirmDialog(false);
                        }}
                        className="group rounded-[28px] border border-[#d1fae5] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:border-[#0f9d58]/40"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]",
                              table.status === "available"
                                ? "bg-emerald-50 text-emerald-700"
                                : table.status === "occupied"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-amber-50 text-amber-700"
                            )}
                          >
                            {table.status}
                          </span>
                          <Table2 className="h-5 w-5 text-[#0f9d58] opacity-70 group-hover:opacity-100" />
                        </div>
                        <div className="min-h-[120px] rounded-[24px] bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5] p-4 flex flex-col justify-between">
                          <div className="text-center">
                            <p className="text-4xl font-black tracking-tight text-[#047857]">{table.tableNumber}</p>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-[#059669]">
                            <span>Tap to select</span>
                            <span>{table.capacity} seats</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {orderDetailsDialog}

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
          className="w-full bg-[#0B9D58] text-[#ffffff] py-5 rounded-3xl  text-xl flex items-center justify-center gap-3 shadow-xl transition hover:bg-[#0B9D58] hover:-translate-y-1 active:translate-y-0"
        >
          <Plus className="h-7 w-7" /> Create New Order
        </button>

        {ordersLoading && !orders.length ? (
          <div className="flex justify-center py-32"><Loader2 className="h-12 w-12 animate-spin text-[#0f9d58]" /></div>
        ) : (
          <div className="space-y-8 pb-20">
            {visibleOrders.map(order => (
              <div key={order.id} className="relative rounded-[12px] overflow-visible transition-all duration-500">
                <div className="absolute left-6 top-4 bottom-4 w-3 bg-gray-300 rounded-r-md shadow-sm" />

                <div className="bg-[#d8ffea] p-8 pl-12 rounded-[12px] border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-[#ef4444] font-black text-2xl tracking-tighter">{order.orderNumber}</h2>
                      <span className="bg-[#e6fff0] text-[#166534] px-4 py-1.5 rounded-2xl text-sm font-black border border-[#166534]/10 shadow-sm">Rs. {order.totalPrice}</span>
                      <h3 className="text-[#ef4444] font-black text-5xl ml-6">{order.table || "Take Away"}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => void openOrderDetails(order.id)} className="bg-white p-2 rounded-full text-[#ef4444] border border-white shadow-sm hover:bg-white transition" aria-label="Open order details"><Eye className="h-5 w-5" /></button>
                      {expandedOrderId === order.id && (
                        <>
                          <button 
                            onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                            className="bg-[#0f9d58] text-white px-8 py-3 rounded-2xl font-black text-lg flex items-center gap-2 shadow-xl hover:bg-[#0b8a4a] transition"
                          >
                            <CheckCircle2 className="h-6 w-6" /> Complete
                          </button>
                        </>
                      )}
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

                  <div className="flex items-end justify-between border-t border-transparent pt-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Amount Payable</p>
                      <div className="flex gap-3 mb-3">
                        <span className="bg-[#fee2e2] text-[#ef4444] px-3 py-1 rounded-xl text-[10px] font-black border border-[#ef4444]/10">Delivery: Rs {order.deliveryCharges || 0}</span>
                        <span className="bg-[#fff7ed] text-[#f97316] px-3 py-1 rounded-xl text-[10px] font-black border border-[#f97316]/10">Pkg: Rs {order.packagingPrice || 0}</span>
                      </div>
                      <p className="text-[#0f9d58] font-black text-5xl tracking-tighter">Rs {order.totalPrice}</p>
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
                        className="flex items-center gap-3 text-[#ef4444] font-black text-xl px-6 py-3 transition hover:bg-black/5 rounded-2xl border-2 border-transparent hover:border-[#ef4444]/10"
                      >
                        {expandedOrderId === order.id ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                        {expandedOrderId === order.id ? "Order Details" : "Edit Order"}
                      </button>
                      {!expandedOrderId && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                          className="bg-[#0f9d58] text-white px-10 py-4 rounded-[24px] font-black text-xl flex items-center gap-3 shadow-2xl hover:bg-[#0b8a4a] transition hover:-translate-y-1"
                        >
                          <CheckCircle2 className="h-7 w-7" /> Complete
                        </button>
                      )}
                    </div>
                  </div>

                  {expandedOrderId === order.id && editingOrderId === order.id && editingOrder && (
                    <div className="mt-10 pt-10 border-t border-gray-100 animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-3 text-gray-700 font-black text-xl">
                          <X className="h-6 w-6 rotate-45 text-[#ef4444]" /> Edit Order
                        </div>
                        <button
                          onClick={saveOrderChanges}
                          disabled={actionLoading}
                          className="bg-[#ef4444] text-white px-12 py-4 rounded-[28px] font-black text-lg shadow-2xl flex items-center gap-3 hover:bg-[#dc2626] transition hover:-translate-y-1 disabled:opacity-60"
                        >
                          {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                          Save Changes
                        </button>
                      </div>

                      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
                        <div className="bg-white/50 rounded-[48px] p-8 border-4 border-white shadow-inner">
                          <h4 className="flex items-center gap-3 font-black text-gray-500 mb-8 uppercase tracking-widest text-sm">
                            <UtensilsCrossed className="h-6 w-6 text-[#ef4444]" /> Current Items
                          </h4>
                          <div className="space-y-4">
                            {editingItems.length === 0 ? (
                              <div className="rounded-[28px] border border-dashed border-gray-200 bg-white p-10 text-center font-bold text-gray-400">
                                No items in this order
                              </div>
                            ) : (
                              editingItems.map((item) => (
                                <div key={`${item.productId}-${item.variantId}`} className="bg-white rounded-[32px] p-5 flex items-center gap-5 border border-black/5 shadow-md">
                                  <div className="relative h-20 w-20 rounded-[20px] overflow-hidden border-4 border-white shadow-xl">
                                    <Image src={productImageUrl(item.image)} alt={item.productName} fill className="object-cover" />
                                    <span className="absolute top-0 right-0 bg-[#ef4444] text-white text-xs font-black w-7 h-7 flex items-center justify-center rounded-bl-[20px]">{item.quantity}</span>
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-black text-[#111827] text-lg">{item.productName}</h5>
                                    <div className="flex items-center gap-3 mt-2">
                                      <span className="text-gray-400 font-bold text-sm">Rs <span className="bg-gray-50 px-3 py-1 rounded-xl text-[#111827]">{item.price}</span></span>
                                      <span className="text-[#0f9d58] font-black text-sm ml-3">Total: Rs {item.price * item.quantity}</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{item.variantName}</p>
                                  </div>
                                  <div className="flex items-center gap-3 bg-gray-50 rounded-[20px] p-2">
                                    <button onClick={() => updateEditingItemQty(item.productId, item.variantId, -1)} className="h-9 w-9 rounded-xl border-2 bg-white flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition"><Minus className="h-4 w-4" /></button>
                                    <span className="font-black text-xl w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => updateEditingItemQty(item.productId, item.variantId, 1)} className="h-9 w-9 rounded-xl border-2 bg-white flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition"><Plus className="h-4 w-4" /></button>
                                  </div>
                                  <button onClick={() => removeEditingItem(item.productId, item.variantId)} className="text-[#ef4444] text-xs font-black px-4 hover:underline transition">× Remove</button>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="mt-6 grid grid-cols-2 gap-4">
                            <div>
                              <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-gray-400">Status</label>
                              <select value={editingStatus} onChange={(e) => setEditingStatus(e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-[#111827] outline-none">
                                <option value={editingOrder.status}>{editingOrder.status}</option>
                                <option value="PENDING">PENDING</option>
                                <option value="PREPARING">PREPARING</option>
                                <option value="READY">READY</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-gray-400">Table</label>
                              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-[#111827]">{editingOrder.table || "Take Away"}</div>
                            </div>
                          </div>

                          <div className="mt-6 grid grid-cols-3 gap-4">
                            <div className="rounded-[24px] bg-white p-4 shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subtotal</p>
                              <p className="mt-2 text-xl font-black text-[#111827]">Rs {editingSubtotal}</p>
                            </div>
                            <div className="rounded-[24px] bg-white p-4 shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery</p>
                              <input type="number" value={editingDeliveryCharges} onChange={(e) => setEditingDeliveryCharges(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 font-black outline-none" />
                            </div>
                            <div className="rounded-[24px] bg-white p-4 shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Packaging</p>
                              <input type="number" value={editingPackagingCharges} onChange={(e) => setEditingPackagingCharges(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 font-black outline-none" />
                            </div>
                          </div>

                          <div className="mt-4 rounded-[24px] bg-white p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Override</p>
                            <input type="number" value={editingOverridePrice} onChange={(e) => setEditingOverridePrice(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 font-black outline-none" />
                          </div>

                          <div className="mt-6 flex items-center justify-between rounded-[28px] bg-[#fff7ed] px-6 py-4">
                            <span className="text-lg font-black text-[#ef4444] uppercase tracking-tighter">Grand Total</span>
                            <span className="text-3xl font-black text-[#ef4444]">Rs {editingGrandTotal}</span>
                          </div>
                        </div>

                        <div className="flex-1">
                           <h4 className="flex items-center gap-3 font-black text-gray-500 mb-8 uppercase tracking-widest text-sm">
                             <Plus className="h-6 w-6 text-[#0f9d58]" /> Add More Products
                           </h4>

                           {productsLoading ? (
                             <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-[#0f9d58]" /></div>
                           ) : (
                             <div className="grid grid-cols-2 gap-6 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                               {activeProducts.map((product) => {
                                 const alreadyAdded = editingItems.some((item) => item.productId === product.id);
                                 return (
                                   <button
                                     key={product.id}
                                     onClick={() => addProductToEditingOrder(product)}
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
                           )}
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
        </div>
      </main>

      {orderDetailsDialog}
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
