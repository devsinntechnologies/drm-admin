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
  Trash2,
  Copy,
  ExternalLink,
  ImagePlus,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader } from "@/components/admin/PortalPage";
import { IndustryIcon } from "@/components/templates/IndustryIcon";
import { TemplatePreviewFrame } from "@/components/templates/TemplatePreviewFrame";
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
  const [dashboardCardOrder, setDashboardCardOrder] = useState<DashboardCardId[]>([]);
  const [dragDashboardCardId, setDragDashboardCardId] = useState<DashboardCardId | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

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
    setDashboardCardOrder([...tpl.dashboardCards]);
    setProductLabel(tpl.labels.product);
    setProductsLabel(tpl.labels.products);
    setLogoDataUrl(null);
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

  function reorderDashboardCards(fromId: DashboardCardId, toId: DashboardCardId) {
    if (fromId === toId) return;
    setDashboardCardOrder((prev) => {
      const from = prev.findIndex((id) => id === fromId);
      const to = prev.findIndex((id) => id === toId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const orderedEnabledDashboardCards = useMemo(
    () => dashboardCardOrder.filter((id) => dashboardCards.includes(id)),
    [dashboardCardOrder, dashboardCards],
  );

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
      dashboardCards: orderedEnabledDashboardCards,
      labels: {
        ...industry.labels,
        product: productLabel,
        products: productsLabel,
      },
      logoDataUrl: logoDataUrl ?? undefined,
      navigation: orderedNavForPreview,
    });

    const next = saveTemplateConfig(config);
    setSaved(next);
    setLastSavedId(config.id);
    setStep("generate");
    toast.success("Industry template saved locally");
  }

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, or SVG).");
      return;
    }
    if (file.size > 512 * 1024) {
      toast.error("Logo must be smaller than 512 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoDataUrl(reader.result);
        toast.success("Logo added to template preview");
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
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
      <PortalPage>
      <PortalPageHeader
        icon={LayoutTemplate}
        title="Industry Templates"
        subtitle="One DigiNizam UI — fifteen industry configurations with shared modules"
      />

      <nav aria-label="Template wizard" className="portal-step-pipeline mb-6">
        {STEPS.map((item, index) => {
          const active = item.id === step;
          const done = index < stepIndex;
          return (
            <div key={item.id} className="contents">
              {index > 0 ? <span className="portal-step-divider" aria-hidden /> : null}
              <button
                type="button"
                onClick={() => {
                  if (item.id === "select") setStep("select");
                  else if (item.id === "customize" && selectedId) setStep("customize");
                  else if (item.id === "generate" && lastSavedId) setStep("generate");
                }}
                className="portal-step-item"
                data-active={active ? "true" : undefined}
                data-done={done ? "true" : undefined}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold",
                    active && "bg-white/15 text-white",
                    done && !active && "bg-[#0050F8]/12 text-[#0050F8]",
                    !active && !done && "border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.label.split(" ")[0]}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {step === "select" && (
        <div className="space-y-8">
          {saved.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
              <div className="flex items-center gap-3 border-b border-[#f1f5f9] px-5 py-4">
                <div className="grid h-9 w-9 place-items-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[#0050F8]">
                  <Layers3 className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold tracking-tight text-[#0f172a]">Saved configurations</h3>
                  <p className="text-xs text-[#64748b]">Quick access to your generated templates</p>
                </div>
                <span className="shrink-0 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  {saved.length} saved
                </span>
              </div>
              <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                {saved.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#e2e8f0] bg-[#fafbfc] px-4 py-3.5 transition-colors hover:border-[#cbd5e1] hover:bg-white"
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

          <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
            <div className="flex items-end justify-between gap-3 border-b border-[#f1f5f9] px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#0050F8]">Step 01</p>
                <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-[#0f172a]">Select business industry</h3>
              </div>
              <span className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#64748b]">
                {INDUSTRY_TEMPLATES.length} templates
              </span>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {INDUSTRY_TEMPLATES.map((tpl) => {
                const color = ACCENT_COLORS[tpl.theme.accent] ?? ACCENT_COLORS.blue;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => selectIndustry(tpl.id)}
                    className="portal-industry-card group"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#e2e8f0]"
                        style={{ backgroundColor: color.soft, color: color.secondary }}
                      >
                        <IndustryIcon name={tpl.theme.icon} />
                      </div>
                      <span className="rounded border border-[#e2e8f0] bg-[#f8fafc] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">
                        {FAMILY_LABELS[tpl.family].split(" ")[0]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold tracking-tight text-[#0f172a]">{tpl.name}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a3b8]">
                      {FAMILY_LABELS[tpl.family]}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#64748b]">{tpl.description}</p>
                    <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#0050F8] opacity-80 transition-opacity group-hover:opacity-100">
                      Customize template
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="dn-btn dn-btn-ghost inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to industries
            </button>
            <div className="hidden items-center gap-2 text-xs font-medium text-[#64748b] sm:flex">
              <span className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1">{industry.name}</span>
              <span>{enabledModules.length} modules</span>
              <span>·</span>
              <span>{dashboardCards.length} dashboard cards</span>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="dn-btn dn-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
            >
              Create business UI <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <TemplatePreviewFrame
            businessName={businessName || industry.name}
            industryIcon={industry.theme.icon}
            industryId={industry.id}
            logoDataUrl={logoDataUrl}
            themeMode={themeMode}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            currency={currency}
            labels={{
              ...industry.labels,
              product: productLabel,
              products: productsLabel,
            }}
            navItems={orderedNavForPreview}
            dashboardCards={orderedEnabledDashboardCards}
            productsLabel={productsLabel}
            device={previewDevice}
            onDeviceChange={setPreviewDevice}
            moduleCount={enabledModules.length}
            cardCount={dashboardCards.length}
          />

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
                  <div className="portal-callout mb-4">
                    <p className="font-semibold text-[#0f172a]">Customization model</p>
                    <p className="mt-1">{modulePlan.summary}</p>
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
                <div className="mb-4 rounded-xl border border-dashed border-[#cbd5e1] bg-[#fafbfc] p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
                      {logoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoDataUrl} alt="Business logo preview" className="h-full w-full object-contain p-1" />
                      ) : (
                        <IndustryIcon name={industry.theme.icon} className="h-8 w-8 text-[#94a3b8]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0f172a]">Business logo</p>
                      <p className="mt-0.5 text-xs text-[#64748b]">
                        Upload a logo for this template. Shown in the sidebar preview and saved with the configuration.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <label className="dn-btn dn-btn-ghost inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-semibold text-[#0f172a]">
                          <ImagePlus className="h-4 w-4" />
                          Upload logo
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                        {logoDataUrl ? (
                          <button
                            type="button"
                            onClick={() => setLogoDataUrl(null)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#fee2e2] bg-white px-3 py-2 text-xs font-semibold text-[#dc2626]"
                          >
                            <X className="h-3.5 w-3.5" /> Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
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
                <p className="mb-4 text-sm text-[#64748b]">
                  Choose KPI cards for the business dashboard. Toggle cards on or off and drag to set display order.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dashboardCardOrder.map((id) => {
                    const selected = dashboardCards.includes(id);
                    return (
                      <DashboardCardChip
                        key={id}
                        id={id}
                        checked={selected}
                        dragging={dragDashboardCardId === id}
                        onToggle={() => toggleDashboardCard(id)}
                        onDragStart={() => setDragDashboardCardId(id)}
                        onDragEnd={() => setDragDashboardCardId(null)}
                        onDrop={() => {
                          if (dragDashboardCardId) {
                            reorderDashboardCards(dragDashboardCardId, id);
                          }
                          setDragDashboardCardId(null);
                        }}
                      />
                    );
                  })}
                </div>
              </Panel>
          </div>
        </div>
      )}

      {step === "generate" && industry && (
        <div className="space-y-6">
          <section className="portal-header">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]">
                  <Check className="h-7 w-7" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0050F8]">Step 03 complete</p>
                  <h2 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-2xl">
                    Business UI template generated
                  </h2>
                  <p className="mt-0.5 text-sm text-[#64748b]">
                    {businessName} is ready to preview. Configuration saved locally until the template API is connected.
                  </p>
                </div>
              </div>
              {lastSavedId ? (
                <Link
                  href={`/dashboard/superAdmin/industry-templates/preview?id=${lastSavedId}`}
                  className="dn-btn dn-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
                >
                  <ExternalLink className="h-4 w-4" /> Open full preview
                </Link>
              ) : null}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <Panel title="Configuration summary">
                <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Industry", value: industry.name },
                    { label: "Modules", value: String(enabledModules.length) },
                    { label: "Dashboard cards", value: String(orderedEnabledDashboardCards.length) },
                    { label: "Theme", value: themeMode },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-[#e2e8f0] bg-[#fafbfc] px-3 py-2.5"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#0f172a]">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-[#64748b]">Brand colours</span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-xs font-mono">
                    <span className="h-4 w-4 rounded border border-[#e2e8f0]" style={{ backgroundColor: primaryColor }} />
                    {primaryColor}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-xs font-mono">
                    <span className="h-4 w-4 rounded border border-[#e2e8f0]" style={{ backgroundColor: secondaryColor }} />
                    {secondaryColor}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                      Enabled modules
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {orderedNavForPreview
                        .filter((item) => enabledModules.includes(item.moduleId))
                        .slice(0, 12)
                        .map((item) => (
                          <span
                            key={item.moduleId}
                            className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#334155]"
                          >
                            {item.label}
                          </span>
                        ))}
                      {enabledModules.length > 12 ? (
                        <span className="rounded-md border border-[#e2e8f0] px-2.5 py-1 text-xs font-medium text-[#64748b]">
                          +{enabledModules.length - 12} more
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                      Dashboard cards
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {orderedEnabledDashboardCards.slice(0, 8).map((id) => (
                        <span
                          key={id}
                          className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#334155]"
                        >
                          {DASHBOARD_CARD_CATALOG[id]?.label ?? id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel title="What's next">
                <ul className="space-y-3 text-sm text-[#475569]">
                  <li className="flex gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#0050F8]" />
                    Open the full preview to walk through modules with mock data.
                  </li>
                  <li className="flex gap-2">
                    <Copy className="mt-0.5 h-4 w-4 shrink-0 text-[#0050F8]" />
                    Template id is stored in local storage — backend sync can replace this later.
                  </li>
                </ul>
                <div className="mt-5 flex flex-wrap gap-3">
                  {lastSavedId ? (
                    <Link
                      href={`/dashboard/superAdmin/industry-templates/preview?id=${lastSavedId}`}
                      className="dn-btn dn-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
                    >
                      <Eye className="h-4 w-4" /> Open industry UI preview
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setStep("select");
                      setSelectedId(null);
                      setLastSavedId(null);
                    }}
                    className="dn-btn dn-btn-ghost inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-semibold text-[#0f172a]"
                  >
                    Configure another industry
                  </button>
                </div>
              </Panel>
            </div>

            <aside className="xl:sticky xl:top-4 xl:self-start">
              <TemplatePreviewFrame
                businessName={businessName}
                industryIcon={industry.theme.icon}
                industryId={industry.id}
                logoDataUrl={logoDataUrl}
                themeMode={themeMode}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                currency={currency}
                labels={{
                  ...industry.labels,
                  product: productLabel,
                  products: productsLabel,
                }}
                navItems={orderedNavForPreview}
                dashboardCards={orderedEnabledDashboardCards}
                productsLabel={productsLabel}
                device={previewDevice}
                onDeviceChange={setPreviewDevice}
                moduleCount={enabledModules.length}
                cardCount={orderedEnabledDashboardCards.length}
              />
            </aside>
          </div>
        </div>
      )}
      </PortalPage>
    </AdminShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="portal-panel">
      <div className="portal-panel-header">
        <h3 className="text-base font-semibold tracking-tight text-[#0f172a]">{title}</h3>
      </div>
      <div className="portal-panel-body">{children}</div>
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

function ConfigChip({
  selected,
  locked = false,
  dragging,
  dragLabel,
  toggleTitle,
  title,
  description,
  footer,
  trailing,
  onToggle,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  selected?: boolean;
  locked?: boolean;
  dragging?: boolean;
  dragLabel: string;
  toggleTitle: string;
  title: string;
  description?: string;
  footer: string;
  trailing?: React.ReactNode;
  onToggle?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
}) {
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
      data-selected={selected ? "true" : undefined}
      data-locked={locked ? "true" : undefined}
      className={cn(
        "portal-config-chip rounded-xl border border-[#e2e8f0] px-3 py-3 text-left",
        !selected && "opacity-90",
        dragging && "portal-config-chip--dragging",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="portal-config-chip-handle mt-0.5 text-[#94a3b8]"
          title="Drag to reorder"
          aria-label={dragLabel}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div
          className={cn(
            "portal-config-chip-toggle min-w-0 flex-1 outline-none",
            locked ? "cursor-not-allowed" : "cursor-pointer",
          )}
          tabIndex={locked ? -1 : 0}
          aria-disabled={locked || undefined}
          onClick={() => {
            if (!locked) onToggle?.();
          }}
          onKeyDown={(e) => {
            if (locked) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle?.();
            }
          }}
          title={toggleTitle}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-md border text-xs font-bold",
                selected
                  ? "border-[#0050F8] bg-[#0050F8] text-white"
                  : "border-[#e2e8f0] bg-white text-[#64748b]",
              )}
            >
              {selected ? "✓" : ""}
            </span>
            <p className="truncate text-sm font-semibold text-[#0f172a]">{title}</p>
            {trailing}
          </div>
          {description ? (
            <p className="mt-1 line-clamp-2 pl-7 text-xs text-[#64748b]">{description}</p>
          ) : null}
          <p
            className={cn(
              "mt-1 pl-7 text-[11px]",
              locked ? "font-semibold text-[#64748b]" : "font-medium text-[#94a3b8]",
            )}
          >
            {footer}
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardCardChip({
  id,
  checked,
  dragging,
  onToggle,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  id: DashboardCardId;
  checked?: boolean;
  dragging?: boolean;
  onToggle?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
}) {
  const meta = DASHBOARD_CARD_CATALOG[id];
  return (
    <ConfigChip
      selected={checked}
      dragging={dragging}
      dragLabel={`Reorder ${meta?.label ?? id}`}
      toggleTitle={checked ? "Hide card" : "Show card"}
      title={meta?.label ?? id}
      description={meta?.description}
      footer={checked ? "Enabled · shown on dashboard" : "Off · hidden from dashboard"}
      onToggle={onToggle}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    />
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
  const displayLabel = label ?? meta?.label ?? id;
  return (
    <ConfigChip
      selected={checked}
      locked={!!locked}
      dragging={dragging}
      dragLabel={`Reorder ${displayLabel}`}
      toggleTitle={locked ? lockReason ?? "Locked" : checked ? "Disable module" : "Enable module"}
      title={displayLabel}
      description={meta?.description}
      footer={
        locked
          ? lockReason ?? "Always on"
          : checked
            ? "Enabled · unselect clears linked modules"
            : "Off · enable pulls required linked modules"
      }
      trailing={locked ? <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-[#94a3b8]" /> : null}
      onToggle={onToggle}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    />
  );
}

export default function IndustryTemplatesPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <IndustryTemplatesContent />
    </Suspense>
  );
}
