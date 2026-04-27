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
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";

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
  return `https://${BASE_URL}/${imagePath}`;
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
  return "Mark as Served";
}

function KitchenPageContent() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const {
    orders: activeOrders,
    loading: ordersLoading,
    updateOrderStatus,
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

  if (!isAuthorized) {
    return null;
  }

  return (
    <AdminShell activeTab="kitchen">
      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl space-y-4">
          <section className="rounded-2xl bg-[linear-gradient(90deg,#ff7300_0%,#ee0010_100%)] p-6 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] border border-white/20">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-white/20">
                <CookingPot className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Kitchen Board</h1>
                <p className="text-sm text-white/90">{kitchenOrders.length} active orders • Manage preparation flow</p>
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

            <article className="rounded-2xl border border-[#feeacc] bg-[#fff9ef] p-4 shadow-[0_6px_14px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ff9500] text-white"><CookingPot className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm text-[#4b5563]">In Cooking</p>
                  <strong className="text-4xl font-bold text-[#111827]">{cookingOrders.length}</strong>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-[#dcfce7] bg-[#f0fdf4] p-4 shadow-[0_6px_14px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#16a34a] text-white"><Clock3 className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm text-[#4b5563]">Ready for Service</p>
                  <strong className="text-4xl font-bold text-[#111827]">{readyOrders.length}</strong>
                </div>
              </div>
            </article>
          </section>

          <section className="grid items-start gap-5 lg:grid-cols-3">
            {(["new", "cooking", "ready"] as const).map((lane) => {
              const laneOrders = lane === "new" ? newOrders : lane === "cooking" ? cookingOrders : readyOrders;
              return (
                <div key={lane} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm border border-[#e5edf5]">
                    <div className="flex items-center gap-2">
                       <span className={`h-2.5 w-2.5 rounded-full ${laneBadgeColor(lane)}`} />
                       <h2 className="text-sm font-bold uppercase tracking-wider text-[#4b5563]">{laneTitle(lane)}</h2>
                    </div>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{laneOrders.length}</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {laneOrders.map((order) => (
                      <article
                        key={order.id}
                        className="group relative flex flex-col gap-3 rounded-2xl border border-white bg-white/90 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(15,23,42,0.1)]"
                      >
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#64748b]">{order.orderNumber}</span>
                            <span className="flex items-center gap-1 text-[11px] font-medium text-[#94a3b8]">
                               <Clock3 className="h-3 w-3" /> {formatElapsed(order.createdAt)}
                            </span>
                         </div>

                         <div className="flex items-center gap-2">
                            <Store className="h-3.5 w-3.5 text-[#64748b]" />
                            <span className="text-sm font-semibold text-[#111827]">{order.table || "Take Away"}</span>
                         </div>

                         <div className="space-y-2.5 border-y border-dashed border-slate-200 py-3">
                            {order.Items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3">
                                 <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-slate-100 shadow-sm">
                                    <Image src={productImageUrl(item.image)} alt={item.productName} fill sizes="40px" className="object-cover" />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-[#334155]">
                                       <span className="mr-1 text-[#ef4444]">{item.quantity}x</span> {item.productName}
                                    </p>
                                    <p className="text-[11px] text-[#94a3b8]">{item.variant.name}</p>
                                 </div>
                              </div>
                            ))}
                         </div>

                         <button
                           type="button"
                           disabled={updatingOrderId === order.id}
                           onClick={() => moveKitchenOrder(order.id, lane)}
                           className={`mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${laneButtonClass(lane)}`}
                         >
                           {updatingOrderId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                           {laneActionLabel(lane)}
                         </button>
                      </article>
                    ))}

                    {laneOrders.length === 0 && (
                      <div className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                         <p className="text-xs font-medium text-slate-400">No orders in this phase</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </main>
    </AdminShell>
  );
}

export default function KitchenPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" /></div>}>
      <KitchenPageContent />
    </Suspense>
  );
}
