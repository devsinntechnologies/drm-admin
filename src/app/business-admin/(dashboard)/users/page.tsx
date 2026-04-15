"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  ChefHat,
  X,
} from "lucide-react";

type Role = "super-admin" | "admin" | "waiter" | "kitchen";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  joined: string;
  active: boolean;
};

const initialUsers: User[] = [
  {
    id: 1,
    name: "Super Admin",
    email: "superadmin@devsim.com",
    phone: "+1234567890",
    role: "super-admin",
    joined: "12/31/2022",
    active: true,
  },
  {
    id: 2,
    name: "Admin User",
    email: "admin@devsim.com",
    phone: "+1234567890",
    role: "admin",
    joined: "12/31/2023",
    active: true,
  },
  {
    id: 3,
    name: "John Waiter",
    email: "waiter@devsim.com",
    phone: "+12345678901",
    role: "waiter",
    joined: "09/30/2024",
    active: true,
  },
  {
    id: 4,
    name: "Chef Mike",
    email: "kitchen@devsim.com",
    phone: "+12345678902",
    role: "kitchen",
    joined: "01/01/2024",
    active: true,
  },
];

const roleBadge: Record<Role, string> = {
  "super-admin": "bg-[#3b82f6] text-white",
  admin: "bg-[#3b82f6] text-white",
  waiter: "bg-[#00c853] text-white",
  kitchen: "bg-[#7c3aed] text-white",
};

const avatarBg: Record<Role, string> = {
  "super-admin": "bg-[#3b82f6]",
  admin: "bg-[#3b82f6]",
  waiter: "bg-[#3b82f6]",
  kitchen: "bg-[#7c3aed]",
};

const avatarIcon: Record<Role, React.ReactNode> = {
  "super-admin": <Users className="w-5 h-5 text-white" />,
  admin: <ChefHat className="w-5 h-5 text-white" />,
  waiter: <Users className="w-5 h-5 text-white" />,
  kitchen: <ChefHat className="w-5 h-5 text-white" />,
};

type FilterType = "All" | "Waiters" | "Kitchen";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");

  const waiters = users.filter((u) => u.role === "waiter").length;
  const kitchen = users.filter((u) => u.role === "kitchen").length;
  const active = users.filter((u) => u.active).length;
  const total = users.length;

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ||
      (filter === "Waiters" && u.role === "waiter") ||
      (filter === "Kitchen" && u.role === "kitchen");
    return matchSearch && matchFilter;
  });

  const deactivate = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    );
  };

  const deleteUser = (id: number) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const filterTabs: FilterType[] = ["All", "Waiters", "Kitchen"];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#eef2ff] rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <div>
            <h2 className="font-bold text-[18px] text-gray-800 tracking-tight leading-tight">
              Team
            </h2>
            <p className="text-[13px] text-gray-400 font-medium">Manage staff</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-[14px] font-bold shadow-sm shadow-blue-200 transition-all hover:shadow-md hover:-translate-y-0.5">
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waiters */}
        <div className="bg-[#eef2ff] rounded-2xl p-4 flex items-center gap-3 border border-blue-100">
          <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Waiters</p>
            <p className="text-[28px] font-extrabold text-gray-800 leading-tight">{waiters}</p>
          </div>
        </div>

        {/* Kitchen */}
        <div className="bg-[#fdf4ff] rounded-2xl p-4 flex items-center gap-3 border border-purple-100">
          <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Kitchen</p>
            <p className="text-[28px] font-extrabold text-gray-800 leading-tight">{kitchen}</p>
          </div>
        </div>

        {/* Active */}
        <div className="bg-[#f0fdf4] rounded-2xl p-4 flex items-center gap-3 border border-green-100">
          <div className="w-10 h-10 bg-[#00c853] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Active</p>
            <p className="text-[28px] font-extrabold text-gray-800 leading-tight">{active}</p>
          </div>
        </div>

        {/* Total */}
        <div className="bg-[#eef2ff] rounded-2xl p-4 flex items-center gap-3 border border-blue-100">
          <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-[28px] font-extrabold text-gray-800 leading-tight">{total}</p>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-full md:w-[480px] shadow-sm hover:border-gray-300 focus-within:border-[#3b82f6] focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <Search className="w-[15px] h-[15px] text-gray-400 flex-shrink-0" strokeWidth={2.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="outline-none text-[13px] text-gray-700 w-full bg-transparent placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {filterTabs.map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#3b82f6] text-white shadow-sm"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {tab === "Waiters" && <Users className="w-3 h-3" />}
                {tab === "Kitchen" && <ChefHat className="w-3 h-3" />}
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Grid — 2 columns */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-10">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-5">
                {/* Top Row: Avatar + Name + Badges */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div className={`w-12 h-12 ${avatarBg[user.role]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {avatarIcon[user.role]}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[16px] text-gray-800 leading-tight">
                      {user.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${roleBadge[user.role]}`}>
                        {user.role}
                      </span>
                      {user.active && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#00c853] text-white">
                          active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-[13px] text-gray-600 truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-[13px] text-gray-600">{user.phone}</span>
                  </div>
                  <p className="text-[12px] text-gray-400 pl-0.5">Joined: {user.joined}</p>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  {/* Deactivate */}
                  <button
                    onClick={() => deactivate(user.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-[13px] py-2.5 rounded-xl border border-gray-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    {user.active ? "Deactivate" : "Activate"}
                  </button>
                  {/* Edit */}
                  <button className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-[#eef2ff] text-gray-400 hover:text-[#3b82f6] rounded-xl border border-gray-200 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-[#fff5f5] text-gray-400 hover:text-[#ff3b30] rounded-xl border border-gray-200 hover:border-[#ffcdd2] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No users found.</p>
        </div>
      )}
    </div>
  );
}
