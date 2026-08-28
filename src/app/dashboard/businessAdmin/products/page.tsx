"use client";

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
  Shapes,
  Package,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import {
  PortalPage,
  PortalMetricRow,
  PortalErrorAlert,
  PortalEmptyState,
  PortalRefreshFab,
  portalInputClass,
  FormField,
} from "@/components/admin/PortalPage";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { Product, useProducts, CreateProductVariantPayload } from "@/hooks/useProducts";
import { BASE_URL } from "@/lib/constant";
import { CategoryRecord, useCategories } from "@/hooks/useCategories";
import { cn, normalizeErrorMessage } from "@/lib/utils";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { useDashboardRefresh } from "@/contexts/DashboardRefreshContext";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";
import { apiClient } from "@/lib/api-client";
import { EMPTY_MEDICINE_PROFILE, MedicineProfileFields, profileToPayload, type MedicineProfileForm } from "@/components/pharmacy/MedicineProfileFields";
import { NumberInput } from "@/components/common/NumberInput";

function ErrorAlert({ message }: { message: unknown }) {
  const errorMessage = normalizeErrorMessage(message, "Error loading items");
  return <PortalErrorAlert title="Error loading items" message={errorMessage} />;
}

type VariantFormItem = Required<Pick<CreateProductVariantPayload, "name" | "price" | "inStock">> &
  Pick<CreateProductVariantPayload, "id" | "costPrice">;

function VariantsEditor({
  variants,
  setVariants,
  onRemoveVariant,
  showCostPrice = false,
}: {
  variants: VariantFormItem[];
  setVariants: React.Dispatch<React.SetStateAction<VariantFormItem[]>>;
  onRemoveVariant?: (variant: VariantFormItem) => void;
  showCostPrice?: boolean;
}) {
  const { currency } = usePharmacyMarket();
  const [vForm, setVForm] = useState<VariantFormItem>({ name: "", price: 0, inStock: 0, costPrice: 0 });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const onAddOrUpdateVariant = () => {
    if (!vForm.name.trim()) {
      toast.error("Variant name is required");
      return;
    }
    if (showCostPrice && !vForm.costPrice) {
      toast.error("Variant cost price is required");
      return;
    }
    if (editingIndex != null) {
      setVariants((prev) =>
        prev.map((item, index) => (index === editingIndex ? { ...item, ...vForm, name: vForm.name.trim() } : item)),
      );
      setEditingIndex(null);
    } else {
      setVariants((prev) => [...prev, { ...vForm, name: vForm.name.trim() }]);
    }
    setVForm({ name: "", price: 0, inStock: 0, costPrice: 0 });
  };

  const startEdit = (index: number) => {
    const variant = variants[index];
    setVForm({
      name: variant.name,
      price: variant.price,
      inStock: variant.inStock,
      costPrice: variant.costPrice ?? 0,
    });
    setEditingIndex(index);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setVForm({ name: "", price: 0, inStock: 0, costPrice: 0 });
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-[var(--text-primary)]">Variants</label>

      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={v.id ?? `new-${i}`} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-sm">
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{v.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {currency} {v.price} • {v.inStock} in stock
                  {showCostPrice && v.costPrice != null && v.costPrice > 0 ? ` • cost ${currency} ${v.costPrice}` : ""}
                  {v.id ? " • saved" : " • new"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(i)}
                  className="rounded-full p-1.5 text-[#0050F8] transition hover:bg-[#eef3ff]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRemoveVariant?.(v);
                    setVariants(variants.filter((_, idx) => idx !== i));
                    if (editingIndex === i) cancelEdit();
                  }}
                  className="rounded-full p-1.5 text-[#ef4444] transition hover:bg-[#fff1f1]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 space-y-3">
        <label className="block space-y-1.5">
          <span className="block text-xs font-semibold text-[var(--text-muted)]">
            {editingIndex != null ? "Edit variant" : "Variant name"}
          </span>
          <input
            value={vForm.name}
            onChange={(e) => setVForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Large, Red, 500ml"
            className={portalInputClass}
          />
        </label>
        <div className={cn("grid gap-3", showCostPrice ? "grid-cols-3" : "grid-cols-2")}>
          <label className="block space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-muted)]">Price</span>
            <NumberInput
              value={vForm.price}
              onChange={(price) => setVForm((p) => ({ ...p, price }))}
              placeholder="0"
              className={portalInputClass}
            />
          </label>
          {showCostPrice ? (
            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold text-[var(--text-muted)]">
                Cost price <span className="text-[#dc2626]">*</span>
              </span>
              <NumberInput
                value={vForm.costPrice ?? 0}
                onChange={(costPrice) => setVForm((p) => ({ ...p, costPrice }))}
                placeholder="0"
                className={portalInputClass}
              />
            </label>
          ) : null}
          <label className="block space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-muted)]">Stock</span>
            <NumberInput
              value={vForm.inStock}
              onChange={(inStock) => setVForm((p) => ({ ...p, inStock }))}
              placeholder="0"
              className={portalInputClass}
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAddOrUpdateVariant}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#001840] py-3.5 text-sm font-bold text-[#ffffff] transition hover:bg-[#00122E]"
          >
            <Plus className="h-5 w-5" /> {editingIndex != null ? "Update variant" : "Add variant"}
          </button>
          {editingIndex != null ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border px-4 py-3.5 text-sm font-bold"
            >
              Cancel
            </button>
          ) : null}
        </div>
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
  const imageUrl = imagePath ? (imagePath.startsWith("http") ? imagePath : `${BASE_URL}/${imagePath}`) : null;

  return (
    <article className="overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col">
      <div className="relative h-80 w-full bg-[#f8fafc]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#94a3b8]">
            <ImageIcon className="h-8 w-8 opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">No Image</span>
          </div>
        )}
      </div>

      <div className="flex flex-col p-5 pt-3">
        <h3 className="mb-3 text-[22px] font-extrabold leading-tight text-[#111827]">{item.name}</h3>

        <div className="mb-4 space-y-3">
          {item.variants && item.variants.length > 0 ? (
            item.variants.map((variant) => (
              <div key={variant.id} className="flex items-center justify-between">
                <span className="text-base font-medium text-[#64748b]">{variant.name}</span>
                <span className="text-base font-extrabold text-[#16a34a]">Rs. {variant.price}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[#64748b]">Price</span>
              <span className="text-base font-black text-[#16a34a]">Rs. {item.price}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onEdit(item.id)}
            className="flex-1 inline-flex min-h-8 items-center justify-center gap-2 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] px-4 py-0.5 text-sm font-black text-[#16a34a] transition hover:bg-[#dcfce7]"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            disabled={deleting}
            className="inline-flex h-12 w-16 items-center justify-center rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#ef4444] transition hover:bg-[#fee2e2]"
          >
            <Trash2 className="h-6 w-6" />
          </button>
        </div>
      </div>
    </article>
  );
}

function MenuItemsContent() {
  const router = useRouter();
  const { token, role } = useAuth();
  const { templateConfig } = useBusinessTemplate();
  const { bumpDashboardRefresh } = useDashboardRefresh();
  const { market, currency } = usePharmacyMarket();
  const isPharmacy = templateConfig?.industryId === "pharmacy";
  const isRetail = templateConfig?.industryId === "retail-store";
  const productLabel = isPharmacy ? "Medicine" : isRetail ? "Product" : "Menu Item";
  const [createMedicine, setCreateMedicine] = useState<MedicineProfileForm>(EMPTY_MEDICINE_PROFILE);
  const [editMedicine, setEditMedicine] = useState<MedicineProfileForm>(EMPTY_MEDICINE_PROFILE);
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    price: 0,
    sortOrder: 0,
    inStock: 0,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    categoryId: "",
    isKitchen: true,
    isStockEnabled: true,
    costPrice: 0,
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
    isStockEnabled: true,
    costPrice: 0,
    image: null as File | null,
  });

  const [createVariants, setCreateVariants] = useState<VariantFormItem[]>([]);
  const [editVariants, setEditVariants] = useState<VariantFormItem[]>([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [quickCategorySort, setQuickCategorySort] = useState(0);

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
  } = useProducts({ page: currentPage, limit: isRetail ? 100 : undefined });

  const { categories, createCategory, actionLoading: categorySaving, fetchCategories } = useCategories({
    page: 1,
    limit: 100,
  });

  const openQuickCategory = () => {
    setQuickCategoryName("");
    setQuickCategorySort(0);
    setCategoryDialogOpen(true);
  };

  const onQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCategoryName.trim()) return toast.error("Category name is required");
    const toastId = toast.loading("Creating category...");
    try {
      const created = await createCategory({
        categoryName: quickCategoryName.trim(),
        sortOrder: quickCategorySort,
      });
      await fetchCategories(1);
      if (created && typeof created === "object" && "id" in created) {
        setCreateForm((p) => ({ ...p, categoryId: created.id }));
        setEditForm((p) => (editOpen ? { ...p, categoryId: created.id } : p));
      }
      setCategoryDialogOpen(false);
      toast.success("Category created", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category", { id: toastId });
    }
  };

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;

    if (!canAccessWorkspacePage(currentRole, "products") && !isSuperAdminImpersonating) {
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
      isStockEnabled: true,
      costPrice: 0,
      image: null,
    });
    setCreateVariants([]);
    setCreateMedicine(EMPTY_MEDICINE_PROFILE);
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
      isStockEnabled: true,
      costPrice: 0,
      image: null,
    });
    setEditVariants([]);
    setDeletedVariantIds([]);
    setEditMedicine(EMPTY_MEDICINE_PROFILE);
    setEditId(null);
  };

  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.categoryId) return toast.error("Category is required");
    if (!createForm.name) return toast.error("Name is required");
    if (isPharmacy) {
      if (!createMedicine.genericName.trim()) return toast.error("Generic name is required");
      if (!createMedicine.saltName.trim()) return toast.error("Salt / composition is required");
    }

    const toastId = toast.loading("Adding product...");
    try {
      await createProduct({
        ...createForm,
        isKitchen: isPharmacy || isRetail ? false : createForm.isKitchen,
        isStockEnabled: isRetail ? createForm.isStockEnabled : undefined,
        costPrice: isRetail ? createForm.costPrice : undefined,
        variants: createVariants,
      });
      if (isPharmacy) {
        const list = await apiClient.get<any>("/products?limit=100", token, impersonatedBusinessId);
        const rows = list?.data || list || [];
        const created = Array.isArray(rows) ? rows.find((item: any) => item.name === createForm.name) : null;
        if (created?.id) {
          await apiClient.put(`/pharmacy-catalog/products/${created.id}/profile`, profileToPayload(createMedicine), token, impersonatedBusinessId);
        }
      }
      toast.success("Product added successfully", { id: toastId });
      setCreateOpen(false);
      resetCreateForm();
      refetch();
      bumpDashboardRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add product", { id: toastId });
    }
  };

  const onOpenEdit = async (id: string) => {
    const toastId = toast.loading("Loading product details...");
    try {
      const product = await getProductById(id);
      setEditId(id);
      setDeletedVariantIds([]);
      setEditForm({
        name: product.name,
        price: product.price,
        sortOrder: product.sortOrder || 0,
        inStock: product.inStock || 0,
        status: product.status as "ACTIVE" | "INACTIVE",
        categoryId: product.categoryId || "",
        isKitchen: product.isKitchen || true,
        isStockEnabled: product.isStockEnabled ?? true,
        costPrice: product.costPrice ?? 0,
        image: null,
      });
      setEditVariants(
        product.variants?.map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price,
          inStock: v.inStock,
          costPrice: v.costPrice ?? 0,
        })) || [],
      );
      if (isPharmacy) {
        try {
          const profile = await apiClient.get<any>(`/pharmacy-catalog/products/${id}`, token, impersonatedBusinessId);
          if (profile) {
            const strip = profile.units?.find((u: any) => u.unit === "strip")?.factorToBase || 10;
            const box = profile.units?.find((u: any) => u.unit === "box")?.factorToBase || 100;
            setEditMedicine({
              genericName: profile.genericName || "",
              saltName: profile.saltName || "",
              barcode: profile.barcode || "",
              hsnCode: profile.hsnCode || "",
              gstRate: Number(profile.gstRate || 0),
              rxRequired: Boolean(profile.rxRequired),
              controlledSchedule: profile.controlledSchedule || "",
              reorderLevel: Number(profile.reorderLevel || 0),
              baseUnit: profile.baseUnit || "tablet",
              stripToTablet: Number(strip),
              boxToStrip: Number(strip) ? Number(box) / Number(strip) : 10,
            });
          }
        } catch {
          setEditMedicine(EMPTY_MEDICINE_PROFILE);
        }
      }
      toast.dismiss(toastId);
      setEditOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load product details", { id: toastId });
    }
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    if (!editForm.categoryId) return toast.error("Category is required");
    if (!editForm.name) return toast.error("Name is required");
    if (isPharmacy) {
      if (!editMedicine.genericName.trim()) return toast.error("Generic name is required");
      if (!editMedicine.saltName.trim()) return toast.error("Salt / composition is required");
    }

    const toastId = toast.loading("Updating product...");
    try {
      await updateProduct(editId, {
        ...editForm,
        isStockEnabled: isRetail ? editForm.isStockEnabled : undefined,
        costPrice: isRetail ? editForm.costPrice : undefined,
        variants: [
          ...editVariants.map((v) =>
            v.id
              ? {
                  id: v.id,
                  name: v.name,
                  price: v.price,
                  inStock: v.inStock,
                  ...(isRetail ? { costPrice: v.costPrice } : {}),
                }
              : {
                  name: v.name,
                  price: v.price,
                  inStock: v.inStock,
                  ...(isRetail ? { costPrice: v.costPrice } : {}),
                },
          ),
          ...deletedVariantIds.map((id) => ({ id, action: "delete" as const })),
        ],
      });
      if (isPharmacy) {
        await apiClient.put(`/pharmacy-catalog/products/${editId}/profile`, profileToPayload(editMedicine), token, impersonatedBusinessId);
      }
      toast.success("Product updated successfully", { id: toastId });
      setEditOpen(false);
      resetEditForm();
      refetch();
      bumpDashboardRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update product", { id: toastId });
    }
  };

  const onDelete = async (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const toastId = toast.loading("Deleting product...");
    try {
      await deleteProduct(deleteId);
      toast.success("Product deleted successfully", { id: toastId });
      setDeleteOpen(false);
      setDeleteId(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product", { id: toastId });
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell
      activeTab="products"
      pageTitle={isPharmacy ? "Medicines" : isRetail ? "Products" : "Menu Items"}
      pageSubtitle={isPharmacy ? market.catalogSubtitle : undefined}
    >
      <PortalPage>
        <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={() => setCreateOpen(true)} className="dn-btn dn-btn-primary">
            <Plus className="h-5 w-5" /> {isPharmacy ? "Add medicine" : "Add Product"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/businessAdmin/categories${impersonatedBusinessId ? `?businessId=${impersonatedBusinessId}` : ""}`)}
            className="dn-btn dn-btn-outline"
          >
            <Shapes className="h-5 w-5" /> Categories
          </button>
          {isPharmacy ? null : (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/businessAdmin/ingredients${impersonatedBusinessId ? `?businessId=${impersonatedBusinessId}` : ""}`)}
              className="dn-btn dn-btn-soft"
            >
              <Package className="h-5 w-5" /> Ingredients
            </button>
          )}
        </div>

        <PortalMetricRow label={isPharmacy ? "Total medicines" : isRetail ? "Total products" : "Total Items"} value={pagination.total} icon={Box} />

        {error ? <ErrorAlert message={error} /> : null}

        {loading ? (
          <Loading />
        ) : filteredProducts.length === 0 ? (
          <PortalEmptyState icon={Box} title={isPharmacy ? "No medicines found" : "No products found"} description={isPharmacy ? "Add a medicine to start billing and stock tracking." : "Add a new product to get started."} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((item) => (
              <MenuCard key={item.id} item={item} onEdit={onOpenEdit} onDelete={onDelete} deleting={actionLoading} />
            ))}
          </div>
        )}

        <PortalRefreshFab onClick={() => refetch()} loading={loading} />

        {/* Dialogs */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
            <div className="bg-white">
              <div className="p-6 pb-4 border-b">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">{isPharmacy ? "Add medicine" : "Add New Product"}</DialogTitle>
                  <DialogDescription>
                    {isPharmacy ? `Name, price, ${market.taxName}, barcode, and clinical flags` : "Fill in the details to create a new product"}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <form className="flex flex-col max-h-[80vh]" onSubmit={onCreateSubmit}>
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-bold">
                        Category <span className="text-[#dc2626]">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={openQuickCategory}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-[#1d4ed8] hover:bg-[#dbeafe]"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add category
                      </button>
                    </div>
                    <select
                      value={createForm.categoryId}
                      onChange={(e) => setCreateForm(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.CategoryName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold">
                      Name <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      value={createForm.name}
                      onChange={(e) => setCreateForm(p => ({ ...p, name: e.target.value }))}
                      placeholder={isPharmacy ? "Medicine name" : "Product Name"}
                      className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold">
                        Price ({currency}) <span className="text-[#dc2626]">*</span>
                      </label>
                      <NumberInput
                        value={createForm.price}
                        onChange={(price) => setCreateForm((p) => ({ ...p, price }))}
                        className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                        required
                        min={0}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold">Stock</label>
                      <NumberInput
                        value={createForm.inStock}
                        onChange={(inStock) => setCreateForm((p) => ({ ...p, inStock }))}
                        className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                        min={0}
                      />
                    </div>
                  </div>
                  {isRetail ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold">
                          Cost price ({currency}) <span className="text-[#dc2626]">*</span>
                        </label>
                        <NumberInput
                          value={createForm.costPrice}
                          onChange={(costPrice) => setCreateForm((p) => ({ ...p, costPrice }))}
                          className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                          required
                          min={0}
                        />
                      </div>
                      <label className="flex items-center gap-2 self-end rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={createForm.isStockEnabled}
                          onChange={(e) => setCreateForm((p) => ({ ...p, isStockEnabled: e.target.checked }))}
                        />
                        Track inventory on sales
                      </label>
                    </div>
                  ) : null}
                  <VariantsEditor variants={createVariants} setVariants={setCreateVariants} showCostPrice={isRetail} />
                  {isPharmacy ? <MedicineProfileFields value={createMedicine} onChange={setCreateMedicine} /> : null}
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Image</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-[#001840] text-[#ffffff] px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 transition hover:bg-[#00122E] shadow-md">
                        <ImageIconLucide className="h-5 w-5" /> Choose Image
                        <input type="file" className="hidden" onChange={(e) => setCreateForm(p => ({ ...p, image: e.target.files?.[0] ?? null }))} />
                      </label>
                      {createForm.image && <span className="text-xs text-green-600 font-medium">{createForm.image.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-4 border-t bg-gray-50 flex flex-col gap-2">
                  <button type="submit" disabled={actionLoading} className="w-full bg-[#001840] text-[#ffffff] py-3.5 rounded-xl font-bold shadow-lg transition hover:bg-[#00122E] flex items-center justify-center gap-2">
                    <Plus className="h-5 w-5" /> {isPharmacy ? "Save medicine" : "Save Product"}
                  </button>
                  <button type="button" onClick={() => setCreateOpen(false)} className="w-full bg-white border border-gray-200 py-3 rounded-xl font-bold text-[#111827] transition hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add category</DialogTitle>
              <DialogDescription>
                Create a category without leaving this form. It will be selected automatically.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={onQuickCreateCategory}>
              <FormField label="Category name" required>
                <input
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  placeholder={isPharmacy ? "e.g. Tablets" : "e.g. Starters"}
                  className={portalInputClass}
                  required
                />
              </FormField>
              <FormField label="Sort order">
                <input
                  type="number"
                  value={quickCategorySort}
                  onChange={(e) => setQuickCategorySort(Number(e.target.value))}
                  className={portalInputClass}
                />
              </FormField>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryDialogOpen(false)}
                  className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySaving}
                  className="flex-1 rounded-xl bg-[#001840] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {categorySaving ? "Saving…" : "Save category"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
            <div className="bg-white">
              <div className="p-6 pb-4 border-b">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">
                    {isPharmacy ? "Update medicine" : "Update Product"}
                  </DialogTitle>
                </DialogHeader>
              </div>

              <form className="flex flex-col max-h-[80vh]" onSubmit={onEditSubmit}>
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-bold">
                        Category <span className="text-[#dc2626]">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={openQuickCategory}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-[#1d4ed8] hover:bg-[#dbeafe]"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add category
                      </button>
                    </div>
                    <select
                      value={editForm.categoryId}
                      onChange={(e) => setEditForm(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.CategoryName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold">
                      Name <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold">
                        Price ({currency}) <span className="text-[#dc2626]">*</span>
                      </label>
                      <NumberInput
                        value={editForm.price}
                        onChange={(price) => setEditForm((p) => ({ ...p, price }))}
                        className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                        required
                        min={0}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold">Stock</label>
                      <NumberInput
                        value={editForm.inStock}
                        onChange={(inStock) => setEditForm((p) => ({ ...p, inStock }))}
                        className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                        min={0}
                      />
                    </div>
                  </div>
                  {isRetail ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold">
                          Cost price ({currency}) <span className="text-[#dc2626]">*</span>
                        </label>
                        <NumberInput
                          value={editForm.costPrice}
                          onChange={(costPrice) => setEditForm((p) => ({ ...p, costPrice }))}
                          className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm outline-none"
                          required
                          min={0}
                        />
                      </div>
                      <label className="flex items-center gap-2 self-end rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={editForm.isStockEnabled}
                          onChange={(e) => setEditForm((p) => ({ ...p, isStockEnabled: e.target.checked }))}
                        />
                        Track inventory on sales
                      </label>
                    </div>
                  ) : null}
                  <VariantsEditor
                    variants={editVariants}
                    setVariants={setEditVariants}
                    showCostPrice={isRetail}
                    onRemoveVariant={(variant) => {
                      if (variant.id) {
                        setDeletedVariantIds((prev) =>
                          prev.includes(variant.id!) ? prev : [...prev, variant.id!],
                        );
                      }
                    }}
                  />
                  {isPharmacy ? <MedicineProfileFields value={editMedicine} onChange={setEditMedicine} /> : null}
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Image</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-[#001840] text-[#ffffff] px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 transition hover:bg-[#00122E] shadow-md">
                        <ImageIconLucide className="h-5 w-5" /> Choose Image
                        <input type="file" className="hidden" onChange={(e) => setEditForm(p => ({ ...p, image: e.target.files?.[0] ?? null }))} />
                      </label>
                      {editForm.image && <span className="text-xs text-green-600 font-medium">{editForm.image.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-4 border-t bg-gray-50 space-y-3">
                  <button type="submit" disabled={actionLoading} className="w-full bg-[#001840] text-[#ffffff] py-3.5 rounded-xl font-bold shadow-lg transition hover:bg-[#00122E] flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> Update Product
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setEditOpen(false)} className="w-full bg-white border border-gray-200 py-3 rounded-xl font-bold text-[#111827] transition hover:bg-gray-50">
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditOpen(false);
                        if (editId) onDelete(editId);
                      }} 
                      className="w-full bg-[#4f46e5] text-white py-3 rounded-xl font-bold transition hover:bg-[#4338ca] flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
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
      </PortalPage>
    </AdminShell>
  );
}

export default function MenuItemsPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <MenuItemsContent />
    </Suspense>
  );
}
