"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, FileText, Loader2, Search } from "lucide-react";
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
import { useRetailResource } from "@/hooks/useRetailResource";
import { apiClient } from "@/lib/api-client";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { getStoredAuthToken } from "@/lib/utils";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { parseSalesSettings } from "@/lib/module-feature-settings";

interface SaleItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variantId?: string | null;
}

interface SaleSummary {
  id: string;
  saleNumber: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items?: SaleItem[];
}

interface SaleDetail extends SaleSummary {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  items: SaleItem[];
}

function parseVariantName(productName: string): { name: string; variantName?: string } {
  const match = productName.match(/^(.+?) \((.+)\)$/);
  if (!match) return { name: productName };
  return { name: match[1], variantName: match[2] };
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
  });
}

function SalesContent() {
  const router = useRouter();
  const { role, token: reduxToken } = useAuth();
  const branding = useInvoiceBranding();
  const { templateConfig } = useBusinessTemplate();
  const allowPrinter = parseSalesSettings(templateConfig?.moduleSettings).allowPrinter;
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const businessId = useActiveBusinessId();
  const token = reduxToken || getStoredAuthToken();

  const { items: sales, loading, error, refresh } = useRetailResource<SaleSummary>("/retail/pos/sales");
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [printerAlertOpen, setPrinterAlertOpen] = useState(false);

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

  const filteredSales = sales.filter((sale) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return sale.saleNumber.toLowerCase().includes(query);
  });

  const openReceipt = async (saleId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await apiClient.get<SaleDetail>(`/retail/pos/sales/${saleId}`, token, businessId);
      setSelectedSale(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="sales" pageTitle="Sales" pageSubtitle="View receipts and past transactions">
      <PortalPage>
        <PortalPageHeader
          icon={FileText}
          title="Sales & Receipts"
          subtitle="Retail POS transactions with full line-item detail"
        />

        <div className="relative mb-6 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className={portalSearchClass}
            placeholder="Search by sale number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[var(--text-muted)]">
                      No sales yet. Complete a sale from POS to see receipts here.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-t border-[var(--border-subtle)]">
                      <td className="px-4 py-3 font-semibold">{sale.saleNumber}</td>
                      <td className="px-4 py-3">{formatDate(sale.createdAt)}</td>
                      <td className="px-4 py-3 capitalize">{sale.paymentMethod.replace("_", " ")}</td>
                      <td className="px-4 py-3">Rs {Number(sale.totalAmount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openReceipt(sale.id)}
                          disabled={loadingDetail}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-muted)]"
                        >
                          {loadingDetail ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
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
          onClick={() => refresh()}
          className="mt-4 text-sm font-semibold text-[var(--brand-secondary)]"
        >
          Refresh list
        </button>
      </PortalPage>

      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-lg p-0">
          <DialogTitle className="sr-only">Sale receipt</DialogTitle>
          {selectedSale ? (
            <div className="p-4">
              <InvoiceReceipt
                orderNumber={selectedSale.saleNumber}
                businessName={branding.businessName}
                logoUrl={branding.logoUrl}
                date={formatDate(selectedSale.createdAt)}
                status="paid"
                subtotal={Number(selectedSale.subtotal)}
                total={Number(selectedSale.totalAmount)}
                items={selectedSale.items.map((item, index) => {
                  const parsed = parseVariantName(item.productName);
                  return {
                    id: item.id ?? String(index),
                    productName: parsed.name,
                    variantName: parsed.variantName,
                    quantity: item.quantity,
                    price: Number(item.unitPrice),
                    total: Number(item.lineTotal),
                  };
                })}
                contactPhone={branding.contactPhone}
                contactEmail={branding.contactEmail}
                address={branding.address}
                website={branding.website}
                footerNote="Thank you for your purchase!"
              />
              {Number(selectedSale.discountAmount) > 0 ? (
                <p className="mt-2 px-2 text-xs text-[var(--text-muted)]">
                  Discount applied: Rs {Number(selectedSale.discountAmount).toLocaleString()}
                </p>
              ) : null}
              <div className="mt-4 flex justify-end gap-2 px-2 pb-2">
                <InvoiceDownloadButton
                  onClick={() =>
                    void downloadInvoicePdf({
                      fileName: `invoice-${selectedSale.saleNumber}.pdf`,
                      orderNumber: selectedSale.saleNumber,
                      businessName: branding.businessName,
                      logoUrl: branding.logoUrl,
                      date: formatDate(selectedSale.createdAt),
                      status: "paid",
                      items: selectedSale.items.map((item) => {
                        const parsed = parseVariantName(item.productName);
                        return {
                          productName: parsed.name,
                          variantName: parsed.variantName,
                          quantity: item.quantity,
                          price: Number(item.unitPrice),
                          total: Number(item.lineTotal),
                        };
                      }),
                      subtotal: Number(selectedSale.subtotal),
                      total: Number(selectedSale.totalAmount),
                      contactPhone: branding.contactPhone,
                      contactEmail: branding.contactEmail,
                      address: branding.address,
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
                  onClick={() => setSelectedSale(null)}
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
