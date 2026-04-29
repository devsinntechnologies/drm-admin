"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Box, ChevronLeft, ChevronRight, Edit, Layers, Loader2, Plus, Search, Store, Trash2, X, Image as ImageIconLucide, RotateCcw, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { CategoryRecord, useCategories } from "@/hooks/useCategories";
import { normalizeErrorMessage } from "@/lib/utils";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BASE_URL } from "@/lib/constant";


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

function CategoryListItem({
  category,
  onEdit,
}: {
  category: CategoryRecord;
  onEdit: (id: string) => void;
}) {
  const imageUrl = category.image
    ? (category.image.startsWith("http") ? category.image : `${BASE_URL}/${category.image}`)
    : null;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#f1f5f9] bg-[#E5281A] p-4 transition hover:border-[#4f46e5]/20 hover:shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-[#f8fafc] flex items-center justify-center border border-[#f1f5f9]">
          {imageUrl ? (
            <Image src={imageUrl} alt={category.CategoryName} fill className="object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-[#94a3b8]" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#111827]">{category.CategoryName}</h4>
          <p className="text-xs text-[#64748b]">Sort order: {category.sortOrder}</p>
        </div>
      </div>
      <button
        onClick={() => onEdit(category.id)}
        className="text-sm font-semibold text-[#6366f1] transition hover:text-[#4f46e5]"
      >
        Edit
      </button>
    </div>
  );
}

function CategoriesContent() {
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
    const toastId = toast.loading("Creating category...");
    try {
      await createCategory({
        categoryName: createForm.categoryName.trim(),
        sortOrder: Number(createForm.sortOrder),
        image: createForm.image,
      });
      toast.success("Category created successfully", { id: toastId });
      resetCreate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category", { id: toastId });
    }
  };

  const onOpenEdit = async (id: string) => {
    const toastId = toast.loading("Loading category details...");
    try {
      const category = await getCategoryById(id);
      setEditId(id);
      setEditForm({
        categoryName: category.CategoryName,
        sortOrder: category.sortOrder ?? 0,
        image: null,
      });
      toast.dismiss(toastId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load category details", { id: toastId });
    }
  };

  const onEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editId || !editForm.categoryName.trim()) {
      if (!editForm.categoryName.trim()) toast.error("Category name is required");
      return;
    }
    const toastId = toast.loading("Updating category...");
    try {
      await updateCategory(editId, {
        categoryName: editForm.categoryName.trim(),
        sortOrder: Number(editForm.sortOrder),
        image: editForm.image,
      });
      toast.success("Category updated successfully", { id: toastId });
      resetEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update category", { id: toastId });
    }
  };

  const onDelete = async (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const toastId = toast.loading("Deleting category...");
    try {
      await deleteCategory(deleteId);
      toast.success("Category deleted successfully", { id: toastId });
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category", { id: toastId });
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <AdminShell activeTab="categories">
      <main className="h-[calc(100vh-80px)] overflow-hidden">
        <div className="mx-auto max-w-7xl h-full p-6">
          <div className="h-full rounded-[32px] border border-white bg-white p-8 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div>
                <h1 className="text-3xl font-extrabold text-[#111827]">Manage Categories</h1>
                <p className="text-base text-[#6b7280]">Add, update, and sort categories from one place</p>
              </div>
              <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-[#f3f4f6] text-[#94a3b8] transition">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 flex-1 min-h-0">
              {/* Left Column: Form */}
              <div className="rounded-3xl border border-[#f1f5f9] bg-[#f8fafc]/50 p-6 flex flex-col min-h-0">
                <h3 className="text-xl font-bold text-[#111827] mb-6 shrink-0">{editId ? "Update Category" : "Add Category"}</h3>
                
                <form className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar" onSubmit={editId ? onEditSubmit : onCreateSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#64748b]">Category Name</label>
                    <input
                      value={editId ? editForm.categoryName : createForm.categoryName}
                      onChange={(e) => editId ? setEditForm(p => ({ ...p, categoryName: e.target.value })) : setCreateForm(p => ({ ...p, categoryName: e.target.value }))}
                      placeholder="Enter category name"
                      className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-[#f97316]/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#64748b]">Sort Order</label>
                    <input
                      type="number"
                      value={editId ? editForm.sortOrder : createForm.sortOrder}
                      onChange={(e) => editId ? setEditForm(p => ({ ...p, sortOrder: Number(e.target.value) })) : setCreateForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-[#f97316]/50"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-[#64748b]">Image</label>
                    <div>
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#d1d5db] bg-white px-6 py-2.5 text-sm font-bold text-[#6366f1] transition hover:bg-[#f9fafb]">
                        Choose Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => editId ? setEditForm(p => ({ ...p, image: e.target.files?.[0] ?? null })) : setCreateForm(p => ({ ...p, image: e.target.files?.[0] ?? null }))}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#f1f5f9] flex flex-col items-center justify-center text-[#94a3b8] border-2 border-dashed border-[#e5e7eb]">
                      {(editId ? editForm.image : createForm.image) ? (
                        <p className="text-sm font-bold text-[#10b981]">{(editId ? editForm.image : createForm.image)?.name}</p>
                      ) : (
                        <span className="text-sm font-medium">No image selected</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 sticky bottom-0 bg-[#f8fafc]/90 py-2">
                    <button
                      type="button"
                      onClick={editId ? resetEdit : resetCreate}
                      className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#e5e7eb] bg-white py-3.5 text-sm font-bold text-[#111827] transition hover:bg-[#f9fafb]"
                    >
                      <RotateCcw className="h-4 w-4" /> Reset
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-[#E5281A] text-white py-3.5 text-sm font-bold  shadow-lg transition hover:bg-[#ea580c] disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Save
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: List */}
              <div className="rounded-3xl border border-[#f1f5f9] bg-white p-6 shadow-sm flex flex-col min-h-0">
                <div className="mb-6 shrink-0">
                  <h3 className="text-xl font-bold text-[#111827]">Category List</h3>
                  <p className="text-xs text-[#6b7280]">Sorted by sort order from the API</p>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#f97316]" /></div>
                  ) : filteredCategories.length === 0 ? (
                    <div className="text-center py-12 text-[#94a3b8] text-sm font-medium">No categories found</div>
                  ) : (
                    filteredCategories.map((category) => (
                      <CategoryListItem key={category.id} category={category} onEdit={onOpenEdit} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DeleteConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onConfirm={confirmDelete}
            title="Delete Category?"
            description="Are you sure you want to delete this category? This will also affect products in this category."
            loading={actionLoading}
          />
        </div>
      </main>
    </AdminShell>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
