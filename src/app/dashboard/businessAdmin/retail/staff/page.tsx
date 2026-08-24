"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, FormField, portalInputClass } from "@/components/admin/PortalPage";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useRetailResource } from "@/hooks/useRetailResource";

interface StaffMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
  status: "active" | "inactive";
}

const ROLES = ["store_manager", "cashier", "inventory_clerk"];

const emptyForm = { name: "", role: "cashier", email: "", password: "" };

function StaffContent() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { items, loading, actionLoading, error, create, patch } =
    useRetailResource<StaffMember>("/retail/staff");

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "staff") && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || form.password.length < 6) {
      toast.error("Name is required and password must be at least 6 characters");
      return;
    }
    const toastId = toast.loading("Creating staff account...");
    try {
      await create({
        name: form.name.trim(),
        role: form.role,
        email: form.email.trim() || undefined,
        password: form.password,
      });
      toast.success("Staff account created", { id: toastId });
      setForm(emptyForm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create staff account", { id: toastId });
    }
  };

  const toggleStatus = async (member: StaffMember) => {
    const toastId = toast.loading("Updating status...");
    try {
      await patch(`${member.id}/status`, { isActive: member.status !== "active" });
      toast.success("Status updated", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status", { id: toastId });
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="staff" pageTitle="Staff" pageSubtitle="Cashiers, managers, and inventory staff">
      <PortalPage>
        <PortalPageHeader icon={UserCog} title="Store Staff" subtitle="Create login accounts for your team" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-muted,#f8fafc)] p-6">
            <h3 className="mb-6 text-lg font-bold">Add Staff Member</h3>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField label="Name" required>
                <input className={portalInputClass} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </FormField>
              <FormField label="Role" required>
                <select className={portalInputClass} value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Email (optional, auto-generated if blank)">
                <input className={portalInputClass} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </FormField>
              <FormField label="Password" required>
                <input
                  type="password"
                  className={portalInputClass}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
              </FormField>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#001840] py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create Account
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Team</h3>
            {loading ? (
              <Loading size="sm" />
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">No staff added yet</p>
            ) : (
              <div className="space-y-3">
                {items.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] p-4">
                    <div>
                      <p className="text-sm font-bold">{member.name}</p>
                      <p className="text-xs capitalize text-[var(--text-muted)]">{member.role?.replace("_", " ")} · {member.email}</p>
                    </div>
                    <button
                      onClick={() => toggleStatus(member)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                        member.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {member.status === "active" ? "Active" : "Inactive"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PortalPage>
    </AdminShell>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <StaffContent />
    </Suspense>
  );
}
