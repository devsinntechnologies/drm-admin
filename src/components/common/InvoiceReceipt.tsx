"use client";

import Image from "next/image";
import { CalendarDays, Hash, Printer, QrCode, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

export type InvoiceLineItem = {
  id?: string;
  productName: string;
  quantity: number;
  price: number | string;
  total?: number | string;
  variantName?: string;
};

export type InvoiceReceiptProps = {
  orderNumber: string;
  businessName?: string;
  tableLabel?: string | null;
  date?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  deliveryCharges?: number;
  packagingPrice?: number;
  total: number;
  status?: string;
  contactPhone?: string;
  contactPhoneAlt?: string;
  className?: string;
  compact?: boolean;
};

function formatMoney(value: number) {
  return `Rs. ${value.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function lineTotal(item: InvoiceLineItem) {
  const unit = Number(item.price) || 0;
  const qty = Number(item.quantity) || 1;
  const explicit = Number(item.total);
  return Number.isFinite(explicit) && explicit > 0 ? explicit : unit * qty;
}

export default function InvoiceReceipt({
  orderNumber,
  businessName = "Restaurant Manager",
  tableLabel,
  date,
  items,
  subtotal,
  deliveryCharges = 0,
  packagingPrice = 0,
  total,
  status,
  contactPhone = "0300-4153368",
  contactPhoneAlt = "0335-4153368",
  className,
  compact = false,
}: InvoiceReceiptProps) {
  const displayDate =
    date ??
    new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const statusLabel = status?.toLowerCase();
  const statusTone =
    statusLabel === "paid"
      ? "bg-[#ecfdf5] text-[#059669] border-[#bbf7d0]"
      : statusLabel === "pending"
        ? "bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]"
        : "bg-[#eef3ff] text-[#0050f8] border-[#c7d7f5]";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#001840_0%,#0050F8_100%)] px-6 py-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Image src="/logo-mark.png" alt="" width={32} height={28} className="h-7 w-auto object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">DigiNizam Receipt</p>
              <h3 className="text-lg font-bold leading-tight">{businessName}</h3>
            </div>
          </div>
          {status ? (
            <span className={cn("rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider", statusTone)}>
              {status}
            </span>
          ) : null}
        </div>
      </div>

      <div className={cn("space-y-5", compact ? "p-4" : "p-6")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ef] bg-[#f8fbff] px-3 py-1.5 text-xs font-bold text-[#334155]">
            <Hash className="h-3.5 w-3.5 text-[#0050F8]" />
            {orderNumber}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ef] bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-[#64748b]">
            <CalendarDays className="h-3.5 w-3.5 text-[#0050F8]" />
            {displayDate}
          </div>
        </div>

        {tableLabel ? (
          <div className="flex items-center gap-3 rounded-xl border border-[#dbe4ef] bg-[#eef3ff] px-4 py-3">
            <Utensils className="h-5 w-5 shrink-0 text-[#0050F8]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Service</p>
              <p className="text-base font-bold text-[#001840]">{tableLabel}</p>
            </div>
          </div>
        ) : null}

        <div>
          <div className="grid grid-cols-[1fr_64px_96px] gap-3 border-b border-[#e2e8f0] pb-2 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
            <span>Item</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Total</span>
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {items.map((item, index) => (
              <div key={item.id ?? `${item.productName}-${index}`} className="grid grid-cols-[1fr_64px_96px] gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0f172a]">{item.productName}</p>
                  {item.variantName ? (
                    <p className="mt-0.5 text-xs text-[#64748b]">{item.variantName} · {formatMoney(Number(item.price))}</p>
                  ) : (
                    <p className="mt-0.5 text-xs text-[#64748b]">{formatMoney(Number(item.price))} each</p>
                  )}
                </div>
                <p className="text-center text-sm font-bold text-[#334155]">{item.quantity}</p>
                <p className="text-right text-sm font-bold text-[#001840]">{formatMoney(lineTotal(item))}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-[#e2e8f0] bg-[#f8fbff] p-4 text-sm">
          <div className="flex items-center justify-between text-[#64748b]">
            <span>Subtotal</span>
            <span className="font-semibold text-[#334155]">{formatMoney(subtotal)}</span>
          </div>
          {deliveryCharges > 0 ? (
            <div className="flex items-center justify-between text-[#64748b]">
              <span>Delivery</span>
              <span className="font-semibold text-[#334155]">{formatMoney(deliveryCharges)}</span>
            </div>
          ) : null}
          {packagingPrice > 0 ? (
            <div className="flex items-center justify-between text-[#64748b]">
              <span>Packaging</span>
              <span className="font-semibold text-[#334155]">{formatMoney(packagingPrice)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between border-t border-[#dbe4ef] pt-3">
            <span className="text-sm font-bold uppercase tracking-wide text-[#001840]">Net Amount</span>
            <span className="text-xl font-bold text-[#0050F8]">{formatMoney(total)}</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-[#edf2f7] pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Contact</p>
            <p className="text-sm font-bold text-[#334155]">{contactPhone}</p>
            <p className="text-sm font-bold text-[#334155]">{contactPhoneAlt}</p>
          </div>
          <QrCode className="h-10 w-10 text-[#001840]/40" />
        </div>
      </div>

      <footer className="border-t border-[#edf2f7] bg-[#f8fbff] px-6 py-4 text-center">
        <p className="text-sm font-medium italic text-[#64748b]">Thank you for dining with us!</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">Powered by DigiNizam</p>
      </footer>
    </article>
  );
}

export function InvoicePrintButton({
  onClick,
  loading,
  label = "Print Receipt",
  className,
}: {
  onClick?: () => void;
  loading?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn("dn-btn dn-btn-primary gap-2", className)}
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
