"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Search } from "lucide-react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import {
  PortalPage,
  PortalPageHeader,
  PortalEmptyState,
  portalSearchClass,
  portalPanelClass,
  portalTableWrapClass,
  portalTableHeadClass,
} from "@/components/admin/PortalPage";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useProducts, type Product } from "@/hooks/useProducts";
import {
  formatStockLabel,
  getActiveVariants,
  getLowStockThreshold,
  getStockStatus,
  hasVariants,
  isStockTracked,
  stockStatusLabel,
  type StockStatus,
} from "@/lib/retail-stock";

type InventoryRow = {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  tracked: boolean;
  onHand: number | null;
  threshold: number;
  status: StockStatus;
  sellPrice: number;
  costPrice: number | null;
};

function statusClass(status: StockStatus): string {
  switch (status) {
    case "out":
      return "bg-red-500/15 text-red-600 dark:text-red-300";
    case "low":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-300";
    case "ok":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300";
    default:
      return "bg-[var(--surface-muted)] text-[var(--text-muted)]";
  }
}

function productToRows(product: Product): InventoryRow[] {
  const tracked = isStockTracked(product);
  const threshold = getLowStockThreshold(product);

  if (hasVariants(product)) {
    return getActiveVariants(product).map((variant) => ({
      id: `${product.id}:${variant.id}`,
      productId: product.id,
      productName: product.name,
      variantName: variant.name,
      tracked,
      onHand: tracked ? (variant.inStock ?? 0) : null,
      threshold,
      status: getStockStatus(product, variant),
      sellPrice: Number(variant.price ?? product.price) || 0,
      costPrice: variant.costPrice ?? product.costPrice ?? null,
    }));
  }

  return [
    {
      id: product.id,
      productId: product.id,
      productName: product.name,
      variantName: "—",
      tracked,
      onHand: tracked ? (product.inStock ?? 0) : null,
      threshold,
      status: getStockStatus(product),
      sellPrice: Number(product.price) || 0,
      costPrice: product.costPrice ?? null,
    },
  ];
}

function InventoryContent() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | StockStatus>("all");

  const { products, loading, error, refetch } = useProducts({ limit: 500 });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "inventory") && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const rows = useMemo(() => {
    const active = products.filter((p) => p.status === "ACTIVE");
    const flat = active.flatMap(productToRows);
    const query = search.trim().toLowerCase();

    return flat.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!query) return true;
      return (
        row.productName.toLowerCase().includes(query) ||
        row.variantName.toLowerCase().includes(query)
      );
    });
  }, [products, search, filter]);

  const summary = useMemo(() => {
    const active = products.filter((p) => p.status === "ACTIVE");
    const flat = active.flatMap(productToRows).filter((r) => r.tracked);
    return {
      total: flat.length,
      out: flat.filter((r) => r.status === "out").length,
      low: flat.filter((r) => r.status === "low").length,
      ok: flat.filter((r) => r.status === "ok").length,
    };
  }, [products]);

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="inventory" pageTitle="Inventory" pageSubtitle="Live stock levels for POS and purchasing">
      <PortalPage>
        <PortalPageHeader
          icon={Package}
          title="Inventory"
          subtitle="Stock shown here is what POS uses — out-of-stock items cannot be sold"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Tracked SKUs", value: summary.total },
            { label: "In stock", value: summary.ok },
            { label: "Low stock", value: summary.low },
            { label: "Out of stock", value: summary.out },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
              <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{item.value}</p>
            </div>
          ))}
        </div>

        <div className={portalPanelClass}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                className={portalSearchClass}
                placeholder="Search product or variant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "ok", "low", "out", "untracked"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    filter === key
                      ? "bg-[var(--brand-primary)] text-white"
                      : "border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-primary)]"
                  }`}
                >
                  {key === "all" ? "All" : stockStatusLabel(key)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <Loading size="sm" />
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : rows.length === 0 ? (
            <PortalEmptyState icon={Package} title="No inventory rows" description="Add products with stock tracking enabled to manage inventory here." />
          ) : (
            <div className={portalTableWrapClass}>
              <table className="w-full text-sm">
                <thead className={portalTableHeadClass}>
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Variant</th>
                    <th className="px-4 py-3 text-right">On hand</th>
                    <th className="px-4 py-3 text-right">Reorder at</th>
                    <th className="px-4 py-3 text-right">Sell price</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-[var(--border-subtle)]">
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{row.productName}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{row.variantName}</td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--text-primary)]">
                        {row.tracked ? row.onHand : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text-muted)]">
                        {row.tracked ? `≤ ${row.threshold}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">Rs {row.sellPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-[var(--text-muted)]">
                        {row.costPrice != null ? `Rs ${row.costPrice.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(row.status)}`}>
                          {stockStatusLabel(row.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Update stock via Products (manual edit), Purchase receive, Returns, or POS sales. Refresh after changes.
          </p>
          <button
            type="button"
            onClick={() => refetch(1)}
            className="mt-2 text-sm font-semibold text-[var(--brand-secondary)] hover:underline"
          >
            Refresh stock
          </button>
        </div>
      </PortalPage>
    </AdminShell>
  );
}

export default function RetailInventoryPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <InventoryContent />
    </Suspense>
  );
}
