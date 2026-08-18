"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function InteractionAlertList({
  alerts,
}: {
  alerts: Array<{ type: string; severity: string; message: string; block?: boolean }>;
}) {
  if (!alerts?.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((alert, index) => (
        <div
          key={`${alert.type}-${index}`}
          className={cn(
            "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
            alert.block ? "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]" : "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
          )}
        >
          {alert.block ? <ShieldAlert className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
}

export function GstBreakdown({
  subtotal,
  tax,
  discount,
  total,
  taxLabel = "Tax",
  money,
  extra,
}: {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  taxLabel?: string;
  money?: (value: number) => string;
  extra?: Array<{ label: string; value: number }>;
}) {
  const fmt = money ?? ((value: number) => value.toFixed(2));
  const row = (label: string, value: number) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#64748b]">{label}</span>
      <span className="font-semibold text-[#0f172a]">{fmt(value)}</span>
    </div>
  );
  return (
    <div className="space-y-1.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
      {row("Subtotal", subtotal)}
      {row("Discount", discount)}
      {row(taxLabel, tax)}
      {(extra || []).map((item) => (
        <div key={item.label}>{row(item.label, item.value)}</div>
      ))}
      <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-2 text-base">
        <span className="font-semibold">Total</span>
        <span className="font-bold">{fmt(total)}</span>
      </div>
    </div>
  );
}

export function ControlledSaleGate({
  doctorLicense,
  patientIdNumber,
  onDoctor,
  onPatient,
  doctorLabel = "Doctor license",
  patientLabel = "Patient ID",
}: {
  doctorLicense: string;
  patientIdNumber: string;
  onDoctor: (value: string) => void;
  onPatient: (value: string) => void;
  doctorLabel?: string;
  patientLabel?: string;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-[#fecaca] bg-[#fff7f7] p-4 md:grid-cols-2">
      <label className="text-sm font-medium text-[#991b1b]">
        {doctorLabel}
        <input
          value={doctorLicense}
          onChange={(event) => onDoctor(event.target.value)}
          className="mt-1 w-full rounded-lg border border-[#fecaca] px-3 py-2 text-[#0f172a]"
        />
      </label>
      <label className="text-sm font-medium text-[#991b1b]">
        {patientLabel}
        <input
          value={patientIdNumber}
          onChange={(event) => onPatient(event.target.value)}
          className="mt-1 w-full rounded-lg border border-[#fecaca] px-3 py-2 text-[#0f172a]"
        />
      </label>
    </div>
  );
}
