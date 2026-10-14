"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CreditPartyDialog from "@/components/retail/CreditPartyDialog";
import { checkoutPaymentOptions, type OrderPaymentMethodId } from "@/lib/order-payment-methods";
import type { OrderCreditDetails } from "@/lib/credit-types";
import { hasCreditIdentifier } from "@/lib/credit-types";
import type { OrderRecord } from "@/hooks/useOrders";

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
  }) => Promise<void>;
};

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

  const options = useMemo(() => checkoutPaymentOptions(allowCredit), [allowCredit]);

  const tableLabel =
    order?.Items?.find((i) => /table/i.test(i.productName))?.productName ??
    order?.table ??
    "Order";

  const itemCount = order?.Items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  const submit = async () => {
    if (method === "credit" && !hasCreditIdentifier(credit ?? {})) {
      setCreditOpen(true);
      return;
    }
    await onConfirm({
      paymentMethod: method,
      credit: method === "credit" ? credit : null,
    });
  };

  if (!order) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl p-0">
          <DialogTitle className="sr-only">Complete order</DialogTitle>
          <div className="bg-gradient-to-br from-[#0a9954] via-[#16a34a] to-[#22c55e] px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-9 w-9" />
                <div>
                  <p className="text-xl font-black">Complete order</p>
                  <p className="text-sm font-semibold text-white/90">{tableLabel}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-full bg-white/20 p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
                {order.orderNumber}
              </p>
              <p className="mt-1 text-2xl font-black text-[#001840]">
                Rs. {Number(order.totalPrice).toLocaleString()}
              </p>
              <p className="text-sm text-[#64748b]">
                {itemCount} item{itemCount === 1 ? "" : "s"}
                {order.tableGuestName ? ` · ${order.tableGuestName}` : ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748b]">
                Payment method
              </p>
              <div className="grid grid-cols-2 gap-2">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setMethod(opt.id as OrderPaymentMethodId);
                      if (opt.id === "credit") setCreditOpen(true);
                    }}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-bold transition ${
                      method === opt.id
                        ? "border-[#16a34a] bg-[#f0fdf4] text-[#14532d]"
                        : "border-[#e2e8f0] bg-white text-[#334155]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {method === "credit" && credit && hasCreditIdentifier(credit) ? (
                <p className="mt-2 text-xs font-semibold text-[#64748b]">
                  Credit: {credit.name}
                  {credit.phone ? ` · ${credit.phone}` : ""}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="dn-btn dn-btn-primary w-full !h-12 !rounded-xl !text-base"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              Confirm & complete
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <CreditPartyDialog
        open={creditOpen}
        onOpenChange={setCreditOpen}
        token={token}
        businessId={businessId}
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
