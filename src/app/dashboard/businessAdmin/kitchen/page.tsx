"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Clock3,
  CookingPot,
  Loader2,
  Store,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";
import { cn } from "@/lib/utils";

type KitchenLane = "new" | "cooking" | "ready";

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

function productImageUrl(imagePath?: string | null) {
  if (!imagePath) {
    return "/business/pic1.jpeg";
  }
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  return `${BASE_URL}/${imagePath}`;
}

function KitchenPageContent() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [removedOrderIds, setRemovedOrderIds] = useState<Record<string, boolean>>({});

  const {
    orders: activeOrders,
    loading: ordersLoading,
    updateOrderStatus,
    refetch,
  } = useOrders({ range: "day" });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? window.localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    const isStaffRole = currentRole === "business_admin" || currentRole === "kitchen" || currentRole === "waiter";
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;

    if (!isStaffRole && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  // Listen for orders completed from orders page
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

  // Filter orders into Takeaway vs Dining
  const takeawayOrders = useMemo(() => {
    return activeOrders.filter((o: any) => {
      if (removedOrderIds[o.id]) return false;
      const orderType = (o.orderType ?? "").toString().toLowerCase().replace(/\s/g, "");
      const table = (o.table ?? "").toString().toLowerCase().replace(/\s/g, "");
      // hide completed/served orders from kitchen
      const status = (o.status ?? "").toString().toLowerCase();
      if (status === "served" || status === "completed" || status === "delivered") return false;
      // Treat missing table, explicit orderType 'takeaway', or table labelled 'take away' as takeaway
      return !o.table || orderType === "takeaway" || table === "takeaway";
    });
  }, [activeOrders, removedOrderIds]);

  const diningOrders = useMemo(() => {
    return activeOrders.filter((o: any) => {
      if (removedOrderIds[o.id]) return false;
      const orderType = (o.orderType ?? "").toString().toLowerCase().replace(/\s/g, "");
      const table = (o.table ?? "").toString().toLowerCase().replace(/\s/g, "");
      const status = (o.status ?? "").toString().toLowerCase();
      if (status === "served" || status === "completed" || status === "delivered") return false;
      return !( !o.table || orderType === "takeaway" || table === "takeaway" );
    });
  }, [activeOrders, removedOrderIds]);

  async function moveKitchenOrder(orderId: string, currentStatus: string) {
    setUpdatingOrderId(orderId);
    let nextStatus = "cooking";
    const status = currentStatus.toLowerCase();

    if (["pending", "new", "placed"].includes(status)) {
      nextStatus = "cooking";
    } else if (["preparing", "cooking", "in_progress", "in-progress"].includes(status)) {
      nextStatus = "ready";
    } else if (status === "ready") {
      nextStatus = "served";
    }

    const toastId = toast.loading("Updating order status...");
    try {
      await updateOrderStatus(orderId, nextStatus);
      // Optimistically remove order from kitchen UI when marked served
      if (nextStatus === "served") {
        setRemovedOrderIds(prev => ({ ...prev, [orderId]: true }));
      }
      toast.success(`Order moved to ${nextStatus}`, { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update order status.";
      toast.error(message, { id: toastId });
    } finally {
      setUpdatingOrderId(null);
    }
  }

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="kitchen">
      <main className="h-[calc(100vh-80px)] overflow-hidden bg-[#f8fafc]">
        <div className="h-full flex flex-col p-6 pb-24 overflow-hidden">
          
          {/* Main Grid: Two Columns */}
          <div className="flex-1 grid grid-cols-2 gap-8 min-h-0">
            
            {/* Take Away / Packaging Column */}
            <div className="flex flex-col gap-6 min-h-0">
              {/* Summary Card */}
              <div className="bg-[#fff7ed] rounded-[32px] p-6 flex items-center gap-4 shadow-sm border border-[#ffedd5]">
                <div className="h-14 w-14 rounded-full bg-[#f74d0b] flex items-center justify-center shadow-lg shadow-gree-200">
                  <Bell className="h-7 w-7 text-[#ffffff]" />
                </div>
                <div>
                  <h2 className="text-[#995239] font-black text-sm uppercase tracking-wider">Take Away / Packaging</h2>
                  <p className="text-4xl font-black text-[#7e2a0c]">{takeawayOrders.length}</p>
                </div>
              </div>

              {/* Lane Container */}
              <div className="flex-1 bg-[#fff7ed]/50 rounded-[40px] border border-[#ffedd5] overflow-hidden flex flex-col p-6 min-h-0">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {takeawayOrders.length > 0 ? (
                    <div className="grid gap-4">
                      {takeawayOrders.map(order => (
                        <OrderCard key={order.id} order={order} onMove={moveKitchenOrder} updating={updatingOrderId === order.id} />
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                      <div className="h-24 w-24 rounded-full bg-[#ffedd5] flex items-center justify-center mb-4">
                        <CookingPot className="h-12 w-12 text-[#9a3412]" />
                      </div>
                      <h3 className="text-2xl font-black text-[#7c2d12]">No orders</h3>
                      <p className="text-[#9a3412] font-medium">New orders will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dining Order Column */}
            <div className="flex flex-col gap-6 min-h-0">
              {/* Summary Card */}
              <div className="bg-[#f0fdf4] rounded-[32px] p-6 flex items-center gap-4 shadow-sm border border-[#dcfce7]">
                <div className="h-14 w-14 rounded-full bg-[#0f9d58] flex items-center justify-center shadow-lg shadow-green-200">
                  <CheckCircle2 className="h-7 w-7 text-[#ffffff]" />
                </div>
                <div>
                  <h2 className="text-[#166534] font-black text-sm uppercase tracking-wider">Dining Order</h2>
                  <p className="text-4xl font-black text-[#14532d]">{diningOrders.length}</p>
                </div>
              </div>

              {/* Lane Container */}
              <div className="flex-1 bg-[#f0fdf4]/50 rounded-[40px] border border-[#dcfce7] overflow-hidden flex flex-col p-6 min-h-0">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {diningOrders.length > 0 ? (
                    <div className="grid gap-4">
                      {diningOrders.map(order => (
                        <OrderCard key={order.id} order={order} onMove={moveKitchenOrder} updating={updatingOrderId === order.id} />
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                      <div className="h-24 w-24 rounded-full bg-[#dcfce7] flex items-center justify-center mb-4">
                        <CookingPot className="h-12 w-12 text-[#166534]" />
                      </div>
                      <h3 className="text-2xl font-black text-[#14532d]">No orders</h3>
                      <p className="text-[#166534] font-medium">New orders will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Floating Refresh */}
          <button 
            onClick={() => refetch()}
            className="fixed bottom-8 right-8 h-14 w-14 rounded-2xl bg-[#ef4444] text-[#ffffff] shadow-xl shadow-red-200 flex items-center justify-center hover:scale-110 transition-all z-50 group"
          >
            <RotateCcw className={cn("h-6 w-6 transition-transform group-hover:rotate-180", ordersLoading && "animate-spin")} />
          </button>

        </div>
      </main>
    </AdminShell>
  );
}

function OrderCard({ order, onMove, updating }: { order: any, onMove: any, updating: boolean }) {
  const status = order.status.toLowerCase();
  const isNew = ["pending", "new", "placed"].includes(status);
  const isCooking = ["preparing", "cooking", "in_progress", "in-progress"].includes(status);
  const isReady = status === "ready";
  const isServed = status === "served" || status === "completed" || status === "delivered";

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            "h-2.5 w-2.5 rounded-full",
            isNew ? "bg-[#ef4444]" : isCooking ? "bg-[#f97316]" : "bg-[#0f9d58]"
          )} />
          <h4 className="text-sm font-black text-slate-400 uppercase tracking-tighter">{order.orderNumber}</h4>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
          <Clock3 className="h-3.5 w-3.5" />
          {formatElapsed(order.createdAt)}
        </div>
      </div>

      {order.table && (
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-[#ef4444]" />
          <span className="text-lg font-black text-[#111827]">{order.table}</span>
        </div>
      )}

      <div className="space-y-3 py-4 border-y border-dashed border-slate-100">
        {order.Items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden relative">
              <Image src={productImageUrl(item.image)} alt={item.productName} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-[#1e293b] truncate">
                <span className="text-[#ef4444]">{item.quantity}x</span> {item.productName}
              </p>
              {item.variant?.name && (
                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.variant.name}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {isServed ? (
        <div className="w-full h-12 rounded-2xl text-sm font-black text-[#0f9d58] transition-all shadow-md flex items-center justify-center gap-2 bg-[#ecfdf5] border border-[#dcfce7]">
          <CheckCircle2 className="h-5 w-5" />
          COMPLETED
        </div>
      ) : (
        <button
          onClick={() => onMove(order.id, order.status)}
          disabled={updating}
          className={cn(
            "w-full h-12 rounded-2xl text-sm font-black text-[#ffffff] transition-all shadow-md flex items-center justify-center gap-2",
            isNew ? "bg-[#ef4444]" : isCooking ? "bg-[#f97316]" : "bg-[#0f9d58]"
          )}
        >
          {updating && <Loader2 className="h-4 w-4 animate-spin" />}
          {isNew ? "START COOKING" : isCooking ? "MARK AS READY" : "MARK AS SERVED"}
        </button>
      )}
    </div>
  );
}

export default function KitchenPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" /></div>}>
      <KitchenPageContent />
    </Suspense>
  );
}
