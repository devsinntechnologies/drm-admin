"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { useGetBusinessByIdQuery } from "@/hooks/useBusiness";
import { usePublicCatalog } from "@/hooks/usePublicCatalog";
import { usePublicDataSettings } from "@/hooks/usePublicData";
import { BASE_URL } from "@/lib/constant";
import { cn, normalizeErrorMessage } from "@/lib/utils";

function imageUrl(path?: string | null) {
  if (!path?.trim()) return null;
  return path.startsWith("http") ? path : `${BASE_URL}/${path.replace(/^\//, "")}`;
}

function StatusPill({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-800",
      )}
    >
      {label}
    </span>
  );
}

export default function PublicCatalogPreviewPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  const businessId = useActiveBusinessId();
  const { settings, loading: settingsLoading, actionLoading, updateSettings, fetchSettings } =
    usePublicDataSettings();

  const { data: business, isFetching: businessLoading } = useGetBusinessByIdQuery(
    businessId || "",
    { skip: !businessId },
  );

  const businessStatus = String(business?.status ?? "").toLowerCase();
  const businessIsActive = businessStatus === "active";
  const storefrontEnabled = settings?.enabled === true;
  const canPreview = storefrontEnabled && businessIsActive;

  const {
    storefront,
    categories,
    products,
    loading,
    refreshing,
    error,
    pagination,
    fetchCatalog,
  } = usePublicCatalog({
    page: currentPage,
    search,
    categoryId: categoryId || undefined,
    available: availableOnly ? true : undefined,
    enabled: canPreview,
  });

  const settingsHref = businessId
    ? `/dashboard/businessAdmin/public-data?businessId=${businessId}`
    : "/dashboard/businessAdmin/public-data";

  const displayName =
    storefront?.displayName || settings?.displayName || business?.businessName || "Untitled storefront";
  const displayDescription =
    storefront?.description || settings?.description || null;
  const logoSrc = imageUrl(storefront?.logo || settings?.logo || null);

  const showDisabledState = !settingsLoading && settings && !settings.enabled;
  const showInactiveBusiness =
    !!settings && settings.enabled && !!business && !!businessStatus && !businessIsActive;
  const showCatalogError = canPreview && !!error && !storefront;
  const showBootLoading =
    (settingsLoading && !settings) || (businessLoading && !business) || (canPreview && loading && !storefront);

  const applySearch = () => {
    setCurrentPage(1);
    setSearch(searchInput.trim());
  };

  const onEnableStorefront = async () => {
    const toastId = toast.loading("Enabling public storefront...");
    try {
      await updateSettings({
        enabled: true,
        syncOperationalCatalog: settings?.syncOperationalCatalog ?? true,
        displayName: settings?.displayName ?? undefined,
        description: settings?.description ?? undefined,
        logo: settings?.logo ?? undefined,
        allowedOrigins: settings?.allowedOrigins ?? [],
      });
      await fetchSettings();
      toast.success("Storefront enabled", { id: toastId });
      if (businessIsActive) await fetchCatalog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enable storefront", { id: toastId });
    }
  };

  const productCards = useMemo(
    () =>
      products.map((product) => {
        const url = imageUrl(product.image);
        return (
          <article
            key={product.id}
            className="overflow-hidden rounded-3xl border border-[#f1f5f9] bg-white shadow-sm"
          >
            <div className="relative h-40 w-full bg-[#f8fafc]">
              {url ? (
                <Image src={url} alt={product.name} fill unoptimized className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-[#cbd5e1]" />
                </div>
              )}
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-base font-bold text-[#0f172a]">{product.name}</h4>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    product.available
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {product.available ? "Available" : "Unavailable"}
                </span>
              </div>
              <p className="text-sm text-[#64748b]">
                PKR {product.price}
                {product.category?.name ? ` • ${product.category.name}` : ""}
              </p>
              {product.variants?.length ? (
                <p className="text-xs text-[#94a3b8]">{product.variants.length} variants</p>
              ) : null}
              {product.description ? (
                <p className="line-clamp-2 text-xs text-[#64748b]">{product.description}</p>
              ) : null}
            </div>
          </article>
        );
      }),
    [products],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#e5edf5] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-[#0f172a]">Public Catalog Preview</h3>
            <p className="text-sm text-[#64748b]">
              Read-only view of what customers see online from the public catalog API.
            </p>
            {businessId ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill
                  ok={storefrontEnabled}
                  label={`Storefront: ${storefrontEnabled ? "enabled" : "disabled"}`}
                />
                <StatusPill
                  ok={businessIsActive}
                  label={`Business: ${businessStatus || (businessLoading ? "loading…" : "unknown")}`}
                />
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              fetchSettings();
              if (canPreview) fetchCatalog();
            }}
            disabled={loading || refreshing}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#d7e1ed] px-4 py-2.5 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", (loading || refreshing || settingsLoading) && "animate-spin")} />
            Refresh
          </button>
        </div>

        {!businessId ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            A business ID is required to preview the public catalog.
          </div>
        ) : showBootLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#001840]" />
          </div>
        ) : showDisabledState ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-semibold text-amber-900">Storefront is disabled</p>
            <p className="mt-1 text-sm text-amber-800">
              Enable the storefront to preview published catalog content.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onEnableStorefront}
                disabled={actionLoading}
                className="dn-btn dn-btn-primary disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enable Storefront
              </button>
              <Link
                href={settingsHref}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900"
              >
                <Settings2 className="h-4 w-4" />
                Open Settings
              </Link>
            </div>
          </div>
        ) : showInactiveBusiness ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-semibold text-amber-900">Business is not active</p>
            <p className="mt-1 text-sm text-amber-800">
              Public catalog requires business status <code>active</code>. Current status:{" "}
              <strong>{businessStatus || "unknown"}</strong>.
            </p>
            <Link
              href="/dashboard/superAdmin/businesses"
              className="dn-btn dn-btn-primary mt-4"
            >
              Open Businesses
            </Link>
          </div>
        ) : showCatalogError ? (
          <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f1] p-4 flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#ef4444]" />
            <div>
              <p className="font-semibold text-[#ef4444]">Catalog unavailable</p>
              <p className="text-sm text-[#dc2626]">{normalizeErrorMessage(error)}</p>
              <Link href={settingsHref} className="mt-3 inline-flex text-sm font-semibold text-[#001840]">
                Review Settings & Sync
              </Link>
            </div>
          </div>
        ) : storefront || canPreview ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#f8fafc]">
              {logoSrc ? (
                <Image src={logoSrc} alt={displayName} fill unoptimized className="object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-[#94a3b8]" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="truncate text-lg font-bold text-[#0f172a]">{displayName}</h4>
              <p className="text-sm text-[#64748b]">
                {displayDescription || "No description set in storefront settings"}
              </p>
              <p className="mt-1 truncate text-xs text-[#94a3b8]">Business ID: {businessId}</p>
            </div>
          </div>
        ) : null}
      </div>

      {canPreview && !showCatalogError && businessId ? (
        <div className="rounded-[28px] border border-[#e5edf5] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[#0f172a]">Published Products</h3>
              {refreshing ? (
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748b]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating…
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <div className="relative min-w-0 flex-1 lg:min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applySearch();
                  }}
                  placeholder="Search published products..."
                  className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-10 pr-3 text-sm outline-none"
                />
              </div>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCurrentPage(1);
                  setCategoryId(e.target.value);
                }}
                className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm outline-none lg:w-48"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm font-medium text-[#334155]">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setAvailableOnly(e.target.checked);
                  }}
                />
                Available only
              </label>
              <button
                type="button"
                onClick={applySearch}
                className="rounded-xl border border-[#d7e1ed] px-4 py-2.5 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc]"
              >
                Apply
              </button>
            </div>
          </div>

          {loading && products.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#001840]" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-[#f8fafc] px-6 py-16 text-center">
              <p className="text-sm font-semibold text-[#475569]">No published products</p>
              <p className="mt-1 text-sm text-[#94a3b8]">
                {availableOnly || search || categoryId
                  ? "Try clearing filters, or publish products in the Products tab."
                  : "Publish categories and products, then sync the catalog."}
              </p>
            </div>
          ) : (
            <div className={cn("relative", refreshing && "opacity-60")}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {productCards}
              </div>
            </div>
          )}

          {!loading && pagination.total > 0 ? (
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-sm text-[#64748b]">
                Page {pagination.page} of {pagination.last_page} • {pagination.total} total
              </p>
              {pagination.last_page > 1 ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || refreshing}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl border border-[#d7e1ed] p-2 disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= pagination.last_page || refreshing}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="rounded-xl border border-[#d7e1ed] p-2 disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
