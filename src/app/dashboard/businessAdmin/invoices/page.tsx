"use client";

import { Download, FileText, Search, CircleDollarSign, Clock3, AlertCircle, ChevronLeft, ChevronRight, Loader2, Eye, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useInvoices, type InvoiceRecord } from "@/hooks/useInvoices";
import { normalizeErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

type InvoiceRow = {
  id: string;
  uuid: string;
  orderNumber: string;
  businessName: string;
  date: string;
  amount: string;
  status: "Paid" | "Pending" | "Overdue";
  itemCount: number;
};

function formatCurrency(value: number) {
  return `${value.toFixed(2)}`;
}

function parsePrice(value?: string | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
}

function toStatus(raw: string): InvoiceRow["status"] {
  const value = raw.toLowerCase();
  if (value === "paid") return "Paid";
  if (value === "pending") return "Pending";
  return "Overdue";
}

function toAmount(invoice: InvoiceRecord) {
  return parsePrice(invoice.totalPrice);
}

function buildInvoicePrintHtml(invoice: InvoiceRecord) {
  const createdAt = formatDate(invoice.createdAt);
  const items = invoice.Items ?? [];
  const subtotal = items.reduce((sum, item) => sum + parsePrice(item.price) * Number(item.quantity || 0), 0);
  const delivery = parsePrice(invoice.deliveryCharges);
  const packaging = parsePrice(invoice.packagingPrice);
  const total = parsePrice(invoice.totalPrice);

  const rows = items
    .map((item, index) => {
      const unitPrice = parsePrice(item.price);
      const qty = Number(item.quantity || 0);
      const lineTotal = unitPrice * qty;
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${item.productname || "-"}</td>
          <td>${qty}</td>
          <td>${formatCurrency(unitPrice)}</td>
          <td>${formatCurrency(lineTotal)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 28px; color: #111827; }
          h1 { margin: 0 0 6px 0; }
          p { margin: 4px 0; }
          .meta { margin: 16px 0 20px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
          .totals { margin-top: 14px; width: 320px; margin-left: auto; }
          .totals div { display: flex; justify-content: space-between; margin: 6px 0; }
          .grand { font-weight: bold; border-top: 1px solid #111827; padding-top: 8px; }
        </style>
      </head>
      <body>
        <h1>Invoice ${invoice.invoiceNumber}</h1>
        <p><strong>Business:</strong> ${invoice.businessName}</p>
        <p><strong>Order Number:</strong> ${invoice.orderNumber}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
        <p><strong>Date:</strong> ${createdAt}</p>

        <div class="meta">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5">No items found</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
          <div><span>Delivery Charges</span><span>${formatCurrency(delivery)}</span></div>
          <div><span>Packaging Charges</span><span>${formatCurrency(packaging)}</span></div>
          <div class="grand"><span>Grand Total</span><span>${formatCurrency(total)}</span></div>
        </div>
      </body>
    </html>
  `;
}

function printHtmlWithIframe(html: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      document.body.removeChild(iframe);
      return;
    }

    frameWindow.focus();
    frameWindow.print();

    window.setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 250);
  };

  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}

function StatCard({ label, value, sub, tone, icon }: { label: string; value: string; sub: string; tone: string; icon: React.ReactNode }) {
  return (
    <article className={`rounded-3xl border px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ${tone}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#4f46e5]">{icon}</div>
        <div>
          <p className="text-sm font-medium text-[#5b6475]">{label}</p>
          <strong className="text-2xl font-semibold text-[#0f172a]">{value}</strong>
          <p className="text-sm text-[#6b7280]">{sub}</p>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: InvoiceRow["status"] }) {
  const tone =
    status === "Paid"
      ? " text-[#16a34a]"
      : status === "Pending"
        ? " text-[#d97706]"
        : "text-[#dc2626]";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function ErrorAlert({ message }: { message: unknown }) {
  const errorMessage = normalizeErrorMessage(message, "Error loading invoices");

  return (
    <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f1] p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-[#ef4444]">Error loading invoices</p>
        <p className="text-sm text-[#dc2626]">{errorMessage}</p>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updatingInvoiceUuid, setUpdatingInvoiceUuid] = useState<string | null>(null);

  const { invoices, loading, actionLoading, error, pagination, nextPage, prevPage, updateInvoiceStatus } = useInvoices({ page: currentPage, limit: 100 });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    const isBusinessRole = currentRole === "business_admin";
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;

    if (!isBusinessRole && !isSuperAdminImpersonating) {
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
      amount: formatCurrency(toAmount(invoice)),
      status: toStatus(invoice.status),
      itemCount: invoice.Items?.length ?? 0,
    }));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return rows.filter((invoice) => {
      const text = `${invoice.id} ${invoice.orderNumber} ${invoice.businessName} ${invoice.amount} ${invoice.status}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [rows, search]);

  const selectedInvoiceSubtotal = useMemo(() => {
    if (!selectedInvoice) return 0;
    return (selectedInvoice.Items ?? []).reduce((sum, item) => sum + parsePrice(item.price) * Number(item.quantity || 0), 0);
  }, [selectedInvoice]);

  const openInvoiceDetails = (invoiceId: string) => {
    const invoice = invoices.find((entry) => (entry.invoiceNumber || entry.uuid) === invoiceId);
    if (!invoice) return;
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
  };

  const handlePrintInvoice = (invoice: InvoiceRecord) => {
    const html = buildInvoicePrintHtml(invoice);
    printHtmlWithIframe(html);
  };

  const handleMarkPaid = async (invoiceUuid: string) => {
    try {
      setUpdatingInvoiceUuid(invoiceUuid);
      await updateInvoiceStatus(invoiceUuid, "paid");
      toast.success("Invoice marked as paid.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update invoice status.";
      toast.error(message);
    } finally {
      setUpdatingInvoiceUuid(null);
    }
  };

  const invoiceStats = useMemo(() => {
    const totalRevenue = invoices.filter((invoice) => invoice.status.toLowerCase() === "paid").reduce((sum, invoice) => sum + toAmount(invoice), 0);
    const pendingRevenue = invoices.filter((invoice) => invoice.status.toLowerCase() === "pending").reduce((sum, invoice) => sum + toAmount(invoice), 0);
    const paidCount = invoices.filter((invoice) => invoice.status.toLowerCase() === "paid").length;
    const pendingCount = invoices.filter((invoice) => invoice.status.toLowerCase() === "pending").length;

    return [
      { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: `${paidCount} paid`, tone: "border-[#bcf0cb] bg-[#effdf2]", icon: <CircleDollarSign className="h-5 w-5" /> },
      { label: "Pending Payments", value: formatCurrency(pendingRevenue), sub: `${pendingCount} pending`, tone: "border-[#ffd7b0] bg-[#fff6ec]", icon: <Clock3 className="h-5 w-5" /> },
      { label: "Total Invoices", value: String(pagination.total), sub: "All time", tone: "border-[#c6d1ff] bg-[#eef1ff]", icon: <FileText className="h-5 w-5" /> },
    ];
  }, [invoices, pagination.total]);

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="invoices">
      <main className="min-h-screen ">
        <div className="mx-auto max-w-7xl space-y-5">
          <section className="rounded-[28px] border border-white bg-white/85 p-5 shadow-[0_14px_28px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#635bff] text-white shadow-[0_10px_18px_rgba(99,91,255,0.22)]">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-[#111827]">Invoices</h1>
                  <p className="text-sm text-[#6b7280]">Track revenue</p>
                </div>
              </div>

              <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-[#cfd8ff] bg-white px-4 py-3 text-sm font-semibold text-[#4f46e5] shadow-[0_10px_20px_rgba(99,91,255,0.08)]">
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {invoiceStats.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </section>

          <section className="rounded-[28px] border border-white bg-white/90 p-5 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#4f46e5]" />
                <h2 className="text-lg font-semibold text-[#111827]">All Invoices</h2>
              </div>
            </div>

            <div className="mb-4 flex h-12 items-center gap-3 rounded-2xl bg-[#f5f7fb] px-4 text-[#94a3b8]">
              <Search className="h-5 w-5" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoices by ID or customer..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#94a3b8]" />
            </div>

            {error ? <ErrorAlert message={error} /> : null}

            <div className="overflow-hidden rounded-[22px] border border-[#eef2f7] bg-white">
              <div className="grid grid-cols-[1.2fr_1.15fr_1.1fr_.9fr_.85fr_.7fr_1fr] gap-4 border-b border-[#eef2f7] bg-[#fafbff] px-4 py-3 text-sm font-semibold text-[#374151]">
                <span>Invoice ID</span>
                <span>Order Number</span>
                <span>Business</span>
                <span>Date</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {loading ? (
                <div className="grid min-h-44 place-items-center text-sm text-[#6b7280]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#4f46e5]" />
                </div>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="grid grid-cols-[1.2fr_1.15fr_1.1fr_.9fr_.85fr_.7fr_1fr] gap-4 border-b border-[#f0f2f7] px-4 py-4 text-sm text-[#374151] last:border-b-0">
                    <span className="font-medium">{invoice.id}</span>
                    <span>{invoice.orderNumber}</span>
                    <span>{invoice.businessName}</span>
                    <span>{invoice.date}</span>
                    <span className="font-semibold text-[#111827]">{invoice.amount}</span>
                    <StatusPill status={invoice.status} />
                    <div className="flex  items-center gap-2">
                      {invoice.status === "Pending" ? (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(invoice.uuid)}
                          disabled={actionLoading && updatingInvoiceUuid === invoice.uuid}
                          className="inline-flex w-fit items-center gap-1 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#15803d] hover:bg-[#dcfce7] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading && updatingInvoiceUuid === invoice.uuid ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          Paid
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => openInvoiceDetails(invoice.id)}
                        className="inline-flex w-fit items-center gap-1 rounded-lg border border-[#d7dcf8] px-3 py-1.5 text-xs font-semibold text-[#4f46e5] hover:bg-[#f5f7ff]"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Detail
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid min-h-44 place-items-center text-sm text-[#6b7280]">No invoices found</div>
              )}
            </div>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                {selectedInvoice ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>Invoice Details</DialogTitle>
                      <DialogDescription>
                        {selectedInvoice.invoiceNumber} • {selectedInvoice.businessName}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-[#e7ebf3] bg-[#fafbff] p-3 text-sm">
                        <p><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</p>
                        <p><strong>Order Number:</strong> {selectedInvoice.orderNumber}</p>
                        <p><strong>Order ID:</strong> {selectedInvoice.orderId}</p>
                        <p><strong>Status:</strong> {selectedInvoice.status}</p>
                      </div>
                      <div className="rounded-xl border border-[#e7ebf3] bg-[#fafbff] p-3 text-sm">
                        <p><strong>Business:</strong> {selectedInvoice.businessName}</p>
                        <p><strong>Created:</strong> {formatDate(selectedInvoice.createdAt)}</p>
                        <p><strong>Updated:</strong> {formatDate(selectedInvoice.updatedAt)}</p>
                        <p><strong>UUID:</strong> {selectedInvoice.uuid}</p>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-xl border border-[#e7ebf3]">
                      <div className="grid grid-cols-[1.8fr_.7fr_.8fr_.9fr] gap-3 border-b border-[#e7ebf3] bg-[#fafbff] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                        <span>Item</span>
                        <span>Quantity</span>
                        <span>Unit Price</span>
                        <span>Total</span>
                      </div>
                      {(selectedInvoice.Items ?? []).length > 0 ? (
                        selectedInvoice.Items.map((item, index) => {
                          const qty = Number(item.quantity || 0);
                          const price = parsePrice(item.price);
                          return (
                            <div key={`${item.productname}-${index}`} className="grid grid-cols-[1.8fr_.7fr_.8fr_.9fr] gap-3 border-b border-[#eef2f7] px-4 py-3 text-sm last:border-b-0">
                              <span className="font-medium">{item.productname}</span>
                              <span>{qty}</span>
                              <span>{formatCurrency(price)}</span>
                              <span className="font-semibold">{formatCurrency(price * qty)}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-4 text-sm text-[#6b7280]">No items found</div>
                      )}
                    </div>

                    <div className="mt-4 ml-auto w-full max-w-sm space-y-2 rounded-xl border border-[#e7ebf3] bg-[#fcfdff] p-3 text-sm">
                      <div className="flex items-center justify-between"><span>Subtotal</span><strong>{formatCurrency(selectedInvoiceSubtotal)}</strong></div>
                      <div className="flex items-center justify-between"><span>Delivery Charges</span><strong>{formatCurrency(parsePrice(selectedInvoice.deliveryCharges))}</strong></div>
                      <div className="flex items-center justify-between"><span>Packaging Charges</span><strong>{formatCurrency(parsePrice(selectedInvoice.packagingPrice))}</strong></div>
                      <div className="flex items-center justify-between border-t border-[#dbe1ef] pt-2 text-base"><span>Grand Total</span><strong>{formatCurrency(parsePrice(selectedInvoice.totalPrice))}</strong></div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handlePrintInvoice(selectedInvoice)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca]"
                      >
                        <Printer className="h-4 w-4" /> Print Invoice
                      </button>
                    </div>
                  </>
                ) : null}
              </DialogContent>
            </Dialog>

            {pagination.last_page > 1 && !search ? (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#e3e7f0] bg-white p-4">
                <div className="text-sm text-[#667085]">
                  Page <strong>{pagination.page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} total invoices)
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      prevPage();
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                    disabled={pagination.page === 1}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f0] bg-white px-3 py-2 text-sm font-medium text-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      nextPage();
                      setCurrentPage((prev) => Math.min(pagination.last_page, prev + 1));
                    }}
                    disabled={pagination.page === pagination.last_page}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f0] bg-white px-3 py-2 text-sm font-medium text-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </AdminShell>
  );
}
