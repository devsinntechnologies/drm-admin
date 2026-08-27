"use client";

import Link from "next/link";
import { KeyRound, Loader2, Mail, UserCog, Users, UtensilsCrossed } from "lucide-react";
import { PortalStatCard } from "@/components/admin/PortalPage";
import type { BusinessRecord } from "@/hooks/useBusiness";
import { useUsers } from "@/hooks/useUsers";
import { appendBusinessId } from "@/lib/module-routes";
import { cn } from "@/lib/utils";

type SoftwareStaffOverviewProps = {
  businessId: string;
  business: BusinessRecord;
  manageUsersHref?: string;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export function SoftwareStaffOverview({
  businessId,
  business,
  manageUsersHref,
}: SoftwareStaffOverviewProps) {
  const { users, waiters, kitchens, loading, error } = useUsers(businessId);
  const activeCount = users.filter((user) => user.status.toLowerCase() === "active").length;
  const usersLink =
    manageUsersHref ?? appendBusinessId("/dashboard/businessAdmin/users", businessId);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">Mobile app logins</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Owner and staff accounts that can sign in to the Flutter app for {business.businessName}.
            </p>
          </div>
          <Link
            href={usersLink}
            className="dn-btn dn-btn-outline inline-flex h-9 items-center rounded-lg px-3 text-sm"
          >
            Manage users in portal
          </Link>
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
                  Owner password is sent by email when the business is created. Staff passwords are set when you add
                  waiters or kitchen users in the portal.
                </p>
                <p className="mt-2 text-xs text-[#64748b]">
                  Passwords are not stored in plain text — reset them from the Users page if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PortalStatCard label="Waiters" value={waiters.length} icon={Users} tone="primary" />
        <PortalStatCard label="Kitchen" value={kitchens.length} icon={UtensilsCrossed} tone="secondary" />
        <PortalStatCard label="Active staff" value={activeCount} icon={Users} tone="accent" />
        <PortalStatCard label="Total mobile users" value={users.length + 1} icon={Users} tone="neutral" />
      </div>

      <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
        <div className="border-b border-[#e2e8f0] px-5 py-4">
          <h3 className="text-sm font-semibold text-[#0f172a]">Staff accounts</h3>
          <p className="text-sm text-[#64748b]">Waiter and kitchen logins for the mobile app (owner shown above).</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#64748b]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
          </div>
        ) : error ? (
          <p className="px-5 py-8 text-sm text-[#dc2626]">{error}</p>
        ) : users.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-[#64748b]">No waiter or kitchen users yet.</p>
            <Link href={usersLink} className="mt-3 inline-flex text-sm font-semibold text-[var(--brand-secondary)] hover:underline">
              Create staff in portal
            </Link>
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
                    <td className="px-5 py-3 font-mono text-xs">{user.email}</td>
                    <td className="px-5 py-3 capitalize">{user.role}</td>
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
