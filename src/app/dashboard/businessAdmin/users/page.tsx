"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalStatCard } from "@/components/admin/PortalPage";
import { useAuth } from "@/hooks/useAuth";
import { useUsers, type UserRole } from "@/hooks/useUsers";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit, Loader2, Mail, Plus, Search, Trash2, Users, UtensilsCrossed, X } from "lucide-react";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { PharmacyStaffPanel } from "@/components/pharmacy/PharmacyStaffPanel";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { normalizeErrorMessage } from "@/lib/utils";
import { asCredentialsResult } from "@/lib/credentials-result";

function formatJoinedDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
}

const getRoleIcon = (
  role: UserRole
): { bg: string; icon: React.ReactNode; color: string } => {
  return {
    bg: "bg-[#001840]",
    icon: role === "kitchen" ? <UtensilsCrossed className="h-6 w-6 text-[#ffffff]" /> : <Users className="h-6 w-6 text-[#ffffff]" />,
    color: "text-[#0050F8]",
  };
};

function UsersContent() {
  const router = useRouter();
  const { role, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const {
    users,
    waiters,
    kitchens,
    loading,
    error,
    actionLoading,
    createUser,
    updatePassword,
    updateUserStatus,
    deleteUser,
  } = useUsers();
  const activeBusinessId = useActiveBusinessId();
  const { templateConfig } = useBusinessTemplate();
  const isPharmacy = templateConfig?.industryId === "pharmacy";
  const impersonatedBusinessId = searchParams.get("businessId");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "waiters">("waiter");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    password: "",
    role: "waiter" as UserRole,
  });

  // Edit password state
  const [editUser, setEditUser] = useState<{ id: string; role: UserRole; name: string; email?: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [emailPassword, setEmailPassword] = useState(true);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; role: UserRole; name: string } | null>(null);

  // Deactivate state
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; role: UserRole; name: string; status: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    if (role) {
      const isSuperAdminImpersonating = role === "super_admin" && !!impersonatedBusinessId;
      const staffModule = isPharmacy ? "staff" : "users";
      if (!canAccessWorkspacePage(role, staffModule) && !isSuperAdminImpersonating && role !== "business_admin") {
        router.replace("/dashboard");
        return;
      }
    }
      }, [isAuthenticated, role, router, impersonatedBusinessId, isPharmacy]);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (selectedRole !== "waiters") {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [searchTerm, selectedRole, users]);

  const onCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = createForm.name.trim();
    const password = createForm.password.trim();

    if (!name || !password) {
      toast.error("Name and password are required.");
      return;
    }

    if (!activeBusinessId) {
      toast.error("Business ID not found. Please ensure a business is selected.");
      return;
    }

    const toastId = toast.loading("Creating user...");
    try {
      const created = await createUser({
        name,
        password,
        role: createForm.role,
      });
      const creds = asCredentialsResult(created);
      toast.success(`${createForm.role === "waiter" ? "Waiter" : "Kitchen"} created successfully.`, { id: toastId });
      if (!creds?.credentialsEmailSent) {
        toast.warning(
          creds?.credentialsEmailError ||
            "Login email was not sent. Share the password you entered with the staff member.",
        );
      }
      setCreateForm({
        name: "",
        password: "",
        role: "waiter",
      });
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.", { id: toastId });
    }
  };

  const onEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editUser || !newPassword.trim()) {
      toast.error("New password is required.");
      return;
    }
    const toastId = toast.loading("Updating password...");
    try {
      const result = await updatePassword(editUser, newPassword.trim(), {
        sendEmail: emailPassword,
      });
      toast.success(
        result?.credentialsEmailSent ? "Password updated and emailed." : "Password updated successfully.",
        { id: toastId },
      );
      if (emailPassword && result && !result.credentialsEmailSent) {
        toast.warning(
          result.credentialsEmailError ||
            `Email was not sent. Password: ${result.temporaryPassword || newPassword.trim()}`,
        );
      }
      setEditUser(null);
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.", { id: toastId });
    }
  };

  const onDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const toastId = toast.loading("Deleting user...");
    try {
      await deleteUser(deleteTarget);
      toast.success(`${deleteTarget.name} deleted successfully.`, { id: toastId });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user.", { id: toastId });
    }
  };

  const onToggleStatusConfirm = async () => {
    if (!deactivateTarget) return;

    const isActive = deactivateTarget.status.toLowerCase() === "active";
    const nextStatus = isActive ? "inactive" : "active";
    const actionLabel = isActive ? "Deactivating" : "Activating";

    const toastId = toast.loading(`${actionLabel} user...`);
    try {
      await updateUserStatus(deactivateTarget, nextStatus);
      toast.success(`${deactivateTarget.name} is now ${nextStatus}.`, { id: toastId });
      setDeactivateTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user status.", { id: toastId });
    }
  };


  const stats = [
    { label: "Waiters", value: waiters.length, icon: Users, tone: "primary" as const },
    { label: "Kitchen Staff", value: kitchens.length, icon: UtensilsCrossed, tone: "secondary" as const },
    { label: "Active", value: users.filter((u) => u.status.toLowerCase() === "active").length, icon: Users, tone: "accent" as const },
    { label: "Total", value: users.length, icon: Users, tone: "neutral" as const },
  ];

  if (isPharmacy) {
    return (
      <AdminShell
        activeTab="staff"
        pageTitle="Staff"
        pageSubtitle="Pharmacist, cashier, manager, shift, and inventory logins"
        headerIcon={Users}
      >
        <PortalPage>
          <PharmacyStaffPanel />
        </PortalPage>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeTab="users" pageTitle="Team" pageSubtitle="Waiters and kitchen staff" headerIcon={Users}>
      <PortalPage>
        <div className="mb-6 flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <button type="button" className="dn-btn dn-btn-primary">
                  <Plus className="h-5 w-5" /> Add Member
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Update user details and roles</DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={onCreateSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="name">Name <span className="text-[#dc2626]">*</span></label>
                    <input
                      id="name"
                      value={createForm.name}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full rounded-xl border border-[#e0e0e0] px-4 py-3 text-sm outline-none focus:border-[#001840] bg-[#f8f8f8]"
                      placeholder="Enter name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="password">Password <span className="text-[#dc2626]">*</span></label>
                    <input
                      id="password"
                      type="password"
                      value={createForm.password}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                      className="w-full rounded-xl border border-[#e0e0e0] px-4 py-3 text-sm outline-none focus:border-[#001840] bg-[#f8f8f8]"
                      placeholder="Enter password"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="category">Role <span className="text-[#dc2626]">*</span></label>
                    <select
                      id="category"
                      value={createForm.role}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
                      className="w-full rounded-xl border border-[#e0e0e0] px-4 py-3 text-sm outline-none focus:border-[#001840] bg-[#f8f8f8]"
                    >
                      <option value="waiter">Waiter</option>
                      <option value="kitchen">Kitchen</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setCreateOpen(false)}
                      className="flex-1 rounded-xl border border-[#e0e0e0] bg-white px-4 py-3 text-sm font-medium text-[#111827] hover:bg-[#f8f8f8]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#001840] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#00122E] disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Save
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <PortalStatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} />
          ))}
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <label className="relative block space-y-1.5">
            <span className="block text-sm font-semibold text-[#64748b]">Search</span>
            <span className="relative block">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 shadow-sm transition focus:border-[#0050F8] focus:outline-none focus:ring-1 focus:ring-[#0050F8]"
              />
            </span>
          </label>

          {/* Role Tabs (pills) */}
          <div className="dn-tab-bar !w-auto">
            <button
              type="button"
              onClick={() => setSelectedRole("waiter")}
              data-active={selectedRole === "waiter" ? "true" : "false"}
              className="dn-tab"
            >
              Waiters
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("kitchen")}
              data-active={selectedRole === "kitchen" ? "true" : "false"}
              className="dn-tab"
            >
              Kitchen
            </button>
          </div>
        </div>

        {/* Users Grid */}
        {loading ? (
          <Loading size="sm" label="Loading team members..." />
        ) : null}

        {!loading && error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{normalizeErrorMessage(error, "Error loading users")}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredUsers.map((user) => {
            const roleInfo = getRoleIcon(user.role);
            const isActive = user.status.toLowerCase() === "active";

            return (
              <div
                key={user.id}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`${roleInfo.bg} flex h-14 w-14 items-center justify-center rounded-2xl text-lg shadow-lg shadow-red-100 shrink-0`}
                  >
                    {roleInfo.icon}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-[20px] leading-tight font-black text-[#111827] mb-2">
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-xl px-3 py-1 text-[13px] font-bold lowercase bg-[#001840] text-[#ffffff]">
                        {user.role}
                      </span>
                      <span className={`inline-flex items-center rounded-xl px-3 py-1 text-[13px] font-bold lowercase ${isActive ? "bg-[#00c853] text-[#ffffff]" : "bg-gray-200 text-gray-700"}`}>
                        {isActive ? "active" : user.status}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-500 font-medium truncate">
                      {user.email}
                    </p>
                    {/* <p className="text-sm text-slate-600">
                      {user.businessName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Joined: {formatJoinedDate(user.createdAt)}
                    </p> */}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 border-t border-slate-200 pt-3">
                  <button
                    onClick={() => setDeactivateTarget({ id: user.id, role: user.role, name: user.name, status: user.status })}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm font-extrabold text-[#111827] hover:bg-[#fafafa]"
                  >
                    {isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => { setEditUser({ id: user.id, role: user.role, name: user.name, email: user.email }); setNewPassword(""); setEmailPassword(true); }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: user.id, role: user.role, name: user.name })}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && filteredUsers.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 py-12 text-center">
            <p className="text-slate-600">No team members found</p>
          </div>
        )}
      </PortalPage>

      {/* Edit Password Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update password for <strong>{editUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onEditSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#111827]" htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                placeholder="Enter new password"
                autoFocus
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#334155]">
              <input
                type="checkbox"
                checked={emailPassword}
                onChange={(e) => setEmailPassword(e.target.checked)}
              />
              Email this password to the staff login
            </label>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                if (!editUser) return;
                void (async () => {
                  const toastId = toast.loading("Emailing a new password…");
                  try {
                    const result = await updatePassword(editUser, "", {
                      generate: true,
                      sendEmail: true,
                    });
                    if (result?.credentialsEmailSent) {
                      toast.success("A new password was emailed.", { id: toastId });
                    } else {
                      toast.warning(
                        result?.credentialsEmailError ||
                          `Password updated. Copy it: ${result?.temporaryPassword || ""}`,
                        { id: toastId },
                      );
                    }
                    setEditUser(null);
                    setNewPassword("");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to email password.", {
                      id: toastId,
                    });
                  }
                })();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dbe3ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] disabled:opacity-60"
            >
              <Mail className="h-4 w-4" />
              Email a new random password
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f04343] px-4 py-2.5 text-sm font-semibold text-[#ffffff] disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {actionLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={!!deactivateTarget} onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}>
        <DialogContent>
          <button
            type="button"
            onClick={() => setDeactivateTarget(null)}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[#ef4444] text-[#ffffff] shadow-sm transition hover:bg-[#dc2626]"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
          <DialogHeader>
            <DialogTitle>{deactivateTarget?.status?.toLowerCase() === "active" ? "Deactivate User" : "Activate User"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {deactivateTarget?.status?.toLowerCase() === "active" ? "deactivate" : "activate"} <strong>{deactivateTarget?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeactivateTarget(null)}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={onToggleStatusConfirm}
              disabled={actionLoading}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#ffffff] disabled:opacity-60 ${deactivateTarget?.status?.toLowerCase() === "active" ? "bg-[#ef4444] hover:bg-[#dc2626]" : "bg-[#16a34a] hover:bg-[#15803d]"}`}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {actionLoading
                ? deactivateTarget?.status?.toLowerCase() === "active"
                  ? "Deactivating..."
                  : "Activating..."
                : deactivateTarget?.status?.toLowerCase() === "active"
                  ? "Deactivate"
                  : "Activate"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={onDeleteConfirm}
              disabled={actionLoading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-red-700 disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {actionLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </AdminShell>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={<Loading fullScreen />}
    >
      <UsersContent />
    </Suspense>
  );
}
