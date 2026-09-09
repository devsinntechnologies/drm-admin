"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { useListIndustriesQuery } from "@/hooks/useIndustryTemplate";
import { useIndustryPrinterDefaults } from "@/hooks/usePrinters";
import { printerRoleLabel, type PrinterRole } from "@/lib/printers";
import { normalizeErrorMessage } from "@/lib/utils";

type RoleState = Record<string, PrinterRole[]>;

export function IndustryPrinterDefaultsPanel() {
  const { data: industries = [], isLoading } = useListIndustriesQuery();
  const { saveDefaults, savingId } = useIndustryPrinterDefaults();
  const [rolesByIndustry, setRolesByIndustry] = useState<RoleState>({});

  useEffect(() => {
    const next: RoleState = {};
    for (const industry of industries) {
      const roles = (industry.defaultPrinterRoles ?? ["receipt"]).filter(
        (role): role is PrinterRole => role === "receipt" || role === "kitchen",
      );
      next[industry.id] = roles.includes("receipt") ? roles : ["receipt", ...roles];
    }
    setRolesByIndustry(next);
  }, [industries]);

  const rows = useMemo(
    () =>
      industries.map((industry) => ({
        id: industry.id,
        name: industry.name,
        roles: rolesByIndustry[industry.id] ?? ["receipt"],
      })),
    [industries, rolesByIndustry],
  );

  function toggle(industryId: string, role: PrinterRole, checked: boolean) {
    setRolesByIndustry((prev) => {
      const current = new Set(prev[industryId] ?? ["receipt"]);
      if (checked) current.add(role);
      else if (role !== "receipt") current.delete(role);
      return { ...prev, [industryId]: [...current] as PrinterRole[] };
    });
  }

  async function onSave(industryId: string) {
    try {
      await saveDefaults(industryId, rolesByIndustry[industryId] ?? ["receipt"]);
      toast.success("Industry printer defaults saved");
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Could not save printer defaults"));
    }
  }

  if (isLoading) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
      <div className="flex items-start gap-3 border-b border-[#f1f5f9] px-6 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#eef2ff] text-[#4338ca]">
          <Printer className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-[#0f172a]">Default printers by industry</h3>
          <p className="mt-0.5 text-xs text-[#64748b]">
            These roles are copied onto a shop when printer access is enabled. IPs are set per business.
          </p>
        </div>
      </div>
      <div className="divide-y divide-[#f1f5f9]">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
            <p className="text-sm font-medium text-[#0f172a]">{row.name}</p>
            <div className="flex flex-wrap items-center gap-3">
              {(["receipt", "kitchen"] as const).map((role) => (
                <label key={role} className="flex items-center gap-1.5 text-xs font-medium text-[#475569]">
                  <input
                    type="checkbox"
                    checked={row.roles.includes(role)}
                    disabled={role === "receipt"}
                    onChange={(event) => toggle(row.id, role, event.target.checked)}
                  />
                  {printerRoleLabel(role)}
                </label>
              ))}
              <button
                type="button"
                onClick={() => void onSave(row.id)}
                disabled={savingId === row.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#0f172a] disabled:opacity-60"
              >
                {savingId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
