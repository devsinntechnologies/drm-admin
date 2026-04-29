"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Box,
  ChevronLeft,
  ChevronRight,
  Edit,
  Layers,
  Loader2,
  Plus,
  Search,
  Store,
  Trash2,
  X,
  Image as ImageIconLucide,
  RotateCcw,
  ImageIcon,
  Pencil,
  Save,
  Tag,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
<<<<<<< Updated upstream
import { useProducts, type CreateProductVariantPayload, type Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { normalizeErrorMessage } from "@/lib/utils";
=======
import { Product, useProducts, CreateProductVariantPayload } from "@/hooks/useProducts";
import { CategoryRecord, useCategories } from "@/hooks/useCategories";
import { cn, normalizeErrorMessage } from "@/lib/utils";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
>>>>>>> Stashed changes
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ErrorAlert({ message }: { message: unknown }) {
  const errorMessage = normalizeErrorMessage(message, "Error loading items");
  return (
    <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f1] p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-[#ef4444]">Error loading items</p>
        <p className="text-sm text-[#dc2626]">{errorMessage}</p>
      </div>
    </div>
  );
}

function VariantsEditor({
  variants,
  setVariants,
}: {
  variants: CreateProductVariantPayload[];
  setVariants: React.Dispatch<React.SetStateAction<CreateProductVariantPayload[]>>;
}) {
  const [vForm, setVForm] = useState<CreateProductVariantPayload>({ name: "", price: 0, inStock: 0 });

  const onAddVariant = () => {
    if (!vForm.name.trim()) return;
    setVariants((prev) => [...prev, { ...vForm }]);
    setVForm({ name: "", price: 0, inStock: 0 });
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-[#111827]">Variants</label>
      
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-[#f1f5f9] bg-white p-3 shadow-sm">
              <div>
                <p className="text-sm font-bold text-[#111827]">{v.name}</p>
                <p className="text-xs text-[#6b7280]">PKR {v.price} • {v.inStock} in stock</p>
              </div>
              <button
                type="button"
                onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                className="rounded-full p-1.5 text-[#ef4444] transition hover:bg-[#fff1f1]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[#f1f5f9] bg-white p-4 space-y-3">
        <input
          value={vForm.name}
          onChange={(e) => setVForm(p => ({ ...p, name: e.target.value }))}
          placeholder="Variant name"
          className="w-full rounded-xl bg-[#f3f4f6] px-4 py-2.5 text-xs font-medium outline-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={vForm.price}
            onChange={(e) => setVForm(p => ({ ...p, price: Number(e.target.value) }))}
            placeholder="Price"
            className="w-full rounded-xl bg-[#f3f4f6] px-4 py-2.5 text-xs font-medium outline-none"
          />
          <input
            type="number"
            value={vForm.inStock}
            onChange={(e) => setVForm(p => ({ ...p, inStock: Number(e.target.value) }))}
            placeholder="Stock"
            className="w-full rounded-xl bg-[#f3f4f6] px-4 py-2.5 text-xs font-medium outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onAddVariant}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ef4444] py-2.5 text-xs font-bold text-white"
        >
          <Plus className="h-4 w-4" /> Add Variant
        </button>
      </div>
    </div>
  );
}

function MenuCard({
  item,
  onEdit,
  onDelete,
  deleting,
}: {
  item: Product;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const imagePath = item.image?.trim();
<<<<<<< Updated upstream
  const imageUrl = imagePath ? (imagePath.startsWith("http") ? imagePath : `https://vendor.umazing.shop/${imagePath}`) : "/business/pic1.jpeg";
=======
  const imageUrl = imagePath ? (imagePath.startsWith("http") ? imagePath : `${BASE_URL}/${imagePath}`) : null;
>>>>>>> Stashed changes

  return (
    <article className="overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col">
      <div className="relative h-48 w-full bg-[#f8fafc] m-2 rounded-2xl overflow-hidden">
        {imageUrl ? (
          <Image src={imageUrl} alt={item.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#94a3b8]">
            <ImageIcon className="h-8 w-8 opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">No Image</span>
          </div>
        )}
      </div>

      <div className="p-4 pt-2">
        <h3 className="mb-3 text-lg font-bold text-[#111827]">{item.name}</h3>

        <div className="mb-4 space-y-2">
          {item.variants && item.variants.length > 0 ? (
            item.variants.map((variant) => (
              <div key={variant.id} className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#64748b]">{variant.name}</span>
                <span className="text-sm font-bold text-[#16a34a]">Rs. {variant.price}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#64748b]">Price</span>
              <span className="text-sm font-bold text-[#16a34a]">Rs. {item.price}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(item.id)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#eefdf5] py-2.5 text-xs font-bold text-[#16a34a] transition hover:bg-[#dcfce7]"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            disabled={deleting}
            className="flex items-center justify-center rounded-xl bg-[#fff2f2] p-2.5 text-[#ef4444] transition hover:bg-[#fee2e2]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function MenuItemsContent() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
<<<<<<< Updated upstream
=======
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

>>>>>>> Stashed changes
  const [createForm, setCreateForm] = useState({
    name: "",
    price: 0,
    sortOrder: 0,
    inStock: 0,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    categoryId: "",
    isKitchen: true,
    image: null as File | null,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    price: 0,
    sortOrder: 0,
    inStock: 0,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    categoryId: "",
    isKitchen: true,
    image: null as File | null,
  });

  const [createVariants, setCreateVariants] = useState<CreateProductVariantPayload[]>([]);
  const [editVariants, setEditVariants] = useState<CreateProductVariantPayload[]>([]);

  const {
    products,
    loading,
    actionLoading,
    error,
    pagination,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    refetch,
  } = useProducts({ page: currentPage });

  const { categories } = useCategories({ page: 1, limit: 100 });

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

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter((item) => {
      const matchesName = item.name.toLowerCase().includes(query);
      const matchesCategory = item.category?.CategoryName.toLowerCase().includes(query);
      return matchesName || matchesCategory;
    });
  }, [products, search]);

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      price: 0,
      sortOrder: 0,
      inStock: 0,
      status: "ACTIVE",
      categoryId: "",
      isKitchen: true,
      image: null,
    });
    setCreateVariants([]);
  };

  const resetEditForm = () => {
    setEditForm({
      name: "",
      price: 0,
      sortOrder: 0,
      inStock: 0,
      status: "ACTIVE",
      categoryId: "",
      isKitchen: true,
      image: null,
    });
    setEditVariants([]);
    setEditId(null);
  };

  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.categoryId) return toast.error("Category is required");
    if (!createForm.name) return toast.error("Name is required");

    const toastId = toast.loading("Adding product...");
    try {
      await createProduct({
        ...createForm,
        variants: createVariants,
      });
      toast.success("Product added successfully", { id: toastId });
      setCreateOpen(false);
      resetCreateForm();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add product", { id: toastId });
    }
  };

  const onOpenEdit = async (id: string) => {
    const toastId = toast.loading("Loading product details...");
    try {
      const product = await getProductById(id);
      setEditId(id);
      setEditForm({
        name: product.name,
        price: product.price,
        sortOrder: product.sortOrder || 0,
        inStock: product.inStock || 0,
        status: product.status as "ACTIVE" | "INACTIVE",
        categoryId: product.categoryId || "",
        isKitchen: product.isKitchen || true,
        image: null,
      });
      setEditVariants(
        product.variants?.map((v) => ({
          name: v.name,
          price: v.price,
          inStock: v.inStock,
        })) || []
      );
      toast.dismiss(toastId);
      setEditOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load product details", { id: toastId });
    }
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    const toastId = toast.loading("Updating product...");
    try {
      await updateProduct(editId, {
        ...editForm,
        variants: editVariants,
      });
      toast.success("Product updated successfully", { id: toastId });
      setEditOpen(false);
      resetEditForm();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update product", { id: toastId });
    }
  };

  const onDelete = async (id: string) => {
<<<<<<< Updated upstream
    const confirmed = typeof window !== "undefined" ? window.confirm("Delete this product?") : false;
    if (!confirmed) {
      return;
    }

=======
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
>>>>>>> Stashed changes
    const toastId = toast.loading("Deleting product...");
    try {
      await deleteProduct(id);
      toast.success("Product deleted successfully", { id: toastId });
<<<<<<< Updated upstream
=======
      setDeleteOpen(false);
      setDeleteId(null);
      refetch();
>>>>>>> Stashed changes
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product", { id: toastId });
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="products">
<<<<<<< Updated upstream
      <main className="min-h-screen ">
        <div className="mx-auto max-w-7xl space-y-5">
          <section className="rounded-[28px] border border-white bg-white/85 p-5 shadow-[0_14px_28px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#4f46e5] text-white shadow-[0_10px_18px_rgba(79,70,229,0.25)]">
                  <Box className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-[#111827]">Products</h1>
                  <p className="text-sm text-[#6b7280]">Manage products & stock</p>
                </div>
              </div>

              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-[#635bff] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(99,91,255,0.24)]">
                    <Plus className="h-4 w-4" /> Add Product
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Product</DialogTitle>
                    <DialogDescription>Create a product using multipart form data. Image is optional.</DialogDescription>
                  </DialogHeader>

                  <form className="space-y-4" onSubmit={onCreateSubmit}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium text-[#111827]" htmlFor="productName">Name</label>
                        <input
                          id="productName"
                          value={createForm.name}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                          className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                          placeholder="e.g. Biryani"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#111827]" htmlFor="productPrice">Price</label>
                        <input
                          id="productPrice"
                          type="number"
                          min={0}
                          value={createForm.price}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
                          className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#111827]" htmlFor="productStock">In Stock</label>
                        <input
                          id="productStock"
                          type="number"
                          min={0}
                          value={createForm.inStock}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, inStock: Number(event.target.value) }))}
                          className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#111827]" htmlFor="sortOrder">Sort Order</label>
                        <input
                          id="sortOrder"
                          type="number"
                          min={0}
                          value={createForm.sortOrder}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))}
                          className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#111827]" htmlFor="productStatus">Status</label>
                        <select
                          id="productStatus"
                          value={createForm.status}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value as "ACTIVE" | "INACTIVE" }))}
                          className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium text-[#111827]" htmlFor="productCategory">Category</label>
                        <select
                          id="productCategory"
                          value={createForm.categoryId}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                          className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                        >
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.CategoryName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <VariantsEditor variants={createVariants} setVariants={setCreateVariants} />

                      <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm font-medium text-[#111827]">
                        <input
                          type="checkbox"
                          checked={createForm.isKitchen}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, isKitchen: event.target.checked }))}
                          className="h-4 w-4 rounded border-[#cbd5e1]"
                        />
                        Is Kitchen Item
                      </label>

                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium text-[#111827]" htmlFor="productImage">Image (optional)</label>
                        <input
                          id="productImage"
                          type="file"
                          accept="image/*"
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))}
                          className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {actionLoading ? <Loader className="h-4 w-4 animate-spin" /> : null}
                      Create Product
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] border-[#c6d1ff] bg-[#eef1ff]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#4f46e5]">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#5b6475]">Total Items</p>
                  <strong className="text-2xl font-semibold text-[#0f172a]">{pagination.total}</strong>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] border-[#ffc7c7] bg-[#fff1f1]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#ef4444]">
                  <span className="text-lg">⚠</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#5b6475]">Low Stock</p>
                  <strong className="text-2xl font-semibold text-[#0f172a]">{stats.lowStockCount}</strong>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] border-[#bcf0cb] bg-[#effdf2]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#16a34a]">
                  <span className="text-lg">Rs</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#5b6475]">Stock Value</p>
                  <strong className="text-2xl font-semibold text-[#0f172a]">{formatPrice(stats.stockValue)}</strong>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] border-[#ead3ff] bg-[#faf2ff]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#4f46e5]">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#5b6475]">Categories</p>
                  <strong className="text-2xl font-semibold text-[#0f172a]">{stats.uniqueCategories}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white bg-white/85 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex h-12 flex-1 items-center gap-3 rounded-2xl bg-[#f5f7fb] px-4 text-[#94a3b8]">
                <Search className="h-5 w-5" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search products..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#94a3b8]"
                />
              </div>
            </div>
          </section>

          {error && <ErrorAlert message={error} />}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-[#4f46e5]" />
            </div>
          ) : (
            <>
              {displayedItems.length === 0 ? (
                <div className="rounded-2xl border border-[#e3e7f0] bg-white p-8 text-center">
                  <Box className="mx-auto h-12 w-12 text-[#94a3b8] mb-3" />
                  <p className="text-[#667085]">No products found</p>
                </div>
              ) : (
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {displayedItems.map((item) => (
                    <MenuCard key={item.id} item={item} onEdit={onOpenEdit} onDelete={onDelete} deleting={actionLoading} />
                  ))}
                </section>
              )}

              {pagination.last_page > 1 && !search && (
                <section className="flex items-center justify-between rounded-2xl border border-[#e3e7f0] bg-white p-4">
                  <div className="text-sm text-[#667085]">
                    Page <strong>{pagination.page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} total items)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        prevPage();
                        setCurrentPage((p) => p - 1);
                      }}
                      disabled={pagination.page === 1}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f0] bg-white px-3 py-2 text-sm font-medium text-[#222] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f8fbff]"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <button
                      onClick={() => {
                        nextPage();
                        setCurrentPage((p) => p + 1);
                      }}
                      disabled={pagination.page === pagination.last_page}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f0] bg-white px-3 py-2 text-sm font-medium text-[#222] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f8fbff]"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              )}
            </>
          )}

          <Dialog
            open={editOpen}
            onOpenChange={(open) => {
              setEditOpen(open);
              if (!open) {
                resetEditForm();
              }
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Update Product</DialogTitle>
                <DialogDescription>Update product details, variants, and optional image.</DialogDescription>
              </DialogHeader>

              <form className="space-y-4" onSubmit={onEditSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="editProductName">Name</label>
                    <input
                      id="editProductName"
                      value={editForm.name}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="editProductPrice">Price</label>
                    <input
                      id="editProductPrice"
                      type="number"
                      min={0}
                      value={editForm.price}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
                      className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="editProductStock">In Stock</label>
                    <input
                      id="editProductStock"
                      type="number"
                      min={0}
                      value={editForm.inStock}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, inStock: Number(event.target.value) }))}
                      className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="editSortOrder">Sort Order</label>
                    <input
                      id="editSortOrder"
                      type="number"
                      min={0}
                      value={editForm.sortOrder}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))}
                      className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="editProductStatus">Status</label>
                    <select
                      id="editProductStatus"
                      value={editForm.status}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value as "ACTIVE" | "INACTIVE" }))}
                      className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="editProductCategory">Category</label>
                    <select
                      id="editProductCategory"
                      value={editForm.categoryId}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                      className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.CategoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <VariantsEditor variants={editVariants} setVariants={setEditVariants} />

                  <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm font-medium text-[#111827]">
                    <input
                      type="checkbox"
                      checked={editForm.isKitchen}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, isKitchen: event.target.checked }))}
                      className="h-4 w-4 rounded border-[#cbd5e1]"
                    />
                    Is Kitchen Item
                  </label>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="editProductImage">Replace Image (optional)</label>
                    <input
                      id="editProductImage"
                      type="file"
                      accept="image/*"
                      onChange={(event) => setEditForm((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))}
                      className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {actionLoading ? <Loader className="h-4 w-4 animate-spin" /> : null}
                  Update Product
                </button>
              </form>
            </DialogContent>
          </Dialog>
=======
      <main className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Menu Items</h1>
            <p className="text-sm text-gray-500">Manage products & stocks</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#ef4444] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#dc2626]"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
            <button
              onClick={() => router.push(`/dashboard/businessAdmin/categories${impersonatedBusinessId ? `?businessId=${impersonatedBusinessId}` : ""}`)}
              className="rounded-lg border border-[#ef4444] px-4 py-2 text-sm font-bold text-[#ef4444] transition hover:bg-[#fff5f5]"
            >
              Categories
            </button>
            <button
              onClick={() => router.push(`/dashboard/businessAdmin/ingredients${impersonatedBusinessId ? `?businessId=${impersonatedBusinessId}` : ""}`)}
              className="rounded-lg border border-[#ef4444] px-4 py-2 text-sm font-bold text-[#ef4444] transition hover:bg-[#fff5f5]"
            >
              Ingredients
            </button>
          </div>
>>>>>>> Stashed changes
        </div>

        {/* Metric Section */}
        <div className="rounded-xl border border-blue-100 bg-[#f0f3ff] p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ef4444] text-white">
            <Box className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Items</p>
            <p className="text-xl font-bold text-[#111827]">{pagination.total}</p>
          </div>
        </div>

        {/* Content Section */}
        {error ? <ErrorAlert message={error} /> : null}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-[#ef4444]" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-24 text-center">
            <Box className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-bold text-[#111827]">No products found</p>
            <p className="text-sm text-gray-500">Add a new product to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((item) => (
              <MenuCard key={item.id} item={item} onEdit={onOpenEdit} onDelete={onDelete} deleting={actionLoading} />
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ef4444] text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className={cn("h-6 w-6", loading && "animate-spin")} />
          </button>
        </div>

        {/* Dialogs */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
            <div className="bg-white">
              <div className="p-6 pb-4 border-b">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Add New Product</DialogTitle>
                  <DialogDescription>Fill in the details to create a new product</DialogDescription>
                </DialogHeader>
              </div>

              <form className="flex flex-col max-h-[80vh]" onSubmit={onCreateSubmit}>
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold">Category</label>
                    <select
                      value={createForm.categoryId}
                      onChange={(e) => setCreateForm(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.CategoryName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold">Name</label>
                    <input
                      value={createForm.name}
                      onChange={(e) => setCreateForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Product Name"
                      className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold">Price (PKR)</label>
                      <input
                        type="number"
                        value={createForm.price}
                        onChange={(e) => setCreateForm(p => ({ ...p, price: Number(e.target.value) }))}
                        className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold">Stock</label>
                      <input
                        type="number"
                        value={createForm.inStock}
                        onChange={(e) => setCreateForm(p => ({ ...p, inStock: Number(e.target.value) }))}
                        className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <VariantsEditor variants={createVariants} setVariants={setCreateVariants} />
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Image</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-black text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                        <ImageIconLucide className="h-4 w-4" /> Choose Image
                        <input type="file" className="hidden" onChange={(e) => setCreateForm(p => ({ ...p, image: e.target.files?.[0] ?? null }))} />
                      </label>
                      {createForm.image && <span className="text-xs text-green-600 font-medium">{createForm.image.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-4 border-t bg-gray-50 flex flex-col gap-2">
                  <button type="submit" disabled={actionLoading} className="w-full bg-[#ef4444] text-white py-3 rounded-xl font-bold shadow-lg transition hover:bg-[#dc2626]">
                    Save Product
                  </button>
                  <button type="button" onClick={() => setCreateOpen(false)} className="w-full bg-white border py-3 rounded-xl font-bold transition hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
            <div className="bg-white">
              <div className="p-6 pb-4 border-b">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Update Product</DialogTitle>
                </DialogHeader>
              </div>

              <form className="flex flex-col max-h-[80vh]" onSubmit={onEditSubmit}>
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold">Category</label>
                    <select
                      value={editForm.categoryId}
                      onChange={(e) => setEditForm(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.CategoryName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold">Name</label>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold">Price (PKR)</label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm(p => ({ ...p, price: Number(e.target.value) }))}
                        className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold">Stock</label>
                      <input
                        type="number"
                        value={editForm.inStock}
                        onChange={(e) => setEditForm(p => ({ ...p, inStock: Number(e.target.value) }))}
                        className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <VariantsEditor variants={editVariants} setVariants={setEditVariants} />
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Image</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-black text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                        <ImageIconLucide className="h-4 w-4" /> Choose Image
                        <input type="file" className="hidden" onChange={(e) => setEditForm(p => ({ ...p, image: e.target.files?.[0] ?? null }))} />
                      </label>
                      {editForm.image && <span className="text-xs text-green-600 font-medium">{editForm.image.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-4 border-t bg-gray-50 flex flex-col gap-2">
                  <button type="submit" disabled={actionLoading} className="w-full bg-[#ef4444] text-white py-3 rounded-xl font-bold shadow-lg transition hover:bg-[#dc2626]">
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setEditOpen(false)} className="w-full bg-white border py-3 rounded-xl font-bold transition hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={confirmDelete}
          title="Delete Product?"
          description="Are you sure you want to delete this product? This action cannot be undone."
          loading={actionLoading}
        />
      </main>
    </AdminShell>
  );
}

export default function MenuItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#ef4444]" />
        </div>
      }
    >
      <MenuItemsContent />
    </Suspense>
  );
}
