"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, FormField, portalInputClass } from "@/components/admin/PortalPage";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { NumberInput } from "@/components/common/NumberInput";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useRetailResource } from "@/hooks/useRetailResource";

interface Expense {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  amount: number;
  paymentMethod: string;
  expenseDate: string;
}

const CATEGORIES = ["rent", "utilities", "salaries", "supplies", "transport", "marketing", "maintenance", "taxes", "other"];
const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "mobile_wallet", "other"];

const emptyForm = {
  category: "rent",
  title: "",
  amount: 0,
  paymentMethod: "cash",
  expenseDate: new Date().toISOString().slice(0, 10),
  description: "",
};

function ExpensesContent() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { items, loading, actionLoading, error, create, update, remove } =
    useRetailResource<Expense>("/expenses");

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "expenses") && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || form.amount <= 0) {
      toast.error("Title and amount are required");
      return;
    }
    const payload = {
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      amount: form.amount,
      paymentMethod: form.paymentMethod,
      expenseDate: form.expenseDate,
    };
    const toastId = toast.loading(editId ? "Updating expense..." : "Recording expense...");
    try {
      if (editId) {
        await update(editId, payload);
        toast.success("Expense updated", { id: toastId });
        setEditId(null);
      } else {
        await create(payload);
        toast.success("Expense recorded", { id: toastId });
      }
      setForm({ ...emptyForm, expenseDate: form.expenseDate });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save expense", { id: toastId });
    }
  };

  const startEdit = (expense: Expense) => {
    setEditId(expense.id);
    setForm({
      category: expense.category,
      title: expense.title,
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      expenseDate: expense.expenseDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      description: expense.description ?? "",
    });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const toastId = toast.loading("Deleting expense...");
    try {
      await remove(deleteId);
      toast.success("Expense deleted", { id: toastId });
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete expense", { id: toastId });
    }
  };

  const totalShown = items.reduce((sum, item) => sum + Number(item.amount), 0);

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="expenses" pageTitle="Expenses" pageSubtitle="Track rent, utilities, salaries and other store costs">
      <PortalPage>
        <PortalPageHeader icon={Receipt} title="Expenses" subtitle={`Rs ${totalShown.toLocaleString()} recorded on this page`} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-muted,#f8fafc)] p-6">
            <h3 className="mb-6 text-lg font-bold">{editId ? "Edit Expense" : "Record Expense"}</h3>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField label="Category" required>
                <select
                  className={portalInputClass}
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Title" required>
                <input
                  className={portalInputClass}
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="August electricity bill"
                />
              </FormField>
              <FormField label="Amount" required>
                <NumberInput
                  min={0}
                  className={portalInputClass}
                  value={form.amount}
                  onChange={(amount) => setForm((p) => ({ ...p, amount }))}
                />
              </FormField>
              <FormField label="Payment method">
                <select
                  className={portalInputClass}
                  value={form.paymentMethod}
                  onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Date" required>
                <input
                  type="date"
                  className={portalInputClass}
                  value={form.expenseDate}
                  onChange={(e) => setForm((p) => ({ ...p, expenseDate: e.target.value }))}
                />
              </FormField>
              <FormField label="Notes">
                <textarea
                  className={portalInputClass}
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </FormField>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#001840] py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editId ? "Update Expense" : "Save Expense"}
              </button>
              {editId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setForm(emptyForm);
                  }}
                  className="w-full rounded-2xl border py-3 text-sm font-bold"
                >
                  Cancel edit
                </button>
              ) : null}
            </form>
          </div>

          <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Recent Expenses</h3>
            {loading ? (
              <Loading size="sm" />
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">No expenses recorded yet</p>
            ) : (
              <div className="space-y-3">
                {items.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] p-4"
                  >
                    <div>
                      <p className="text-sm font-bold">{expense.title}</p>
                      <p className="text-xs capitalize text-[var(--text-muted)]">
                        {expense.category} · {expense.expenseDate} · {expense.paymentMethod.replace("_", " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-bold">Rs {Number(expense.amount).toLocaleString()}</p>
                      <button
                        onClick={() => startEdit(expense)}
                        className="text-sm font-semibold text-[#0050F8]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(expense.id);
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
          title="Delete expense?"
          description="This expense record will be removed permanently."
          loading={actionLoading}
        />
      </PortalPage>
    </AdminShell>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <ExpensesContent />
    </Suspense>
  );
}
