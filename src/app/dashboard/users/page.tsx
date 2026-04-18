"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { useUsers, type UserRole } from "@/hooks/useUsers";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";

function formatJoinedDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
}

const getRoleIcon = (
  role: UserRole
): { bg: string; icon: string; color: string } => {
  switch (role) {
    case "waiter":
      return {
        bg: "bg-blue-100",
        icon: "👨‍💼",
        color: "text-blue-600",
      };
    case "kitchen":
      return {
        bg: "bg-purple-100",
        icon: "👨‍🍳",
        color: "text-purple-600",
      };
    default:
      return {
        bg: "bg-gray-100",
        icon: "👤",
        color: "text-gray-600",
      };
  }
};

export default function UsersPage() {
  const router = useRouter();
  const { role, isAuthenticated } = useAuth();
  const { users, waiters, kitchens, loading, error, actionLoading, createUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    password: "",
    role: "waiter" as UserRole,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    if (role && role !== "business_admin") {
      router.replace("/dashboard");
      return;
    }
  }, [isAuthenticated, role, router]);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (selectedRole !== "all") {
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

  const businessId = typeof window !== "undefined" ? window.localStorage.getItem("businessId") : null;

  const onCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = createForm.name.trim();
    const password = createForm.password.trim();

    if (!name || !password) {
      toast.error("Name and password are required.");
      return;
    }

    if (createForm.role === "waiter" && !businessId) {
      toast.error("Business ID is missing in local storage. Please login again.");
      return;
    }

    try {
      await createUser({
        name,
        password,
        role: createForm.role,
      });

      toast.success(`${createForm.role === "waiter" ? "Waiter" : "Kitchen"} created successfully.`);
      setCreateForm({
        name: "",
        password: "",
        role: "waiter",
      });
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.");
    }
  };

  const stats = [
    {
      label: "Waiters",
      value: waiters.length,
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      icon: "👨‍💼",
    },
    {
      label: "Kitchen",
      value: kitchens.length,
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      icon: "👨‍🍳",
    },
    {
      label: "Active",
      value: users.filter((u) => u.status.toLowerCase() === "active").length,
      bg: "bg-gradient-to-br from-green-50 to-green-100",
      icon: "✓",
    },
    {
      label: "Total",
      value: users.length,
      bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      icon: "👥",
    },
  ];

  return (
    <AdminShell activeTab="users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Team</h1>
            <p className="text-sm text-slate-600">Manage staff</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
                <Plus className="h-4 w-4" />
                Add
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>Create a waiter or kitchen account.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={onCreateSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="role">Role</label>
                  <select
                    id="role"
                    value={createForm.role}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
                    className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                  >
                    <option value="waiter">Waiter</option>
                    <option value="kitchen">Kitchen</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="name">Name</label>
                  <input
                    id="name"
                    value={createForm.name}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
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
                    className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                    placeholder="Enter password"
                  />
                </div>

                {createForm.role === "waiter" ? (
                  <p className="rounded-lg border border-[#dbe3ef] bg-[#f8fafc] px-3 py-2 text-xs text-[#475569]">
                    Business ID source: localStorage.businessId {businessId ? "(available)" : "(missing)"}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {actionLoading ? "Creating..." : "Create User"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-lg border border-gray-200 p-4`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
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

          {/* Role Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setSelectedRole("all")}
              className={`px-4 py-3 text-sm font-medium transition ${
                selectedRole === "all"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedRole("waiter")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                selectedRole === "waiter"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              👨‍💼 Waiters
            </button>
            <button
              onClick={() => setSelectedRole("kitchen")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                selectedRole === "kitchen"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              👨‍🍳 Kitchen
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
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
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
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          user.role === "waiter"
                            ? "bg-blue-100 text-blue-800"
                            : user.role === "kitchen"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {isActive ? "active" : user.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      ✉️ {user.email}
                    </p>
                    <p className="text-sm text-slate-600">
                      🏢 {user.businessName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Joined: {formatJoinedDate(user.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 border-t border-slate-200 pt-4">
                  <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100">
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
    </AdminShell>
  );
}
