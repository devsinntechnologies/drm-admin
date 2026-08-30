"use client";

import { Download, FileText, Search, Clock3, Loader2, Eye, Printer, RotateCcw, File, X, Trash2 } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import {
  PortalPage,
} from "@/components/admin/PortalPage";
import InvoiceReceipt, { InvoiceDownloadButton, InvoicePrintButton } from "@/components/common/InvoiceReceipt";
import { PrinterAccessAlert } from "@/components/common/PrinterAccessAlert";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useInvoices, type InvoiceRecord } from "@/hooks/useInvoices";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useInvoiceBranding } from "@/hooks/useInvoiceBranding";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { formatInvoiceDateTime } from "@/lib/invoice-datetime";
import { parseSalesSettings } from "@/lib/module-feature-settings";

type RangeFilter = "day" | "week" | "month";

type InvoiceRow = {
  id: string;
  uuid: string;
  orderNumber: string;
  businessName: string;
  date: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  itemCount: number;
};

function formatCurrency(value: number, currency = "PKR") {
  try {
    return new Intl.NumberFormat(currency === "GBP" ? "en-GB" : currency === "PKR" ? "en-PK" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

function parsePrice(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function invoiceAmounts(invoice: InvoiceRecord) {
  const itemsSubtotal = (invoice.Items ?? []).reduce((sum, item) => {
    const explicit = Number(item.total);
    if (Number.isFinite(explicit) && explicit > 0) return sum + explicit;
    return sum + parsePrice(item.price) * Number(item.quantity || 0);
  }, 0);
  const delivery = parsePrice(invoice.deliveryCharges);
  const packaging = parsePrice(invoice.packagingPrice);
  const stored = parsePrice(invoice.totalPrice);
  const total = stored > 0 ? stored : itemsSubtotal + delivery + packaging;
  const subtotal =
    typeof invoice.subtotal === "number" && invoice.subtotal > 0
      ? invoice.subtotal
      : itemsSubtotal > 0
        ? itemsSubtotal
        : Math.max(0, total - delivery - packaging);
  return { subtotal, delivery, packaging, total };
}

function displayInvoiceId(raw?: string | null) {
  const value = (raw || "").trim();
  if (!value || value.toUpperCase() === "PENDING" || value.toUpperCase() === "N/A") {
    return "Pending";
  }
  return value;
}

function toStatus(_raw: string): InvoiceRow["status"] {
  return "Paid";
}

function InvoicesContent() {
  const router = useRouter();
  const { role } = useAuth();
  const { templateConfig, currency } = useBusinessTemplate();
  const branding = useInvoiceBranding();
  const isPharmacy = templateConfig?.industryId === "pharmacy";
  const isRetail = templateConfig?.industryId === "retail-store";
  const salesSettings = parseSalesSettings(templateConfig?.moduleSettings);
  const allowInvoiceExport = salesSettings.allowExport;
  const allowPrinter = salesSettings.allowPrinter;
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("day");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deletingInvoiceUuid, setDeletingInvoiceUuid] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [printerAlertOpen, setPrinterAlertOpen] = useState(false);

  const canDeleteInvoice =
    (role ?? (typeof window !== "undefined" ? localStorage.getItem("roleName") : null)) ===
      "business_admin";

  const { invoices, loading, actionLoading, error, pagination, refetch, deleteInvoice, exportExcel } = useInvoices({
    page: currentPage,
    limit: 100,
    range: rangeFilter,
  });

  useEffect(() => {
    if (isRetail) {
      const suffix = impersonatedBusinessId ? `?businessId=${impersonatedBusinessId}` : "";
      router.replace(`/dashboard/businessAdmin/retail/sales${suffix}`);
      return;
    }

    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    if (!canAccessWorkspacePage(currentRole, "sales")) {
      router.replace("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId, isRetail]);

  const rows = useMemo<InvoiceRow[]>(() => {
    return invoices.map((invoice) => ({
      id: displayInvoiceId(invoice.invoiceNumber),
      uuid: invoice.uuid,
      orderNumber: invoice.orderNumber,
      businessName: invoice.businessName,
      date: formatInvoiceDateTime(invoice.createdAt),
      amount: parsePrice(invoice.totalPrice),
      status: toStatus(invoice.status),
      itemCount: invoice.Items?.length ?? 0,
    }));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return rows.filter((invoice) => {
      const matchesSearch = `${invoice.id} ${invoice.orderNumber} ${invoice.businessName} ${invoice.status}`
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesSearch;
    });
  }, [rows, search]);

  const stats = useMemo(() => {
    const paid = rows.filter((r) => r.status === "Paid").length;
    const revenue = rows.filter((r) => r.status === "Paid").reduce((sum, r) => sum + r.amount, 0);
    return { paid, revenue, total: rows.length };
  }, [rows]);

  const handleDeleteInvoice = async (invoiceUuid: string, invoiceNumber: string) => {
    if (!canDeleteInvoice) {
      toast.error("Only business admin can delete invoices.");
      return;
    }
    const confirmed = window.confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`);
    if (!confirmed) return;

    const toastId = toast.loading("Deleting invoice...");
    try {
      setDeletingInvoiceUuid(invoiceUuid);
      await deleteInvoice(invoiceUuid);
      toast.success("Invoice deleted.", { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete invoice.";
      toast.error(message, { id: toastId });
    } finally {
      setDeletingInvoiceUuid(null);
    }
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading("Exporting invoices...");
    try {
      await exportExcel({
        range: rangeFilter,
        status: "paid",
      });
      toast.success("Excel exported with invoice and product details.", { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export invoices.";
      toast.error(message, { id: toastId });
    }
  };

  const handlePrint = () => {
    if (!allowPrinter) {
      setPrinterAlertOpen(true);
      return;
    }
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const requestPrinterOr = (action: () => void) => {
    if (!allowPrinter) {
      setPrinterAlertOpen(true);
      return;
    }
    action();
  };

  const openInvoiceDetails = (invoiceUuid: string) => {
    const invoice = invoices.find((i) => i.uuid === invoiceUuid);
    if (!invoice) return;
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
  };

  const selectedAmounts = selectedInvoice ? invoiceAmounts(selectedInvoice) : null;

  const handleDownloadPdf = async () => {
    if (!selectedInvoice || !selectedAmounts) return;
    const toastId = toast.loading("Preparing PDF...");
    setDownloadingPdf(true);
    try {
      await downloadInvoicePdf({
        fileName: `invoice-${selectedInvoice.invoiceNumber || selectedInvoice.uuid}.pdf`,
        orderNumber: selectedInvoice.orderNumber || selectedInvoice.invoiceNumber,
        businessName: branding.businessName || selectedInvoice.businessName,
        logoUrl: branding.logoUrl,
        date: formatInvoiceDateTime(selectedInvoice.createdAt),
        status: selectedInvoice.status,
        items: (selectedInvoice.Items ?? []).map((item) => ({
          productName: item.productname,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          variantName: item.variantName,
        })),
        subtotal: selectedAmounts.subtotal,
        deliveryCharges: selectedAmounts.delivery,
        packagingPrice: selectedAmounts.packaging,
        total: selectedAmounts.total,
        contactPhone: branding.contactPhone || selectedInvoice.businessPhone,
        contactEmail: branding.contactEmail || selectedInvoice.businessEmail,
        address: branding.address || selectedInvoice.businessAddress,
        website: branding.website,
      });
      toast.success("Invoice PDF downloaded.", { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download PDF.";
      toast.error(message, { id: toastId });
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell
      activeTab="invoices"
      pageTitle={isPharmacy ? "Sales" : "Invoices"}
      pageSubtitle={isPharmacy ? "Paid invoices and pharmacy sale history" : undefined}
    >
      <PortalPage>
        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Invoices", value: stats.total, tone: "text-[#001840]" },
            { label: "Paid", value: stats.paid, tone: "text-[#059669]" },
            { label: "Collected Revenue", value: formatCurrency(stats.revenue, currency), tone: "text-[#0050F8]" },
          ].map((card) => (
            <article key={card.label} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">{card.label}</p>
              <p className={cn("mt-2 text-2xl font-bold", card.tone)}>{card.value}</p>
            </article>
          ))}
        </section>

        {/* Filters */}
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Period</p>
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
                      onClick={() => {
                        setRangeFilter(tab.key);
                        setCurrentPage(1);
                      }}
                    >
                      <Clock3 className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <label className="relative block w-full space-y-1.5 lg:max-w-sm">
              <span className="block text-sm font-semibold text-[#64748b]">Search</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoice, order, or business..."
                  className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] pl-10 pr-4 text-sm outline-none focus:border-[#0050F8] focus:ring-2 focus:ring-[#0050F8]/20"
                />
              </span>
            </label>
          </div>
        </section>

        {/* Table */}
        <section className="rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2f7] px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-5 w-5 shrink-0 text-[#0050F8]" />
              <h2 className="text-lg font-bold text-[#0f172a]">Invoice List</h2>
              <span className="rounded-full bg-[#eef3ff] px-2.5 py-0.5 text-xs font-semibold text-[#001840]">
                {filteredInvoices.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {allowInvoiceExport ? (
                <button
                  type="button"
                  onClick={() => void handleExportExcel()}
                  className="dn-btn dn-btn-primary !h-9 !px-3"
                >
                  <Download className="h-4 w-4" />
                  Export Excel
                </button>
              ) : null}
              <button type="button" onClick={() => refetch()} className="dn-btn dn-btn-soft !h-9 !px-3">
                <RotateCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>

          {error ? (
            <div className="mx-6 my-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
              {error}
            </div>
          ) : null}

          {loading ? (
            <Loading />
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#eef3ff] text-[#0050F8]">
                <FileText className="h-8 w-8" />
              </div>
              <p className="text-lg font-semibold text-[#0f172a]">No invoices found</p>
              <p className="mt-1 text-sm text-[#64748b]">
                {isPharmacy
                    ? "Complete a POS sale to generate your first invoice."
                    : "Complete an order to generate your first invoice."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-[#edf2f7] bg-[#f8fbff] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                    <th className="px-6 py-3">Invoice</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.uuid} className="transition hover:bg-[#f8fbff]/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef3ff] text-[#0050F8]">
                            <File className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-semibold text-[#0f172a]">
                            {invoice.id === "Pending" ? (
                              <span className="inline-flex rounded-full bg-[#fff7ed] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-[#ea580c]">
                                Pending
                              </span>
                            ) : (
                              invoice.id
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#64748b]">{invoice.orderNumber}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#64748b]">
                          <Clock3 className="h-3.5 w-3.5" />
                          {invoice.date}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-[#0050F8]">{formatCurrency(invoice.amount, currency)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                            invoice.status === "Paid"
                              ? "bg-[#ecfdf5] text-[#059669]"
                              : "bg-[#fff7ed] text-[#ea580c]",
                          )}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openInvoiceDetails(invoice.uuid)}
                            className="dn-btn dn-btn-soft !h-9 !px-3"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestPrinterOr(() => openInvoiceDetails(invoice.uuid))}
                            className={cn(
                              "dn-btn dn-btn-outline !h-9 !px-3",
                              !allowPrinter && "opacity-45",
                            )}
                            title={allowPrinter ? "Print" : "Printing is disabled — contact your administrator"}
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {canDeleteInvoice ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoice(invoice.uuid, invoice.id)}
                              disabled={actionLoading && deletingInvoiceUuid === invoice.uuid}
                              className="dn-btn dn-btn-outline !h-9 !px-3 text-[#dc2626] border-[#fecaca] hover:bg-[#fef2f2]"
                              title="Delete invoice"
                            >
                              {deletingInvoiceUuid === invoice.uuid ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.last_page > 1 ? (
            <div className="flex items-center justify-between border-t border-[#edf2f7] px-6 py-4 text-sm text-[#64748b]">
              <span>
                Page {pagination.page} of {pagination.last_page}
              </span>
            </div>
          ) : null}
        </section>
      </PortalPage>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-2xl border-none p-0 shadow-2xl print:shadow-none">
          <DialogTitle className="sr-only">Invoice Details</DialogTitle>
          {selectedInvoice ? (
            <div className="print:p-0">
              <div className="flex items-center justify-between border-b border-[#edf2f7] bg-[#f8fbff] px-6 py-4 print:hidden">
                <h3 className="text-lg font-bold text-[#0f172a]">Invoice Preview</h3>
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-[#dbe4ef] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6" id="invoice-print-area">
                <InvoiceReceipt
                  orderNumber={selectedInvoice.orderNumber || selectedInvoice.invoiceNumber}
                  businessName={branding.businessName || selectedInvoice.businessName}
                  logoUrl={branding.logoUrl}
                  date={formatInvoiceDateTime(selectedInvoice.createdAt)}
                  status={selectedInvoice.status}
                  items={(selectedInvoice.Items ?? []).map((item, i) => ({
                    id: String(i),
                    productName: item.productname,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                    variantName: item.variantName,
                  }))}
                  subtotal={selectedAmounts?.subtotal ?? 0}
                  deliveryCharges={selectedAmounts?.delivery ?? 0}
                  packagingPrice={selectedAmounts?.packaging ?? 0}
                  total={selectedAmounts?.total ?? 0}
                  contactPhone={branding.contactPhone || selectedInvoice.businessPhone}
                  contactEmail={branding.contactEmail || selectedInvoice.businessEmail}
                  address={branding.address || selectedInvoice.businessAddress}
                  website={branding.website}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[#edf2f7] bg-[#f8fbff] px-6 py-4 print:hidden">
                <button type="button" onClick={() => setIsDetailsOpen(false)} className="dn-btn dn-btn-outline">
                  Close
                </button>
                <InvoiceDownloadButton onClick={() => void handleDownloadPdf()} loading={downloadingPdf} />
                <InvoicePrintButton
                  onClick={handlePrint}
                  label="Print Receipt"
                  className={!allowPrinter ? "opacity-45" : undefined}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <PrinterAccessAlert open={printerAlertOpen} onOpenChange={setPrinterAlertOpen} />
    </AdminShell>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={<Loading fullScreen />}
    >
      <InvoicesContent />
    </Suspense>
  );
}
