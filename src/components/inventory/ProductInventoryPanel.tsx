"use client";

import { useEffect, useMemo, useState } from "react";
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
  getActiveVariants,
  getLowStockThreshold,
  getStockStatus,
  hasVariants,
  isStockTracked,
  stockStatusLabel,
  summarizeCatalogStock,
  type StockStatus,
} from "@/lib/retail-stock";
import { cn } from "@/lib/utils";

type InventoryFilter = "all" | "tracked" | StockStatus;

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
};

const FILTER_CHIPS: { key: InventoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ok", label: "In stock" },
  { key: "low", label: "Low stock" },
  { key: "out", label: "Out of stock" },
  { key: "untracked", label: "Not tracked" },
];

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

function isActiveProduct(product: Product): boolean {
  return String(product.status ?? "").toUpperCase() === "ACTIVE";
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
    },
  ];
}

function emptyCopy(filter: InventoryFilter): { title: string; description: string } {
  switch (filter) {
    case "ok":
      return { title: "No in-stock items", description: "Nothing currently sits above the reorder level." };
    case "low":
      return { title: "No low-stock items", description: "No tracked SKUs are at or below the reorder level." };
    case "out":
      return { title: "No out-of-stock items", description: "None of the tracked SKUs are at zero." };
    case "untracked":
      return { title: "No untracked products", description: "Every product in this catalog has Track Stock turned on." };
    case "tracked":
      return { title: "No tracked products", description: "Turn on Track Stock on a product to monitor on-hand quantity here." };
    default:
      return {
        title: "No inventory rows",
        description: "Add products and turn on Track Stock in the app or Products page. Quantities entered there appear here.",
      };
  }
}

export function ProductInventoryPanel() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InventoryFilter>("all");

  const { products, loading, error } = useProducts({ limit: 500 });

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

  const allRows = useMemo(() => {
    return products.filter(isActiveProduct).flatMap(productToRows);
  }, [products]);

  const summary = useMemo(() => summarizeCatalogStock(products), [products]);

  const chipCounts: Record<InventoryFilter, number> = {
    all: allRows.length,
    tracked: summary.tracked,
    ok: summary.ok,
    low: summary.low,
    out: summary.out,
    untracked: summary.untracked,
  };

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allRows.filter((row) => {
      if (filter === "tracked" && !row.tracked) return false;
      if (filter !== "all" && filter !== "tracked" && row.status !== filter) return false;
      if (!query) return true;
      return (
        row.productName.toLowerCase().includes(query) ||
        row.variantName.toLowerCase().includes(query)
      );
    });
  }, [allRows, search, filter]);

  if (!isAuthorized) return null;

  const empty = emptyCopy(filter);

  return (
    <AdminShell activeTab="inventory" pageTitle="Inventory" pageSubtitle="Live stock levels shared with the app">
      <PortalPage>
        <PortalPageHeader
          icon={Package}
          title="Inventory"
          subtitle="Same on-hand stock the app portal uses. Sales, purchases, and product edits update these quantities."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { key: "tracked", label: "Tracked SKUs", value: summary.tracked },
              { key: "ok", label: "In stock", value: summary.ok },
              { key: "low", label: "Low stock", value: summary.low },
              { key: "out", label: "Out of stock", value: summary.out },
            ] as const
          ).map((item) => {
            const selected = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={selected}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  selected
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] ring-2 ring-[var(--brand-primary)]/30"
                    : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--brand-secondary)]",
                )}
              >
                <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{item.value}</p>
              </button>
            );
          })}
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
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setFilter(chip.key)}
                  aria-pressed={filter === chip.key}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    filter === chip.key
                      ? "bg-[var(--brand-primary)] text-white"
                      : "border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-primary)] hover:border-[var(--brand-secondary)]",
                  )}
                >
                  {chip.label} ({chipCounts[chip.key]})
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <Loading size="sm" />
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : rows.length === 0 ? (
            <PortalEmptyState icon={Package} title={empty.title} description={empty.description} />
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
        </div>
      </PortalPage>
    </AdminShell>
  );
}
