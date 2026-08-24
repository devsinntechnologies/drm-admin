"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, FormField, portalInputClass } from "@/components/admin/PortalPage";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useRetailResource } from "@/hooks/useRetailResource";

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

const emptyForm = { name: "", contactPerson: "", phone: "", email: "", address: "" };

function SuppliersContent() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { items, loading, actionLoading, error, create, update, remove } =
    useRetailResource<Supplier>("/retail/suppliers");

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "suppliers") && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    const toastId = toast.loading(editId ? "Updating supplier..." : "Creating supplier...");
    try {
      const payload = {
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
      };
      if (editId) await update(editId, payload);
      else await create(payload);
      toast.success(editId ? "Supplier updated" : "Supplier created", { id: toastId });
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save supplier", { id: toastId });
    }
  };

  const onEdit = (supplier: Supplier) => {
    setEditId(supplier.id);
    setForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
    });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const toastId = toast.loading("Deleting supplier...");
    try {
      await remove(deleteId);
      toast.success("Supplier deleted", { id: toastId });
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete supplier", { id: toastId });
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="suppliers" pageTitle="Suppliers" pageSubtitle="Vendors you purchase stock from">
      <PortalPage>
        <PortalPageHeader icon={Truck} title="Suppliers" subtitle="Manage the vendors who supply your store" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-muted,#f8fafc)] p-6">
            <h3 className="mb-6 text-lg font-bold">{editId ? "Update Supplier" : "Add Supplier"}</h3>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField label="Name" required>
                <input
                  className={portalInputClass}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Metro Wholesale"
                />
              </FormField>
              <FormField label="Contact person">
                <input
                  className={portalInputClass}
                  value={form.contactPerson}
                  onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))}
                />
              </FormField>
              <FormField label="Phone">
                <input
                  className={portalInputClass}
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </FormField>
              <FormField label="Email">
                <input
                  className={portalInputClass}
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </FormField>
              <FormField label="Address">
                <textarea
                  className={portalInputClass}
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border-2 border-[var(--border-subtle)] bg-white py-3 text-sm font-bold"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#001840] py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Supplier List</h3>
            {loading ? (
              <Loading size="sm" />
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">No suppliers yet</p>
            ) : (
              <div className="space-y-3">
                {items.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] p-4"
                  >
                    <div>
                      <p className="text-sm font-bold">{supplier.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {[supplier.contactPerson, supplier.phone, supplier.email].filter(Boolean).join(" · ") || "No contact info"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onEdit(supplier)} className="text-sm font-semibold text-[#0050F8]">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(supplier.id);
                          setDeleteOpen(true);
                        }}
                        className="text-sm font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DeleteConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={confirmDelete}
          title="Delete supplier?"
          description="This supplier will no longer be available for new purchase orders."
          loading={actionLoading}
        />
      </PortalPage>
    </AdminShell>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <SuppliersContent />
    </Suspense>
  );
}
