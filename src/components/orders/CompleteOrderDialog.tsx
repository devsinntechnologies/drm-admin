"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Wallet,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CreditPartyDialog from "@/components/retail/CreditPartyDialog";
import { checkoutPaymentOptions, type OrderPaymentMethodId } from "@/lib/order-payment-methods";
import type { OrderCreditDetails } from "@/lib/credit-types";
import { hasCreditIdentifier } from "@/lib/credit-types";
import type { OrderRecord } from "@/hooks/useOrders";
import { ProductMediaImage } from "@/components/common/ProductMediaImage";
import { resolveOrderItemImage } from "@/lib/product-image";
import {
  formatSessionClock,
  sessionPlayedSeconds,
  sessionRemainingSeconds,
} from "@/lib/session-timer-web";
import {
  hasTimedTableSession,
  isOpenEndedSession,
  liveSessionCharge,
  packageOvertimeMinutes,
  resolveTimedOrderTotal,
  snookerOptionFor,
} from "@/lib/session-billing.util";

type Props = {
  open: boolean;
  order: OrderRecord | null;
  allowCredit: boolean;
  token: string | null;
  businessId: string | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    paymentMethod: OrderPaymentMethodId;
    credit?: OrderCreditDetails | null;
    totalPrice: number;
  }) => Promise<void>;
};

function tableLabel(order: OrderRecord): string {
  const tableItem = order.Items?.find((i) => /table/i.test(i.productName));
  const table = tableItem?.productName ?? order.table ?? "Order";
  const guest = order.tableGuestName?.trim();
  if (guest) return `${table} · ${guest}`;
  return table;
}

function PaymentTile({
  label,
  image,
  selected,
  onSelect,
}: {
  label: string;
  image: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const isCredit = label.toLowerCase().includes("credit");
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex h-[168px] flex-col rounded-[18px] border bg-white p-3 shadow-[0_3px_10px_rgba(0,0,0,0.06)] transition ${
        selected ? "border-[#16a34a] border-[2.6px] bg-[#ecfdf5]" : "border-[#d1d5db] border-[1.3px]"
      }`}
    >
      {selected ? (
        <CheckCircle2 className="absolute right-2.5 top-2.5 h-7 w-7 text-[#16a34a]" />
      ) : null}
      <div className="flex flex-1 items-center justify-center">
        {image ? (
          <Image
            src={image}
            alt={label}
            width={140}
            height={110}
            className="max-h-[110px] w-auto object-contain"
            unoptimized
          />
        ) : isCredit ? (
          <Wallet className="h-16 w-16 text-[#059669]" strokeWidth={1.5} />
        ) : (
          <CreditCard className="h-16 w-16 text-[#059669]" strokeWidth={1.5} />
        )}
      </div>
      <p
        className={`text-center text-[17px] font-black ${
          selected ? "text-[#14532d]" : "text-[#334155]"
        }`}
      >
        {label}
      </p>
    </button>
  );
}

export function CompleteOrderDialog({
  open,
  order,
  allowCredit,
  token,
  businessId,
  busy,
  onClose,
  onConfirm,
}: Props) {
  const [method, setMethod] = useState<OrderPaymentMethodId>("cash");
  const [credit, setCredit] = useState<OrderCreditDetails | null>(null);
  const [creditOpen, setCreditOpen] = useState(false);
  const [clock, setClock] = useState(0);

  const options = useMemo(() => checkoutPaymentOptions(allowCredit), [allowCredit]);

  useEffect(() => {
    if (!open || !order || !hasTimedTableSession(order)) return;
    const id = window.setInterval(() => setClock((c) => c + 1), 1000);
    return () => window.clearInterval(id);
  }, [open, order]);

  const resolvedTotal = useMemo(() => {
    if (!order) return 0;
    void clock;
    if (hasTimedTableSession(order)) {
      return resolveTimedOrderTotal({ order });
    }
    const n = Number(order.totalPrice);
    return Number.isFinite(n) ? n : 0;
  }, [order, clock]);

  const sessionMeta = useMemo(() => {
    if (!order || !hasTimedTableSession(order)) return null;
    void clock;
    const openEnded = isOpenEndedSession(order);
    const remaining = openEnded ? 0 : sessionRemainingSeconds(order);
    const played = sessionPlayedSeconds(order);
    const game = (order.gameType ?? "").trim();
    const overtime = !openEnded && remaining < 0;
    const tableCharge = liveSessionCharge(order);
    const otMins = packageOvertimeMinutes(order);
    const opt = snookerOptionFor(game);
    return {
      playedLabel: formatSessionClock(played),
      overtimeMin: overtime ? Math.ceil(Math.abs(remaining) / 60) : 0,
      game,
      tableCharge,
      otMins,
      otRate: opt?.perMinuteRate ?? 0,
    };
  }, [order, clock]);

  const creditBusinessId = businessId ?? order?.businessId ?? null;

  const submit = async () => {
    if (method === "credit" && !hasCreditIdentifier(credit ?? {})) {
      setCreditOpen(true);
      return;
    }
    await onConfirm({
      paymentMethod: method,
      credit: method === "credit" ? credit : null,
      totalPrice: resolvedTotal,
    });
  };

  if (!order) return null;

  const itemCount = order.Items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const totalLabel = resolvedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="flex max-h-[88vh] max-w-[820px] flex-col gap-0 overflow-hidden rounded-[22px] p-0">
          <DialogTitle className="sr-only">Complete order</DialogTitle>
          <div className="bg-gradient-to-br from-[#0a9954] via-[#16a34a] to-[#22c55e] px-5 py-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[14px] bg-white/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-[22px] font-black leading-tight">Complete order</p>
                  <p className="text-[15px] font-bold text-white/90">{tableLabel(order)}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-white/15">
                <X className="h-7 w-7" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="rounded-[14px] border border-[#16a34a]/35 bg-[#ecfdf5] px-[18px] py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-600">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </p>
                  {sessionMeta ? (
                    <p
                      className={`mt-1 text-[13px] font-bold ${
                        sessionMeta.overtimeMin > 0 ? "text-[#dc2626]" : "text-slate-500"
                      }`}
                    >
                      {[
                        sessionMeta.game,
                        `Played ${sessionMeta.playedLabel}`,
                        sessionMeta.overtimeMin > 0 ? `OT +${sessionMeta.overtimeMin}m` : null,
                        sessionMeta.otMins > 0 && sessionMeta.otRate > 0
                          ? `Billed OT ${sessionMeta.otMins}m @ Rs ${sessionMeta.otRate}/min`
                          : null,
                        sessionMeta.tableCharge > 0
                          ? `Table Rs ${sessionMeta.tableCharge.toLocaleString()}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>
                <p className="text-[32px] font-black leading-none text-[#059669]">Rs {totalLabel}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {order.Items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-[14px] border border-[#e2e8f0] bg-white p-3"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#e2e8f0]">
                    <ProductMediaImage
                      src={resolveOrderItemImage(item.productId, item.image)}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black text-[#0f172a]">{item.productName}</p>
                    <p className="text-sm font-bold text-slate-500">Qty {item.quantity}</p>
                  </div>
                  <p className="text-lg font-black text-[#059669]">
                    Rs {Number(item.total ?? item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <p className="mb-3 mt-5 text-lg font-black text-[#334155]">Payment method</p>
            <div className="grid grid-cols-2 gap-3.5">
              {options.map((opt) => (
                <PaymentTile
                  key={opt.id}
                  label={opt.label}
                  image={opt.image}
                  selected={method === opt.id}
                  onSelect={() => {
                    setMethod(opt.id as OrderPaymentMethodId);
                    if (opt.id === "credit") setCreditOpen(true);
                  }}
                />
              ))}
            </div>
            {method === "credit" && credit && hasCreditIdentifier(credit) ? (
              <p className="mt-3 text-sm font-semibold text-slate-600">
                Credit: {credit.name}
                {credit.phone ? ` · ${credit.phone}` : ""}
              </p>
            ) : null}
          </div>

          <div className="flex gap-3.5 border-t border-[#e2e8f0] px-5 py-5">
            <button
              type="button"
              onClick={onClose}
              className="h-16 flex-1 rounded-[14px] border-[1.5px] border-[#94a3b8] text-lg font-extrabold text-[#475569]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="flex h-16 flex-[2] items-center justify-center gap-2 rounded-[14px] bg-[#16a34a] text-xl font-black text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-7 w-7 animate-spin" /> : <CheckCircle2 className="h-7 w-7" />}
              Complete
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <CreditPartyDialog
        open={creditOpen}
        onOpenChange={setCreditOpen}
        token={token}
        businessId={creditBusinessId}
        initial={credit}
        onSave={(details) => {
          setCredit(details);
          setMethod("credit");
          setCreditOpen(false);
        }}
      />
    </>
  );
}
