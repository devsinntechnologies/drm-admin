"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, ImagePlus, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage } from "@/components/admin/PortalPage";
import { IndustryIcon } from "@/components/templates/IndustryIcon";
import { GptPreviewDrawer } from "@/components/wizard/GptPreviewDrawer";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { DashboardCardChip, ModuleChip } from "@/components/wizard/TemplateConfigChips";
import { TemplateThemeFields } from "@/components/wizard/TemplateThemeFields";
import { useTemplateBuilder } from "@/hooks/useTemplateBuilder";
import { useCreateBusinessMutation } from "@/hooks/useBusiness";
import { useListIndustriesQuery } from "@/hooks/useIndustryTemplate";
import { useGetPlansQuery } from "@/hooks/usePlan";
import { saveBusinessProfile } from "@/lib/business-profile";
import { loadAllTemplateConfigsLocal } from "@/template-engine/persist-template-config";
import { INDUSTRY_TEMPLATES } from "@/templates/industries";
import { colorsFromAccent } from "@/templates/modules";
import type { DashboardCardId, ModuleId } from "@/templates/types";
import type { BusinessSetupStepId } from "@/templates/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "select-template", label: "Template", description: "Pick your industry" },
  { id: "business-profile", label: "Profile", description: "Business details" },
  { id: "theme", label: "Theme", description: "Colors & branding" },
  { id: "modules", label: "Modules", description: "Enable features" },
  { id: "dashboard", label: "Dashboard", description: "KPI cards" },
  { id: "review", label: "Review", description: "Confirm setup" },
  { id: "generate", label: "Done", description: "Create business" },
] as const;

const countryOptions = [
  { label: "Pakistan (+92)", value: "+92" },
  { label: "United States (+1)", value: "+1" },
  { label: "United Arab Emirates (+971)", value: "+971" },
];

function BusinessSetupContent() {
  const router = useRouter();
  const builder = useTemplateBuilder();
  const [step, setStep] = useState<BusinessSetupStepId>("select-template");
  const [gptOpen, setGptOpen] = useState(false);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);

  const [manager, setManager] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+92");
  const [planId, setPlanId] = useState("");
  const [dragModuleId, setDragModuleId] = useState<ModuleId | null>(null);
  const [dragDashboardCardId, setDragDashboardCardId] = useState<DashboardCardId | null>(null);

  const [createBusiness, { isLoading: creating }] = useCreateBusinessMutation();
  const { data: apiIndustries } = useListIndustriesQuery();
  const { data: planData, isLoading: plansLoading } = useGetPlansQuery();
  const plans = useMemo(() => {
    if (Array.isArray(planData)) return planData;
    if (planData?.data && Array.isArray(planData.data.plans)) return planData.data.plans;
    if (planData?.plans && Array.isArray(planData.plans)) return planData.plans;
    return [];
  }, [planData]);
  const savedConfigs = useMemo(() => loadAllTemplateConfigsLocal(), []);

  useEffect(() => {
    if (apiIndustries?.length) {
      builder.loadApiCatalog(apiIndustries);
    }
  }, [apiIndustries, builder.loadApiCatalog]);

  const industriesForPicker = apiIndustries?.length ? apiIndustries : INDUSTRY_TEMPLATES;

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const completedSteps = STEPS.slice(0, stepIndex).map((s) => s.id);

  function goNext() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id as BusinessSetupStepId);
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.id as BusinessSetupStepId);
  }

  async function handleGenerateBusiness() {
    if (!builder.industry) return;
    if (!builder.businessName.trim() || !email.trim() || !address.trim() || !manager.trim() || !planId) {
      toast.error("Complete all required business fields before generating");
      setStep("business-profile");
      return;
    }

    const toastId = toast.loading("Creating business and applying template...");
    try {
      const phone = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;
      const created = await createBusiness({
        businessName: builder.businessName.trim(),
        address: address.trim(),
        phone,
        email: email.trim(),
        manager: manager.trim(),
        planId,
      }).unwrap();

      if (!created.id) {
        throw new Error("Business created but no ID returned");
      }

      const config = await builder.saveConfig(created.id);
      if (config) setSavedTemplateId(config.id);

      saveBusinessProfile(created.id, {
        industryId: builder.industry.id,
        primaryColor: builder.primaryColor,
        secondaryColor: builder.secondaryColor,
        themeMode: builder.themeMode,
        typography: builder.extensions.typography ?? "Poppins",
        layoutStyle: "comfortable",
      });

      setCreatedBusinessId(created.id);
      setStep("generate");
      toast.success("Business created with template configuration", { id: toastId });
    } catch {
      toast.error("Failed to create business. Please try again.", { id: toastId });
    }
  }

  return (
    <AdminShell activeTab="businesses">
      <PortalPage>
        <div className="mb-5 rounded-xl border border-[#e2e8f0] bg-[#fafbfc] px-4 py-4 sm:px-5">
          <WizardStepper
            steps={[...STEPS]}
            currentStepId={step}
            completedStepIds={completedSteps}
            allowJumpToCompleted
            onStepClick={(id) => {
              if (id === "generate" && !createdBusinessId) return;
              setStep(id as BusinessSetupStepId);
            }}
          />
        </div>

        {step === "select-template" && (
          <WizardLayout
            title="Select industry template"
            subtitle="Choose the industry blueprint that defines modules, navigation, and dashboard defaults"
            isFirstStep
            onNext={() => {
              if (!builder.selectedId) {
                toast.error("Select an industry template to continue");
                return;
              }
              goNext();
            }}
            onOpenGptPreview={() => setGptOpen(true)}
          >
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-[#0f172a]">Saved templates</h3>
              {savedConfigs.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {savedConfigs.slice(0, 4).map((config) => (
                    <button
                      key={config.id}
                      type="button"
                      onClick={() => builder.loadFromConfig(config)}
                      className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-left hover:border-[#0050F8]"
                    >
                      <p className="font-semibold text-[#0f172a]">{config.businessName}</p>
                      <p className="text-xs text-[#64748b]">{config.industryName}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#64748b]">No saved templates yet — pick an industry below.</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {industriesForPicker.map((tpl) => {
                const colors = colorsFromAccent(tpl.theme.accent);
                const active = builder.selectedId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => builder.selectIndustry(tpl.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition",
                      active ? "border-[#001840] bg-[#001840] text-white" : "border-[#e2e8f0] bg-white hover:border-[#0050F8]",
                    )}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className="grid h-10 w-10 place-items-center rounded-lg"
                        style={{ backgroundColor: active ? "rgba(255,255,255,0.15)" : `${colors.secondary}18`, color: active ? "#fff" : colors.secondary }}
                      >
                        <IndustryIcon name={tpl.theme.icon} />
                      </div>
                      <div>
                        <p className="font-semibold">{tpl.name}</p>
                        <p className={cn("text-xs", active ? "text-white/75" : "text-[#64748b]")}>{tpl.modules.length} modules</p>
                      </div>
                    </div>
                    <p className={cn("text-sm", active ? "text-white/80" : "text-[#64748b]")}>{tpl.description}</p>
                  </button>
                );
              })}
            </div>
          </WizardLayout>
        )}

        {step === "business-profile" && builder.industry && (
          <WizardLayout
            title="Business profile"
            subtitle="Enter the business information required to create the tenant"
            onBack={goBack}
            onNext={goNext}
            nextDisabled={!builder.businessName.trim() || !email.trim() || !manager.trim() || !planId}
            onOpenGptPreview={() => setGptOpen(true)}
          >
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-[#cbd5e1] bg-[#fafbfc] p-4">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
                {builder.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={builder.logoDataUrl} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <IndustryIcon name={builder.industry.theme.icon} className="h-8 w-8 text-[#94a3b8]" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0f172a]">Business logo</p>
                <div className="mt-2 flex gap-2">
                  <label className="dn-btn dn-btn-ghost inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold">
                    <ImagePlus className="h-4 w-4" /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={builder.handleLogoUpload} />
                  </label>
                  {builder.logoDataUrl ? (
                    <button type="button" onClick={() => builder.setLogoDataUrl(null)} className="rounded-lg border px-3 py-2 text-xs font-semibold text-[#dc2626]">
                      <X className="inline h-3.5 w-3.5" /> Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Business name *
                <input value={builder.businessName} onChange={(e) => builder.setBusinessName(e.target.value)} className="portal-input" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Manager / Owner *
                <input value={manager} onChange={(e) => setManager(e.target.value)} className="portal-input" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Email *
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="portal-input" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Phone *
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="portal-input">
                    {countryOptions.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="portal-input" placeholder="3001234567" />
                </div>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-[#374151] md:col-span-2">
                Address *
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="portal-input" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Plan *
                <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="portal-input" disabled={plansLoading}>
                  <option value="">Select plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.displayName || plan.planName}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Currency
                <select value={builder.currency} onChange={(e) => builder.setCurrency(e.target.value)} className="portal-input">
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                </select>
              </label>
            </div>
          </WizardLayout>
        )}

        {step === "theme" && builder.industry && (
          <WizardLayout title="Theme & branding" subtitle="Configure colours and interface mode" onBack={goBack} onNext={goNext} onOpenGptPreview={() => setGptOpen(true)}>
            <TemplateThemeFields
              themeMode={builder.themeMode}
              onThemeModeChange={builder.setThemeMode}
              primaryColor={builder.primaryColor}
              onPrimaryColorChange={builder.setPrimaryColor}
              secondaryColor={builder.secondaryColor}
              onSecondaryColorChange={builder.setSecondaryColor}
              productLabel={builder.productLabel}
              onProductLabelChange={builder.setProductLabel}
              productsLabel={builder.productsLabel}
              onProductsLabelChange={builder.setProductsLabel}
            />
          </WizardLayout>
        )}

        {step === "modules" && builder.industry && (
          <WizardLayout title="Modules & navigation" subtitle="Enable modules and review navigation order" onBack={goBack} onNext={goNext} onOpenGptPreview={() => setGptOpen(true)}>
            <p className="mb-2 text-sm text-[#64748b]">
              Build a fully custom dashboard. Toggle any module on/off, and drag cards to set sidebar order. Only Dashboard and Settings stay locked.
            </p>
            {builder.modulePlan ? (
              <p className="mb-4 rounded-xl bg-[#f8fafc] px-3 py-2 text-xs text-[#64748b]">
                {builder.modulePlan.summary}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {builder.navItems.map((item) => {
                const checked = builder.enabledModules.includes(item.moduleId);
                const locked = checked && builder.lockedModules.has(item.moduleId);
                const reason = locked
                  ? builder.getLockReason(item.moduleId)
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
                    onToggle={() => builder.toggleModule(item.moduleId)}
                    onDragStart={() => setDragModuleId(item.moduleId)}
                    onDragEnd={() => setDragModuleId(null)}
                    onDrop={() => {
                      if (dragModuleId) builder.reorderModules(dragModuleId, item.moduleId);
                      setDragModuleId(null);
                    }}
                  />
                );
              })}
            </div>
          </WizardLayout>
        )}

        {step === "dashboard" && builder.industry && (
          <WizardLayout title="Dashboard configuration" subtitle="Choose KPI cards for the business dashboard" onBack={goBack} onNext={goNext} onOpenGptPreview={() => setGptOpen(true)}>
            <p className="mb-4 text-sm text-[#64748b]">
              Choose KPI cards for the business dashboard. Toggle cards on or off and drag to set display order.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {builder.dashboardCardOrder.map((cardId) => {
                const selected = builder.dashboardCards.includes(cardId);
                return (
                  <DashboardCardChip
                    key={cardId}
                    id={cardId}
                    checked={selected}
                    dragging={dragDashboardCardId === cardId}
                    onToggle={() => builder.toggleDashboardCard(cardId)}
                    onDragStart={() => setDragDashboardCardId(cardId)}
                    onDragEnd={() => setDragDashboardCardId(null)}
                    onDrop={() => {
                      if (dragDashboardCardId) {
                        builder.reorderDashboardCards(dragDashboardCardId, cardId);
                      }
                      setDragDashboardCardId(null);
                    }}
                  />
                );
              })}
            </div>
          </WizardLayout>
        )}

        {step === "review" && builder.industry && (
          <WizardLayout
            title="Review & generate"
            subtitle="Confirm business setup before creation"
            onBack={goBack}
            isLastStep
            finishLabel={creating ? "Creating…" : "Generate Business"}
            finishDisabled={creating}
            onFinish={handleGenerateBusiness}
            onOpenGptPreview={() => setGptOpen(true)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <h4 className="font-semibold text-[#0f172a]">Business</h4>
                <ul className="mt-2 space-y-1 text-sm text-[#64748b]">
                  <li>{builder.businessName}</li>
                  <li>{email}</li>
                  <li>{manager}</li>
                  <li>{address}</li>
                </ul>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <h4 className="font-semibold text-[#0f172a]">Template</h4>
                <ul className="mt-2 space-y-1 text-sm text-[#64748b]">
                  <li>{builder.industry.name}</li>
                  <li>{builder.enabledModules.length} modules</li>
                  <li>{builder.dashboardCards.length} dashboard cards</li>
                  <li>{builder.themeMode} theme</li>
                </ul>
              </div>
            </div>
          </WizardLayout>
        )}

        {step === "generate" && createdBusinessId ? (
          <section className="rounded-xl border border-[#bbf7d0] bg-[#ecfdf5] p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#059669] text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-[#065f46]">Business created successfully</h2>
                <p className="mt-2 text-sm text-[#047857]">
                  {builder.businessName} is ready with the configured industry template
                  {savedTemplateId ? ` (config ${savedTemplateId.slice(0, 8)}…)` : ""}.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/dashboard/superAdmin/businesses/${createdBusinessId}`} className="dn-btn dn-btn-primary rounded-xl px-4 py-2.5 text-sm">
                View business profile
              </Link>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `${window.location.origin}/dashboard/businessAdmin?businessId=${createdBusinessId}`,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                className="dn-btn dn-btn-outline inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
              >
                Open workspace <ExternalLink className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => router.push("/dashboard/superAdmin/businesses")} className="dn-btn dn-btn-ghost rounded-xl px-4 py-2.5 text-sm">
                Back to businesses
              </button>
            </div>
          </section>
        ) : step === "generate" ? (
          <section className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-center">
            <p className="text-sm text-[#64748b]">Complete the review step and click &quot;Generate Business&quot; to create your business.</p>
            <button type="button" onClick={() => setStep("review")} className="dn-btn dn-btn-primary mt-4 rounded-xl px-4 py-2.5 text-sm">
              Go to review
            </button>
          </section>
        ) : null}

        <GptPreviewDrawer
          open={gptOpen}
          onClose={() => setGptOpen(false)}
          stepId={step}
          stepLabel={STEPS.find((s) => s.id === step)?.label ?? "Preview"}
          config={builder.gptPreviewConfig}
        />
      </PortalPage>
    </AdminShell>
  );
}

export default function BusinessSetupPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <BusinessSetupContent />
    </Suspense>
  );
}
