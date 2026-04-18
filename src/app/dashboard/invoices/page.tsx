"use client";

import { Download, FileText, Search, CircleDollarSign, Clock3, AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { useInvoices, type InvoiceRecord } from "@/hooks/useInvoices";

type InvoiceRow = {
  id: string;
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
  const total = Number(invoice.totalPrice || 0);
  return Number.isFinite(total) ? total : 0;
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
      ? "bg-[#dcfce7] text-[#16a34a]"
      : status === "Pending"
        ? "bg-[#fff7d6] text-[#d97706]"
        : "bg-[#fee2e2] text-[#dc2626]";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f1] p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-[#ef4444]">Error loading invoices</p>
        <p className="text-sm text-[#dc2626]">{message}</p>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const { invoices, loading, error, pagination, nextPage, prevPage } = useInvoices({ page: currentPage, limit: 100 });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    if (currentRole !== "business_admin") {
      router.replace("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [role, router]);

  const rows = useMemo<InvoiceRow[]>(() => {
    return invoices.map((invoice) => ({
      id: invoice.invoiceNumber || invoice.uuid,
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
              <div className="grid grid-cols-[1.3fr_1.2fr_1.2fr_1fr_1fr_.8fr] gap-4 border-b border-[#eef2f7] bg-[#fafbff] px-4 py-3 text-sm font-semibold text-[#374151]">
                <span>Invoice ID</span>
                <span>Order Number</span>
                <span>Business</span>
                <span>Date</span>
                <span>Amount</span>
                <span>Status</span>
              </div>

              {loading ? (
                <div className="grid min-h-44 place-items-center text-sm text-[#6b7280]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#4f46e5]" />
                </div>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="grid grid-cols-[1.3fr_1.2fr_1.2fr_1fr_1fr_.8fr] gap-4 border-b border-[#f0f2f7] px-4 py-4 text-sm text-[#374151] last:border-b-0">
                    <span className="font-medium">{invoice.id}</span>
                    <span>{invoice.orderNumber}</span>
                    <span>{invoice.businessName}</span>
                    <span>{invoice.date}</span>
                    <span className="font-semibold text-[#111827]">{invoice.amount}</span>
                    <StatusPill status={invoice.status} />
                  </div>
                ))
              ) : (
                <div className="grid min-h-44 place-items-center text-sm text-[#6b7280]">No invoices found</div>
              )}
            </div>

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
