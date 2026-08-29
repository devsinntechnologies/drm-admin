"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Loader2 } from "lucide-react";
import { PortalCard, PortalStatCard, portalBtnPrimaryClass, portalInputClass } from "@/components/admin/PortalPage";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";
import { usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { getModuleHref } from "@/lib/module-routes";

type InvoiceReports = {
  revenue: { completed: number; open: number; total: number };
  orders: { total: number; completed: number; open: number };
};

function monthStartIso() {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardReportsSection() {
  const { templateConfig } = useBusinessTemplate();
  const { money } = usePharmacyMarket();
  const industryId = templateConfig?.industryId;
  const reportsOn = (templateConfig?.enabledModules ?? []).includes("reports");
  const pharmacy = industryId === "pharmacy";
  const [fromDate, setFromDate] = useState(monthStartIso);
  const [toDate, setToDate] = useState(todayIso);
  const [appliedFrom, setAppliedFrom] = useState(fromDate);
  const [appliedTo, setAppliedTo] = useState(toDate);
  const rangeKey = `${appliedFrom}:${appliedTo}`;

  const invoicePath = reportsOn && !pharmacy ? `/dashboard/reports?fromDate=${appliedFrom}&toDate=${appliedTo}` : null;
  const pharmacyBestPath =
    reportsOn && pharmacy
      ? `/pharmacy-reports/best-sellers?fromDate=${appliedFrom}&toDate=${appliedTo}`
      : null;

  const { data: invoiceReport, loading: invoiceLoading } = usePharmacyQuery<InvoiceReports>(invoicePath, rangeKey);
  const { data: best, loading: bestLoading } = usePharmacyQuery<Array<{ name: string; qty: number; revenue: number }>>(
    pharmacyBestPath,
    rangeKey,
  );

  if (!reportsOn) return null;

  const loading = invoiceLoading || bestLoading;
  const reportsHref = getModuleHref("reports", industryId);

  return (
    <PortalCard
      title="Reports"
      subtitle="Same filters as the Reports module — change dates and apply"
      icon={BarChart3}
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">From</span>
          <input
            type="date"
            className={portalInputClass}
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">To</span>
          <input
            type="date"
            className={portalInputClass}
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setAppliedFrom(fromDate);
            setAppliedTo(toDate);
          }}
          className={`${portalBtnPrimaryClass} !w-auto px-4 py-2`}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Apply
        </button>
        <Link href={reportsHref} className="text-sm font-semibold text-[var(--brand-secondary)] underline">
          Open full reports
        </Link>
      </div>

      {pharmacy ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <PortalStatCard
            label="Best seller (period)"
            value={best?.[0]?.name ?? "—"}
          />
          <PortalStatCard label="Best-seller revenue" value={money(Number(best?.[0]?.revenue ?? 0))} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <PortalStatCard label="Sales" value={money(Number(invoiceReport?.revenue.total ?? 0))} />
          <PortalStatCard label="Invoices" value={invoiceReport?.orders.total ?? 0} />
          <PortalStatCard label="Unpaid" value={money(Number(invoiceReport?.revenue.open ?? 0))} tone="secondary" />
        </div>
      )}
    </PortalCard>
  );
}
