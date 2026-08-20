"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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
  PublicCategoryRecord,
  usePublicCategories,
} from "@/hooks/usePublicData";
import { BASE_URL } from "@/lib/constant";
import { cn, normalizeErrorMessage } from "@/lib/utils";

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

export default function PublicDataCategoriesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PublicCategoryRecord | null>(null);
  const [editing, setEditing] = useState<PublicCategoryRecord | null>(null);

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    sortOrder: 0,
    isPublished: true,
    image: null as File | null,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    sortOrder: 0,
    isPublished: true,
    image: null as File | null,
  });

  const {
    categories,
    loading,
    actionLoading,
    error,
    pagination,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
  } = usePublicCategories({ page: currentPage, search });

  const activeCategories = useMemo(
    () => categories.filter((category) => !category.deletedAt),
    [categories],
  );

  const resetCreate = () => {
    setCreateForm({ name: "", description: "", sortOrder: 0, isPublished: true, image: null });
  };

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    const toastId = toast.loading("Creating public category...");
    try {
      await createCategory({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        sortOrder: Number(createForm.sortOrder) || 0,
        isPublished: createForm.isPublished,
        image: createForm.image,
      });
      toast.success("Category created", { id: toastId });
      resetCreate();
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category", { id: toastId });
    }
  };

  const onOpenEdit = async (id: string) => {
    const toastId = toast.loading("Loading category...");
    try {
      const category = await getCategoryById(id);
      setEditing(category);
      setEditId(id);
      setEditForm({
        name: category.name,
        description: category.description ?? "",
        sortOrder: category.sortOrder ?? 0,
        isPublished: !!category.isPublished,
        image: null,
      });
      setEditOpen(true);
      toast.dismiss(toastId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load category", { id: toastId });
    }
  };

  const onEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editId || !editForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    const toastId = toast.loading("Updating category...");
    try {
      await updateCategory(editId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        sortOrder: Number(editForm.sortOrder) || 0,
        isPublished: editForm.isPublished,
        image: editForm.image,
      });
      toast.success("Category updated", { id: toastId });
      setEditOpen(false);
      setEditId(null);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update category", { id: toastId });
    }
  };

  const onConvert = async () => {
    if (!editId) return;
    const toastId = toast.loading("Converting to manual...");
    try {
      await updateCategory(editId, { convertToManual: true });
      toast.success("Converted to manual category", { id: toastId });
      setEditOpen(false);
      setEditId(null);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to convert category", { id: toastId });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const toastId = toast.loading("Removing category...");
    try {
      await deleteCategory(deleteTarget.id);
      toast.success(
        deleteTarget.sourceType === "operational"
          ? "Synchronized category suppressed"
          : "Category deleted",
        { id: toastId },
      );
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category", { id: toastId });
    }
  };

  return (
    <div className="rounded-[28px] border border-[#e5edf5] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#0f172a]">Public Categories</h3>
          <p className="text-sm text-[#64748b]">Create manual categories or manage synchronized ones</p>
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
                placeholder="Search categories..."
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
            <Plus className="h-4 w-4" /> New Category
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-[#fecaca] bg-[#fff1f1] p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#ef4444]">Error loading categories</p>
            <p className="text-sm text-[#dc2626]">{normalizeErrorMessage(error)}</p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <Loading />
      ) : activeCategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-[#f8fafc] px-6 py-16 text-center">
          <p className="text-sm font-semibold text-[#475569]">No public categories found</p>
          <p className="mt-1 text-sm text-[#94a3b8]">Create a manual category or sync from the operational catalog.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeCategories.map((category) => {
            const url = imageUrl(category.image);
            return (
              <div
                key={category.id}
                className="flex flex-col gap-4 rounded-2xl border border-[#f1f5f9] p-4 transition hover:border-[#cbd5e1] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[#f1f5f9] bg-[#f8fafc]">
                    {url ? (
                      <Image src={url} alt={category.name} fill className="object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-[#94a3b8]" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-[#0f172a]">{category.name}</h4>
                      <StatusChip
                        label={category.sourceType}
                        tone={category.sourceType === "manual" ? "blue" : "slate"}
                      />
                      <StatusChip
                        label={category.syncStatus}
                        tone={
                          category.syncStatus === "synced"
                            ? "green"
                            : category.syncStatus === "detached"
                              ? "amber"
                              : category.syncStatus === "failed"
                                ? "red"
                                : "slate"
                        }
                      />
                      <StatusChip
                        label={category.isPublished ? "published" : "unpublished"}
                        tone={category.isPublished ? "green" : "slate"}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#64748b]">
                      Sort {category.sortOrder}
                      {category.overriddenFields?.length
                        ? ` • Overrides: ${category.overriddenFields.join(", ")}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenEdit(category.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#001840] hover:bg-[#EEF3FF]"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget(category);
                      setDeleteOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#dc2626] hover:bg-[#fff1f1]"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
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
        <DialogContent className="max-w-lg rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Create public category</DialogTitle>
            <DialogDescription>Adds a manual public-only category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Category name <span className="text-[#dc2626]">*</span></span>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Category name"
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
            <label className="flex items-center gap-2 text-sm font-medium text-[#334155]">
              <input
                type="checkbox"
                checked={createForm.isPublished}
                onChange={(e) => setCreateForm((p) => ({ ...p, isPublished: e.target.checked }))}
              />
              Published
            </label>
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
              Create Category
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Edit public category</DialogTitle>
            <DialogDescription>
              Editing synchronized fields creates overrides that sync will skip.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onEdit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Category name <span className="text-[#dc2626]">*</span></span>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Category name"
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
            <label className="flex items-center gap-2 text-sm font-medium text-[#334155]">
              <input
                type="checkbox"
                checked={editForm.isPublished}
                onChange={(e) => setEditForm((p) => ({ ...p, isPublished: e.target.checked }))}
              />
              Published
            </label>
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
              Save Changes
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
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        loading={actionLoading}
        title={deleteTarget?.sourceType === "operational" ? "Suppress synchronized category?" : "Delete category?"}
        description={
          deleteTarget?.sourceType === "operational"
            ? "This will soft-delete and suppress the synchronized category so sync will not recreate it."
            : "This will soft-delete the manual public category."
        }
      />
    </div>
  );
}
