"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Box, ChevronLeft, ChevronRight, Edit, Layers, Loader2, Plus, Search, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { CategoryRecord, useCategories } from "@/hooks/useCategories";
import { normalizeErrorMessage } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ErrorAlert({ message }: { message: unknown }) {
  const errorMessage = normalizeErrorMessage(message, "Error loading categories");

  return (
    <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f1] p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-[#ef4444]">Error loading categories</p>
        <p className="text-sm text-[#dc2626]">{errorMessage}</p>
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  onEdit,
  onDelete,
  deleting,
}: {
  category: CategoryRecord;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const imageUrl = category.image
    ? (category.image.startsWith("http") ? category.image : `https://vendor.umazing.shop/${category.image}`)
    : "/business/pic1.jpeg";

  return (
    <article className="rounded-3xl border border-[#e4e8f0] bg-white overflow-hidden shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="relative h-42">
        <Image src={imageUrl} alt={category.CategoryName} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.5)_100%)]" />
        <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between gap-3 text-white">
          <div>
            <h3 className="text-lg font-semibold">{category.CategoryName}</h3>
            <p className="text-xs text-white/80">{category.businessName}</p>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            {category.products.length} products
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm text-[#64748b]">
          <span>Sort Order</span>
          <span className="font-semibold text-[#111827]">{category.sortOrder}</span>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Products</p>
          {category.products.length === 0 ? (
            <p className="text-sm text-[#94a3b8]">No products in this category</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {category.products.slice(0, 4).map((product) => (
                <span key={product.id} className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs text-[#334155]">
                  {product.name}
                </span>
              ))}
              {category.products.length > 4 && (
                <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs text-[#4f46e5]">
                  +{category.products.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onEdit(category.id)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#cfd8ff] bg-[#eef2ff] px-4 py-3 text-sm font-semibold text-[#4f46e5]"
          >
            <Edit className="h-4 w-4" /> Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(category.id)}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#fecaca] bg-white px-4 py-3 text-sm font-semibold text-[#ef4444] disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CategoriesPage() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    categoryName: "",
    sortOrder: 0,
    image: null as File | null,
  });

  const [editForm, setEditForm] = useState({
    categoryName: "",
    sortOrder: 0,
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
  } = useCategories({ page: currentPage });

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

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return categories;
    }

    return categories.filter((category) => {
      const matchesCategory = category.CategoryName.toLowerCase().includes(query);
      const matchesBusiness = category.businessName.toLowerCase().includes(query);
      const matchesProduct = category.products.some((product) => product.name.toLowerCase().includes(query));
      return matchesCategory || matchesBusiness || matchesProduct;
    });
  }, [categories, search]);

  const metrics = useMemo(() => {
    const totalProducts = categories.reduce((sum, category) => sum + category.products.length, 0);
    const activeProducts = categories.reduce(
      (sum, category) => sum + category.products.filter((product) => product.status === "ACTIVE").length,
      0,
    );
    const businessCount = new Set(categories.map((category) => category.businessId)).size;

    return {
      totalProducts,
      activeProducts,
      businessCount,
    };
  }, [categories]);

  const resetCreate = () => {
    setCreateForm({ categoryName: "", sortOrder: 0, image: null });
  };

  const resetEdit = () => {
    setEditForm({ categoryName: "", sortOrder: 0, image: null });
    setEditId(null);
  };

  const onCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createForm.categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await createCategory({
        categoryName: createForm.categoryName.trim(),
        sortOrder: Number(createForm.sortOrder),
        image: createForm.image,
      });
      toast.success("Category created successfully");
      setCreateOpen(false);
      resetCreate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    }
  };

  const onOpenEdit = async (id: string) => {
    try {
      const category = await getCategoryById(id);
      setEditId(id);
      setEditForm({
        categoryName: category.CategoryName,
        sortOrder: category.sortOrder ?? 0,
        image: null,
      });
      setEditOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load category details");
    }
  };

  const onEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editId) {
      return;
    }

    if (!editForm.categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await updateCategory(editId, {
        categoryName: editForm.categoryName.trim(),
        sortOrder: Number(editForm.sortOrder),
        image: editForm.image,
      });
      toast.success("Category updated successfully");
      setEditOpen(false);
      resetEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update category");
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = typeof window !== "undefined" ? window.confirm("Delete this category?") : false;
    if (!confirmed) {
      return;
    }

    try {
      await deleteCategory(id);
      toast.success("Category deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <AdminShell activeTab="categories">
      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl space-y-5">
          <section className="rounded-[28px] border border-white bg-white/85 p-5 shadow-[0_14px_28px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#4f46e5] text-white shadow-[0_10px_18px_rgba(79,70,229,0.25)]">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-[#111827]">Categories</h1>
                  <p className="text-sm text-[#6b7280]">Manage category list for your business</p>
                </div>
              </div>

              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#635bff] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(99,91,255,0.24)]"
                  >
                    <Plus className="h-4 w-4" /> Add Category
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Category</DialogTitle>
                    <DialogDescription>Add a new category with optional image.</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={onCreateSubmit}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111827]" htmlFor="categoryName">Category Name</label>
                      <input
                        id="categoryName"
                        value={createForm.categoryName}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, categoryName: event.target.value }))}
                        className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                        placeholder="e.g. Beverages"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111827]" htmlFor="sortOrder">Sort Order</label>
                      <input
                        id="sortOrder"
                        type="number"
                        value={createForm.sortOrder}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))}
                        className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111827]" htmlFor="image">Image</label>
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))}
                        className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Create Category
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-[#c6d1ff] bg-[#eef1ff] px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#4f46e5]"><Layers className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-medium text-[#5b6475]">Total Categories</p>
                  <strong className="text-2xl font-semibold text-[#0f172a]">{pagination.total}</strong>
                </div>
              </div>
            </article>
            <article className="rounded-3xl border border-[#bcf0cb] bg-[#effdf2] px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#16a34a]"><Box className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-medium text-[#5b6475]">Total Products</p>
                  <strong className="text-2xl font-semibold text-[#0f172a]">{metrics.totalProducts}</strong>
                </div>
              </div>
            </article>
            <article className="rounded-3xl border border-[#ead3ff] bg-[#faf2ff] px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#8b5cf6]"><Store className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-medium text-[#5b6475]">Businesses</p>
                  <strong className="text-2xl font-semibold text-[#0f172a]">{metrics.businessCount}</strong>
                </div>
              </div>
            </article>
            <article className="rounded-3xl border border-[#ffd7b5] bg-[#fff7ed] px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#ea580c]"><Search className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-medium text-[#5b6475]">Active Products</p>
                  <strong className="text-2xl font-semibold text-[#0f172a]">{metrics.activeProducts}</strong>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-3xl border border-white bg-white/85 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
            <div className="flex h-12 items-center gap-3 rounded-2xl bg-[#f5f7fb] px-4 text-[#94a3b8]">
              <Search className="h-5 w-5" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by category, business, or product"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#94a3b8]"
              />
            </div>
          </section>

          {error ? <ErrorAlert message={error} /> : null}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="rounded-2xl border border-[#e3e7f0] bg-white p-8 text-center">
              <Layers className="mx-auto mb-3 h-12 w-12 text-[#94a3b8]" />
              <p className="text-[#667085]">No categories found</p>
            </div>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={onOpenEdit}
                  onDelete={onDelete}
                  deleting={actionLoading}
                />
              ))}
            </section>
          )}

          {pagination.last_page > 1 && !search ? (
            <section className="flex items-center justify-between rounded-2xl border border-[#e3e7f0] bg-white p-4">
              <div className="text-sm text-[#667085]">
                Page <strong>{pagination.page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} total categories)
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f0] bg-white px-3 py-2 text-sm font-medium text-[#222] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(pagination.last_page, prev + 1))}
                  disabled={currentPage === pagination.last_page}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f0] bg-white px-3 py-2 text-sm font-medium text-[#222] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          ) : null}

          <Dialog
            open={editOpen}
            onOpenChange={(open) => {
              setEditOpen(open);
              if (!open) {
                resetEdit();
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Category</DialogTitle>
                <DialogDescription>Edit category details or replace image.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={onEditSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="editCategoryName">Category Name</label>
                  <input
                    id="editCategoryName"
                    value={editForm.categoryName}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, categoryName: event.target.value }))}
                    className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="editSortOrder">Sort Order</label>
                  <input
                    id="editSortOrder"
                    type="number"
                    value={editForm.sortOrder}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="editImage">Replace Image</label>
                  <input
                    id="editImage"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setEditForm((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))}
                    className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Update Category
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </AdminShell>
  );
}
