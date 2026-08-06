"use client";

import { Download, FileText, Search, Clock3, Loader2, Eye, Printer, CheckCircle2, RotateCcw, File, X, Receipt, Filter } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import {
  PortalPage,
  PortalPageHeader,
} from "@/components/admin/PortalPage";
import InvoiceReceipt, { InvoicePrintButton } from "@/components/common/InvoiceReceipt";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useInvoices, type InvoiceRecord } from "@/hooks/useInvoices";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type StatusFilter = "all" | "pending" | "paid";

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

function formatCurrency(value: number) {
  return `PKR ${value.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parsePrice(value?: string | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function toStatus(raw: string): InvoiceRow["status"] {
  const value = raw.toLowerCase();
  if (value === "paid") return "Paid";
  if (value === "pending") return "Pending";
  return "Overdue";
}

function InvoicesContent() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updatingInvoiceUuid, setUpdatingInvoiceUuid] = useState<string | null>(null);

  const { invoices, loading, actionLoading, error, pagination, refetch, updateInvoiceStatus } = useInvoices({
    page: currentPage,
    limit: 100,
  });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    const isBusinessRole = currentRole === "business_admin" || currentRole === "super_admin";
    if (!isBusinessRole) {
      router.replace("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const rows = useMemo<InvoiceRow[]>(() => {
    return invoices.map((invoice) => ({
      id: invoice.invoiceNumber || invoice.uuid,
      uuid: invoice.uuid,
      orderNumber: invoice.orderNumber,
      businessName: invoice.businessName,
      date: formatDate(invoice.createdAt),
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

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && invoice.status !== "Paid") ||
        (statusFilter === "paid" && invoice.status === "Paid");

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status !== "Paid").length;
    const paid = rows.filter((r) => r.status === "Paid").length;
    const revenue = rows.filter((r) => r.status === "Paid").reduce((sum, r) => sum + r.amount, 0);
    return { pending, paid, revenue, total: rows.length };
  }, [rows]);

  const handleMarkPaid = async (invoiceUuid: string) => {
    const toastId = toast.loading("Updating status...");
    try {
      setUpdatingInvoiceUuid(invoiceUuid);
      await updateInvoiceStatus(invoiceUuid, "paid");
      toast.success("Invoice marked as paid.", { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update invoice status.";
      toast.error(message, { id: toastId });
    } finally {
      setUpdatingInvoiceUuid(null);
    }
  };

  const handleExportPDF = () => {
    if (filteredInvoices.length === 0) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(0, 24, 64);
      doc.text("Invoices Report", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      const tableData = filteredInvoices.map((r) => [
        r.id,
        r.orderNumber,
        r.date,
        formatCurrency(r.amount),
        r.status,
      ]);

      autoTable(doc, {
        startY: 35,
        head: [["Invoice ID", "Order #", "Date", "Amount", "Status"]],
        body: tableData,
        headStyles: { fillColor: [0, 24, 64] },
        alternateRowStyles: { fillColor: [238, 243, 255] },
      });

      doc.save(`invoices-report-${Date.now()}.pdf`);
      toast.success("PDF exported successfully", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const openInvoiceDetails = (invoiceUuid: string) => {
    const invoice = invoices.find((i) => i.uuid === invoiceUuid);
    if (!invoice) return;
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
  };

  const selectedSubtotal = selectedInvoice
    ? parsePrice(selectedInvoice.totalPrice) -
      parsePrice(selectedInvoice.deliveryCharges) -
      parsePrice(selectedInvoice.packagingPrice)
    : 0;

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="invoices">
      <PortalPage>
        <PortalPageHeader
          icon={Receipt}
          title="Invoices"
          subtitle="Track billing, payments, and receipts"
          actions={
            <button type="button" onClick={handleExportPDF} className="dn-btn dn-btn-outline shrink-0">
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          }
        />

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Invoices", value: stats.total, tone: "text-[#001840]" },
            { label: "Pending Payment", value: stats.pending, tone: "text-[#ea580c]" },
            { label: "Collected Revenue", value: formatCurrency(stats.revenue), tone: "text-[#0050F8]" },
          ].map((card) => (
            <article key={card.label} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">{card.label}</p>
              <p className={cn("mt-2 text-2xl font-bold", card.tone)}>{card.value}</p>
            </article>
          ))}
        </section>

        {/* Filters */}
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="dn-tab-bar !rounded-2xl !py-2 lg:w-auto">
              {(
                [
                  { key: "all" as const, label: "All" },
                  { key: "pending" as const, label: "Pending" },
                  { key: "paid" as const, label: "Paid" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  data-active={statusFilter === tab.key ? "true" : "false"}
                  className="dn-tab !h-10"
                  onClick={() => setStatusFilter(tab.key)}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice, order, or business..."
                className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] pl-10 pr-4 text-sm outline-none focus:border-[#0050F8] focus:ring-2 focus:ring-[#0050F8]/20"
              />
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#edf2f7] px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0050F8]" />
              <h2 className="text-lg font-bold text-[#0f172a]">Invoice List</h2>
              <span className="rounded-full bg-[#eef3ff] px-2.5 py-0.5 text-xs font-semibold text-[#001840]">
                {filteredInvoices.length}
              </span>
            </div>
            <button type="button" onClick={() => refetch()} className="dn-btn dn-btn-soft !h-9 !px-3">
              <RotateCcw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
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
                {statusFilter === "pending"
                  ? "All invoices are paid — great work!"
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
                          <span className="text-sm font-semibold text-[#0f172a]">{invoice.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#64748b]">{invoice.orderNumber}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#64748b]">
                          <Clock3 className="h-3.5 w-3.5" />
                          {invoice.date}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-[#0050F8]">{formatCurrency(invoice.amount)}</td>
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
                            onClick={() => openInvoiceDetails(invoice.uuid)}
                            className="dn-btn dn-btn-outline !h-9 !px-3"
                            title="Print"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {invoice.status !== "Paid" ? (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(invoice.uuid)}
                              disabled={actionLoading && updatingInvoiceUuid === invoice.uuid}
                              className="dn-btn dn-btn-secondary !h-9 !px-3"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Paid
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
                  orderNumber={selectedInvoice.orderNumber}
                  businessName={selectedInvoice.businessName}
                  date={formatDate(selectedInvoice.createdAt)}
                  status={selectedInvoice.status}
                  items={(selectedInvoice.Items ?? []).map((item, i) => ({
                    id: String(i),
                    productName: item.productname,
                    quantity: item.quantity,
                    price: item.price,
                  }))}
                  subtotal={selectedSubtotal}
                  deliveryCharges={parsePrice(selectedInvoice.deliveryCharges)}
                  packagingPrice={parsePrice(selectedInvoice.packagingPrice)}
                  total={parsePrice(selectedInvoice.totalPrice)}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[#edf2f7] bg-[#f8fbff] px-6 py-4 print:hidden">
                <button type="button" onClick={() => setIsDetailsOpen(false)} className="dn-btn dn-btn-outline">
                  Close
                </button>
                {selectedInvoice.status.toLowerCase() !== "paid" ? (
                  <button
                    type="button"
                    onClick={() => handleMarkPaid(selectedInvoice.uuid)}
                    disabled={actionLoading}
                    className="dn-btn dn-btn-secondary"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Paid
                  </button>
                ) : null}
                <InvoicePrintButton onClick={handlePrint} label="Print Receipt" />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
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
