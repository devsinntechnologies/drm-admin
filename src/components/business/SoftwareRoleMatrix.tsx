"use client";

import { ChefHat, Shield, UserRound } from "lucide-react";
import {
  SOFTWARE_ROLE_KEYS,
  SOFTWARE_ROLE_LABELS,
  type RoleAccessMap,
  type SoftwareRoleKey,
} from "@/lib/role-access";
import { resolveRoleEntry } from "@/lib/software-role-defaults";
import { cn } from "@/lib/utils";
import type { ModuleId } from "@/templates/types";

const ROLE_ICONS: Record<SoftwareRoleKey, typeof UserRound> = {
  waiter: UserRound,
  kitchen: ChefHat,
  business_admin: Shield,
};

type SoftwareRoleMatrixProps = {
  businessName: string;
  mobileModules: ModuleId[];
  roleAccess: RoleAccessMap;
  onChange: (next: RoleAccessMap) => void;
  moduleLabel: (moduleId: ModuleId) => string;
  compact?: boolean;
};

export function SoftwareRoleMatrix({
  businessName,
  mobileModules,
  roleAccess,
  onChange,
  moduleLabel,
  compact = false,
}: SoftwareRoleMatrixProps) {
  if (mobileModules.length === 0) {
    return (
      <p className="text-sm text-[#64748b]">
        Enable at least one module above to assign role permissions.
      </p>
    );
  }

  const toggleModule = (role: SoftwareRoleKey, moduleId: ModuleId) => {
    const entry = resolveRoleEntry(roleAccess, role, mobileModules);
    const modules = new Set(entry.modules ?? []);
    if (modules.has(moduleId)) {
      modules.delete(moduleId);
    } else {
      modules.add(moduleId);
    }
    const nextModules = Array.from(modules);
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
        ...resolveRoleEntry(roleAccess, role, mobileModules),
        defaultModule: moduleId,
      },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#64748b]">
        Choose which tabs each role can open in {businessName}. Flutter shows supported modules;
        portal-only modules remain available on the web.
      </p>

      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-[#64748b]">
            <tr>
              <th className="px-4 py-3">Role</th>
              {mobileModules.map((moduleId) => (
                <th key={moduleId} className="px-3 py-3 text-center">
                  {moduleLabel(moduleId)}
                </th>
              ))}
              {!compact ? <th className="px-4 py-3">Opens on</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {SOFTWARE_ROLE_KEYS.map((role) => {
              const entry = resolveRoleEntry(roleAccess, role, mobileModules);
              const allowed = new Set(entry.modules ?? []);
              const Icon = ROLE_ICONS[role];

              return (
                <tr key={role} className="text-[#334155]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-[#0f172a]">{SOFTWARE_ROLE_LABELS[role]}</p>
                        <p className="text-xs text-[#94a3b8]">{allowed.size} tab{allowed.size === 1 ? "" : "s"}</p>
                      </div>
                    </div>
                  </td>
                  {mobileModules.map((moduleId) => {
                    const selected = allowed.has(moduleId);
                    return (
                      <td key={moduleId} className="px-3 py-3 text-center">
                        <button
                          type="button"
                          aria-pressed={selected}
                          aria-label={`${SOFTWARE_ROLE_LABELS[role]} — ${moduleLabel(moduleId)}`}
                          onClick={() => toggleModule(role, moduleId)}
                          className={cn(
                            "mx-auto grid h-8 w-8 place-items-center rounded-lg border transition-colors",
                            selected
                              ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                              : "border-[#e2e8f0] bg-white text-[#cbd5e1] hover:border-[#cbd5e1]",
                          )}
                        >
                          {selected ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                  {!compact ? (
                    <td className="px-4 py-3">
                      <select
                        className="portal-input h-9 min-w-[9rem] rounded-lg text-sm"
                        value={entry.defaultModule ?? ""}
                        onChange={(event) => setDefaultModule(role, event.target.value as ModuleId)}
                      >
                        {(entry.modules ?? []).map((moduleId) => (
                          <option key={moduleId} value={moduleId}>
                            {moduleLabel(moduleId)}
                          </option>
                        ))}
                      </select>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
