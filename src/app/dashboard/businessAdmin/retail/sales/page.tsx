"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock3, Eye, FileText, Search } from "lucide-react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, portalSearchClass } from "@/components/admin/PortalPage";
import InvoiceReceipt, { InvoiceDownloadButton, InvoicePrintButton } from "@/components/common/InvoiceReceipt";
import { PrinterAccessAlert } from "@/components/common/PrinterAccessAlert";
import { useInvoiceBranding } from "@/hooks/useInvoiceBranding";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useInvoices, type InvoiceRecord } from "@/hooks/useInvoices";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { parseSalesSettings } from "@/lib/module-feature-settings";
import { formatInvoiceDateTime } from "@/lib/invoice-datetime";

type RangeFilter = "day" | "week" | "month";

function parsePrice(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function invoiceAmounts(invoice: InvoiceRecord) {
  const items = invoice.Items ?? invoice.items ?? [];
  const itemsSubtotal = items.reduce((sum, item) => {
    const explicit = Number(item.total);
    if (Number.isFinite(explicit) && explicit > 0) return sum + explicit;
    return sum + parsePrice(item.price) * Number(item.quantity || 0);
  }, 0);
  const stored = parsePrice(invoice.totalPrice);
  const total = stored > 0 ? stored : itemsSubtotal;
  const subtotal =
    typeof invoice.subtotal === "number" && invoice.subtotal > 0
      ? invoice.subtotal
      : itemsSubtotal;
  return { subtotal, total, items };
}

function formatDate(value: string) {
  return formatInvoiceDateTime(value);
}

function SalesContent() {
  const router = useRouter();
  const { role } = useAuth();
  const branding = useInvoiceBranding();
  const { templateConfig } = useBusinessTemplate();
  const allowPrinter = parseSalesSettings(templateConfig?.moduleSettings).allowPrinter;
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("day");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [printerAlertOpen, setPrinterAlertOpen] = useState(false);

  const { invoices, loading, error, refetch } = useInvoices({
    page: 1,
    limit: 100,
    range: rangeFilter,
  });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "sales") && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return invoices;
    return invoices.filter((invoice) =>
      `${invoice.invoiceNumber} ${invoice.orderNumber} ${invoice.status}`
        .toLowerCase()
        .includes(query),
    );
  }, [invoices, search]);

  if (!isAuthorized) return null;

  const selectedAmounts = selectedInvoice ? invoiceAmounts(selectedInvoice) : null;

  return (
    <AdminShell activeTab="sales" pageTitle="Sales" pageSubtitle="View receipts and past transactions">
      <PortalPage>
        <PortalPageHeader
          icon={FileText}
          title="Sales & Receipts"
          subtitle="Invoices from the Flutter POS, with full line-item detail"
        />

        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className={portalSearchClass}
              placeholder="Search by invoice or order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="dn-tab-bar !rounded-2xl !py-2 lg:w-auto">
            {(
              [
                { key: "day" as const, label: "Daily" },
                { key: "week" as const, label: "Weekly" },
                { key: "month" as const, label: "Monthly" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                data-active={rangeFilter === tab.key ? "true" : "false"}
                className="dn-tab !h-10"
                onClick={() => setRangeFilter(tab.key)}
              >
                <Clock3 className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Loading size="sm" />
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-muted)] text-left text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3">Sale #</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                      No sales yet. Complete a sale from the Flutter POS to see receipts here.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((invoice) => (
                    <tr key={invoice.uuid} className="border-t border-[var(--border-subtle)]">
                      <td className="px-4 py-3 font-semibold">
                        {invoice.invoiceNumber || invoice.uuid}
                      </td>
                      <td className="px-4 py-3">{invoice.orderNumber || "—"}</td>
                      <td className="px-4 py-3">{formatDate(invoice.createdAt)}</td>
                      <td className="px-4 py-3 capitalize">{invoice.status}</td>
                      <td className="px-4 py-3">
                        Rs {invoiceAmounts(invoice).total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(invoice)}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-muted)]"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 text-sm font-semibold text-[var(--brand-secondary)]"
        >
          Refresh list
        </button>
      </PortalPage>

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-lg p-0">
          <DialogTitle className="sr-only">Sale receipt</DialogTitle>
          {selectedInvoice && selectedAmounts ? (
            <div className="p-4">
              <InvoiceReceipt
                orderNumber={selectedInvoice.orderNumber || selectedInvoice.invoiceNumber}
                businessName={branding.businessName || selectedInvoice.businessName}
                logoUrl={branding.logoUrl || selectedInvoice.businessLogo || undefined}
                date={formatDate(selectedInvoice.createdAt)}
                status={selectedInvoice.status}
                subtotal={selectedAmounts.subtotal}
                total={selectedAmounts.total}
                items={selectedAmounts.items.map((item, index) => ({
                  id: String(index),
                  productName: item.productname,
                  variantName: item.variantName,
                  quantity: item.quantity,
                  price: parsePrice(item.price),
                  total: Number(item.total) || parsePrice(item.price) * Number(item.quantity || 0),
                }))}
                contactPhone={branding.contactPhone || selectedInvoice.businessPhone}
                contactEmail={branding.contactEmail || selectedInvoice.businessEmail}
                address={branding.address || selectedInvoice.businessAddress}
                website={branding.website}
                footerNote="Thank you for your purchase!"
              />
              <div className="mt-4 flex justify-end gap-2 px-2 pb-2">
                <InvoiceDownloadButton
                  onClick={() =>
                    void downloadInvoicePdf({
                      fileName: `invoice-${selectedInvoice.invoiceNumber || selectedInvoice.uuid}.pdf`,
                      orderNumber: selectedInvoice.orderNumber || selectedInvoice.invoiceNumber,
                      businessName: branding.businessName || selectedInvoice.businessName,
                      logoUrl: branding.logoUrl || selectedInvoice.businessLogo || undefined,
                      date: formatDate(selectedInvoice.createdAt),
                      status: selectedInvoice.status,
                      items: selectedAmounts.items.map((item) => ({
                        productName: item.productname,
                        variantName: item.variantName,
                        quantity: item.quantity,
                        price: parsePrice(item.price),
                        total: Number(item.total) || parsePrice(item.price) * Number(item.quantity || 0),
                      })),
                      subtotal: selectedAmounts.subtotal,
                      total: selectedAmounts.total,
                      contactPhone: branding.contactPhone || selectedInvoice.businessPhone,
                      contactEmail: branding.contactEmail || selectedInvoice.businessEmail,
                      address: branding.address || selectedInvoice.businessAddress,
                      website: branding.website,
                    })
                  }
                />
                <InvoicePrintButton
                  onClick={() => {
                    if (!allowPrinter) {
                      setPrinterAlertOpen(true);
                      return;
                    }
                    window.print();
                  }}
                />
                <button
                  type="button"
                  className="rounded-xl border px-4 py-2 text-sm font-semibold"
                  onClick={() => setSelectedInvoice(null)}
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <PrinterAccessAlert open={printerAlertOpen} onOpenChange={setPrinterAlertOpen} />
    </AdminShell>
  );
}

export default function RetailSalesPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <SalesContent />
    </Suspense>
  );
}
