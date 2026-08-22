"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Layers3,
  LayoutTemplate,
  Trash2,
  Copy,
  ExternalLink,
  ImagePlus,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { readLogoAsDataUrl, validateLogoFile } from "@/lib/logo-upload";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage } from "@/components/admin/PortalPage";
import { IndustryIcon } from "@/components/templates/IndustryIcon";
import { GptPreviewDrawer } from "@/components/wizard/GptPreviewDrawer";
import { GptPreviewButton } from "@/components/wizard/GptPreviewButton";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { DashboardCardChip, ModuleChip } from "@/components/wizard/TemplateConfigChips";
import { TemplateThemeFields } from "@/components/wizard/TemplateThemeFields";
import { createCustomizedConfig, buildDefaultNavigation } from "@/template-engine/builder";
import { persistTemplateConfig } from "@/template-engine/persist-template-config";
import { createDefaultExtensions } from "@/template-engine/template-extensions-storage";
import { deleteTemplateConfig, loadSavedTemplates } from "@/template-engine/storage";
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
} from "@/templates/modules";
import type {
  CustomizedTemplateConfig,
  DashboardCardId,
  IndustryTemplate,
  ModuleId,
  TemplateBuilderStepId,
  TemplateConfigExtensions,
  ThemeMode,
} from "@/templates/types";
import { cn } from "@/lib/utils";
import { PharmacyCountryPicker } from "@/components/pharmacy/PharmacyCountryPicker";
import { pharmacyCountryDefaults, type PharmacyMarketCode } from "@/lib/pharmacy-market";

const STEPS: Array<{ id: TemplateBuilderStepId; label: string; description: string }> = [
  { id: "industry", label: "Industry", description: "Pick a blueprint" },
  { id: "business-profile", label: "Profile", description: "Business info" },
  { id: "theme", label: "Theme", description: "Colors & style" },
  { id: "modules", label: "Modules", description: "Features & menu" },
  { id: "dashboard-cards", label: "KPIs", description: "Dashboard cards" },
  { id: "dashboard-widgets", label: "Widgets", description: "Charts & feeds" },
  { id: "forms", label: "Forms", description: "Custom fields" },
  { id: "permissions", label: "Roles", description: "Access control" },
  { id: "preview", label: "Save", description: "Finish template" },
];

function IndustryTemplatesContent() {
  const [step, setStep] = useState<TemplateBuilderStepId>("industry");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState<CustomizedTemplateConfig[]>([]);

  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [market, setMarket] = useState<PharmacyMarketCode>("PK");
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
  const [extensions, setExtensions] = useState<TemplateConfigExtensions>({});
  const [gptOpen, setGptOpen] = useState(false);

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
    if (tpl.id === "pharmacy") {
      const defaults = pharmacyCountryDefaults("PK");
      setMarket(defaults.market);
      setCurrency(defaults.currency);
      setLocation(defaults.location);
    }
    setLogoDataUrl(null);
    setExtensions(createDefaultExtensions(tpl.name));
    setNavItems(
      buildDefaultNavigation(available, labels, tpl.id).map((item) => ({
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
    setStep("business-profile");
  }

  function applyModuleSelection(nextEnabled: ModuleId[]) {
    setEnabledModules(nextEnabled);
    setNavItems((current) => {
      const labels = { product: productLabel, products: productsLabel };
      const available = industry
        ? getAvailableModules(industry.modules, industry.optionalModules)
        : nextEnabled;
      const rebuilt = buildDefaultNavigation(available, labels, industry?.id);
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

  async function handleGenerate() {
    if (!industry) return;
    if (!businessName.trim()) {
      toast.error("Business name is required");
      return;
    }

    const config = createCustomizedConfig({
      businessName,
      industry,
      currency,
      market: industry.id === "pharmacy" ? market : undefined,
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

    const withExtensions = { ...config, extensions };
    const result = await persistTemplateConfig(withExtensions);
    setSaved(loadSavedTemplates());
    setLastSavedId(result.config.id);
    setStep("preview");
    toast.success(result.persistedToApi ? "Industry template saved to platform" : result.warning ?? "Industry template saved");
  }

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const error = validateLogoFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    void readLogoAsDataUrl(file).then((dataUrl) => {
      setLogoDataUrl(dataUrl);
      toast.success("Logo added to template preview");
    });
    event.target.value = "";
  }

  function removeSaved(id: string) {
    setSaved(deleteTemplateConfig(id));
    if (lastSavedId === id) setLastSavedId(null);
    toast.success("Template removed");
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const softSecondary = `${secondaryColor}22`;

  const gptPreviewConfig = useMemo(
    () => ({
      businessName,
      industryId: industry?.id ?? selectedId ?? "",
      industryIcon: industry?.theme.icon,
      logoDataUrl,
      themeMode,
      primaryColor,
      secondaryColor,
      currency,
      labels: {
        ...(industry?.labels ?? { product: productLabel, products: productsLabel }),
        product: productLabel,
        products: productsLabel,
      },
      navItems: orderedNavForPreview,
      dashboardCards: orderedEnabledDashboardCards,
      productsLabel: productsLabel,
    }),
    [
      businessName,
      industry,
      selectedId,
      logoDataUrl,
      themeMode,
      primaryColor,
      secondaryColor,
      currency,
      productLabel,
      productsLabel,
      orderedNavForPreview,
      orderedEnabledDashboardCards,
    ],
  );

  function goToStep(next: TemplateBuilderStepId) {
    setStep(next);
  }

  function goNextStep() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  }

  function goPrevStep() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  }

  return (
    <AdminShell activeTab="industry-templates">
      <PortalPage>
      <div className="mb-5 rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 sm:px-5">
        <WizardStepper
          steps={STEPS}
          currentStepId={step}
          completedStepIds={STEPS.slice(0, stepIndex).map((s) => s.id)}
          allowJumpToCompleted={!!selectedId}
          onStepClick={(id) => {
            if (id === "industry") goToStep("industry");
            else if (selectedId) goToStep(id as TemplateBuilderStepId);
          }}
        />
      </div>

      {step === "industry" && (
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

      {step !== "industry" && step !== "preview" && industry && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white px-4 py-3">
            <button
              type="button"
              onClick={goPrevStep}
              className="dn-btn dn-btn-ghost inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a]"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="hidden items-center gap-2 text-xs font-medium text-[#64748b] sm:flex">
              <span className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1">{STEPS[stepIndex]?.label}</span>
              <span>{industry.name}</span>
              <span>·</span>
              <span>{enabledModules.length} modules</span>
            </div>
            <div className="flex items-center gap-2">
              <GptPreviewButton onClick={() => setGptOpen(true)} />
              {step === "permissions" ? (
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="dn-btn dn-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
                >
                  Save & Preview <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNextStep}
                  className="dn-btn dn-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
              {step === "business-profile" && (
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
                {industry.productScope?.length ? (
                  <div className="mt-6">
                    <h4 className="mb-1 text-sm font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
                      Complete product scope · {industry.productScope.length} modules
                    </h4>
                    <p className="mb-3 text-xs text-[#64748b]">
                      Sidebar combines related areas into {industry.modules.length} workspace modules. Every catalog module is listed below.
                    </p>
                    <div className="overflow-hidden rounded-xl border border-[#e2e8f0]">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Module</th>
                            <th className="px-3 py-2">Description</th>
                            <th className="px-3 py-2">Group</th>
                          </tr>
                        </thead>
                        <tbody>
                          {industry.productScope.map((item) => (
                            <tr key={item.number} className="border-t border-[#e2e8f0] align-top">
                              <td className="px-3 py-2 font-semibold text-[#0f172a]">{item.number}</td>
                              <td className="px-3 py-2 font-medium text-[#0f172a]">{item.name}</td>
                              <td className="px-3 py-2 text-xs leading-relaxed text-[#64748b]">{item.description}</td>
                              <td className="px-3 py-2">
                                <span className="rounded-md border border-[#e2e8f0] bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
                                  {item.group}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </Panel>
              )}

              {step === "business-profile" && (
              <Panel title="Business profile">
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
                {industry.id === "pharmacy" ? (
                  <div className="mb-4">
                    <PharmacyCountryPicker
                      value={market}
                      onChange={(code) => {
                        const defaults = pharmacyCountryDefaults(code);
                        setMarket(defaults.market);
                        setCurrency(defaults.currency);
                        setLocation((prev) => (prev.trim() ? prev : defaults.location));
                      }}
                    />
                  </div>
                ) : null}
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
                    {industry.id === "pharmacy" ? (
                      <input
                        value={`${currency} · ${market === "UK" ? "United Kingdom" : "Pakistan"}`}
                        disabled
                        className="portal-input opacity-70"
                      />
                    ) : (
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="portal-input">
                        <option value="PKR">PKR · Pakistan</option>
                        <option value="GBP">GBP · United Kingdom</option>
                        <option value="USD">USD</option>
                        <option value="AED">AED</option>
                        <option value="EUR">EUR</option>
                      </select>
                    )}
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
                  <Field label="Template name">
                    <input
                      value={extensions.templateName ?? ""}
                      onChange={(e) => setExtensions((prev) => ({ ...prev, templateName: e.target.value }))}
                      className="portal-input"
                    />
                  </Field>
                  <Field label="Template description">
                    <input
                      value={extensions.templateDescription ?? ""}
                      onChange={(e) => setExtensions((prev) => ({ ...prev, templateDescription: e.target.value }))}
                      className="portal-input"
                    />
                  </Field>
                </div>
              </Panel>
              )}

              {step === "theme" && (
              <Panel title="Theme & branding">
                <TemplateThemeFields
                  themeMode={themeMode}
                  onThemeModeChange={setThemeMode}
                  primaryColor={primaryColor}
                  onPrimaryColorChange={setPrimaryColor}
                  secondaryColor={secondaryColor}
                  onSecondaryColorChange={setSecondaryColor}
                  productLabel={productLabel}
                  onProductLabelChange={setProductLabel}
                  productsLabel={productsLabel}
                  onProductsLabelChange={setProductsLabel}
                />
              </Panel>
              )}

              {step === "modules" && (
              <Panel title="Modules & navigation">
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
                        industryId={industry.id}
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
              )}

              {step === "dashboard-cards" && (
              <Panel title="Dashboard KPI cards">
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
              )}

              {step === "dashboard-widgets" && (
              <Panel title="Dashboard widgets">
                <p className="mb-4 text-sm text-[#64748b]">Choose analytics widgets shown on the dashboard preview.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { id: "order-status-chart", label: "Order status chart" },
                    { id: "statistics-row", label: "Statistics row" },
                    { id: "top-products", label: "Top products" },
                    { id: "recent-orders", label: "Recent orders" },
                    { id: "activity-feed", label: "Activity feed" },
                  ].map((widget) => {
                    const active = extensions.dashboardWidgets?.includes(widget.id as never);
                    return (
                      <label key={widget.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm", active ? "border-[#001840] bg-[#eef3ff]" : "border-[#e2e8f0]")}>
                        <input
                          type="checkbox"
                          checked={!!active}
                          onChange={() => {
                            setExtensions((prev) => {
                              const current = prev.dashboardWidgets ?? [];
                              const next = active
                                ? current.filter((id) => id !== widget.id)
                                : [...current, widget.id as never];
                              return { ...prev, dashboardWidgets: next };
                            });
                          }}
                        />
                        {widget.label}
                      </label>
                    );
                  })}
                </div>
              </Panel>
              )}

              {step === "forms" && (
              <Panel title="Forms & business fields">
                <p className="mb-4 text-sm text-[#64748b]">Mark which business profile fields are required when creating a tenant.</p>
                <div className="space-y-2">
                  {(extensions.businessProfileFields ?? []).map((field, index) => (
                    <label key={field.id} className="flex items-center justify-between rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm">
                      <span>{field.label}</span>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => {
                          setExtensions((prev) => {
                            const fields = [...(prev.businessProfileFields ?? [])];
                            fields[index] = { ...fields[index], required: e.target.checked };
                            return { ...prev, businessProfileFields: fields };
                          });
                        }}
                      />
                    </label>
                  ))}
                </div>
              </Panel>
              )}

              {step === "permissions" && (
              <Panel title="Permissions & roles">
                <p className="mb-4 text-sm text-[#64748b]">Default roles included with this industry template.</p>
                <div className="flex flex-wrap gap-2">
                  {industry.roles.map((role) => (
                    <span key={role} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-sm font-medium">
                      {role}
                    </span>
                  ))}
                </div>
              </Panel>
              )}
          </div>
        </div>
      )}

      {step === "preview" && industry && (
        <div className="space-y-6">
          <section className="portal-header">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]">
                  <Check className="h-7 w-7" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0050F8]">Step 9 complete</p>
                  <h2 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-2xl">
                    Business UI template generated
                  </h2>
                  <p className="mt-0.5 text-sm text-[#64748b]">
                    {businessName} is ready to preview. Configuration saved to platform when API is available, otherwise stored locally.
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
              <GptPreviewButton onClick={() => setGptOpen(true)} />
            </div>
          </section>

          <div className="space-y-6">
            <div className="space-y-6">
              <Panel title="Configuration summary">
                <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Industry", value: industry.name },
                    {
                      label: "Country",
                      value:
                        industry.id === "pharmacy"
                          ? `${market === "UK" ? "United Kingdom" : "Pakistan"} · ${currency}`
                          : currency,
                    },
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
                    Use GPT Preview Template on any step to walk through modules with mock data.
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
                      setStep("industry");
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
          </div>
        </div>
      )}
      <GptPreviewDrawer
        open={gptOpen}
        onClose={() => setGptOpen(false)}
        stepId={step}
        stepLabel={STEPS.find((s) => s.id === step)?.label ?? "Preview"}
        config={gptPreviewConfig}
      />
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

export default function IndustryTemplatesPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <IndustryTemplatesContent />
    </Suspense>
  );
}
