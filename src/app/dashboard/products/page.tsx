"use client";

import Image from "next/image";
import { Box, Plus, Search, Trash2, Pencil, Minus, Store, AlertCircle, ChevronLeft, ChevronRight, Loader } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { useProducts, type CreateProductVariantPayload, type Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { normalizeErrorMessage } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function formatPrice(value: number) {
  return `${value.toFixed(0)}`;
}

function ErrorAlert({ message }: { message: unknown }) {
  const errorMessage = normalizeErrorMessage(message, "Error loading products");

  return (
    <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f1] p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-[#ef4444]">Error loading products</p>
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
  return (
    <div className="space-y-2 sm:col-span-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#111827]">Variants</label>
        <button
          type="button"
          onClick={() => setVariants((prev) => [...prev, { name: "", price: 0, inStock: 0 }])}
          className="inline-flex items-center gap-1 rounded-lg border border-[#dbe3ef] px-2 py-1 text-xs font-semibold text-[#4f46e5]"
        >
          <Plus className="h-3.5 w-3.5" /> Add Variant
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#dbe3ef] p-3 text-xs text-[#64748b]">
          No variants added. Product will be created without variants.
        </p>
      ) : (
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div key={`${variant.name}-${index}`} className="grid grid-cols-1 gap-2 rounded-xl border border-[#e2e8f0] p-3 sm:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
              <input
                value={variant.name}
                onChange={(event) =>
                  setVariants((prev) => prev.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))
                }
                placeholder="Variant name"
                className="rounded-lg border border-[#dbe3ef] px-2 py-1.5 text-sm outline-none focus:border-[#635bff]"
              />
              <input
                type="number"
                min={0}
                value={variant.price}
                onChange={(event) =>
                  setVariants((prev) => prev.map((item, i) => (i === index ? { ...item, price: Number(event.target.value) } : item)))
                }
                placeholder="Price"
                className="rounded-lg border border-[#dbe3ef] px-2 py-1.5 text-sm outline-none focus:border-[#635bff]"
              />
              <input
                type="number"
                min={0}
                value={variant.inStock}
                onChange={(event) =>
                  setVariants((prev) => prev.map((item, i) => (i === index ? { ...item, inStock: Number(event.target.value) } : item)))
                }
                placeholder="Stock"
                className="rounded-lg border border-[#dbe3ef] px-2 py-1.5 text-sm outline-none focus:border-[#635bff]"
              />
              <button
                type="button"
                onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
                className="inline-flex items-center justify-center rounded-lg border border-[#fecaca] px-2 text-[#ef4444]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
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
  const lowStock = item.inStock < 20;
  const stockStatus = lowStock ? "Low" : "Good";
  const stockColor = lowStock ? "bg-[#ef4444]" : "bg-[#16a34a]";
  const categoryName = item.category?.CategoryName || "Uncategorized";
  const imagePath = item.image?.trim();
  const imageUrl = imagePath ? (imagePath.startsWith("http") ? imagePath : `https://vendor.umazing.shop/${imagePath}`) : "/business/pic1.jpeg";

  return (
    <article className="overflow-hidden rounded-[28px] border border-[#e4e8f0]  shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="relative h-52">
        <Image 
          src={imageUrl} 
          alt={item.name} 
          fill 
          sizes="(max-width: 640px) 100vw, 25vw" 
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/business/pic1.jpeg";
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0.3)_100%)]" />
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white bg-[#4f46e5]`}>{categoryName}</span>
        <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${lowStock ? "bg-[#ef4444]" : "bg-[#16a34a]"}`}>
          {lowStock ? `Low: ${item.inStock}` : item.inStock}
        </span>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
          <div>
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <p className="text-xs text-white/80">per unit</p>
          </div>
          <strong className="text-2xl font-semibold">{formatPrice(item.price)}</strong>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between text-sm text-[#667085]">
          <span>Stock Level</span>
          <span className={lowStock ? "text-[#ef4444]" : "text-[#16a34a]"}>{stockStatus}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#edf2f7]">
          <div className={`h-full rounded-full ${stockColor}`} style={{ width: `${Math.min((item.inStock / 100) * 100, 100)}%` }} />
        </div>

        {item.variants && item.variants.length > 0 && (
          <div className="text-xs text-[#667085]">
            <p className="font-medium mb-2">{item.variants.length} variant{item.variants.length > 1 ? "s" : ""}</p>
            <div className="space-y-1">
              {item.variants.slice(0, 2).map((variant) => (
                <div key={variant.id} className="flex justify-between">
                  <span>{variant.name}</span>
                  <span className="font-medium">{formatPrice(variant.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl border border-[#e8ebf3] bg-[#fafbff] px-4 py-3 text-sm text-[#5b6475]">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5e7eb] bg-white text-[#111827]">
            <Minus className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="font-medium">Quick Adjust</p>
            <p className="text-xs text-[#667085]">±5 units</p>
          </div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5e7eb] bg-white text-[#111827]">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button type="button" onClick={() => onEdit(item.id)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#cfd8ff] bg-[#eef2ff] px-4 py-3 text-sm font-semibold text-[#4f46e5]">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button type="button" onClick={() => onDelete(item.id)} disabled={deleting} className="inline-flex items-center justify-center rounded-2xl border border-[#fecaca] bg-white px-4 py-3 text-[#ef4444] disabled:opacity-60">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MenuItemsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
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
  const [createVariants, setCreateVariants] = useState<CreateProductVariantPayload[]>([
    { name: "Half", price: 250, inStock: 20 },
    { name: "Full", price: 450, inStock: 12 },
  ]);
  const [editVariants, setEditVariants] = useState<CreateProductVariantPayload[]>([]);

  const { products, loading, actionLoading, error, pagination, nextPage, prevPage, createProduct, getProductById, updateProduct, deleteProduct } = useProducts({
    page: currentPage,
  });
  const { categories } = useCategories({ page: 1, limit: 100 });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    if (currentRole !== "business_admin") {
      router.replace("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [role, router]);

  const filteredItems = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [products, search]);

  const stats = useMemo(() => {
    const lowStockCount = products.filter((item) => item.inStock < 20).length;
    const stockValue = products.reduce((sum, item) => sum + item.price * item.inStock, 0);
    const uniqueCategories = new Set(products.map((item) => item.categoryId).filter(Boolean)).size;

    return {
      lowStockCount,
      stockValue,
      uniqueCategories,
    };
  }, [products]);

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
    setCreateVariants([
      { name: "Half", price: 250, inStock: 20 },
      { name: "Full", price: 450, inStock: 12 },
    ]);
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

  const onCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createForm.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (!createForm.categoryId) {
      toast.error("Category is required");
      return;
    }

    const validVariants = createVariants.filter((variant) => variant.name.trim());
    if (validVariants.some((variant) => Number.isNaN(variant.price) || Number.isNaN(variant.inStock))) {
      toast.error("Variant values are invalid");
      return;
    }

    try {
      await createProduct({
        name: createForm.name.trim(),
        price: Number(createForm.price),
        sortOrder: Number(createForm.sortOrder),
        inStock: Number(createForm.inStock),
        status: createForm.status,
        categoryId: createForm.categoryId,
        isKitchen: createForm.isKitchen,
        variants: validVariants,
        image: createForm.image,
      });

      toast.success("Product created successfully");
      setCreateOpen(false);
      resetCreateForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    }
  };

  const onOpenEdit = async (id: string) => {
    try {
      const product = await getProductById(id);
      setEditId(id);
      setEditForm({
        name: product.name,
        price: product.price,
        sortOrder: product.sortOrder,
        inStock: product.inStock,
        status: product.status,
        categoryId: product.categoryId || "",
        isKitchen: true,
        image: null,
      });
      setEditVariants(
        (product.variants || []).map((variant) => ({
          name: variant.name,
          price: variant.price,
          inStock: variant.inStock,
        })),
      );
      setEditOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load product");
    }
  };

  const onEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editId) {
      return;
    }

    if (!editForm.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (!editForm.categoryId) {
      toast.error("Category is required");
      return;
    }

    const validVariants = editVariants.filter((variant) => variant.name.trim());
    if (validVariants.some((variant) => Number.isNaN(variant.price) || Number.isNaN(variant.inStock))) {
      toast.error("Variant values are invalid");
      return;
    }

    try {
      await updateProduct(editId, {
        name: editForm.name.trim(),
        price: Number(editForm.price),
        sortOrder: Number(editForm.sortOrder),
        inStock: Number(editForm.inStock),
        status: editForm.status,
        categoryId: editForm.categoryId,
        isKitchen: editForm.isKitchen,
        variants: validVariants,
        image: editForm.image,
      });

      toast.success("Product updated successfully");
      setEditOpen(false);
      resetEditForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update product");
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = typeof window !== "undefined" ? window.confirm("Delete this product?") : false;
    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(id);
      toast.success("Product deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  if (!isAuthorized) {
    return null;
  }

  const displayedItems = search ? filteredItems : filteredItems.slice(0, 30);

  return (
    <AdminShell activeTab="products">
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
                <DialogContent className="max-w-xl">
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
            <DialogContent className="max-w-xl">
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
        </div>
      </main>
    </AdminShell>
  );
}
