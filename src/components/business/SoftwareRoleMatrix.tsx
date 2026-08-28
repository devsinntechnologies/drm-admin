"use client";

import { ChefHat, Package, Shield, UserRound } from "lucide-react";
import {
  roleKeyLabel,
  type RoleAccessMap,
  type SoftwareRoleKey,
} from "@/lib/role-access";
import { resolveRoleEntry } from "@/lib/software-role-defaults";
import {
  getMobileReadiness,
  mobileReadinessLabel,
  type MobileReadiness,
} from "@/lib/software-supported-modules";
import { cn } from "@/lib/utils";
import type { ModuleId } from "@/templates/types";

const ROLE_ICONS: Record<string, typeof UserRound> = {
  waiter: UserRound,
  kitchen: ChefHat,
  business_admin: Shield,
  store_manager: Shield,
  cashier: UserRound,
  inventory_clerk: Package,
  pharmacy_manager: Shield,
  pharmacist: UserRound,
  shift_incharge: UserRound,
  inventory_manager: Package,
};

function ReadinessBadge({ status }: { status: MobileReadiness }) {
  const label = mobileReadinessLabel(status);
  if (status === "ready") {
    return (
      <span className="mt-1 inline-block rounded-full bg-[#ecfdf5] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#059669]">
        {label}
      </span>
    );
  }
  if (status === "capability") {
    return (
      <span className="mt-1 inline-block rounded-full bg-[#eff6ff] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1d4ed8]">
        {label}
      </span>
    );
  }
  return (
    <span className="mt-1 inline-block rounded-full bg-[#f1f5f9] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#64748b]">
      {label}
    </span>
  );
}

type SoftwareRoleMatrixProps = {
  businessName: string;
  /** Modules that can be assigned (typically all enabled modules). */
  modules: ModuleId[];
  roleKeys: SoftwareRoleKey[];
  roleAccess: RoleAccessMap;
  onChange: (next: RoleAccessMap) => void;
  moduleLabel: (moduleId: ModuleId) => string;
  compact?: boolean;
  /** Hide portal badges and copy — Software Control mobile-only view. */
  mobileOnly?: boolean;
  /** @deprecated use modules */
  mobileModules?: ModuleId[];
};

export function SoftwareRoleMatrix({
  businessName,
  modules: modulesProp,
  mobileModules,
  roleKeys,
  roleAccess,
  onChange,
  moduleLabel,
  compact = false,
  mobileOnly = false,
}: SoftwareRoleMatrixProps) {
  const modules = modulesProp?.length ? modulesProp : (mobileModules ?? []);

  if (modules.length === 0) {
    return (
      <p className="text-sm text-[#64748b]">
        Enable at least one module above to assign role permissions.
      </p>
    );
  }

  const toggleModule = (role: SoftwareRoleKey, moduleId: ModuleId) => {
    const entry = resolveRoleEntry(roleAccess, role, modules);
    const nextSet = new Set(entry.modules ?? []);
    if (nextSet.has(moduleId)) {
      nextSet.delete(moduleId);
    } else {
      nextSet.add(moduleId);
    }
    const nextModules = Array.from(nextSet);
    const defaultModule =
      entry.defaultModule && nextModules.includes(entry.defaultModule)
        ? entry.defaultModule
        : nextModules[0];
    onChange({
      ...roleAccess,
      [role]: { modules: nextModules, defaultModule },
    });
  };

  const setDefaultModule = (role: SoftwareRoleKey, moduleId: ModuleId) => {
    onChange({
      ...roleAccess,
      [role]: {
        ...resolveRoleEntry(roleAccess, role, modules),
        defaultModule: moduleId,
      },
    });
  };

  const hasPortalOnly = !mobileOnly && modules.some((id) => getMobileReadiness(id) === "planned");

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#64748b]">
        {mobileOnly
          ? `Check which mobile tabs each role can open in ${businessName}. Unchecked tabs are hidden on the Flutter app after next login or refresh.`
          : `For each role, check the modules they may open in ${businessName}'s portal and Flutter app. Unchecked = hidden for that role after next login or refresh.`}
      </p>

      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-[#64748b]">
            <tr>
              <th className="px-4 py-3">Role</th>
              {modules.map((moduleId) => {
                const readiness = getMobileReadiness(moduleId);
                return (
                  <th key={moduleId} className="px-3 py-3 text-center align-bottom">
                    <div className="flex flex-col items-center">
                      <span className="normal-case tracking-normal text-[#0f172a]">
                        {moduleLabel(moduleId)}
                      </span>
                      {!mobileOnly ? (
                        <span className="mt-0.5 flex flex-wrap items-center justify-center gap-1">
                          <span className="rounded-full bg-[#eff6ff] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#1d4ed8]">
                            Portal
                          </span>
                          <ReadinessBadge status={readiness} />
                        </span>
                      ) : readiness === "capability" ? (
                        <ReadinessBadge status={readiness} />
                      ) : null}
                    </div>
                  </th>
                );
              })}
              {!compact ? <th className="px-4 py-3">Opens on</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {roleKeys.map((role) => {
              const entry = resolveRoleEntry(roleAccess, role, modules);
              const allowed = new Set(entry.modules ?? []);
              const Icon = ROLE_ICONS[role] ?? UserRound;

              return (
                <tr key={role}>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-medium text-[#0f172a]">
                      <Icon className="h-4 w-4 text-[var(--brand-secondary)]" />
                      {roleKeyLabel(role)}
                    </span>
                  </td>
                  {modules.map((moduleId) => (
                    <td key={moduleId} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={allowed.has(moduleId)}
                        onChange={() => toggleModule(role, moduleId)}
                        aria-label={`${roleKeyLabel(role)} can access ${moduleLabel(moduleId)}`}
                      />
                    </td>
                  ))}
                  {!compact ? (
                    <td className="px-4 py-3">
                      {(() => {
                        const assigned = entry.modules ?? [];
                        const mobileReady = assigned.filter(
                          (id) => getMobileReadiness(id) === "ready",
                        );
                        const options = mobileReady.length ? mobileReady : assigned;
                        const value =
                          entry.defaultModule && options.includes(entry.defaultModule)
                            ? entry.defaultModule
                            : options[0] ?? "";
                        return (
                          <select
                            className="w-full max-w-[10rem] rounded-lg border border-[#e2e8f0] bg-white px-2 py-1.5 text-xs"
                            value={value}
                            disabled={!options.length}
                            onChange={(event) =>
                              setDefaultModule(role, event.target.value as ModuleId)
                            }
                          >
                            {options.map((moduleId) => (
                              <option key={moduleId} value={moduleId}>
                                {moduleLabel(moduleId)}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={cn("text-xs text-[#94a3b8]", compact && "hidden")}>
        {mobileOnly ? (
          <>
            <strong className="font-semibold text-[#64748b]">Mobile</strong> = Flutter bottom-nav tab.{" "}
            <strong className="font-semibold text-[#64748b]">Mobile capability</strong> = feature inside
            Products or Orders (e.g. Categories).
          </>
        ) : (
          <>
            <strong className="font-semibold text-[#64748b]">Mobile</strong> = Flutter tab.{" "}
            <strong className="font-semibold text-[#64748b]">Mobile capability</strong> = gated inside
            another screen (e.g. Categories).{" "}
            <strong className="font-semibold text-[#64748b]">Portal only</strong> = web until a mobile
            screen is ready
            {hasPortalOnly ? " — still selectable for portal access" : ""}.
          </>
        )}
      </p>
    </div>
  );
}
