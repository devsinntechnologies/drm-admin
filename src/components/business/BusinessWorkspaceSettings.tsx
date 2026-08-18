"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { ImagePlus, Loader2, Palette, Shapes, X } from "lucide-react";
import { toast } from "sonner";
import { ModuleChip } from "@/components/wizard/TemplateConfigChips";
import { TemplateThemeFields } from "@/components/wizard/TemplateThemeFields";
import { businessApi } from "@/hooks/useBusiness";
import { useAuth } from "@/hooks/useAuth";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import {
  useCreateTemplateConfigMutation,
  useUpdateTemplateConfigMutation,
} from "@/hooks/useIndustryTemplate";
import { normalizeErrorMessage } from "@/lib/utils";
import { buildDefaultNavigation, syncNavigationToEnabledModules } from "@/template-engine/builder";
import { INDUSTRY_TEMPLATES, getIndustryById } from "@/templates/industries";
import {
  canDisableModule,
  getLockReason,
  getLockedModules,
  withDependenciesEnabled,
  withDependentsDisabled,
} from "@/templates/module-dependencies";
import { ACCENT_COLORS, colorsFromAccent } from "@/templates/modules";
import type { AccentColor, ModuleId, ThemeMode } from "@/templates/types";

type DraftChange = {
  primaryColor: string;
  secondaryColor: string;
  themeMode: ThemeMode;
  logoUrl: string | null;
  enabledModules: ModuleId[];
};

type Props = {
  businessId: string;
  businessName: string;
  templateConfig: ApiTemplateConfig | null | undefined;
  fallbackIndustryId?: string;
  onDraftChange?: (draft: DraftChange) => void;
};

export function BusinessWorkspaceSettings({
  businessId,
  businessName,
  templateConfig,
  fallbackIndustryId,
  onDraftChange,
}: Props) {
  const dispatch = useDispatch();
  const { role } = useAuth();
  const canChangeIndustry = role === "super_admin";
  const initialIndustryId = templateConfig?.industryId ?? fallbackIndustryId ?? "retail-store";
  const [industryId, setIndustryId] = useState(initialIndustryId);
  const industry = getIndustryById(industryId);
  const availableModules = useMemo<ModuleId[]>(() => {
    if (!industry) return [];
    return Array.from(new Set([...industry.modules, ...(industry.optionalModules ?? [])]));
  }, [industry]);

  const [primaryColor, setPrimaryColor] = useState(templateConfig?.primaryColor ?? "#001840");
  const [secondaryColor, setSecondaryColor] = useState(templateConfig?.secondaryColor ?? "#0050F8");
  const [themeMode, setThemeMode] = useState<ThemeMode>(templateConfig?.themeMode ?? "light");
  const [logoUrl, setLogoUrl] = useState<string | null>(templateConfig?.logoUrl ?? null);
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>(
    (templateConfig?.enabledModules ?? industry?.modules ?? []) as ModuleId[],
  );

  const [updateConfig, { isLoading: savingUpdate }] = useUpdateTemplateConfigMutation();
  const [createConfig, { isLoading: savingCreate }] = useCreateTemplateConfigMutation();
  const saving = savingUpdate || savingCreate;
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;

  useEffect(() => {
    const nextIndustryId = templateConfig?.industryId ?? fallbackIndustryId ?? "retail-store";
    setIndustryId(nextIndustryId);
    const nextIndustry = getIndustryById(nextIndustryId);
    setPrimaryColor(templateConfig?.primaryColor ?? "#001840");
    setSecondaryColor(templateConfig?.secondaryColor ?? "#0050F8");
    setThemeMode(templateConfig?.themeMode ?? "light");
    setLogoUrl(templateConfig?.logoUrl ?? null);
    setEnabledModules((templateConfig?.enabledModules ?? nextIndustry?.modules ?? []) as ModuleId[]);
  }, [templateConfig, fallbackIndustryId]);

  useEffect(() => {
    onDraftChangeRef.current?.({ primaryColor, secondaryColor, themeMode, logoUrl, enabledModules });
  }, [primaryColor, secondaryColor, themeMode, logoUrl, enabledModules]);

  const locked = useMemo(
    () => getLockedModules(industry?.id ?? "", enabledModules, availableModules),
    [industry?.id, enabledModules, availableModules],
  );

  const applyIndustry = (nextId: string) => {
    const next = getIndustryById(nextId);
    if (!next) return;
    setIndustryId(nextId);
    setEnabledModules([...next.modules] as ModuleId[]);
    const palette = colorsFromAccent(next.theme.accent);
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
  };

  const toggleModule = (moduleId: ModuleId) => {
    if (!industry) return;
    const isOn = enabledModules.includes(moduleId);
    if (isOn) {
      const check = canDisableModule(industry.id, moduleId, enabledModules, availableModules);
      if (!check.ok) {
        toast.error(check.reason ?? "This module cannot be disabled");
        return;
      }
      const { next, removed } = withDependentsDisabled(
        industry.id,
        moduleId,
        enabledModules,
        availableModules,
      );
      const related = removed.filter((id) => id !== moduleId);
      if (related.length) {
        toast.message(`Also turned off: ${related.join(", ")}`);
      }
      setEnabledModules(next);
      return;
    }

    const next = withDependenciesEnabled(industry.id, moduleId, enabledModules, availableModules);
    const added = next.filter((id) => !enabledModules.includes(id) && id !== moduleId);
    if (added.length) {
      toast.message(`Also enabled: ${added.join(", ")}`);
    }
    setEnabledModules(next);
  };

  const handleLogoUpload = (file?: File | null) => {
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Logo must be 1.5 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!industry) {
      toast.error("This business has no industry template to edit.");
      return;
    }

    const industryChanged = industry.id !== templateConfig?.industryId;
    const navigation = industryChanged
      ? buildDefaultNavigation(enabledModules, industry.labels)
      : syncNavigationToEnabledModules(
          templateConfig?.navigation,
          enabledModules,
          templateConfig?.labels ?? industry.labels,
        );

    const payload = {
      businessName: templateConfig?.businessName ?? businessName,
      industryId: industry.id,
      primaryColor,
      secondaryColor,
      themeMode,
      enabledModules,
      navigation,
      dashboardCards: industryChanged
        ? [...industry.dashboardCards]
        : (templateConfig?.dashboardCards ?? industry.dashboardCards),
      labels: industryChanged ? industry.labels : (templateConfig?.labels ?? industry.labels),
      currency: templateConfig?.currency,
      location: templateConfig?.location,
      branchCount: templateConfig?.branchCount,
      logoUrl: logoUrl || "",
      businessId,
    };

    const toastId = toast.loading("Saving workspace settings…");
    try {
      if (templateConfig?.id) {
        await updateConfig({ id: templateConfig.id, body: payload }).unwrap();
      } else {
        await createConfig(payload).unwrap();
      }
      dispatch(businessApi.util.invalidateTags([{ type: "Business", id: businessId }]));
      toast.success(
        industryChanged
          ? `${industry.name} modules saved. Reload the workspace if the sidebar still looks old.`
          : "Theme, logo, and modules saved.",
        { id: toastId },
      );
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Could not save workspace settings."), { id: toastId });
    }
  };

  if (!industry) {
    return (
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <p className="mb-3 text-sm text-[#64748b]">
          Could not match an industry for this business. Choose one and save to load the correct modules.
        </p>
        {canChangeIndustry ? (
          <select
            className="portal-input max-w-sm"
            value=""
            onChange={(event) => applyIndustry(event.target.value)}
          >
            <option value="" disabled>
              Select industry
            </option>
            {INDUSTRY_TEMPLATES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        ) : null}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-[var(--brand-secondary)]" />
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Theme & logo</h2>
        </div>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          {canChangeIndustry
            ? "Choose the industry this business should run. Saving Pharmacy loads medicines, batches, expiry, and prescriptions instead of salon appointments."
            : `${industry.name} workspace. Industry stays the same; only colors, logo, and modules can change.`}
        </p>

        {canChangeIndustry ? (
          <label className="mb-5 grid max-w-sm gap-1.5 text-sm font-medium text-[var(--text-primary)]">
            Industry
            <select
              className="portal-input"
              value={industryId}
              onChange={(event) => applyIndustry(event.target.value)}
            >
              {INDUSTRY_TEMPLATES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-xs font-bold text-[var(--text-muted)]">Logo</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Business logo</p>
            <div className="mt-2 flex gap-2">
              <label className="dn-btn dn-btn-outline inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-xs">
                <ImagePlus className="h-4 w-4" /> Upload
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => handleLogoUpload(event.target.files?.[0])} />
              </label>
              {logoUrl ? (
                <button type="button" onClick={() => setLogoUrl(null)} className="rounded-lg border px-3 py-2 text-xs font-semibold text-[#dc2626]">
                  <X className="mr-1 inline h-3.5 w-3.5" /> Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <TemplateThemeFields
          themeMode={themeMode}
          onThemeModeChange={setThemeMode}
          primaryColor={primaryColor}
          onPrimaryColorChange={setPrimaryColor}
          secondaryColor={secondaryColor}
          onSecondaryColorChange={setSecondaryColor}
        />

        <p className="mb-2 mt-4 text-xs font-semibold text-[var(--text-muted)]">Quick presets</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
            const preset = ACCENT_COLORS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setPrimaryColor(preset.primary);
                  setSecondaryColor(preset.secondary);
                }}
                className="h-7 w-7 rounded-md border border-[var(--border-subtle)]"
                style={{ backgroundColor: preset.primary }}
                title={preset.label}
              />
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shapes className="h-4 w-4 text-[var(--brand-secondary)]" />
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Modules</h2>
        </div>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Turn modules on or off for this business. Dashboard and Settings stay available.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {availableModules.map((moduleId) => (
            <ModuleChip
              key={moduleId}
              id={moduleId}
              checked={enabledModules.includes(moduleId)}
              locked={locked.has(moduleId)}
              lockReason={getLockReason(industry.id, moduleId, enabledModules, availableModules)}
              onToggle={() => toggleModule(moduleId)}
            />
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={() => void save()} disabled={saving} className="dn-btn dn-btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save workspace settings
        </button>
      </div>
    </div>
  );
}
