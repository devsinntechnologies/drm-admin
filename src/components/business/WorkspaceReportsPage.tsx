"use client";

import { useMemo, useState } from "react";
import { BarChart3, Download, Loader2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import {
  FormField,
  PortalPage,
  PortalPageHeader,
  PortalStatCard,
  portalBtnPrimaryClass,
  portalBtnSecondaryClass,
  portalInputClass,
  portalPanelClass,
} from "@/components/admin/PortalPage";
import { DataTable } from "@/components/workspace/DataTable";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";
import { usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { asList } from "@/lib/api";
import { downloadSalesReportPdf } from "@/lib/sales-report-pdf";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { toast } from "sonner";

type InvoiceReports = {
  fromDate: string;
  toDate: string;
  revenue: { completed: number; open: number; total: number };
  orders: { total: number; completed: number; cancelled: number; open: number };
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
  byOrderType: Array<{ orderType: string; count: number; revenue: number }>;
};

function monthStartIso() {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function WorkspaceReportsPage() {
  const { money } = usePharmacyMarket();
  const { businessName } = useBusinessTemplate();
  const [fromDate, setFromDate] = useState(monthStartIso);
  const [toDate, setToDate] = useState(todayIso);
  const [appliedFrom, setAppliedFrom] = useState(fromDate);
  const [appliedTo, setAppliedTo] = useState(toDate);
  const rangeKey = `${appliedFrom}:${appliedTo}`;

  const invoicePath = `/dashboard/reports?fromDate=${appliedFrom}&toDate=${appliedTo}`;
  const { data: invoiceReport, loading } = usePharmacyQuery<InvoiceReports>(invoicePath, rangeKey);

  const topRows = useMemo(
    () =>
      asList<InvoiceReports["topProducts"][number]>(invoiceReport?.topProducts).map((row) => ({
        name: row.name,
        qty: Number(row.quantity).toFixed(0),
        revenue: money(Number(row.revenue)),
      })),
    [invoiceReport, money],
  );

  const downloadPdf = () => {
    if (!invoiceReport) {
      toast.error("No report data to download yet.");
      return;
    }
    downloadSalesReportPdf({
      businessName: businessName || "DigiNizam",
      fromDate: appliedFrom,
      toDate: appliedTo,
      sales: money(Number(invoiceReport.revenue?.total ?? 0)),
      unpaid: money(Number(invoiceReport.revenue?.open ?? 0)),
      invoices: invoiceReport.orders?.total ?? 0,
      paidInvoices: invoiceReport.orders?.completed ?? 0,
      topItems: topRows,
    });
  };

  return (
    <AdminShell activeTab="reports" pageTitle="Reports" pageSubtitle="Filter a date range and review live sales">
      <PortalPage>
        <PortalPageHeader
          icon={BarChart3}
          title="Reports"
          subtitle="Invoices, sales, and top items for the selected period"
          actions={
            <button
              type="button"
              onClick={downloadPdf}
              disabled={loading || !invoiceReport}
              className={`${portalBtnPrimaryClass} !w-auto px-4 py-2.5`}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          }
        />

        <div className={`${portalPanelClass} mb-6`}>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="From">
              <input
                type="date"
                className={portalInputClass}
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </FormField>
            <FormField label="To">
              <input
                type="date"
                className={portalInputClass}
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </FormField>
            <div className="flex items-end">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setAppliedFrom(fromDate);
                  setAppliedTo(toDate);
                }}
                className={`${portalBtnSecondaryClass} !w-auto px-5 py-2.5`}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Apply filters
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <PortalStatCard label="Sales" value={money(Number(invoiceReport?.revenue.total ?? 0))} />
          <PortalStatCard label="Unpaid" value={money(Number(invoiceReport?.revenue.open ?? 0))} tone="accent" />
          <PortalStatCard label="Invoices" value={invoiceReport?.orders.total ?? 0} />
          <PortalStatCard
            label="Paid invoices"
            value={invoiceReport?.orders.completed ?? 0}
            tone="secondary"
          />
        </div>
        <h2 className="mt-6 text-sm font-semibold text-[#64748b]">Top items</h2>
        <DataTable
          columns={[
            { key: "name", label: "Item" },
            { key: "qty", label: "Qty", className: "text-right" },
            { key: "revenue", label: "Revenue", className: "text-right" },
          ]}
          rows={topRows}
          empty={<p className="py-6 text-sm text-[var(--text-muted)]">No sales in this period</p>}
        />
        {(invoiceReport?.byOrderType ?? []).length ? (
          <>
            <h2 className="mt-6 text-sm font-semibold text-[#64748b]">By order type</h2>
            <DataTable
              columns={[
                { key: "orderType", label: "Type" },
                { key: "count", label: "Invoices" },
                { key: "revenue", label: "Revenue" },
              ]}
              rows={asList<InvoiceReports["byOrderType"][number]>(invoiceReport?.byOrderType).map((row) => ({
                orderType: String(row.orderType ?? "—"),
                count: String(row.count),
                revenue: money(Number(row.revenue)),
              }))}
            />
          </>
        ) : null}
      </PortalPage>
    </AdminShell>
  );
}
