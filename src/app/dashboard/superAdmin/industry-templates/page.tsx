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
import { ACCENT_COLORS, DASHBOARD_CARD_CATALOG, MODULE_CATALOG } from "@/templates/modules";
import type {
  AccentColor,
  CustomizedTemplateConfig,
  DashboardCardId,
  IndustryTemplate,
  ModuleId,
  ThemeMode,
} from "@/templates/types";
import { cn } from "@/lib/utils";

type WizardStep = "select" | "preview" | "customize" | "generate";

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: "select", label: "Select Industry" },
  { id: "preview", label: "Template Preview" },
  { id: "customize", label: "Customize" },
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
  const [accent, setAccent] = useState<AccentColor>("blue");
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>([]);
  const [dashboardCards, setDashboardCards] = useState<DashboardCardId[]>([]);
  const [navItems, setNavItems] = useState<CustomizedTemplateConfig["navigation"]>([]);
  const [productLabel, setProductLabel] = useState("Product");
  const [productsLabel, setProductsLabel] = useState("Products");
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  useEffect(() => {
    setSaved(loadSavedTemplates());
  }, []);

  const industry = useMemo(
    () => (selectedId ? getIndustryById(selectedId) ?? null : null),
    [selectedId],
  );

  function hydrateFromIndustry(tpl: IndustryTemplate) {
    setBusinessName(`${tpl.name} Demo`);
    setAccent(tpl.theme.accent);
    setThemeMode("light");
    setEnabledModules([...tpl.modules]);
    setDashboardCards([...tpl.dashboardCards]);
    setProductLabel(tpl.labels.product);
    setProductsLabel(tpl.labels.products);
    setNavItems(buildDefaultNavigation(tpl.modules, tpl.labels));
  }

  function selectIndustry(id: string) {
    const tpl = getIndustryById(id);
    if (!tpl) return;
    setSelectedId(id);
    hydrateFromIndustry(tpl);
    setStep("preview");
  }

  function toggleOptionalModule(moduleId: ModuleId) {
    if (!industry) return;
    if (industry.modules.includes(moduleId)) return;

    setEnabledModules((prev) => {
      const next = prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId];

      setNavItems((current) => {
        const labels = { product: productLabel, products: productsLabel };
        const rebuilt = buildDefaultNavigation(next, labels);
        return rebuilt.map((item) => {
          const existing = current.find((c) => c.moduleId === item.moduleId);
          return existing ? { ...item, label: existing.label, visible: existing.visible } : item;
        });
      });

      return next;
    });
  }

  function toggleDashboardCard(cardId: DashboardCardId) {
    setDashboardCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId],
    );
  }

  function moveNav(index: number, direction: -1 | 1) {
    setNavItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
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
      accent,
      themeMode,
      enabledModules,
      dashboardCards,
      labels: {
        ...industry.labels,
        product: productLabel,
        products: productsLabel,
      },
      navigation: navItems,
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

  const accentMeta = ACCENT_COLORS[accent] ?? ACCENT_COLORS.blue;
  const stepIndex = STEPS.findIndex((s) => s.id === step);

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
                else if (selectedId) setStep(item.id);
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
                      style={{ backgroundColor: color.soft, color: color.value }}
                    >
                      <IndustryIcon name={tpl.theme.icon} />
                    </div>
                    <p className="text-base font-semibold text-[#0f172a]">{tpl.name}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                      {FAMILY_LABELS[tpl.family]}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm text-[#64748b]">{tpl.description}</p>
                    <p className="mt-4 text-sm font-semibold text-[#0050F8] group-hover:underline">
                      View template →
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {step === "preview" && industry && (
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
              onClick={() => setStep("customize")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#001840] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(0,24,64,0.2)]"
            >
              Customize template <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <div className="mb-5 flex items-start gap-4">
                <div
                  className="grid h-14 w-14 place-items-center rounded-2xl"
                  style={{ backgroundColor: accentMeta.soft, color: accentMeta.value }}
                >
                  <IndustryIcon name={industry.theme.icon} className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-[#0f172a]">{industry.name} Template</h3>
                  <p className="mt-1 text-sm text-[#64748b]">{industry.description}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
                    {FAMILY_LABELS[industry.family]}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <PreviewList title="Included modules" items={industry.modules.map((id) => MODULE_CATALOG[id]?.label ?? id)} checked />
                <PreviewList title="Optional modules" items={industry.optionalModules.map((id) => MODULE_CATALOG[id]?.label ?? id)} />
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <PreviewList title="Available roles" items={industry.roles} />
                <PreviewList title="Key workflows" items={industry.workflows} />
              </div>

              <div className="mt-6">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
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
            </article>

            <div className="space-y-6">
              <article className="rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
                  Sidebar preview
                </h4>
                <div className="rounded-2xl border border-[#edf2f7] bg-[#f8fbff] p-3">
                  <div className="mb-3 border-b border-[#edf2f7] pb-3">
                    <p className="text-sm font-semibold text-[#0f172a]">{industry.name}</p>
                    <p className="text-xs text-[#64748b]">Restaurant Manager shell</p>
                  </div>
                  <div className="space-y-1">
                    {industry.modules.slice(0, 10).map((id) => (
                      <div
                        key={id}
                        className="rounded-xl px-3 py-2 text-sm font-medium text-[#334155] hover:bg-white"
                      >
                        {MODULE_CATALOG[id]?.label ?? id}
                      </div>
                    ))}
                    {industry.modules.length > 10 && (
                      <p className="px-3 pt-1 text-xs text-[#94a3b8]">
                        +{industry.modules.length - 10} more modules
                      </p>
                    )}
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
                  Dashboard cards
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {industry.dashboardCards.map((id) => (
                    <div
                      key={id}
                      className="rounded-2xl border border-[#e8eef7] bg-[#f8fafc] px-3 py-3"
                    >
                      <p className="text-xs text-[#64748b]">{DASHBOARD_CARD_CATALOG[id]?.label ?? id}</p>
                      <p className="mt-1 text-lg font-semibold text-[#0f172a]">—</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      )}

      {step === "customize" && industry && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep("preview")}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to preview
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

                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-[#64748b]">Accent colour</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAccent(key)}
                        className={cn(
                          "h-9 w-9 rounded-full border-2 transition",
                          accent === key ? "border-[#0f172a] scale-110" : "border-transparent",
                        )}
                        style={{ backgroundColor: ACCENT_COLORS[key].value }}
                        title={ACCENT_COLORS[key].label}
                      />
                    ))}
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

              <Panel title="2. Modules">
                <p className="mb-4 text-sm text-[#64748b]">
                  Required modules are locked. Optional packs can be toggled.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {industry.modules.map((id) => (
                    <ModuleChip key={id} id={id} locked checked />
                  ))}
                  {industry.optionalModules.map((id) => (
                    <ModuleChip
                      key={id}
                      id={id}
                      checked={enabledModules.includes(id)}
                      onToggle={() => toggleOptionalModule(id)}
                    />
                  ))}
                </div>
              </Panel>

              <Panel title="3. Navigation">
                <p className="mb-4 text-sm text-[#64748b]">
                  Show/hide, rename, and reorder sidebar items.
                </p>
                <div className="space-y-2">
                  {navItems.map((item, index) => (
                    <div
                      key={item.moduleId}
                      className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e8eef7] bg-[#f8fafc] px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={item.visible}
                        disabled={industry.modules.includes(item.moduleId) && item.moduleId === "dashboard"}
                        onChange={(e) =>
                          setNavItems((prev) =>
                            prev.map((n, i) => (i === index ? { ...n, visible: e.target.checked } : n)),
                          )
                        }
                      />
                      <input
                        value={item.label}
                        onChange={(e) =>
                          setNavItems((prev) =>
                            prev.map((n, i) => (i === index ? { ...n, label: e.target.value } : n)),
                          )
                        }
                        className="min-w-0 flex-1 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-sm font-medium"
                      />
                      <button type="button" onClick={() => moveNav(index, -1)} className="rounded-lg border border-[#e2e8f0] bg-white px-2 py-1 text-xs font-semibold">
                        ↑
                      </button>
                      <button type="button" onClick={() => moveNav(index, 1)} className="rounded-lg border border-[#e2e8f0] bg-white px-2 py-1 text-xs font-semibold">
                        ↓
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="4. Dashboard cards">
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
                    style={{ background: `linear-gradient(90deg,#001840,${accentMeta.value})` }}
                  >
                    <span className="truncate">{businessName || industry.name}</span>
                    <span className="opacity-80">{themeMode}</span>
                  </div>
                  <div className="flex min-h-[280px]">
                    {previewDevice !== "mobile" && (
                      <div
                        className={cn(
                          "w-[38%] space-y-1 border-r p-2 text-[11px]",
                          themeMode === "dark" ? "border-white/10 bg-[#111827]" : "border-[#e2e8f0] bg-white",
                        )}
                      >
                        {navItems
                          .filter((n) => n.visible)
                          .slice(0, 8)
                          .map((n) => (
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
                            <p className="mt-1 text-sm font-semibold" style={{ color: accentMeta.value }}>
                              •••
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-[11px] opacity-60">
                        {productsLabel} · {enabledModules.length} modules active
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
              {industry.name} · {FAMILY_LABELS[industry.family]} · {enabledModules.length} modules · {themeMode} · {accent}
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
  checked,
  locked,
  onToggle,
}: {
  id: ModuleId;
  checked?: boolean;
  locked?: boolean;
  onToggle?: () => void;
}) {
  const meta = MODULE_CATALOG[id];
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onToggle}
      className={cn(
        "rounded-2xl border px-3 py-3 text-left transition",
        checked ? "border-[#0050F8] bg-[#eef3ff]" : "border-[#e2e8f0] bg-white",
        locked && "cursor-default opacity-90",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid h-5 w-5 place-items-center rounded-md text-xs font-bold",
            checked ? "bg-[#0050F8] text-white" : "bg-[#e2e8f0] text-[#64748b]",
          )}
        >
          {checked ? "✓" : ""}
        </span>
        <p className="text-sm font-semibold text-[#0f172a]">{meta?.label ?? id}</p>
      </div>
      <p className="mt-1 line-clamp-2 pl-7 text-xs text-[#64748b]">{meta?.description}</p>
      {locked && <p className="mt-1 pl-7 text-[11px] font-semibold text-[#94a3b8]">Required</p>}
    </button>
  );
}

export default function IndustryTemplatesPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <IndustryTemplatesContent />
    </Suspense>
  );
}
