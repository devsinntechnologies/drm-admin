"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { useUsers, type UserRole } from "@/hooks/useUsers";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit, Loader2, Plus, Search, Trash2, Users, User, UtensilsCrossed, X } from "lucide-react";
import { normalizeErrorMessage } from "@/lib/utils";

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
  switch (role) {
    case "waiter":
      return {
        bg: "bg-blue-100",
        icon: <Users className="h-6 w-6 text-blue-600" />,
        color: "text-blue-600",
      };
    case "kitchen":
      return {
        bg: "bg-purple-100",
        icon: <Users className="h-6 w-6 text-purple-600" />,
        color: "text-purple-600",
      };
    default:
      return {
        bg: "bg-gray-100",
        icon: <Users className="h-6 w-6 text-gray-600" />,
        color: "text-gray-600",
      };
  }
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
  const [editUser, setEditUser] = useState<{ id: string; role: UserRole; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

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
      const isBusinessRole = role === "business_admin";
      const isSuperAdminImpersonating = role === "super_admin" && !!impersonatedBusinessId;

      if (!isBusinessRole && !isSuperAdminImpersonating) {
        router.replace("/dashboard");
        return;
      }
    }
  }, [isAuthenticated, role, router, impersonatedBusinessId]);

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
      await createUser({
        name,
        password,
        role: createForm.role,
      });

      toast.success(`${createForm.role === "waiter" ? "Waiter" : "Kitchen"} created successfully.`, { id: toastId });
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
      await updatePassword(editUser, newPassword.trim());
      toast.success("Password updated successfully.", { id: toastId });
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
    {
      label: "Waiters",
      value: waiters.length,
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      icon: "waiter",
    },
    {
      label: "Kitchen",
      value: kitchens.length,
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      icon: "kitchen",
    },
    {
      label: "Active",
      value: users.filter((u) => u.status.toLowerCase() === "active").length,
      bg: "bg-gradient-to-br from-green-50 to-green-100",
      icon: "active",
    },
    {
      label: "Total",
      value: users.length,
      bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      icon: "total",
    },
  ];

  return (
    <AdminShell activeTab="users">
      <div className="space-y-6">
        {/* Header - card style like screenshot */}
        <div className="rounded-2xl border border-[#f3f3f3] bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-[#ef4444] flex items-center justify-center text-white shadow text-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#111827]">Team</h1>
              <p className="text-sm text-[#6b7280]">Manage Staff</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex rounded-lg bg-[#ef4444] px-4 py-2 gap-1 text-lg font-extrabold text-white shadow-sm hover:bg-[#dc2626] transition">
                  <Plus className="h-6 w-6" />
                  Add
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Update user details and roles</DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={onCreateSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="name">Name</label>
                    <input
                      id="name"
                      value={createForm.name}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full rounded-xl border border-[#e0e0e0] px-4 py-3 text-sm outline-none focus:border-[#ef4444] bg-[#f8f8f8]"
                      placeholder="Enter name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      value={createForm.password}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                      className="w-full rounded-xl border border-[#e0e0e0] px-4 py-3 text-sm outline-none focus:border-[#ef4444] bg-[#f8f8f8]"
                      placeholder="Enter password"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="category">Category</label>
                    <select
                      id="category"
                      value={createForm.role}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
                      className="w-full rounded-xl border border-[#e0e0e0] px-4 py-3 text-sm outline-none focus:border-[#ef4444] bg-[#f8f8f8]"
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
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#ef4444] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#dc2626] disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Save
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#ef4444] p-4 bg-[#eff8ff]">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#ef4444] flex items-center justify-center text-white text-lg">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-500">Waiters</p>
                <p className="mt-2 text-2xl font-extrabold text-[#111827]">{waiters.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ef4444] p-4 bg-[#fff5fb]">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#ef4444] flex items-center justify-center text-white text-lg">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-500">Kitchen</p>
                <p className="mt-2 text-2xl font-extrabold text-[#111827]">{kitchens.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ef4444] p-4 bg-[#fff6f6]">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#ef4444] flex items-center justify-center text-white text-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-500">Total</p>
                <p className="mt-2 text-2xl font-extrabold text-[#111827]">{users.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Role Tabs (pills) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedRole("waiter")}
              className={`px-4 py-2 text-sm font-extrabold rounded-md transition ${selectedRole === "waiter" ? "bg-[#ef4444] text-[#ffffff]" : "bg-white border border-[#e1e3e6] text-[#4a4a4a] "}`}
            >
              Waiters
            </button>
            <button
              onClick={() => setSelectedRole("kitchen")}
              className={`px-4 py-2 text-sm font-extrabold rounded-md transition ${selectedRole === "kitchen" ? "bg-[#ef4444] text-[#ffffff] border border-gray-200" : "bg-white border border-[#e1e3e6] text-[#4a4a4a] "}`}
            >
              Kitchen
            </button>
          </div>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading team members...
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{normalizeErrorMessage(error, "Error loading users")}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredUsers.map((user) => {
            const roleInfo = getRoleIcon(user.role);
            const isActive = user.status.toLowerCase() === "active";

            return (
              <div
                key={user.id}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`${roleInfo.bg} flex h-12 w-12 items-center justify-center rounded-lg text-lg`}
                  >
                    {roleInfo.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {user.name}
                      </h3>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${user.role === "waiter"
                          ? "bg-blue-100 text-blue-800"
                          : user.role === "kitchen"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {user.role}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {isActive ? "active" : user.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
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

                <div className="mt-4 flex items-center gap-3 border-t border-slate-200 pt-4">
                  <button
                    onClick={() => setDeactivateTarget({ id: user.id, role: user.role, name: user.name, status: user.status })}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm font-extrabold text-[#111827] hover:bg-[#fafafa]"
                  >
                    {isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => { setEditUser({ id: user.id, role: user.role, name: user.name }); setNewPassword(""); }}
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
      </div>

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
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" />
        </div>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
