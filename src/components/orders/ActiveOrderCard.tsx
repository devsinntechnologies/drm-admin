"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderRecord } from "@/hooks/useOrders";
import { ProductMediaImage } from "@/components/common/ProductMediaImage";
import { resolveOrderItemImage } from "@/lib/product-image";
import { OrderSessionPanel } from "@/components/orders/OrderSessionPanel";
import { hasTimedTableSession, resolveTimedOrderTotal } from "@/lib/session-billing.util";

type OrdersSettings = {
  allowRemove?: boolean;
  allowComplete?: boolean;
  allowViewDetails?: boolean;
  enableTableSession?: boolean;
  allowSessionPause?: boolean;
  allowSessionAddTime?: boolean;
  allowSessionEditTime?: boolean;
};

type Props = {
  order: OrderRecord;
  settings: OrdersSettings;
  actionLoading?: boolean;
  formatElapsed: (createdAt: string) => string;
  onRemove: (orderId: string) => void;
  onComplete: (order: OrderRecord) => void;
  onViewDetails?: (orderId: string) => void;
  onSessionPatch: (
    orderId: string,
    payload: { paused?: boolean; sessionMinutes?: number },
  ) => Promise<void>;
};

function tableHeadline(order: OrderRecord): string {
  const tableProduct =
    order.Items.find((i) => /table/i.test(i.productName))?.productName ?? order.table ?? "Counter";
  const guest = order.tableGuestName?.trim();
  if (guest) return `${tableProduct} · ${guest}`;
  return tableProduct;
}

export function ActiveOrderCard({
  order,
  settings,
  actionLoading,
  formatElapsed,
  onRemove,
  onComplete,
  onViewDetails,
  onSessionPatch,
}: Props) {
  const isTakeAway = String(order.table || "").toLowerCase().includes("take");
  const hasSession = Boolean(settings.enableTableSession && hasTimedTableSession(order));
  const [, tick] = useState(0);
  useEffect(() => {
    if (!hasSession) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [hasSession, order.id, order.sessionPausedAt, order.sessionPausedMs, order.sessionMinutes]);
  const headline = tableHeadline(order);
  const total = hasSession
    ? resolveTimedOrderTotal({ order: { ...order, Items: order.Items } })
    : Number(order.totalPrice);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-[0_2px_8px_rgba(22,163,74,0.12)]",
        isTakeAway
          ? "border-orange-300 bg-orange-50/80"
          : hasSession
            ? "border-green-300 bg-[#ecfdf5]"
            : "border-[#c7d7f5] bg-[#eef3ff]",
      )}
    >
      <div
        className={cn(
          "absolute bottom-0 left-0 top-0 w-1.5",
          isTakeAway ? "bg-orange-500" : "bg-[#f97316]",
        )}
      />

      <div className="pl-4 pr-4 py-4 sm:pl-5 sm:pr-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
            <h3
              className={cn(
                "text-xl font-black leading-tight sm:text-2xl",
                hasSession ? "text-[#e11d48]" : "text-[#001840]",
              )}
            >
              {headline}
            </h3>
            <span className="rounded-lg border border-[#059669]/25 bg-[#059669]/10 px-2.5 py-1 text-lg font-black text-[#059669] sm:text-xl">
              Rs. {Number.isFinite(total) ? total.toLocaleString() : order.totalPrice}
            </span>
            {hasSession ? (
              <span className="text-base font-extrabold text-slate-600">{formatElapsed(order.createdAt)}</span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {settings.allowViewDetails && onViewDetails ? (
              <button
                type="button"
                onClick={() => onViewDetails(order.id)}
                className="rounded-xl border border-[#c7d7f5] bg-white p-2.5 text-[#0050F8] shadow-sm transition hover:bg-[#eef3ff]"
                aria-label="View invoice"
              >
                <Eye className="h-5 w-5" />
              </button>
            ) : null}
            {settings.allowRemove ? (
              <button
                type="button"
                onClick={() => onRemove(order.id)}
                disabled={actionLoading}
                className="rounded-xl border border-red-200 bg-white p-2.5 text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                aria-label="Remove order"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            ) : null}
            {settings.allowComplete ? (
              <button
                type="button"
                onClick={() => onComplete(order)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-3 text-base font-black text-white shadow-md transition hover:bg-[#15803d] sm:px-6 sm:py-3.5 sm:text-lg"
              >
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" /> Complete
              </button>
            ) : null}
          </div>
        </div>

        {!hasSession ? (
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">{order.orderNumber}</p>
        ) : null}

        {hasSession ? (
          <div className="mt-3">
            <OrderSessionPanel
              order={order}
              allowPause={settings.allowSessionPause}
              allowAddTime={settings.allowSessionAddTime}
              allowEditTime={settings.allowSessionEditTime}
              busy={actionLoading}
              onPatch={(payload) => onSessionPatch(order.id, payload)}
            />
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {order.Items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/80 bg-white px-2.5 py-1.5 text-sm shadow-sm"
            >
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md">
                <ProductMediaImage
                  src={resolveOrderItemImage(item.productId, item.image)}
                  alt={item.productName}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-black text-[#0f172a]">{item.productName}</span>
              <span className="font-bold text-[#059669]">x{item.quantity}</span>
              <span className="font-black text-[#059669]">Rs {item.total ?? item.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
