"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { businessApi } from "@/hooks/useBusiness";
import { useUpdateEntitlementsMutation } from "@/hooks/useIndustryTemplate";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { getIndustryById } from "@/templates/industries";
import { getLockedModules, moduleLabel } from "@/templates/module-dependencies";
import { normalizeErrorMessage } from "@/lib/utils";
import type { ModuleId } from "@/templates/types";

const SHELL: ModuleId[] = ["dashboard", "settings"];

type Props = {
  businessId: string;
  templateConfig: ApiTemplateConfig | null | undefined;
  industryId: string;
};

/**
 * Super-admin catalog for a business: modules checked + saved here become
 * the only ones available in Portal → Features (and Software Control).
 */
export function BusinessEntitlements({
  businessId,
  templateConfig,
  industryId,
}: Props) {
  const dispatch = useDispatch();
  const industry = getIndustryById(industryId);
  const industryModules = useMemo<ModuleId[]>(() => {
    if (!industry) return [];
    return Array.from(new Set([...industry.modules, ...(industry.optionalModules ?? [])]));
  }, [industry]);

  const unrestricted = !templateConfig?.entitledModules;
  const [selected, setSelected] = useState<Set<ModuleId>>(() => {
    const seed = (templateConfig?.entitledModules ?? industryModules) as ModuleId[];
    return new Set([...SHELL.filter((id) => industryModules.includes(id)), ...seed]);
  });

  const [updateEntitlements, { isLoading: saving }] = useUpdateEntitlementsMutation();

  const syncKey = [
    templateConfig?.id ?? "",
    templateConfig?.updatedAt ?? "",
    (templateConfig?.entitledModules ?? []).join(","),
    industryModules.join(","),
  ].join("|");

  useEffect(() => {
    const seed = (templateConfig?.entitledModules ?? industryModules) as ModuleId[];
    setSelected(
      new Set([...SHELL.filter((id) => industryModules.includes(id)), ...seed]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  if (!templateConfig?.id || !industry) return null;

  const locked = getLockedModules(industry.id, Array.from(selected), industryModules);

  const toggle = (moduleId: ModuleId) => {
    if (locked.has(moduleId) || SHELL.includes(moduleId)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      for (const shell of SHELL) {
        if (industryModules.includes(shell)) next.add(shell);
      }
      return next;
    });
  };

  const save = async () => {
    const entitledModules = Array.from(
      new Set([
        ...SHELL.filter((id) => industryModules.includes(id)),
        ...Array.from(selected).filter((id) => industryModules.includes(id)),
      ]),
    );

    if (entitledModules.length === 0) {
      toast.error("Select at least one module.");
      return;
    }

    const toastId = toast.loading("Saving available modules…");
    try {
      await updateEntitlements({
        id: templateConfig.id,
        entitledModules,
      }).unwrap();
      dispatch(businessApi.util.invalidateTags([{ type: "Business", id: businessId }]));
      toast.success("Saved. Portal Features below now shows only these modules.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Could not save available modules."), {
        id: toastId,
      });
    }
  };

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <h2 className="mb-1 text-sm font-bold text-[var(--text-primary)]">
        1. Available modules (catalog)
      </h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        {unrestricted
          ? "Check the modules this business may use, then Save. After save, only those modules appear below in Portal Features."
          : "Only the checked modules appear below in Portal Features. Uncheck → Save to remove them from the catalog."}
      </p>
      <div className="grid gap-2 md:grid-cols-2">
        {industryModules.map((moduleId) => {
          const isLocked = locked.has(moduleId) || SHELL.includes(moduleId);
          return (
            <label
              key={moduleId}
              className={`flex items-center gap-2 text-sm text-[var(--text-primary)] ${
                isLocked ? "opacity-80" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(moduleId)}
                onChange={() => toggle(moduleId)}
                disabled={isLocked}
                className="h-4 w-4"
              />
              <span>
                {moduleLabel(moduleId)}
                {isLocked ? (
                  <span className="ml-1 text-xs text-[var(--text-muted)]">(always on)</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="dn-btn dn-btn-primary"
        >
          {saving ? "Saving…" : "Save available modules"}
        </button>
      </div>
    </section>
  );
}
