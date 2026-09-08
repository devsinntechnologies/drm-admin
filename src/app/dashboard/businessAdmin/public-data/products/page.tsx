"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PublicProductRecord,
  PublicVariantRecord,
  usePublicCategories,
  usePublicProducts,
} from "@/hooks/usePublicData";
import { BASE_URL } from "@/lib/constant";
import { cn, normalizeErrorMessage } from "@/lib/utils";
import { DragSortHandle } from "@/components/common/DragSortHandle";
import { useHtml5Reorder } from "@/hooks/useHtml5Reorder";

function StatusChip({ label, tone }: { label: string; tone: "green" | "amber" | "slate" | "red" | "blue" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    red: "bg-red-50 text-red-700 border-red-100",
    blue: "bg-sky-50 text-sky-700 border-sky-100",
  };
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold", tones[tone])}>
      {label}
    </span>
  );
}

function imageUrl(path?: string | null) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${BASE_URL}/${path}`;
}

const emptyProductForm = {
  publicCategoryId: "",
  name: "",
  description: "",
  price: 0,
  sortOrder: 0,
  available: true,
  isPublished: true,
  image: null as File | null,
};

export default function PublicDataProductsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PublicProductRecord | null>(null);
  const [variants, setVariants] = useState<PublicVariantRecord[]>([]);
  const [variantForm, setVariantForm] = useState({
    name: "",
    price: 0,
    sortOrder: 0,
    available: true,
    isPublished: true,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PublicProductRecord | null>(null);
  const [createForm, setCreateForm] = useState(emptyProductForm);
  const [editForm, setEditForm] = useState(emptyProductForm);

  const {
    products,
    loading,
    actionLoading,
    error,
    pagination,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    createVariant,
    updateVariant,
    deleteVariant,
    listVariants,
    fetchProducts,
    reorderProducts,
  } = usePublicProducts({ page: currentPage, search });

  const { categories } = usePublicCategories({ page: 1, limit: 100, enabled: true });
  const categoryOptions = useMemo(
    () => categories.filter((category) => !category.deletedAt),
    [categories],
  );
  const activeProducts = useMemo(
    () => products.filter((product) => !product.deletedAt),
    [products],
  );

  const onReorder = useCallback(
    async (ids: string[]) => {
      try {
        await reorderProducts(ids);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save catalog order");
        throw err;
      }
    },
    [reorderProducts],
  );

  const {
    items: orderedProducts,
    dragId,
    dropId,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
  } = useHtml5Reorder(activeProducts, onReorder, !actionLoading);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.name.trim() || !createForm.publicCategoryId) {
      toast.error("Name and category are required");
      return;
    }
    const toastId = toast.loading("Creating public product...");
    try {
      await createProduct({
        publicCategoryId: createForm.publicCategoryId,
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        price: Number(createForm.price) || 0,
        sortOrder: Number(createForm.sortOrder) || 0,
        available: createForm.available,
        isPublished: createForm.isPublished,
        image: createForm.image,
      });
      toast.success("Product created", { id: toastId });
      setCreateForm(emptyProductForm);
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product", { id: toastId });
    }
  };

  const onOpenEdit = async (id: string) => {
    const toastId = toast.loading("Loading product...");
    try {
      const product = await getProductById(id);
      const productVariants = product.variants?.length
        ? product.variants
        : await listVariants(id);
      setEditing(product);
      setEditId(id);
      setVariants(productVariants.filter((variant) => !variant.deletedAt));
      setEditForm({
        publicCategoryId: product.publicCategoryId,
        name: product.name,
        description: product.description ?? "",
        price: product.price ?? 0,
        sortOrder: product.sortOrder ?? 0,
        available: !!product.available,
        isPublished: !!product.isPublished,
        image: null,
      });
      setEditOpen(true);
      toast.dismiss(toastId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load product", { id: toastId });
    }
  };

  const onEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editId || !editForm.name.trim() || !editForm.publicCategoryId) {
      toast.error("Name and category are required");
      return;
    }
    const toastId = toast.loading("Updating product...");
    try {
      await updateProduct(editId, {
        publicCategoryId: editForm.publicCategoryId,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: Number(editForm.price) || 0,
        sortOrder: Number(editForm.sortOrder) || 0,
        available: editForm.available,
        isPublished: editForm.isPublished,
        image: editForm.image,
      });
      toast.success("Product updated", { id: toastId });
      setEditOpen(false);
      setEditId(null);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update product", { id: toastId });
    }
  };

  const onConvert = async () => {
    if (!editId) return;
    const toastId = toast.loading("Converting to manual...");
    try {
      await updateProduct(editId, { convertToManual: true });
      toast.success("Converted to manual product", { id: toastId });
      setEditOpen(false);
      setEditId(null);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to convert product", { id: toastId });
    }
  };

  const refreshVariants = async (productId: string) => {
    const next = await listVariants(productId);
    setVariants(next.filter((variant) => !variant.deletedAt));
    await fetchProducts(currentPage, search);
  };

  const onAddVariant = async () => {
    if (!editId || !variantForm.name.trim()) {
      toast.error("Variant name is required");
      return;
    }
    const toastId = toast.loading("Creating variant...");
    try {
      await createVariant(editId, {
        name: variantForm.name.trim(),
        price: Number(variantForm.price) || 0,
        sortOrder: Number(variantForm.sortOrder) || 0,
        available: variantForm.available,
        isPublished: variantForm.isPublished,
      });
      setVariantForm({ name: "", price: 0, sortOrder: 0, available: true, isPublished: true });
      await refreshVariants(editId);
      toast.success("Variant created", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create variant", { id: toastId });
    }
  };

  const onToggleVariantPublish = async (variant: PublicVariantRecord) => {
    if (!editId) return;
    const toastId = toast.loading("Updating variant...");
    try {
      await updateVariant(editId, variant.id, { isPublished: !variant.isPublished });
      await refreshVariants(editId);
      toast.success("Variant updated", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update variant", { id: toastId });
    }
  };

  const onConvertVariant = async (variant: PublicVariantRecord) => {
    if (!editId) return;
    const toastId = toast.loading("Converting variant...");
    try {
      await updateVariant(editId, variant.id, { convertToManual: true });
      await refreshVariants(editId);
      toast.success("Variant converted", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to convert variant", { id: toastId });
    }
  };

  const onDeleteVariant = async (variant: PublicVariantRecord) => {
    if (!editId) return;
    const toastId = toast.loading("Removing variant...");
    try {
      await deleteVariant(editId, variant.id);
      await refreshVariants(editId);
      toast.success("Variant removed", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete variant", { id: toastId });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const toastId = toast.loading("Removing product...");
    try {
      await deleteProduct(deleteTarget.id);
      toast.success(
        deleteTarget.sourceType === "operational"
          ? "Synchronized product suppressed"
          : "Product deleted",
        { id: toastId },
      );
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product", { id: toastId });
    }
  };

  return (
    <div className="rounded-[28px] border border-[#e5edf5] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#0f172a]">Public Products</h3>
          <p className="text-sm text-[#64748b]">
            Manage published products, availability, and variants. Drag the grip to change catalog order.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-[240px] space-y-1.5">
            <span className="block text-sm font-semibold text-[#64748b]">Search</span>
            <span className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setCurrentPage(1);
                    setSearch(searchInput.trim());
                  }
                }}
                placeholder="Search products..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-10 pr-3 text-sm outline-none"
              />
            </span>
          </label>
          <button
            type="button"
            onClick={() => {
              setCurrentPage(1);
              setSearch(searchInput.trim());
            }}
            className="rounded-xl border border-[#d7e1ed] px-4 py-2.5 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc]"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="dn-btn dn-btn-primary"
          >
            <Plus className="h-4 w-4" /> New Product
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-[#fecaca] bg-[#fff1f1] p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#ef4444]">Error loading products</p>
            <p className="text-sm text-[#dc2626]">{normalizeErrorMessage(error)}</p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <Loading />
      ) : activeProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-[#f8fafc] px-6 py-16 text-center">
          <p className="text-sm font-semibold text-[#475569]">No public products found</p>
          <p className="mt-1 text-sm text-[#94a3b8]">Create a manual product or sync from the operational catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orderedProducts.map((product) => {
            const url = imageUrl(product.image);
            return (
              <article
                key={product.id}
                onDragOver={(event) => onDragOver(product.id, event)}
                onDrop={(event) => onDrop(product.id, event)}
                className={cn(
                  "overflow-hidden rounded-3xl border bg-white shadow-sm transition",
                  dragId === product.id ? "border-[#93c5fd] opacity-60" : "border-[#f1f5f9]",
                  dropId === product.id && dragId !== product.id ? "ring-2 ring-[#93c5fd]" : "",
                )}
              >
                <div className="relative h-44 w-full bg-[#f8fafc]">
                  {url ? (
                    <Image src={url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-[#cbd5e1]" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3 rounded-xl bg-white/90 shadow-sm">
                    <DragSortHandle
                      disabled={actionLoading}
                      onDragStart={(event) => onDragStart(product.id, event)}
                      onDragEnd={onDragEnd}
                    />
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h4 className="text-base font-bold text-[#0f172a]">{product.name}</h4>
                    <p className="text-sm text-[#64748b]">
                      PKR {product.price}
                      {product.category?.name ? ` • ${product.category.name}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusChip label={product.sourceType} tone={product.sourceType === "manual" ? "blue" : "slate"} />
                    <StatusChip
                      label={product.syncStatus}
                      tone={
                        product.syncStatus === "synced"
                          ? "green"
                          : product.syncStatus === "detached"
                            ? "amber"
                            : product.syncStatus === "failed"
                              ? "red"
                              : "slate"
                      }
                    />
                    <StatusChip label={product.available ? "available" : "unavailable"} tone={product.available ? "green" : "slate"} />
                    <StatusChip label={product.isPublished ? "published" : "unpublished"} tone={product.isPublished ? "green" : "slate"} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenEdit(product.id)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#EEF3FF] px-3 py-2 text-sm font-semibold text-[#001840]"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteTarget(product);
                        setDeleteOpen(true);
                      }}
                      className="inline-flex items-center justify-center rounded-xl bg-[#fff1f1] px-3 py-2 text-sm font-semibold text-[#dc2626]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pagination.last_page > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-[#64748b]">
            Page {pagination.page} of {pagination.last_page} • {pagination.total} total
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-[#d7e1ed] p-2 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= pagination.last_page}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded-xl border border-[#d7e1ed] p-2 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Create public product</DialogTitle>
            <DialogDescription>Creates a manual public-only product.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Category <span className="text-[#dc2626]">*</span></span>
              <select
                value={createForm.publicCategoryId}
                onChange={(e) => setCreateForm((p) => ({ ...p, publicCategoryId: e.target.value }))}
                required
                className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
              >
                <option value="">Select category</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Product name <span className="text-[#dc2626]">*</span></span>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Product name"
                required
                className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Description</span>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                rows={3}
                className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="block text-sm font-semibold text-[#64748b]">Price <span className="text-[#dc2626]">*</span></span>
                <input
                  type="number"
                  min={0}
                  value={createForm.price}
                  onChange={(e) => setCreateForm((p) => ({ ...p, price: Number(e.target.value) }))}
                  placeholder="Price"
                  required
                  className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="block text-sm font-semibold text-[#64748b]">Sort order</span>
                <input
                  type="number"
                  min={0}
                  value={createForm.sortOrder}
                  onChange={(e) => setCreateForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                  placeholder="Sort order"
                  className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[#334155]">
                <input
                  type="checkbox"
                  checked={createForm.available}
                  onChange={(e) => setCreateForm((p) => ({ ...p, available: e.target.checked }))}
                />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#334155]">
                <input
                  type="checkbox"
                  checked={createForm.isPublished}
                  onChange={(e) => setCreateForm((p) => ({ ...p, isPublished: e.target.checked }))}
                />
                Published
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Image</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setCreateForm((p) => ({ ...p, image: e.target.files?.[0] ?? null }))}
                className="w-full text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={actionLoading}
              className="dn-btn dn-btn-primary w-full disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Product
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Edit public product</DialogTitle>
            <DialogDescription>
              Edit content, publication state, and variants. Synchronized edits become overrides.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onEdit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Category <span className="text-[#dc2626]">*</span></span>
              <select
                value={editForm.publicCategoryId}
                onChange={(e) => setEditForm((p) => ({ ...p, publicCategoryId: e.target.value }))}
                required
                className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
              >
                <option value="">Select category</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Product name <span className="text-[#dc2626]">*</span></span>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Product name"
                required
                className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Description</span>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                rows={3}
                className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="block text-sm font-semibold text-[#64748b]">Price <span className="text-[#dc2626]">*</span></span>
                <input
                  type="number"
                  min={0}
                  value={editForm.price}
                  onChange={(e) => setEditForm((p) => ({ ...p, price: Number(e.target.value) }))}
                  placeholder="Price"
                  required
                  className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="block text-sm font-semibold text-[#64748b]">Sort order</span>
                <input
                  type="number"
                  min={0}
                  value={editForm.sortOrder}
                  onChange={(e) => setEditForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                  placeholder="Sort order"
                  className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[#334155]">
                <input
                  type="checkbox"
                  checked={editForm.available}
                  onChange={(e) => setEditForm((p) => ({ ...p, available: e.target.checked }))}
                />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#334155]">
                <input
                  type="checkbox"
                  checked={editForm.isPublished}
                  onChange={(e) => setEditForm((p) => ({ ...p, isPublished: e.target.checked }))}
                />
                Published
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Image</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setEditForm((p) => ({ ...p, image: e.target.files?.[0] ?? null }))}
                className="w-full text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={actionLoading}
              className="dn-btn dn-btn-primary w-full disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Product
            </button>
            {editing?.sourceType === "operational" && editing.syncStatus === "detached" ? (
              <button
                type="button"
                onClick={onConvert}
                disabled={actionLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7e1ed] py-3 text-sm font-semibold text-[#0f172a] disabled:opacity-60"
              >
                Convert to Manual
              </button>
            ) : null}
          </form>

          <div className="mt-6 space-y-3 border-t border-[#e2e8f0] pt-5">
            <h4 className="text-sm font-bold text-[#0f172a]">Variants</h4>
            {variants.length === 0 ? (
              <p className="text-sm text-[#94a3b8]">No variants yet.</p>
            ) : (
              <div className="space-y-2">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#f1f5f9] p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0f172a]">{variant.name}</p>
                      <p className="text-xs text-[#64748b]">
                        {variant.price != null ? `PKR ${variant.price}` : "No price"} •{" "}
                        {variant.sourceType} • {variant.syncStatus} •{" "}
                        {variant.isPublished ? "published" : "unpublished"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleVariantPublish(variant)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#001840] hover:bg-[#EEF3FF]"
                      >
                        {variant.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      {variant.sourceType === "operational" && variant.syncStatus === "detached" ? (
                        <button
                          type="button"
                          onClick={() => onConvertVariant(variant)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc]"
                        >
                          Convert
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onDeleteVariant(variant)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#dc2626] hover:bg-[#fff1f1]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-[#f1f5f9] bg-[#f8fafc] p-4 space-y-3">
              <label className="block space-y-1.5">
                <span className="block text-sm font-semibold text-[#64748b]">Variant name</span>
                <input
                  value={variantForm.name}
                  onChange={(e) => setVariantForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Variant name"
                  className="w-full rounded-xl bg-white px-4 py-2.5 text-sm outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="block text-sm font-semibold text-[#64748b]">Price</span>
                  <input
                    type="number"
                    min={0}
                    value={variantForm.price}
                    onChange={(e) => setVariantForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    placeholder="Price"
                    className="w-full rounded-xl bg-white px-4 py-2.5 text-sm outline-none"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-semibold text-[#64748b]">Sort order</span>
                  <input
                    type="number"
                    min={0}
                    value={variantForm.sortOrder}
                    onChange={(e) => setVariantForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                    placeholder="Sort order"
                    className="w-full rounded-xl bg-white px-4 py-2.5 text-sm outline-none"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={onAddVariant}
                disabled={actionLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Plus className="h-4 w-4" /> Add Variant
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        loading={actionLoading}
        title={deleteTarget?.sourceType === "operational" ? "Suppress synchronized product?" : "Delete product?"}
        description={
          deleteTarget?.sourceType === "operational"
            ? "This will soft-delete and suppress the synchronized product so sync will not recreate it."
            : "This will soft-delete the manual public product."
        }
      />
    </div>
  );
}
