"use client";

import { useMemo, useState } from "react";
import { Briefcase, Clock, Loader2, Package, Plus, Search, ShoppingCart, Stethoscope, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { portalInputClass, PortalStatCard } from "@/components/admin/PortalPage";
import { DataTable, StatusBadge } from "@/components/workspace/DataTable";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";
import { PHARMACY_STAFF_ROLES, type PharmacyStaffRole } from "@/lib/pharmacy-role-nav";

type StaffFilter = "all" | PharmacyStaffRole;

type PharmacyStaffRow = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  licenseNumber?: string;
  status?: string;
};

const ROLE_LABEL: Record<PharmacyStaffRole, string> = {
  pharmacy_manager: "Pharmacy manager",
  pharmacist: "Pharmacist",
  cashier: "Cashier",
  shift_incharge: "Shift incharge",
  inventory_manager: "Inventory manager",
};

function roleLabel(role?: string) {
  if (role && role in ROLE_LABEL) return ROLE_LABEL[role as PharmacyStaffRole];
  return role || "Staff";
}

export function PharmacyStaffPanel() {
  const { role } = useAuth();
  const { market } = usePharmacyMarket();
  const { token, businessId, pending, run } = usePharmacyAction();
  const canManage = role === "business_admin" || role === "super_admin" || role === "pharmacy_manager";
  const { rows, loading, error, reload } = usePharmacyQuery<PharmacyStaffRow[]>("/pharmacy/staff");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<StaffFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "pharmacist" as PharmacyStaffRole,
    licenseNumber: "",
  });

  const staff = rows as PharmacyStaffRow[];

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return staff.filter((row) => {
      const roleMatch = selectedRole === "all" || row.role === selectedRole;
      const searchMatch =
        !query ||
        row.name?.toLowerCase().includes(query) ||
        row.email?.toLowerCase().includes(query);
      return roleMatch && searchMatch;
    });
  }, [searchTerm, selectedRole, staff]);

  const stats = [
    { label: "Managers", value: staff.filter((row) => row.role === "pharmacy_manager").length, icon: Briefcase, tone: "primary" as const },
    { label: "Pharmacists", value: staff.filter((row) => row.role === "pharmacist").length, icon: Stethoscope, tone: "secondary" as const },
    { label: "Cashiers", value: staff.filter((row) => row.role === "cashier").length, icon: ShoppingCart, tone: "accent" as const },
    { label: "Shift leads", value: staff.filter((row) => row.role === "shift_incharge").length, icon: Clock, tone: "neutral" as const },
    { label: "Inventory", value: staff.filter((row) => row.role === "inventory_manager").length, icon: Package, tone: "primary" as const },
    { label: "Total", value: staff.length, icon: Users, tone: "neutral" as const },
  ];

  return (
    <div className="space-y-6">
      {canManage ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
            <Plus className="h-4 w-4" /> Add member
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <PortalStatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} />
        ))}
      </div>

      {createOpen && canManage ? (
        <form
          className="grid gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            run(async () => {
              const created = await apiClient.post<{ email?: string; name?: string }>("/pharmacy/staff", {
                ...form,
                email: form.email.trim() || undefined,
              }, token, businessId);
              toast.success(`Login: ${created?.email || form.email || "see Staff list"}`);
              setForm({ name: "", email: "", password: "", role: "pharmacist", licenseNumber: "" });
              setCreateOpen(false);
              reload();
            });
          }}
        >
          <input className={portalInputClass} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={portalInputClass} type="email" placeholder="Login email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={portalInputClass} type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <select className={portalInputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as PharmacyStaffRole })}>
            {PHARMACY_STAFF_ROLES.map((role) => (
              <option key={role} value={role}>{ROLE_LABEL[role]}</option>
            ))}
          </select>
          <input className={portalInputClass} placeholder={market.staffLicenseLabel} value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
          <Button type="submit" disabled={pending} className="sm:col-span-2 lg:col-span-1">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </form>
      ) : null}

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${portalInputClass} pl-10`}
          />
        </div>
        <div className="dn-tab-bar !w-auto overflow-x-auto">
          {([
            ["all", "All"],
            ["pharmacy_manager", "Manager"],
            ["pharmacist", "Pharmacist"],
            ["cashier", "Cashier"],
            ["shift_incharge", "Shift"],
            ["inventory_manager", "Inventory"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedRole(value)}
              data-active={selectedRole === value ? "true" : "false"}
              className="dn-tab shrink-0"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}
      {loading ? <p className="text-sm text-[var(--text-muted)]">Loading team members…</p> : null}

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "license", label: market.staffLicenseLabel },
          { key: "status", label: "Status" },
          { key: "actions", label: "" },
        ]}
        rows={filtered.map((row) => ({
          name: row.name,
          email: row.email || "—",
          role: roleLabel(row.role),
          license: row.licenseNumber || "—",
          status: <StatusBadge value={row.status || "inactive"} tone={row.status === "active" ? "success" : "neutral"} />,
          actions: canManage ? (
            <button
              type="button"
              className="text-sm font-semibold text-[var(--brand-secondary)]"
              onClick={() =>
                run(async () => {
                  await apiClient.patch(`/pharmacy/staff/${row.id}/status`, { isActive: row.status !== "active" }, token, businessId);
                  toast.success(row.status === "active" ? "Deactivated" : "Activated");
                  reload();
                })
              }
            >
              {row.status === "active" ? "Deactivate" : "Activate"}
            </button>
          ) : (
            "—"
          ),
        }))}
        empty={<p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] py-12 text-center text-[var(--text-muted)]">No pharmacy staff found</p>}
      />
    </div>
  );
}
