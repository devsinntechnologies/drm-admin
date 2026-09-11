"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock3, Eye, FileText, Loader2, Printer, RotateCcw, Search } from "lucide-react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, portalSearchClass } from "@/components/admin/PortalPage";
import InvoiceReceipt, { InvoiceDownloadButton, InvoicePrintButton } from "@/components/common/InvoiceReceipt";
import { PrinterAccessAlert } from "@/components/common/PrinterAccessAlert";
import { ConnectPrinterDialog } from "@/components/invoices/ConnectPrinterDialog";
import { useInvoiceBranding } from "@/hooks/useInvoiceBranding";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useInvoices, type InvoiceRecord } from "@/hooks/useInvoices";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { parseSalesSettings } from "@/lib/module-feature-settings";
import { formatInvoiceDateTime } from "@/lib/invoice-datetime";
import { apiClient } from "@/lib/api-client";
import { cn, normalizeErrorMessage } from "@/lib/utils";
import { INVOICE_TIPS } from "@/lib/feature-tips";
import type { BusinessPrinter, PrintersPayload } from "@/lib/printers";
import { STAFF_REALTIME_EVENTS } from "@/lib/staff-realtime";
import {
  createPrintJob,
  invoiceRecordToPrintPayload,
} from "@/lib/print-jobs";
import { toast } from "sonner";

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

function isReturnedStatus(raw?: string | null) {
  const value = String(raw ?? "").toLowerCase().trim();
  return value === "returned" || value === "refunded";
}

function canReturnInvoiceRole(roleName?: string | null) {
  const role = String(roleName ?? "").toLowerCase().trim();
  return (
    role === "business_admin" ||
    role === "super_admin" ||
    role === "admin" ||
    role === "businessadmin" ||
    role.includes("business")
  );
}

function isReturnableStatus(raw?: string | null) {
  const value = String(raw ?? "").toLowerCase().trim();
  return value === "paid" || value === "pending";
}

function SalesContent() {
  const router = useRouter();
  const { role, token } = useAuth();
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
  const [connectPrinterOpen, setConnectPrinterOpen] = useState(false);
  const [connectedPrinter, setConnectedPrinter] = useState<BusinessPrinter | null>(null);
  const [printInFlight, setPrintInFlight] = useState(false);
  const [returningInvoiceUuid, setReturningInvoiceUuid] = useState<string | null>(null);
  const [returnConfirmUuid, setReturnConfirmUuid] = useState<string | null>(null);
  const activeBusinessId = useActiveBusinessId();

  const resolvedRole =
    role ?? (typeof window !== "undefined" ? localStorage.getItem("roleName") : null);
  const canReturnInvoice = canReturnInvoiceRole(resolvedRole);

  const refreshConnectedPrinter = useCallback(async () => {
    if (!token || !activeBusinessId || !allowPrinter) return;
    try {
      const payload = await apiClient.get<PrintersPayload>("/printers", token, activeBusinessId);
      setConnectedPrinter(
        payload.printers.find(
          (printer) => printer.isConnected && printer.lastStatus !== "unreachable",
        ) ?? null,
      );
    } catch {
      // ignore
    }
  }, [token, activeBusinessId, allowPrinter]);

  useEffect(() => {
    void refreshConnectedPrinter();
  }, [refreshConnectedPrinter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPrintersChanged = (event: Event) => {
      const detail = (event as CustomEvent).detail as PrintersPayload | undefined;
      if (detail?.printers) {
        setConnectedPrinter(
          detail.printers.find(
            (printer) => printer.isConnected && printer.lastStatus !== "unreachable",
          ) ?? null,
        );
        return;
      }
      void refreshConnectedPrinter();
    };
    window.addEventListener(STAFF_REALTIME_EVENTS.PRINTERS_CHANGED, onPrintersChanged);
    window.addEventListener("printers:updated", onPrintersChanged);
    return () => {
      window.removeEventListener(STAFF_REALTIME_EVENTS.PRINTERS_CHANGED, onPrintersChanged);
      window.removeEventListener("printers:updated", onPrintersChanged);
    };
  }, [refreshConnectedPrinter]);

  const { invoices, loading, actionLoading, error, refetch, returnInvoice } = useInvoices({
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

  const handleConfirmReturn = async () => {
    if (!returnConfirmUuid) return;
    if (!canReturnInvoice) {
      toast.error("Only a business admin can return invoices.");
      setReturnConfirmUuid(null);
      return;
    }

    const invoiceUuid = returnConfirmUuid;
    setReturnConfirmUuid(null);
    const toastId = toast.loading("Returning invoice...");
    try {
      setReturningInvoiceUuid(invoiceUuid);
      await returnInvoice(invoiceUuid);
      toast.success("Invoice returned successfully.", { id: toastId });
      setSelectedInvoice((prev) =>
        prev && prev.uuid === invoiceUuid ? { ...prev, status: "returned" } : prev,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to return invoice.";
      toast.error(message, { id: toastId });
    } finally {
      setReturningInvoiceUuid(null);
    }
  };

  if (!isAuthorized) return null;

  const selectedAmounts = selectedInvoice ? invoiceAmounts(selectedInvoice) : null;
  const selectedReturned = selectedInvoice ? isReturnedStatus(selectedInvoice.status) : false;

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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!allowPrinter) {
                  setPrinterAlertOpen(true);
                  return;
                }
                if (connectedPrinter) {
                  const suffix = activeBusinessId
                    ? `?businessId=${encodeURIComponent(activeBusinessId)}`
                    : "";
                  router.push(`/dashboard/businessAdmin/software/printers${suffix}`);
                  return;
                }
                setConnectPrinterOpen(true);
              }}
              className={cn(
                "dn-btn !h-9 !px-3",
                connectedPrinter ? "!bg-[#16a34a] !text-white hover:!bg-[#15803d]" : "dn-btn-soft",
                !allowPrinter && "opacity-45",
              )}
            >
              <Printer className="h-4 w-4" />
              {connectedPrinter ? (
                <>
                  <span className="max-w-[140px] truncate">{connectedPrinter.name}</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    Connected
                  </span>
                </>
              ) : (
                "Connect Printer"
              )}
            </button>
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
                  <th className="px-4 py-3 text-right">Actions</th>
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
                  filteredSales.map((invoice) => {
                    const returned = isReturnedStatus(invoice.status);
                    const showReturn =
                      canReturnInvoice && !returned && isReturnableStatus(invoice.status);
                    return (
                      <tr key={invoice.uuid} className="border-t border-[var(--border-subtle)]">
                        <td className="px-4 py-3 font-semibold">
                          {invoice.invoiceNumber || invoice.uuid}
                        </td>
                        <td className="px-4 py-3">{invoice.orderNumber || "—"}</td>
                        <td className="px-4 py-3">{formatDate(invoice.createdAt)}</td>
                        <td className="px-4 py-3">
                          {returned ? (
                            <span
                              className="inline-flex rounded-full bg-[#fef2f2] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#dc2626]"
                              title={INVOICE_TIPS.returned}
                            >
                              RETURNED
                            </span>
                          ) : (
                            <span className="capitalize">{invoice.status}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          Rs {invoiceAmounts(invoice).total.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(invoice)}
                              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-muted)]"
                              title={INVOICE_TIPS.view}
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </button>
                            {returned ? (
                              <span
                                className="inline-flex items-center rounded-lg bg-[#fef2f2] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#dc2626]"
                                title={INVOICE_TIPS.returned}
                              >
                                RETURNED
                              </span>
                            ) : showReturn ? (
                              <button
                                type="button"
                                onClick={() => setReturnConfirmUuid(invoice.uuid)}
                                disabled={actionLoading && returningInvoiceUuid === invoice.uuid}
                                className="dn-btn !h-9 !px-3 !bg-[#dc2626] !text-white hover:!bg-[#b91c1c]"
                                title={INVOICE_TIPS.return}
                              >
                                {returningInvoiceUuid === invoice.uuid ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <RotateCcw className="h-4 w-4" />
                                    Return
                                  </>
                                )}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                status={selectedReturned ? "returned" : selectedInvoice.status}
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
                footerNote={branding.businessName || selectedInvoice.businessName}
              />
              <div className="mt-4 flex flex-wrap justify-end gap-2 px-2 pb-2">
                {selectedReturned ? (
                  <span
                    className="inline-flex items-center rounded-lg bg-[#fef2f2] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#dc2626]"
                    title={INVOICE_TIPS.returned}
                  >
                    RETURNED INVOICE
                  </span>
                ) : (
                  <>
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
                        if (!selectedInvoice || printInFlight) return;
                        void (async () => {
                          setPrintInFlight(true);
                          try {
                            await createPrintJob(token, activeBusinessId, {
                              jobType: "INVOICE",
                              printerId: connectedPrinter?.id,
                              printerName: connectedPrinter?.name,
                              referenceNumber:
                                selectedInvoice.invoiceNumber ||
                                selectedInvoice.orderNumber ||
                                selectedInvoice.uuid,
                              referenceId: selectedInvoice.uuid || selectedInvoice.orderId,
                              payload: invoiceRecordToPrintPayload(
                                selectedInvoice as unknown as Record<string, unknown>,
                              ),
                            });
                            window.print();
                            toast.success(
                              connectedPrinter
                                ? "Invoice queued and sent to the connected printer."
                                : "Invoice added to the print queue.",
                            );
                          } catch (err) {
                            toast.error(
                              normalizeErrorMessage(err, "Print failed. Check printer connection."),
                            );
                          } finally {
                            setPrintInFlight(false);
                          }
                        })();
                      }}
                    />
                    {canReturnInvoice && isReturnableStatus(selectedInvoice.status) ? (
                      <button
                        type="button"
                        onClick={() => setReturnConfirmUuid(selectedInvoice.uuid)}
                        disabled={returningInvoiceUuid === selectedInvoice.uuid}
                        className="dn-btn !bg-[#dc2626] !text-white hover:!bg-[#b91c1c]"
                        title={INVOICE_TIPS.return}
                      >
                        {returningInvoiceUuid === selectedInvoice.uuid ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4" />
                            Return
                          </>
                        )}
                      </button>
                    ) : null}
                  </>
                )}
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

      <Dialog open={Boolean(returnConfirmUuid)} onOpenChange={(open) => !open && setReturnConfirmUuid(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-lg font-bold text-[#0f172a]">Return invoice?</DialogTitle>
          <p className="mt-2 text-sm text-[#64748b]">
            Are you sure you want to return this invoice? This action is permanent. The invoice amount will be
            removed from sales calculations, associated profit will be removed from profit calculations, and
            purchased products will be added back to inventory. This invoice cannot be restored after it is returned.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="dn-btn dn-btn-outline"
              disabled={Boolean(returningInvoiceUuid)}
              onClick={() => setReturnConfirmUuid(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dn-btn !bg-[#dc2626] !text-white hover:!bg-[#b91c1c]"
              disabled={Boolean(returningInvoiceUuid)}
              onClick={() => void handleConfirmReturn()}
            >
              {returningInvoiceUuid ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm Return"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <PrinterAccessAlert open={printerAlertOpen} onOpenChange={setPrinterAlertOpen} />
      <ConnectPrinterDialog
        open={connectPrinterOpen}
        onOpenChange={setConnectPrinterOpen}
        onConnectedChange={setConnectedPrinter}
      />
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
