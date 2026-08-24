"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, FormField, portalInputClass } from "@/components/admin/PortalPage";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useRetailResource } from "@/hooks/useRetailResource";

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  loyaltyPoints: number;
  totalSpent: number;
}

const emptyForm = { name: "", phone: "", email: "" };

function CustomersContent() {
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
    useRetailResource<Customer>("/retail/customers");

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "customers") && !isSuperAdminImpersonating) {
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
      toast.error("Customer name is required");
      return;
    }
    const toastId = toast.loading(editId ? "Updating customer..." : "Adding customer...");
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
      };
      if (editId) await update(editId, payload);
      else await create(payload);
      toast.success(editId ? "Customer updated" : "Customer added", { id: toastId });
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save customer", { id: toastId });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const toastId = toast.loading("Deleting customer...");
    try {
      await remove(deleteId);
      toast.success("Customer deleted", { id: toastId });
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete customer", { id: toastId });
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="customers" pageTitle="Customers" pageSubtitle="Shoppers who buy from your store">
      <PortalPage>
        <PortalPageHeader icon={Users} title="Customers" subtitle="Track repeat customers and their spend" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-muted,#f8fafc)] p-6">
            <h3 className="mb-6 text-lg font-bold">{editId ? "Update Customer" : "Add Customer"}</h3>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField label="Name" required>
                <input
                  className={portalInputClass}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ayesha Khan"
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
            <h3 className="mb-4 text-lg font-bold">Customer List</h3>
            {loading ? (
              <Loading size="sm" />
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">No customers yet</p>
            ) : (
              <div className="space-y-3">
                {items.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] p-4"
                  >
                    <div>
                      <p className="text-sm font-bold">{customer.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {[customer.phone, customer.email].filter(Boolean).join(" · ") || "No contact info"} · Spent Rs {Number(customer.totalSpent ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditId(customer.id);
                          setForm({ name: customer.name, phone: customer.phone ?? "", email: customer.email ?? "" });
                        }}
                        className="text-sm font-semibold text-[#0050F8]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(customer.id);
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
          title="Delete customer?"
          description="This customer record will be removed."
          loading={actionLoading}
        />
      </PortalPage>
    </AdminShell>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <CustomersContent />
    </Suspense>
  );
}
