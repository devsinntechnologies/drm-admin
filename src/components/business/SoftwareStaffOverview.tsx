"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { BusinessRecord } from "@/hooks/useBusiness";
import {
  previewStaffLoginEmail,
  useStaffAccounts,
  type StaffAccount,
} from "@/hooks/useStaffAccounts";
import { manageUsersHrefForIndustry, staffRoleLabel } from "@/lib/staff-role-catalog";
import { appendBusinessId } from "@/lib/module-routes";
import { cn, normalizeErrorMessage } from "@/lib/utils";
import type { ModuleId } from "@/templates/types";
import { OwnerCredentialsActions } from "@/components/business/OwnerCredentialsActions";
import { useAuth } from "@/hooks/useAuth";

type SoftwareStaffOverviewProps = {
  businessId: string;
  business: BusinessRecord;
  industryId?: string | null;
  enabledModules?: ModuleId[] | string[] | null;
  manageUsersHref?: string;
  compact?: boolean;
  hidePortalLink?: boolean;
};

type RoleFilter = "all" | "active" | string;

const AVATAR_TONES = [
  "bg-[#eef2ff] text-[#4338ca]",
  "bg-[#ecfeff] text-[#0e7490]",
  "bg-[#fef3c7] text-[#b45309]",
  "bg-[#fce7f3] text-[#be185d]",
  "bg-[#dbeafe] text-[#1d4ed8]",
  "bg-[#f1f5f9] text-[#334155]",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function avatarTone(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash += name.charCodeAt(i);
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

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
  compact = false,
  hidePortalLink = false,
}: SoftwareStaffOverviewProps) {
  const { role } = useAuth();
  const canManageOwner =
    role === "super_admin" || role === "business_admin";
  const resolvedIndustryId = industryId ?? business.templateConfig?.industryId ?? null;
  const ownerEmail = business.ownerEmail || business.email;
  const {
    family,
    creatableRoles,
    users,
    byRole,
    loading,
    error,
    actionLoading,
    createStaff,
    updateStaff,
    updatePassword,
    setStatus,
    deleteStaff,
  } = useStaffAccounts(businessId, resolvedIndustryId, enabledModules);

  const defaultRole = creatableRoles[0]?.key ?? "waiter";
  const activeCount = users.filter((user) => user.status.toLowerCase() === "active").length;
  const usersLink =
    manageUsersHref ??
    manageUsersHrefForIndustry(resolvedIndustryId, businessId) ??
    appendBusinessId("/dashboard/businessAdmin/users", businessId);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [menuId, setMenuId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    password: "",
    email: "",
    role: defaultRole,
  });
  const [createdCreds, setCreatedCreds] = useState<{
    name: string;
    email: string;
    password: string;
    emailSent: boolean;
    emailError?: string;
    staff?: StaffAccount;
  } | null>(null);

  const [editTarget, setEditTarget] = useState<StaffAccount | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const [passwordTarget, setPasswordTarget] = useState<StaffAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [emailPassword, setEmailPassword] = useState(true);
  const [shownReset, setShownReset] = useState<{
    name: string;
    email: string;
    password: string;
    emailSent: boolean;
    emailError?: string;
    staff?: StaffAccount;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffAccount | null>(null);

  const roleOptions = useMemo(() => creatableRoles, [creatableRoles]);

  const predictedEmail = useMemo(() => {
    if (!createForm.name.trim()) return "";
    return previewStaffLoginEmail(ownerEmail, createForm.name.trim());
  }, [createForm.name, ownerEmail]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter === "active") {
        if (user.status.toLowerCase() !== "active") return false;
      } else if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }
      if (!query) return true;
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        staffRoleLabel(user.role).toLowerCase().includes(query)
      );
    });
  }, [users, roleFilter, search]);

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
      const result = await createStaff({
        name,
        password,
        role,
        email: createForm.email.trim() || undefined,
      });
      toast.success(`${staffRoleLabel(role)} created successfully.`, { id: toastId });
      setCreatedCreds({
        name,
        email: result.account.email || predictedEmail,
        password: result.temporaryPassword || password,
        emailSent: result.credentialsEmailSent === true,
        emailError: result.credentialsEmailError,
        staff: result.account,
      });
      if (!result.credentialsEmailSent) {
        toast.warning(
          result.credentialsEmailError ||
            "Credentials email was not sent. Copy the login details below.",
        );
      }
      setCreateForm({ name: "", password: "", email: "", role: defaultRole });
      setCreateOpen(false);
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to create staff."), { id: toastId });
    }
  };

  const onEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    const name = editName.trim();
    if (!name) {
      toast.error("Name is required.");
      return;
    }
    const toastId = toast.loading("Updating staff…");
    try {
      await updateStaff(editTarget, {
        name,
        role: family === "restaurant" ? undefined : editRole || editTarget.role,
      });
      toast.success("Staff updated.", { id: toastId });
      setEditTarget(null);
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to update staff."), { id: toastId });
    }
  };

  const onPasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordTarget) return;
    const password = newPassword.trim();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    const toastId = toast.loading("Updating password…");
    try {
      const result = await updatePassword(passwordTarget, password, {
        sendEmail: emailPassword,
      });
      toast.success(
        result?.credentialsEmailSent ? "Password updated and emailed." : "Password updated.",
        { id: toastId },
      );
      setShownReset({
        name: passwordTarget.name,
        email: result?.loginEmail || passwordTarget.email,
        password: result?.temporaryPassword || password,
        emailSent: result?.credentialsEmailSent === true,
        emailError: result?.credentialsEmailError,
        staff: passwordTarget,
      });
      if (result && !result.credentialsEmailSent && emailPassword) {
        toast.warning(
          result.credentialsEmailError ||
            "Password email was not sent. Copy the password from the dialog.",
        );
      }
      setPasswordTarget(null);
      setNewPassword("");
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to update password."), { id: toastId });
    }
  };

  const emailNewStaffPassword = async (staff: StaffAccount) => {
    const toastId = toast.loading("Emailing a new password…");
    try {
      const result = await updatePassword(staff, "", { generate: true, sendEmail: true });
      toast.dismiss(toastId);
      setShownReset({
        name: staff.name,
        email: result?.loginEmail || staff.email,
        password: result?.temporaryPassword || "",
        emailSent: result?.credentialsEmailSent === true,
        emailError: result?.credentialsEmailError,
        staff,
      });
      if (result?.credentialsEmailSent) {
        toast.success("A new password was emailed.");
      } else {
        toast.warning(
          result?.credentialsEmailError ||
            "Password was updated, but the email was not sent. Copy it below.",
        );
      }
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to email a new password."), {
        id: toastId,
      });
    }
  };

  const toggleStatus = async (user: StaffAccount) => {
    const isActive = user.status.toLowerCase() === "active";
    const toastId = toast.loading(isActive ? "Deactivating…" : "Activating…");
    try {
      await setStatus(user, !isActive);
      toast.success(isActive ? "Staff deactivated." : "Staff activated.", { id: toastId });
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to update status."), { id: toastId });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const toastId = toast.loading("Removing staff…");
    try {
      await deleteStaff(deleteTarget);
      toast.success("Staff removed.", { id: toastId });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to remove staff."), { id: toastId });
    }
  };

  const ownerName = business.ownerName || business.businessName || "Owner";

  const filters: { key: RoleFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: users.length },
    ...roleOptions.map((role) => ({
      key: role.key,
      label: role.label,
      count: byRole[role.key] ?? 0,
    })),
    { key: "active", label: "Active", count: activeCount },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef2ff] text-[#4338ca]">
            <Users className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#0f172a]">Staff</h2>
            <p className="mt-0.5 text-sm text-[#64748b]">
              {compact
                ? "Create and manage logins for this business."
                : "People who can sign in to this business."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hidePortalLink ? null : (
          <Link
            href={usersLink}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
          >
            Team page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          )}
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
                Add staff
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add staff</DialogTitle>
                <DialogDescription>
                  Login is the owner email with +staff_name, unless you enter a different address.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={(event) => void onCreateSubmit(event)}>
                <FormField label="Name" required>
                  <input
                    id="software-staff-name"
                    value={createForm.name}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                    className={portalInputClass}
                    placeholder="Full name"
                    autoComplete="off"
                  />
                </FormField>

                <FormField label="Password" required>
                  <input
                    id="software-staff-password"
                    type="password"
                    value={createForm.password}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                    className={portalInputClass}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                </FormField>

                <FormField label="Login email">
                  <input
                    id="software-staff-email"
                    type="email"
                    value={createForm.email}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                    className={portalInputClass}
                    placeholder={predictedEmail || "Leave blank to auto-generate"}
                    autoComplete="off"
                  />
                  {predictedEmail && !createForm.email.trim() ? (
                    <p className="text-xs text-[#64748b]">
                      Will create <span className="font-mono">{predictedEmail}</span>
                    </p>
                  ) : null}
                </FormField>

                <div className="space-y-2">
                  <span className="block text-sm font-semibold text-[#64748b]">Role</span>
                  <div className="flex flex-wrap gap-2">
                    {roleOptions.map((role) => (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => setCreateForm((prev) => ({ ...prev, role: role.key }))}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition",
                          createForm.role === role.key
                            ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                            : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]",
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
                      "Add staff"
                    )}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-3">
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold", avatarTone(ownerName))}>
          {initials(ownerName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#0f172a]">{ownerName}</p>
          <p className="truncate text-xs text-[#64748b]">{ownerEmail}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#334155] ring-1 ring-[#e2e8f0]">
          Owner
        </span>
        {canManageOwner ? (
          <OwnerCredentialsActions
            businessId={businessId}
            ownerName={ownerName}
            ownerEmail={ownerEmail}
            compact
            selfService={role === "business_admin"}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setRoleFilter(filter.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
                roleFilter === filter.key
                  ? "bg-[#0f172a] text-white"
                  : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]",
              )}
            >
              {filter.label}
              <span
                className={cn(
                  "tabular-nums",
                  roleFilter === filter.key ? "text-white/70" : "text-[#94a3b8]",
                )}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:max-w-[16rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search staff"
            className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-[#94a3b8] focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/15"
            aria-label="Search staff"
          />
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-sm text-[#64748b]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
        </div>
      ) : error ? (
        <p className="px-5 py-8 text-sm text-[#dc2626]">{error}</p>
      ) : users.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f1f5f9] text-[#94a3b8]">
            <Users className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-[#0f172a]">No staff yet</p>
          <p className="mt-1 text-sm text-[#64748b]">Add a store manager, cashier, or clerk to get started.</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-secondary)] hover:underline"
            disabled={roleOptions.length === 0}
          >
            <Plus className="h-4 w-4" />
            Add staff
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-[#64748b]">No staff match this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
              <tr>
                <th className="px-5 pb-2 pt-0 font-semibold">Person</th>
                <th className="px-5 pb-2 pt-0 font-semibold">Role</th>
                <th className="px-5 pb-2 pt-0 font-semibold">Status</th>
                <th className="hidden px-5 pb-2 pt-0 font-semibold md:table-cell">Added</th>
                <th className="px-5 pb-2 pt-0 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredUsers.map((user) => {
                const isActive = user.status.toLowerCase() === "active";
                return (
                  <tr key={user.id} className="text-[#334155] hover:bg-[#fafbfc]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold",
                            avatarTone(user.name),
                          )}
                        >
                          {initials(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0f172a]">{user.name}</p>
                          <p className="truncate text-xs text-[#64748b]">{user.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#334155]">
                        {staffRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                          isActive ? "bg-[#ecfdf5] text-[#059669]" : "bg-[#f1f5f9] text-[#64748b]",
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-[#059669]" : "bg-[#94a3b8]")} />
                        {user.status}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3 text-[#64748b] md:table-cell">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <StaffRowMenu
                          user={user}
                          open={menuId === user.id}
                          onOpenChange={(open) => setMenuId(open ? user.id : null)}
                          disabled={actionLoading}
                          onEdit={() => {
                            setMenuId(null);
                            setEditTarget(user);
                            setEditName(user.name);
                            setEditRole(user.role);
                          }}
                          onPassword={() => {
                            setMenuId(null);
                            setPasswordTarget(user);
                            setNewPassword("");
                            setEmailPassword(true);
                          }}
                          onEmailPassword={() => {
                            setMenuId(null);
                            void emailNewStaffPassword(user);
                          }}
                          onToggleStatus={() => {
                            setMenuId(null);
                            void toggleStatus(user);
                          }}
                          onDelete={() => {
                            setMenuId(null);
                            setDeleteTarget(user);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit staff</DialogTitle>
            <DialogDescription>
              Change the display name{family === "restaurant" ? "" : " or role"}.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void onEditSubmit(event)}>
            <FormField label="Name" required>
              <input
                id="edit-staff-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={portalInputClass}
              />
            </FormField>
            {family !== "restaurant" ? (
              <div className="space-y-2">
                <span className="block text-sm font-semibold text-[#64748b]">Role</span>
                <div className="flex flex-wrap gap-2">
                  {roleOptions.map((role) => (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => setEditRole(role.key)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition",
                        editRole === role.key
                          ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                          : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]",
                      )}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <button type="button" className="dn-btn dn-btn-outline h-9 rounded-lg px-3 text-sm" onClick={() => setEditTarget(null)}>
                Cancel
              </button>
              <button type="submit" className="dn-btn dn-btn-primary h-9 rounded-lg px-3 text-sm" disabled={actionLoading}>
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(passwordTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordTarget(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for {passwordTarget?.name}. You can also email it to them.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void onPasswordSubmit(event)}>
            <FormField label="New password" required>
              <input
                id="reset-staff-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={portalInputClass}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm text-[#334155]">
              <input
                type="checkbox"
                checked={emailPassword}
                onChange={(event) => setEmailPassword(event.target.checked)}
              />
              Email this password to the staff login
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="dn-btn dn-btn-outline h-9 rounded-lg px-3 text-sm"
                onClick={() => setPasswordTarget(null)}
              >
                Cancel
              </button>
              <button type="submit" className="dn-btn dn-btn-primary h-9 rounded-lg px-3 text-sm" disabled={actionLoading}>
                Update password
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer be able to sign in. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#dc2626] text-white hover:bg-[#b91c1c]"
              onClick={() => void confirmDelete()}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(createdCreds)} onOpenChange={(open) => !open && setCreatedCreds(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Staff login created</DialogTitle>
            <DialogDescription>
              {createdCreds?.emailSent
                ? "Credentials were emailed to the staff login and the business owner."
                : "Email was not sent. Copy these details and share them manually."}
            </DialogDescription>
          </DialogHeader>
          {createdCreds ? (
            <div className="space-y-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm">
              <p>
                <span className="text-[#64748b]">Name:</span>{" "}
                <span className="font-medium">{createdCreds.name}</span>
              </p>
              <p>
                <span className="text-[#64748b]">Email:</span>{" "}
                <span className="font-mono text-xs">{createdCreds.email}</span>
              </p>
              <p>
                <span className="text-[#64748b]">Password:</span>{" "}
                <span className="font-mono text-xs">{createdCreds.password}</span>
              </p>
              {!createdCreds.emailSent && createdCreds.emailError ? (
                <p className="text-xs text-[#b45309]">{createdCreds.emailError}</p>
              ) : null}
              <button
                type="button"
                className="dn-btn dn-btn-outline inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    `Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`,
                  );
                  toast.success("Credentials copied.");
                }}
              >
                <Copy className="h-4 w-4" />
                Copy credentials
              </button>
              {createdCreds.staff ? (
                <button
                  type="button"
                  className="dn-btn dn-btn-primary inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm"
                  disabled={actionLoading}
                  onClick={() => {
                    const staff = createdCreds.staff;
                    if (!staff) return;
                    void emailNewStaffPassword(staff).then(() => setCreatedCreds(null));
                  }}
                >
                  <Mail className="h-4 w-4" />
                  {createdCreds.emailSent ? "Resend login email" : "Email login details"}
                </button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(shownReset)} onOpenChange={(open) => !open && setShownReset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Staff password updated</DialogTitle>
            <DialogDescription>
              {shownReset?.emailSent
                ? "The new password was emailed. It is shown once here as a backup."
                : "Email was not sent. Copy this password and share it securely."}
            </DialogDescription>
          </DialogHeader>
          {shownReset ? (
            <div className="space-y-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm">
              <p>
                <span className="text-[#64748b]">Name:</span>{" "}
                <span className="font-medium">{shownReset.name}</span>
              </p>
              <p>
                <span className="text-[#64748b]">Email:</span>{" "}
                <span className="font-mono text-xs">{shownReset.email}</span>
              </p>
              {shownReset.password ? (
                <p>
                  <span className="text-[#64748b]">Password:</span>{" "}
                  <span className="font-mono text-xs">{shownReset.password}</span>
                </p>
              ) : null}
              {!shownReset.emailSent && shownReset.emailError ? (
                <p className="text-xs text-[#b45309]">{shownReset.emailError}</p>
              ) : null}
              <button
                type="button"
                className="dn-btn dn-btn-outline inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    `Email: ${shownReset.email}\nPassword: ${shownReset.password}`,
                  );
                  toast.success("Credentials copied.");
                }}
              >
                <Copy className="h-4 w-4" />
                Copy credentials
              </button>
              {shownReset.staff ? (
                <button
                  type="button"
                  className="dn-btn dn-btn-primary inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm"
                  disabled={actionLoading}
                  onClick={() => {
                    const staff = shownReset.staff;
                    if (!staff) return;
                    void emailNewStaffPassword(staff);
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Resend login email
                </button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function StaffRowMenu({
  user,
  open,
  onOpenChange,
  disabled,
  onEdit,
  onPassword,
  onEmailPassword,
  onToggleStatus,
  onDelete,
}: {
  user: StaffAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
  onEdit: () => void;
  onPassword: () => void;
  onEmailPassword: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isActive = user.status.toLowerCase() === "active";

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="grid h-8 w-8 place-items-center rounded-lg text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]"
        aria-label={`Actions for ${user.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#334155] hover:bg-[#f8fafc]"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#334155] hover:bg-[#f8fafc]"
            onClick={onPassword}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Reset password
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#334155] hover:bg-[#f8fafc]"
            onClick={onEmailPassword}
          >
            <Mail className="h-3.5 w-3.5" />
            Email new password
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#334155] hover:bg-[#f8fafc]"
            onClick={onToggleStatus}
          >
            {isActive ? <UserMinus className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
            {isActive ? "Deactivate" : "Activate"}
          </button>
          <div className="my-1 h-px bg-[#f1f5f9]" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#dc2626] hover:bg-[#fef2f2]"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}
