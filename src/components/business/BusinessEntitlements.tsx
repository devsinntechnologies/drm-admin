"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useUpdateEntitlementsMutation } from "@/hooks/useIndustryTemplate";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { getIndustryById } from "@/templates/industries";
import { moduleLabel } from "@/templates/module-dependencies";
import { normalizeErrorMessage } from "@/lib/utils";
import type { ModuleId } from "@/templates/types";

type Props = {
  templateConfig: ApiTemplateConfig | null | undefined;
  industryId: string;
};

/**
 * Super-admin-only control: which of a business's industry-available
 * modules it's allowed to toggle for itself in Software & Mobile -> Control.
 * Separate from enabledModules — this only bounds what the business admin
 * may turn on, it doesn't turn anything on or off itself.
 */
export function BusinessEntitlements({ templateConfig, industryId }: Props) {
  const industry = getIndustryById(industryId);
  const availableModules = useMemo<ModuleId[]>(() => {
    if (!industry) return [];
    return Array.from(new Set([...industry.modules, ...(industry.optionalModules ?? [])]));
  }, [industry]);

  const unrestricted = !templateConfig?.entitledModules;
  const [selected, setSelected] = useState<Set<ModuleId>>(
    new Set((templateConfig?.entitledModules ?? availableModules) as ModuleId[]),
  );

  const [updateEntitlements, { isLoading: saving }] = useUpdateEntitlementsMutation();

  if (!templateConfig?.id || !industry) return null;

  const toggle = (moduleId: ModuleId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const save = async () => {
    const toastId = toast.loading("Saving entitlements…");
    try {
      await updateEntitlements({
        id: templateConfig.id,
        entitledModules: Array.from(selected),
      }).unwrap();
      toast.success("Entitlements saved.", { id: toastId });
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Could not save entitlements."), { id: toastId });
    }
  };

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <h2 className="mb-1 text-sm font-bold text-[var(--text-primary)]">Module entitlements</h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        {unrestricted
          ? "This business can currently toggle any module available for its industry. Check the ones it should be limited to, then save."
          : "Only the checked modules can be toggled on by this business's own admin."}
      </p>
      <div className="grid gap-2 md:grid-cols-2">
        {availableModules.map((moduleId) => (
          <label key={moduleId} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={selected.has(moduleId)}
              onChange={() => toggle(moduleId)}
              className="h-4 w-4"
            />
            {moduleLabel(moduleId)}
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={() => void save()} disabled={saving} className="dn-btn dn-btn-primary">
          {saving ? "Saving…" : "Save entitlements"}
        </button>
      </div>
    </section>
  );
}
