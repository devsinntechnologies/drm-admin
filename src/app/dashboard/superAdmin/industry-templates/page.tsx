"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  GripVertical,
  Layers3,
  LayoutTemplate,
  Lock,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { IndustryIcon } from "@/components/templates/IndustryIcon";
import { createCustomizedConfig, buildDefaultNavigation } from "@/template-engine/builder";
import { deleteTemplateConfig, loadSavedTemplates, saveTemplateConfig } from "@/template-engine/storage";
import { FAMILY_LABELS, INDUSTRY_TEMPLATES, getIndustryById } from "@/templates/industries";
import {
  canDisableModule,
  getAvailableModules,
  getIndustryModulePlan,
  getLockReason,
  getLockedModules,
  moduleLabel,
  withDependenciesEnabled,
  withDependentsDisabled,
} from "@/templates/module-dependencies";
import {
  ACCENT_COLORS,
  colorsFromAccent,
  DASHBOARD_CARD_CATALOG,
  MODULE_CATALOG,
} from "@/templates/modules";
import type {
  AccentColor,
  CustomizedTemplateConfig,
  DashboardCardId,
  IndustryTemplate,
  ModuleId,
  ThemeMode,
} from "@/templates/types";
import { cn } from "@/lib/utils";

type WizardStep = "select" | "customize" | "generate";

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: "select", label: "Select Industry" },
  { id: "customize", label: "Customize Template" },
  { id: "generate", label: "Generate" },
];

function IndustryTemplatesContent() {
  const [step, setStep] = useState<WizardStep>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState<CustomizedTemplateConfig[]>([]);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [location, setLocation] = useState("");
  const [branchCount, setBranchCount] = useState(1);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [primaryColor, setPrimaryColor] = useState("#001840");
  const [secondaryColor, setSecondaryColor] = useState("#0050F8");
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>([]);
  const [dashboardCards, setDashboardCards] = useState<DashboardCardId[]>([]);
  const [navItems, setNavItems] = useState<CustomizedTemplateConfig["navigation"]>([]);
  const [productLabel, setProductLabel] = useState("Product");
  const [productsLabel, setProductsLabel] = useState("Products");
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [dragModuleId, setDragModuleId] = useState<ModuleId | null>(null);

  useEffect(() => {
    setSaved(loadSavedTemplates());
  }, []);

  const industry = useMemo(
    () => (selectedId ? getIndustryById(selectedId) ?? null : null),
    [selectedId],
  );

  const availableModules = useMemo(
    () => (industry ? getAvailableModules(industry.modules, industry.optionalModules) : []),
    [industry],
  );

  const modulePlan = useMemo(
    () => (industry ? getIndustryModulePlan(industry.id) : undefined),
    [industry],
  );

  const lockedModules = useMemo(
    () =>
      industry
        ? getLockedModules(industry.id, enabledModules, availableModules)
        : new Set<ModuleId>(),
    [industry, enabledModules, availableModules],
  );

  const orderedNavForPreview = useMemo(
    () =>
      navItems
        .filter((item) => enabledModules.includes(item.moduleId))
        .map((item) => ({ ...item, visible: true })),
    [navItems, enabledModules],
  );

  function hydrateFromIndustry(tpl: IndustryTemplate) {
    const available = getAvailableModules(tpl.modules, tpl.optionalModules);
    const labels = { ...tpl.labels };
    const colors = colorsFromAccent(tpl.theme.accent);
    setBusinessName(`${tpl.name} Demo`);
    setPrimaryColor(colors.primary);
    setSecondaryColor(colors.secondary);
    setThemeMode("light");
    setEnabledModules([...tpl.modules]);
    setDashboardCards([...tpl.dashboardCards]);
    setProductLabel(tpl.labels.product);
    setProductsLabel(tpl.labels.products);
    setNavItems(
      buildDefaultNavigation(available, labels).map((item) => ({
        ...item,
        visible: tpl.modules.includes(item.moduleId),
      })),
    );
  }

  function selectIndustry(id: string) {
    const tpl = getIndustryById(id);
    if (!tpl) return;
    setSelectedId(id);
    hydrateFromIndustry(tpl);
    setStep("customize");
  }

  function applyModuleSelection(nextEnabled: ModuleId[]) {
    setEnabledModules(nextEnabled);
    setNavItems((current) => {
      const labels = { product: productLabel, products: productsLabel };
      const available = industry
        ? getAvailableModules(industry.modules, industry.optionalModules)
        : nextEnabled;
      const rebuilt = buildDefaultNavigation(available, labels);
      if (!current.length) {
        return rebuilt.map((r) => ({ ...r, visible: nextEnabled.includes(r.moduleId) }));
      }

      const kept = current
        .map((item) => {
          const fresh = rebuilt.find((r) => r.moduleId === item.moduleId);
          if (!fresh) return null;
          return {
            ...fresh,
            label: item.label || fresh.label,
            visible: nextEnabled.includes(item.moduleId),
          };
        })
        .filter(Boolean) as CustomizedTemplateConfig["navigation"];

      const extras = rebuilt
        .filter((r) => !current.some((c) => c.moduleId === r.moduleId))
        .map((r) => ({ ...r, visible: nextEnabled.includes(r.moduleId) }));

      return [...kept, ...extras];
    });
  }

  function toggleModule(moduleId: ModuleId) {
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
        toast.message(
          `Also unselected: ${related.map(moduleLabel).join(", ")}`,
        );
      }
      applyModuleSelection(next);
      return;
    }

    const next = withDependenciesEnabled(industry.id, moduleId, enabledModules, availableModules);
    const added = next.filter((id) => !enabledModules.includes(id) && id !== moduleId);
    if (added.length) {
      toast.message(`Also enabled: ${added.map(moduleLabel).join(", ")}`);
    }
    applyModuleSelection(next);
  }

  function toggleDashboardCard(cardId: DashboardCardId) {
    setDashboardCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId],
    );
  }

  function reorderModules(fromId: ModuleId, toId: ModuleId) {
    if (fromId === toId) return;
    setNavItems((prev) => {
      const from = prev.findIndex((item) => item.moduleId === fromId);
      const to = prev.findIndex((item) => item.moduleId === toId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function handleGenerate() {
    if (!industry) return;
    if (!businessName.trim()) {
      toast.error("Business name is required");
      return;
    }

    const config = createCustomizedConfig({
      businessName,
      industry,
      currency,
      location,
      branchCount,
      primaryColor,
      secondaryColor,
      themeMode,
      enabledModules,
      dashboardCards,
      labels: {
        ...industry.labels,
        product: productLabel,
        products: productsLabel,
      },
      navigation: orderedNavForPreview,
    });

    const next = saveTemplateConfig(config);
    setSaved(next);
    setLastSavedId(config.id);
    setStep("generate");
    toast.success("Industry template saved locally");
  }

  function removeSaved(id: string) {
    setSaved(deleteTemplateConfig(id));
    if (lastSavedId === id) setLastSavedId(null);
    toast.success("Template removed");
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const softSecondary = `${secondaryColor}22`;

  return (
    <AdminShell activeTab="industry-templates">
      <section className="mb-6 flex w-full flex-col gap-4 rounded-3xl border border-white bg-[linear-gradient(120deg,rgba(255,255,255,0.95),rgba(241,245,249,0.9))] px-5 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-[#001840] to-[#0050F8] text-white shadow-[0_10px_20px_rgba(0,24,64,0.24)]">
            <LayoutTemplate className="h-7 w-7" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[1.65rem] font-semibold leading-tight text-[#181d2c]">
              Industry Templates
            </h2>
            <p className="truncate text-[0.92rem] text-[#6c7890]">
              One DigiNizam UI — fifteen industry configurations with shared modules
            </p>
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((item, index) => {
          const active = item.id === step;
          const done = index < stepIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "select") setStep("select");
                else if (item.id === "customize" && selectedId) setStep("customize");
                else if (item.id === "generate" && lastSavedId) setStep("generate");
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                active && "bg-[#001840] text-white",
                done && !active && "bg-[#eef3ff] text-[#0050F8]",
                !active && !done && "bg-white text-[#64748b] border border-[#e2e8f0]",
              )}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-xs">
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>

      {step === "select" && (
        <div className="space-y-8">
          {saved.length > 0 && (
            <section className="rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <div className="mb-4 flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-[#0050F8]" />
                <h3 className="text-lg font-semibold text-[#0f172a]">Saved configurations</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {saved.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#e8eef7] bg-[#f8fafc] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#0f172a]">{item.businessName}</p>
                      <p className="truncate text-xs text-[#64748b]">
                        {item.industryName} · {item.enabledModules.length} modules
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        href={`/dashboard/superAdmin/industry-templates/preview?id=${item.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#0050F8] hover:bg-[#eef3ff]"
                        title="Open preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeSaved(item.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#fee2e2] bg-white text-[#ef4444] hover:bg-[#fef2f2]"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-4 text-lg font-semibold text-[#0f172a]">Select business industry</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {INDUSTRY_TEMPLATES.map((tpl) => {
                const color = ACCENT_COLORS[tpl.theme.accent] ?? ACCENT_COLORS.blue;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => selectIndustry(tpl.id)}
                    className="group rounded-3xl border border-[#e2e8f0] bg-white p-5 text-left shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#0050F8]/40 hover:shadow-[0_14px_28px_rgba(0,24,64,0.1)]"
                  >
                    <div
                      className="mb-4 grid h-12 w-12 place-items-center rounded-2xl"
                      style={{ backgroundColor: color.soft, color: color.secondary }}
                    >
                      <IndustryIcon name={tpl.theme.icon} />
                    </div>
                    <p className="text-base font-semibold text-[#0f172a]">{tpl.name}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                      {FAMILY_LABELS[tpl.family]}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm text-[#64748b]">{tpl.description}</p>
                    <p className="mt-4 text-sm font-semibold text-[#0050F8] group-hover:underline">
                      Customize template →
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {step === "customize" && industry && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to industries
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#001840] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(0,24,64,0.2)]"
            >
              Create business UI <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <Panel title={`${industry.name} template`}>
                <div className="mb-4 flex items-start gap-4">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                    style={{ backgroundColor: softSecondary, color: secondaryColor }}
                  >
                    <IndustryIcon name={industry.theme.icon} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[#64748b]">{industry.description}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
                      {FAMILY_LABELS[industry.family]}
                    </p>
                  </div>
                </div>
                {modulePlan && (
                  <div className="mb-4 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e3a8a]">
                    <p className="font-semibold">Customization model</p>
                    <p className="mt-1 text-[#1d4ed8]">{modulePlan.summary}</p>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <PreviewList title="Available roles" items={industry.roles} />
                  <PreviewList title="Key workflows" items={industry.workflows} />
                </div>
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
                    Special industry screens
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {industry.specialScreens.map((screen) => (
                      <span
                        key={screen}
                        className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-sm font-medium text-[#334155]"
                      >
                        {screen}
                      </span>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel title="1. Business profile">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Business name">
                    <input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="portal-input"
                      placeholder="e.g. City Pharmacy"
                    />
                  </Field>
                  <Field label="Industry">
                    <input value={industry.name} disabled className="portal-input opacity-70" />
                  </Field>
                  <Field label="Currency">
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="portal-input">
                      <option value="PKR">PKR</option>
                      <option value="USD">USD</option>
                      <option value="AED">AED</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </Field>
                  <Field label="Location">
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="portal-input"
                      placeholder="City / region"
                    />
                  </Field>
                  <Field label="Branch count">
                    <input
                      type="number"
                      min={1}
                      value={branchCount}
                      onChange={(e) => setBranchCount(Math.max(1, Number(e.target.value) || 1))}
                      className="portal-input"
                    />
                  </Field>
                  <Field label="Interface">
                    <div className="flex gap-2">
                      {(["light", "dark"] as ThemeMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setThemeMode(mode)}
                          className={cn(
                            "flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize",
                            themeMode === mode
                              ? "border-[#001840] bg-[#001840] text-white"
                              : "border-[#e2e8f0] bg-white text-[#334155]",
                          )}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Primary colour">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-11 w-14 cursor-pointer rounded-xl border border-[#e2e8f0] bg-white p-1"
                      />
                      <input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="portal-input font-mono uppercase"
                        placeholder="#001840"
                      />
                    </div>
                  </Field>
                  <Field label="Secondary colour">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-11 w-14 cursor-pointer rounded-xl border border-[#e2e8f0] bg-white p-1"
                      />
                      <input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="portal-input font-mono uppercase"
                        placeholder="#0050F8"
                      />
                    </div>
                  </Field>
                </div>
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold text-[#94a3b8]">Quick presets</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
                      const preset = ACCENT_COLORS[key];
                      const active =
                        primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
                        secondaryColor.toLowerCase() === preset.secondary.toLowerCase();
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setPrimaryColor(preset.primary);
                            setSecondaryColor(preset.secondary);
                          }}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold",
                            active
                              ? "border-[#0f172a] bg-[#f8fafc]"
                              : "border-[#e2e8f0] bg-white text-[#64748b]",
                          )}
                          title={`${preset.primary} / ${preset.secondary}`}
                        >
                          <span className="flex h-4 overflow-hidden rounded-full border border-[#e2e8f0]">
                            <span className="h-4 w-3" style={{ backgroundColor: preset.primary }} />
                            <span className="h-4 w-3" style={{ backgroundColor: preset.secondary }} />
                          </span>
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label={`Singular label (was Product)`}>
                    <input
                      value={productLabel}
                      onChange={(e) => setProductLabel(e.target.value)}
                      className="portal-input"
                    />
                  </Field>
                  <Field label={`Plural label (was Products)`}>
                    <input
                      value={productsLabel}
                      onChange={(e) => setProductsLabel(e.target.value)}
                      className="portal-input"
                    />
                  </Field>
                </div>
              </Panel>

              <Panel title="2. Modules & navigation">
                <p className="mb-2 text-sm text-[#64748b]">
                  Build a fully custom dashboard. Toggle any module on/off, and drag cards to set sidebar order. Only Dashboard and Settings stay locked.
                </p>
                {modulePlan && (
                  <p className="mb-4 rounded-xl bg-[#f8fafc] px-3 py-2 text-xs text-[#64748b]">
                    {modulePlan.summary}
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {navItems.map((item) => {
                    const checked = enabledModules.includes(item.moduleId);
                    const locked = checked && lockedModules.has(item.moduleId);
                    const reason = locked
                      ? getLockReason(industry.id, item.moduleId, enabledModules, availableModules)
                      : null;
                    return (
                      <ModuleChip
                        key={item.moduleId}
                        id={item.moduleId}
                        label={item.label}
                        checked={checked}
                        locked={!!locked}
                        lockReason={reason}
                        dragging={dragModuleId === item.moduleId}
                        onToggle={() => toggleModule(item.moduleId)}
                        onDragStart={() => setDragModuleId(item.moduleId)}
                        onDragEnd={() => setDragModuleId(null)}
                        onDrop={() => {
                          if (dragModuleId) reorderModules(dragModuleId, item.moduleId);
                          setDragModuleId(null);
                        }}
                      />
                    );
                  })}
                </div>
              </Panel>

              <Panel title="3. Dashboard cards">
                <div className="grid gap-3 sm:grid-cols-2">
                  {industry.dashboardCards.map((id) => {
                    const selected = dashboardCards.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleDashboardCard(id)}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-left transition",
                          selected
                            ? "border-[#0050F8] bg-[#eef3ff]"
                            : "border-[#e2e8f0] bg-white opacity-70",
                        )}
                      >
                        <p className="text-sm font-semibold text-[#0f172a]">
                          {DASHBOARD_CARD_CATALOG[id]?.label ?? id}
                        </p>
                        <p className="mt-1 text-xs text-[#64748b]">
                          {DASHBOARD_CARD_CATALOG[id]?.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Panel>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
              <div className="rounded-3xl border border-[#e2e8f0] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#0f172a]">Live shell preview</h4>
                  <div className="flex gap-1">
                    {(
                      [
                        ["desktop", Monitor],
                        ["tablet", Tablet],
                        ["mobile", Smartphone],
                      ] as const
                    ).map(([device, Icon]) => (
                      <button
                        key={device}
                        type="button"
                        onClick={() => setPreviewDevice(device)}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg",
                          previewDevice === device ? "bg-[#eef3ff] text-[#0050F8]" : "text-[#94a3b8]",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={cn(
                    "mx-auto overflow-hidden rounded-2xl border border-[#e2e8f0] transition-all",
                    themeMode === "dark" ? "bg-[#0f172a] text-white" : "bg-[#f8fafc] text-[#0f172a]",
                    previewDevice === "desktop" && "w-full",
                    previewDevice === "tablet" && "w-[85%]",
                    previewDevice === "mobile" && "w-[62%]",
                  )}
                >
                  <div
                    className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span className="truncate">{businessName || industry.name}</span>
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      {themeMode}
                    </span>
                  </div>
                  <div className="flex min-h-[280px]">
                    {previewDevice !== "mobile" && (
                      <div
                        className={cn(
                          "w-[38%] space-y-1 border-r p-2 text-[11px]",
                          themeMode === "dark" ? "border-white/10 bg-[#111827]" : "border-[#e2e8f0] bg-white",
                        )}
                      >
                        {orderedNavForPreview.slice(0, 8).map((n) => (
                            <div key={n.moduleId} className="truncate rounded-lg px-2 py-1.5 font-medium">
                              {n.label}
                            </div>
                          ))}
                      </div>
                    )}
                    <div className="flex-1 p-3">
                      <p className="mb-2 text-xs font-semibold opacity-70">Dashboard</p>
                      <div className="grid grid-cols-2 gap-2">
                        {dashboardCards.slice(0, 4).map((id) => (
                          <div
                            key={id}
                            className={cn(
                              "rounded-xl p-2",
                              themeMode === "dark" ? "bg-white/5" : "bg-white border border-[#e8eef7]",
                            )}
                          >
                            <p className="truncate text-[10px] opacity-60">
                              {DASHBOARD_CARD_CATALOG[id]?.label}
                            </p>
                            <p className="mt-1 text-sm font-semibold" style={{ color: secondaryColor }}>
                              •••
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-[11px] opacity-60">
                        {productsLabel} · {enabledModules.length} modules · drag cards to reorder nav
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {step === "generate" && industry && (
        <div className="mx-auto max-w-3xl space-y-6">
          <article className="rounded-3xl border border-[#bbf7d0] bg-[#f0fdf4] p-6 text-center shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#16a34a] text-white">
              <Check className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-semibold text-[#14532d]">UI template generated</h3>
            <p className="mt-2 text-sm text-[#166534]">
              Configuration saved to local storage (mock). Backend template API can replace this later without redesigning screens.
            </p>
          </article>

          <article className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <h4 className="text-lg font-semibold text-[#0f172a]">{businessName}</h4>
            <p className="mt-1 text-sm text-[#64748b]">
              {industry.name} · {FAMILY_LABELS[industry.family]} · {enabledModules.length} modules · {themeMode} · {primaryColor} / {secondaryColor}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {lastSavedId && (
                <Link
                  href={`/dashboard/superAdmin/industry-templates/preview?id=${lastSavedId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#001840] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  <Eye className="h-4 w-4" /> Open industry UI preview
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setStep("select");
                  setSelectedId(null);
                  setLastSavedId(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-semibold text-[#0f172a]"
              >
                Configure another industry
              </button>
            </div>
          </article>
        </div>
      )}
    </AdminShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
      <h3 className="mb-4 text-lg font-semibold text-[#0f172a]">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-[#64748b]">{label}</span>
      {children}
    </label>
  );
}

function PreviewList({
  title,
  items,
  checked,
}: {
  title: string;
  items: string[];
  checked?: boolean;
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">{title}</h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-[#334155]">
            <span className={cn("mt-0.5", checked ? "text-[#16a34a]" : "text-[#94a3b8]")}>
              {checked ? "✓" : "○"}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModuleChip({
  id,
  label,
  checked,
  locked,
  lockReason,
  dragging,
  onToggle,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  id: ModuleId;
  label?: string;
  checked?: boolean;
  locked?: boolean;
  lockReason?: string | null;
  dragging?: boolean;
  onToggle?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
}) {
  const meta = MODULE_CATALOG[id];
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.();
      }}
      className={cn(
        "rounded-2xl border px-3 py-3 text-left transition",
        checked ? "border-[#0050F8] bg-[#eef3ff]" : "border-[#e2e8f0] bg-white opacity-80",
        dragging && "scale-[0.98] border-dashed opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab text-[#94a3b8] active:cursor-grabbing"
          title="Drag to reorder sidebar"
          aria-label={`Reorder ${label ?? meta?.label ?? id}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
          title={locked ? lockReason ?? "Locked" : checked ? "Disable module" : "Enable module"}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-md text-xs font-bold",
                checked ? "bg-[#0050F8] text-white" : "bg-[#e2e8f0] text-[#64748b]",
              )}
            >
              {checked ? "✓" : ""}
            </span>
            <p className="truncate text-sm font-semibold text-[#0f172a]">
              {label ?? meta?.label ?? id}
            </p>
            {locked ? <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-[#94a3b8]" /> : null}
          </div>
          <p className="mt-1 line-clamp-2 pl-7 text-xs text-[#64748b]">{meta?.description}</p>
          {locked ? (
            <p className="mt-1 pl-7 text-[11px] font-semibold text-[#64748b]">
              {lockReason ?? "Always on"}
            </p>
          ) : (
            <p className="mt-1 pl-7 text-[11px] font-medium text-[#94a3b8]">
              {checked
                ? "Enabled · unselect clears linked modules"
                : "Off · enable pulls required linked modules"}
            </p>
          )}
        </button>
      </div>
    </div>
  );
}

export default function IndustryTemplatesPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <IndustryTemplatesContent />
    </Suspense>
  );
}
