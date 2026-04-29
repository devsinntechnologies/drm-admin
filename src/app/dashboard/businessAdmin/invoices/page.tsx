"use client";

import { Download, FileText, Search, Clock3, AlertCircle, ChevronLeft, ChevronRight, Loader2, Eye, Printer, CheckCircle2, RotateCcw, File, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useInvoices, type InvoiceRecord } from "@/hooks/useInvoices";
import { cn, normalizeErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Image from "next/image";

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
  return `PKR ${value.toFixed(2)}`;
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
    hour12: true
  });
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

function InvoicesContent() {
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

  const { invoices, loading, actionLoading, error, pagination, refetch, nextPage, prevPage, updateInvoiceStatus } = useInvoices({ page: currentPage, limit: 100 });

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

  const unpaidCount = useMemo(() => invoices.filter(i => i.status.toLowerCase() === 'pending').length, [invoices]);

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
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Invoices Report", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      const tableData = rows.map(r => [r.id, r.orderNumber, r.date, r.amount, r.status]);

      autoTable(doc, {
        startY: 35,
        head: [["Invoice ID", "Order #", "Date", "Amount", "Status"]],
        body: tableData,
        headStyles: { fillColor: [99, 102, 241] },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      doc.save(`invoices-report-${new Date().getTime()}.pdf`);
      toast.success("PDF exported successfully", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  const openInvoiceDetails = (invoiceUuid: string) => {
    const invoice = invoices.find(i => i.uuid === invoiceUuid);
    if (!invoice) return;
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="invoices">
      <main className="h-[calc(100vh-80px)] overflow-hidden bg-[#f8fafc]">
        <div className="h-full flex flex-col p-6 space-y-6">
          
          {/* Header Section */}
          <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-[#ef4444] flex items-center justify-center shadow-lg shadow-red-100">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#111827]">Invoices</h1>
                <p className="text-sm font-bold text-slate-400">Track revenue</p>
              </div>
            </div>
          </section>

          {/* Unpaid Badge Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-full bg-[#fff7ed] px-4 py-2 border border-[#ffedd5]">
              <Printer className="h-4 w-4 text-[#f97316]" />
              <span className="text-xs font-black text-[#f97316] uppercase tracking-wider">{unpaidCount} Unpaid Invoice</span>
            </div>
            <span className="text-xs font-bold text-slate-400 italic">Showing unpaid only</span>
          </div>

          {/* Table Card */}
          <section className="flex-1 bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col min-h-0 overflow-hidden relative">
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#6366f1]" />
                <h2 className="text-xl font-black text-[#111827]">All Invoices</h2>
              </div>
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#6366f1] text-[#6366f1] text-sm font-black hover:bg-[#6366f1]/5 transition-all"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>

            {/* Printer Disconnected Banner */}
            <div className="flex justify-center mb-8">
              <button className="flex items-center gap-3 bg-[#ef4444] text-white px-6 py-4 rounded-2xl shadow-xl shadow-red-100 group active:scale-95 transition-all">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Printer className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black leading-tight">Printer Disconnected</p>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Click to connect</p>
                </div>
              </button>
            </div>

            {/* Invoices Table */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1.2fr_.8fr_.8fr_1.2fr_1fr] gap-4 bg-[#f8fafc] px-6 py-4 rounded-2xl text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">
                <span>Invoice ID</span>
                <span>Order Number</span>
                <span>Date & Time</span>
                <span>Amount</span>
                <span className="text-center">Status</span>
                <span className="text-center">Preview</span>
                <span className="text-center">Print</span>
                <span className="text-right">Mark Paid</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {loading ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" /></div>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <div key={invoice.id} className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1.2fr_.8fr_.8fr_1.2fr_1fr] gap-4 items-center px-6 py-4 bg-white hover:bg-slate-50/50 rounded-3xl transition-all border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0">
                          <File className="h-4 w-4 text-[#6366f1]" />
                        </div>
                        <span className="text-xs font-black text-[#1e293b] truncate">{invoice.id}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{invoice.orderNumber}</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Clock3 className="h-3.5 w-3.5 opacity-40" />
                        {invoice.date}
                      </div>
                      <span className="text-xs font-black text-[#2563eb]">{invoice.amount}</span>
                      <div className="flex justify-center">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          invoice.status === "Paid" ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-[#fff7ed] text-[#f97316]"
                        )}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <button 
                          onClick={() => openInvoiceDetails(invoice.uuid)}
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-[#6366f1] transition-colors"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex justify-center">
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#64748b] text-white text-[10px] font-black hover:bg-[#475569] transition-all">
                          <Printer className="h-3.5 w-3.5" />
                          Print Invoice
                        </button>
                      </div>
                      <div className="flex justify-end">
                        {invoice.status !== "Paid" && (
                          <button 
                            onClick={() => handleMarkPaid(invoice.uuid)}
                            disabled={actionLoading && updatingInvoiceUuid === invoice.uuid}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00c853] text-white text-[10px] font-black hover:bg-[#00a844] transition-all"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-bold">No invoices found</div>
                )}
              </div>
            </div>

            {/* Table Footer / Pagination - Floating Red Refresh */}
            <button 
              onClick={() => refetch()}
              className="fixed bottom-8 right-8 h-14 w-14 rounded-2xl bg-[#ef4444] text-white shadow-xl shadow-red-200 flex items-center justify-center hover:scale-110 transition-all z-50 group"
            >
              <RotateCcw className={cn("h-6 w-6 transition-transform group-hover:rotate-180", loading && "animate-spin")} />
            </button>
          </section>

        </div>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-white">
              <div className="p-8 pb-4 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#6366f1] flex items-center justify-center text-white">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#111827]">Invoice Details</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedInvoice?.invoiceNumber}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailsOpen(false)} className="h-10 w-10 rounded-xl hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#f8fafc] p-5 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Info</p>
                    <p className="text-sm font-bold text-[#111827]"># {selectedInvoice?.orderNumber}</p>
                    <p className="text-xs text-slate-500 mt-2">Date: {selectedInvoice && formatDate(selectedInvoice.createdAt)}</p>
                  </div>
                  <div className="bg-[#f8fafc] p-5 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <span className={cn(
                      "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      selectedInvoice?.status.toLowerCase() === 'paid' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                    )}>
                      {selectedInvoice?.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-black text-[#111827] uppercase tracking-tighter">Items Summary</p>
                  <div className="rounded-3xl border border-slate-100 overflow-hidden">
                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 bg-slate-50 px-6 py-3 text-[10px] font-black text-slate-400 uppercase">
                      <span>Item</span>
                      <span className="text-center">Qty</span>
                      <span className="text-right">Price</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {selectedInvoice?.Items.map((item, i) => (
                        <div key={i} className="grid grid-cols-[2fr_1fr_1fr] gap-4 px-6 py-4 items-center">
                          <span className="text-sm font-bold text-[#1e293b]">{item.productname}</span>
                          <span className="text-sm font-bold text-center text-slate-500">{item.quantity}x</span>
                          <span className="text-sm font-black text-right text-[#111827]">{formatCurrency(parsePrice(item.price))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8fafc] rounded-3xl p-6 space-y-3">
                  <div className="flex justify-between text-sm font-bold text-slate-500">
                    <span>Subtotal</span>
                    <span>{selectedInvoice && formatCurrency(parsePrice(selectedInvoice.totalPrice) - parsePrice(selectedInvoice.deliveryCharges) - parsePrice(selectedInvoice.packagingPrice))}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-500">
                    <span>Delivery</span>
                    <span>{selectedInvoice && formatCurrency(parsePrice(selectedInvoice.deliveryCharges))}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-[#111827] border-t border-slate-200 pt-3">
                    <span>Total Amount</span>
                    <span className="text-[#2563eb]">{selectedInvoice && formatCurrency(parsePrice(selectedInvoice.totalPrice))}</span>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 flex justify-end gap-3">
                <button onClick={() => setIsDetailsOpen(false)} className="px-6 py-3 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-200 transition-colors">Close</button>
                <button className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#ef4444] text-white font-black text-sm shadow-lg shadow-red-200 transition-all active:scale-95">
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </AdminShell>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" /></div>}>
      <InvoicesContent />
    </Suspense>
  );
}
