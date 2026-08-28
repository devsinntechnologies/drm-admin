"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2, Mail, Plus, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { PortalStatCard } from "@/components/admin/PortalPage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { BusinessRecord } from "@/hooks/useBusiness";
import { useStaffAccounts } from "@/hooks/useStaffAccounts";
import { manageUsersHrefForIndustry, staffRoleLabel } from "@/lib/staff-role-catalog";
import { appendBusinessId } from "@/lib/module-routes";
import { cn, normalizeErrorMessage } from "@/lib/utils";
import type { ModuleId } from "@/templates/types";

type SoftwareStaffOverviewProps = {
  businessId: string;
  business: BusinessRecord;
  industryId?: string | null;
  enabledModules?: ModuleId[] | string[] | null;
  manageUsersHref?: string;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export function SoftwareStaffOverview({
  businessId,
  business,
  industryId,
  enabledModules,
  manageUsersHref,
}: SoftwareStaffOverviewProps) {
  const resolvedIndustryId = industryId ?? business.templateConfig?.industryId ?? null;
  const {
    creatableRoles,
    users,
    byRole,
    loading,
    error,
    actionLoading,
    createStaff,
  } = useStaffAccounts(businessId, resolvedIndustryId, enabledModules);

  const defaultRole = creatableRoles[0]?.key ?? "waiter";
  const activeCount = users.filter((user) => user.status.toLowerCase() === "active").length;
  const usersLink =
    manageUsersHref ??
    manageUsersHrefForIndustry(resolvedIndustryId, businessId) ??
    appendBusinessId("/dashboard/businessAdmin/users", businessId);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    password: "",
    email: "",
    role: defaultRole,
  });

  const roleOptions = useMemo(() => creatableRoles, [creatableRoles]);

  const onCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = createForm.name.trim();
    const password = createForm.password.trim();
    const role = createForm.role || defaultRole;

    if (!name || !password) {
      toast.error("Name and password are required.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!roleOptions.some((r) => r.key === role)) {
      toast.error("Select a valid role for this business.");
      return;
    }

    const toastId = toast.loading("Creating staff…");
    try {
      await createStaff({
        name,
        password,
        role,
        email: createForm.email.trim() || undefined,
      });
      toast.success(`${staffRoleLabel(role)} created successfully.`, { id: toastId });
      setCreateForm({ name: "", password: "", email: "", role: defaultRole });
      setCreateOpen(false);
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to create staff."), { id: toastId });
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">Mobile app logins</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Owner and staff accounts for {business.businessName}. Roles follow this business template.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dialog
              open={createOpen}
              onOpenChange={(open) => {
                setCreateOpen(open);
                if (!open) {
                  setCreateForm({ name: "", password: "", email: "", role: defaultRole });
                } else {
                  setCreateForm((prev) => ({ ...prev, role: prev.role || defaultRole }));
                }
              }}
            >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="dn-btn dn-btn-primary inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm"
                  disabled={roleOptions.length === 0}
                >
                  <Plus className="h-4 w-4" />
                  Create staff
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create staff</DialogTitle>
                  <DialogDescription>
                    Roles available for this industry template. They can sign in with the generated or provided login.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={(event) => void onCreateSubmit(event)}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="software-staff-name">
                      Name <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      id="software-staff-name"
                      value={createForm.name}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full rounded-xl border border-[#e0e0e0] bg-[#f8f8f8] px-4 py-3 text-sm outline-none focus:border-[#001840]"
                      placeholder="Enter name"
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="software-staff-password">
                      Password <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      id="software-staff-password"
                      type="password"
                      value={createForm.password}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                      className="w-full rounded-xl border border-[#e0e0e0] bg-[#f8f8f8] px-4 py-3 text-sm outline-none focus:border-[#001840]"
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="software-staff-email">
                      Email (optional)
                    </label>
                    <input
                      id="software-staff-email"
                      type="email"
                      value={createForm.email}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                      className="w-full rounded-xl border border-[#e0e0e0] bg-[#f8f8f8] px-4 py-3 text-sm outline-none focus:border-[#001840]"
                      placeholder="optional@email.com"
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-[#111827]">Role</span>
                    <div className="flex flex-wrap gap-2">
                      {roleOptions.map((role) => (
                        <button
                          key={role.key}
                          type="button"
                          onClick={() => setCreateForm((prev) => ({ ...prev, role: role.key }))}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm font-medium",
                            createForm.role === role.key
                              ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                              : "border-[#e2e8f0] bg-white text-[#64748b]",
                          )}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      className="dn-btn dn-btn-outline h-9 rounded-lg px-3 text-sm"
                      onClick={() => setCreateOpen(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="dn-btn dn-btn-primary h-9 rounded-lg px-3 text-sm"
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                        </>
                      ) : (
                        "Create staff"
                      )}
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Link
              href={usersLink}
              className="dn-btn dn-btn-outline inline-flex h-9 items-center rounded-lg px-3 text-sm"
            >
              Manage users in portal
            </Link>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]">
                <UserCog className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Business owner</p>
                <p className="mt-1 font-semibold text-[#0f172a]">{business.ownerName || business.businessName}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-[#475569]">
                  <Mail className="h-4 w-4 shrink-0 text-[#94a3b8]" />
                  <span className="truncate">{business.ownerEmail || business.email}</span>
                </p>
                <p className="mt-1 text-xs text-[#64748b]">Role: {business.ownerRole || "business_admin"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fef3c7] text-[#b45309]">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Passwords</p>
                <p className="mt-1 text-sm text-[#475569]">
                  Staff passwords are set when you create accounts here. Reset them from the users page if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {roleOptions.slice(0, 3).map((role) => (
          <PortalStatCard
            key={role.key}
            label={role.label}
            value={byRole[role.key] ?? 0}
            icon={Users}
            tone="primary"
          />
        ))}
        <PortalStatCard label="Active staff" value={activeCount} icon={Users} tone="accent" />
        {roleOptions.length <= 2 ? (
          <PortalStatCard label="Total staff" value={users.length} icon={Users} tone="neutral" />
        ) : null}
      </div>

      <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
        <div className="border-b border-[#e2e8f0] px-5 py-4">
          <h3 className="text-sm font-semibold text-[#0f172a]">Staff accounts</h3>
          <p className="text-sm text-[#64748b]">
            Logins for this template ({roleOptions.map((r) => r.label).join(", ") || "none"}).
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#64748b]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
          </div>
        ) : error ? (
          <p className="px-5 py-8 text-sm text-[#dc2626]">{error}</p>
        ) : users.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-[#64748b]">No staff users yet.</p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-3 inline-flex text-sm font-semibold text-[var(--brand-secondary)] hover:underline"
              disabled={roleOptions.length === 0}
            >
              Create staff
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Login email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {users.map((user) => (
                  <tr key={user.id} className="text-[#334155]">
                    <td className="px-5 py-3 font-medium text-[#0f172a]">{user.name}</td>
                    <td className="px-5 py-3 font-mono text-xs">{user.email || "—"}</td>
                    <td className="px-5 py-3">{staffRoleLabel(user.role)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                          user.status.toLowerCase() === "active"
                            ? "bg-[#ecfdf5] text-[#059669]"
                            : "bg-[#f1f5f9] text-[#64748b]",
                        )}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
