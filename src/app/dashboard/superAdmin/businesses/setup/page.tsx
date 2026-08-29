"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe2, LayoutDashboard, Settings2, Smartphone, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage } from "@/components/admin/PortalPage";
import { GptPreviewDrawer } from "@/components/wizard/GptPreviewDrawer";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { IndustryPickerCard } from "@/components/wizard/IndustryPickerCard";
import { BusinessMarketPicker, marketFromPhonePrefix, type BusinessMarketCode } from "@/components/wizard/BusinessMarketPicker";
import { WizardFormField, WizardFormSection } from "@/components/wizard/WizardFormField";
import { LogoPickerField } from "@/components/business/LogoPickerField";
import { TemplateThemeFields } from "@/components/wizard/TemplateThemeFields";
import { useTemplateBuilder } from "@/hooks/useTemplateBuilder";
import { useCreateBusinessMutation, useLazyCheckBusinessEmailQuery } from "@/hooks/useBusiness";
import { useListIndustriesQuery } from "@/hooks/useIndustryTemplate";
import { useGetPlansQuery } from "@/hooks/usePlan";
import { saveBusinessProfile } from "@/lib/business-profile";
import { loadAllTemplateConfigsLocal } from "@/template-engine/persist-template-config";
import { INDUSTRY_TEMPLATES } from "@/templates/industries";
import { colorsFromAccent } from "@/templates/modules";
import type { BusinessSetupStepId } from "@/templates/types";
import { pharmacyCountryDefaults } from "@/lib/pharmacy-market";
import {
  formatE164,
  resolveBusinessApiError,
  validateBusinessProfileFields,
  validateEmail,
  validatePhoneNumber,
} from "@/lib/form-validation";

const STEPS = [
  { id: "select-template", label: "Industry", description: "Pick a business type" },
  { id: "business-profile", label: "Details", description: "Name and contact" },
  { id: "theme", label: "Look", description: "Colours and labels" },
  { id: "review", label: "Check", description: "Then create" },
  { id: "generate", label: "Done", description: "All set" },
] as const;

function BusinessSetupContent() {
  const router = useRouter();
  const builder = useTemplateBuilder();
  const [step, setStep] = useState<BusinessSetupStepId>("select-template");
  const [gptOpen, setGptOpen] = useState(false);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);

  const [manager, setManager] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+92");
  const [planId, setPlanId] = useState("");
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [createBusiness, { isLoading: creating }] = useCreateBusinessMutation();
  const [checkBusinessEmail] = useLazyCheckBusinessEmailQuery();
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

  function applyProfileFieldErrors(
    errors: NonNullable<ReturnType<typeof validateBusinessProfileFields>>,
  ) {
    setProfileError(null);
    setEmailHint(errors.email ?? null);
    setPhoneHint(errors.phone ?? null);

    const firstError =
      errors.businessName ||
      errors.manager ||
      errors.email ||
      errors.phone ||
      errors.address ||
      errors.planId;

    if (firstError) {
      toast.error(firstError);
    }
  }

  function applyMarket(market: BusinessMarketCode) {
    if (market === "UK") {
      setCountryCode("+44");
      builder.setCurrency("GBP");
    } else {
      setCountryCode("+92");
      builder.setCurrency("PKR");
    }

    if (builder.industry?.id === "pharmacy") {
      builder.applyPharmacyCountry(market);
      const defaults = pharmacyCountryDefaults(market);
      if (!address.trim()) setAddress(defaults.location);
    }
  }

  async function validateAndContinueFromProfile() {
    const errors = validateBusinessProfileFields({
      businessName: builder.businessName,
      manager,
      email,
      countryCode,
      phoneNumber,
      address,
      planId,
    });

    if (errors) {
      applyProfileFieldErrors(errors);
      return;
    }

    setProfileError(null);
    setPhoneHint(null);

    const emailFormatError = validateEmail(email);
    if (emailFormatError) {
      setEmailHint(emailFormatError);
      toast.error(emailFormatError);
      return;
    }

    try {
      const availability = await checkBusinessEmail(email.trim().toLowerCase()).unwrap();
      if (!availability.available) {
        const taken = "This email is already registered. Use a different owner email.";
        setEmailHint(taken);
        toast.error(taken);
        return;
      }
      setEmailHint("Email is available");
    } catch {
      setEmailHint(null);
    }

    goNext();
  }

  async function handleGenerateBusiness() {
    if (!builder.industry) return;

    const profileErrors = validateBusinessProfileFields({
      businessName: builder.businessName,
      manager,
      email,
      countryCode,
      phoneNumber,
      address,
      planId,
    });

    if (profileErrors) {
      applyProfileFieldErrors(profileErrors);
      setStep("business-profile");
      return;
    }

    try {
      const availability = await checkBusinessEmail(email.trim().toLowerCase()).unwrap();
      if (!availability.available) {
        setEmailHint("This email is already registered. Use a different owner email.");
        toast.error("This email is already registered");
        setStep("business-profile");
        return;
      }
    } catch {
      // If check fails, still attempt create — server will reject duplicates.
    }

    const toastId = toast.loading("Creating business and applying template...");
    try {
      const phone = formatE164(countryCode, phoneNumber);
      const created = await createBusiness({
        businessName: builder.businessName.trim(),
        address: address.trim(),
        phone,
        email: email.trim().toLowerCase(),
        manager: manager.trim(),
        planId,
      }).unwrap();

      if (!created.id) {
        throw new Error("Business created but no ID returned");
      }

      await builder.saveConfig(created.id);

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
    } catch (err) {
      const { message, field } = resolveBusinessApiError(err);
      if (field === "phone") {
        setPhoneHint(message);
        setProfileError(null);
      } else if (field === "email") {
        setEmailHint(message);
        setProfileError(null);
      } else {
        setProfileError(message);
      }
      setStep("business-profile");
      toast.error(message, { id: toastId });
    }
  }

  return (
    <AdminShell activeTab="businesses">
      <PortalPage>
        <div className="mb-5 rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 sm:px-5">
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
            title="Pick an industry"
            subtitle="Choose the template. Portal, website, and app modules are configured after you create the business."
            accentBlue
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
              <h3 className="wizard-section-title mb-3">Saved setups</h3>
              {savedConfigs.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {savedConfigs.slice(0, 4).map((config) => (
                    <button
                      key={config.id}
                      type="button"
                      onClick={() => builder.loadFromConfig(config)}
                      className="wizard-card wizard-card-surface p-3 text-left hover:border-[var(--brand-secondary)] hover:shadow-[0_2px_10px_rgba(15,23,42,0.06)]"
                    >
                      <p className="font-semibold text-[#64748b]">{config.businessName}</p>
                      <p className="text-xs text-[#94a3b8]">{config.industryName}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="wizard-help">No saved setups — pick one below.</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {industriesForPicker.map((tpl) => {
                const colors = colorsFromAccent(tpl.theme.accent);
                return (
                  <IndustryPickerCard
                    key={tpl.id}
                    name={tpl.name}
                    icon={tpl.theme.icon}
                    featureCount={tpl.modules.length}
                    accentColor={colors.secondary}
                    selected={builder.selectedId === tpl.id}
                    onClick={() => builder.selectIndustry(tpl.id)}
                  />
                );
              })}
            </div>
          </WizardLayout>
        )}

        {step === "business-profile" && builder.industry && (
          <WizardLayout
            title="Business details"
            subtitle="Owner name, email, phone and plan."
            accentBlue
            onBack={goBack}
            onNext={validateAndContinueFromProfile}
            onOpenGptPreview={() => setGptOpen(true)}
          >
            {profileError ? (
              <p className="mb-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#dc2626]">
                {profileError}
              </p>
            ) : null}

            <div className="wizard-form-stack">
              <WizardFormSection>
                <LogoPickerField
                  src={builder.logoDataUrl}
                  hint="Any size PNG, JPG, or WebP. Crop it to fit login, splash, nav, and invoices."
                  onFile={builder.applyLogoFile}
                  onRemove={builder.logoDataUrl ? builder.clearLogo : undefined}
                />
              </WizardFormSection>

              <div className="wizard-form-divider" />

              <WizardFormSection>
                <BusinessMarketPicker
                  value={marketFromPhonePrefix(countryCode)}
                  onChange={applyMarket}
                />
              </WizardFormSection>

              <div className="wizard-form-divider" />

              <WizardFormSection>
                <div className="wizard-form-grid">
                  <WizardFormField label="Business name" required>
                    <input
                      value={builder.businessName}
                      onChange={(e) => {
                        builder.setBusinessName(e.target.value);
                        setProfileError(null);
                      }}
                      className="wizard-input"
                      placeholder="Your business name"
                    />
                  </WizardFormField>

                  <WizardFormField label="Owner name" required>
                    <input
                      value={manager}
                      onChange={(e) => {
                        setManager(e.target.value);
                        setProfileError(null);
                      }}
                      className="wizard-input"
                      placeholder="Full name"
                    />
                  </WizardFormField>

                  <WizardFormField
                    label="Email"
                    required
                    hint={emailHint || "Owner login email"}
                    hintTone={
                      emailHint?.includes("available")
                        ? "success"
                        : emailHint && !emailHint.includes("available")
                          ? "error"
                          : "default"
                    }
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailHint(null);
                        setProfileError(null);
                      }}
                      onBlur={async () => {
                        const formatError = validateEmail(email);
                        if (formatError) {
                          setEmailHint(formatError);
                          return;
                        }
                        try {
                          const result = await checkBusinessEmail(email.trim().toLowerCase()).unwrap();
                          setEmailHint(
                            result.available
                              ? "Email is available"
                              : "This email is already registered",
                          );
                        } catch {
                          setEmailHint(null);
                        }
                      }}
                      className="wizard-input"
                      placeholder="owner@business.com"
                    />
                  </WizardFormField>

                  <WizardFormField
                    label="Phone"
                    required
                    hint={phoneHint || "No leading 0"}
                    hintTone={phoneHint ? "error" : "default"}
                  >
                    <div className="wizard-input-group">
                      <span className="wizard-input-prefix">{countryCode}</span>
                      <input
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          setPhoneHint(validatePhoneNumber(countryCode, e.target.value));
                          setProfileError(null);
                        }}
                        className="wizard-input wizard-input--attached"
                        placeholder={countryCode === "+44" ? "7123456789" : "3001234567"}
                        inputMode="tel"
                      />
                    </div>
                  </WizardFormField>

                  <WizardFormField label="Address" required className="wizard-form-grid--full-row">
                    <input
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setProfileError(null);
                      }}
                      className="wizard-input"
                      placeholder="Street, city"
                    />
                  </WizardFormField>

                  <WizardFormField label="Plan" required>
                    <select
                      value={planId}
                      onChange={(e) => {
                        setPlanId(e.target.value);
                        setProfileError(null);
                      }}
                      className="wizard-input"
                      disabled={plansLoading}
                    >
                      <option value="">Select plan</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.displayName || plan.planName}
                        </option>
                      ))}
                    </select>
                  </WizardFormField>

                  <WizardFormField label="Currency" hint="Based on country above">
                    {builder.industry.id === "pharmacy" ? (
                      <input
                        value={`${builder.currency} · ${builder.market === "UK" ? "United Kingdom" : "Pakistan"}`}
                        disabled
                        className="wizard-input"
                      />
                    ) : (
                      <select
                        value={builder.currency}
                        onChange={(e) => {
                          builder.setCurrency(e.target.value);
                          if (e.target.value === "GBP") setCountryCode("+44");
                          else if (e.target.value === "PKR") setCountryCode("+92");
                        }}
                        className="wizard-input"
                      >
                        <option value="PKR">PKR · Pakistan</option>
                        <option value="GBP">GBP · United Kingdom</option>
                        <option value="USD">USD</option>
                        <option value="AED">AED</option>
                      </select>
                    )}
                  </WizardFormField>
                </div>
              </WizardFormSection>
            </div>
          </WizardLayout>
        )}

        {step === "theme" && builder.industry && (
          <WizardLayout
            title="Look & feel"
            subtitle="Choose light or dark mode and a colour theme."
            accentBlue
            onBack={goBack}
            onNext={goNext}
            onOpenGptPreview={() => setGptOpen(true)}
          >
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

        {step === "review" && builder.industry && (
          <WizardLayout
            title="Final check"
            subtitle="Create the business when ready."
            accentBlue
            onBack={goBack}
            isLastStep
            finishLabel={creating ? "Creating…" : "Create business"}
            finishDisabled={creating}
            onFinish={handleGenerateBusiness}
            onOpenGptPreview={() => setGptOpen(true)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="wizard-review-card">
                <h4>Business</h4>
                <ul className="mt-2 space-y-1">
                  <li>{builder.businessName}</li>
                  <li>{email}</li>
                  <li>{manager}</li>
                  <li>{address}</li>
                </ul>
              </div>
              <div className="wizard-review-card">
                <h4>Setup</h4>
                <ul className="mt-2 space-y-1">
                  <li>{builder.industry.name} template</li>
                  {builder.industry.id === "pharmacy" ? (
                    <li>{builder.market === "UK" ? "United Kingdom" : "Pakistan"} · {builder.currency}</li>
                  ) : (
                    <li>{builder.currency}</li>
                  )}
                  <li>Portal, website, and software modules are enabled after create</li>
                  <li>{builder.themeMode} mode</li>
                </ul>
              </div>
            </div>
          </WizardLayout>
        )}

        {step === "generate" && createdBusinessId ? (
          <section className="wizard-form-stack">
            <div className="rounded-xl border border-[#bbf7d0] bg-[#ecfdf5] p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#059669] text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold text-[#065f46]">{builder.businessName} is ready</h2>
                  <p className="mt-2 text-sm text-[#047857]">
                    Your {builder.industry?.name.toLowerCase() ?? "business"} is set up with the industry
                    template. Enable Website, Portal, or Software from each area, then configure modules there.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href={`/dashboard/superAdmin/businesses/${createdBusinessId}/website`}
                className="group rounded-xl border-2 border-[#e8edf3] bg-white p-5 text-left transition-all hover:border-[var(--brand-secondary)] hover:shadow-[0_4px_16px_rgba(0,80,248,0.1)]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]">
                  <Globe2 className="h-5 w-5" />
                </span>
                <p className="mt-4 text-base font-semibold text-[#0f172a]">Website</p>
                <p className="mt-1 text-sm text-[#64748b]">Set up pages, theme and your public storefront.</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-secondary)]">
                  Manage website <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                href={`/dashboard/superAdmin/businesses/${createdBusinessId}/portal`}
                className="group rounded-xl border-2 border-[#e8edf3] bg-white p-5 text-left transition-all hover:border-[var(--brand-secondary)] hover:shadow-[0_4px_16px_rgba(0,80,248,0.1)]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]">
                  <LayoutDashboard className="h-5 w-5" />
                </span>
                <p className="mt-4 text-base font-semibold text-[#0f172a]">Portal</p>
                <p className="mt-1 text-sm text-[#64748b]">Run daily work — stock, sales, orders and team.</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-secondary)]">
                  Manage portal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                href={`/dashboard/superAdmin/businesses/${createdBusinessId}/software/control`}
                className="group rounded-xl border-2 border-[#e8edf3] bg-white p-5 text-left transition-all hover:border-[var(--brand-secondary)] hover:shadow-[0_4px_16px_rgba(0,80,248,0.1)]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]">
                  <Smartphone className="h-5 w-5" />
                </span>
                <p className="mt-4 text-base font-semibold text-[#0f172a]">Software & Mobile</p>
                <p className="mt-1 text-sm text-[#64748b]">Configure the Flutter app — features, nav and roles.</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-secondary)]">
                  Manage software <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                href={`/dashboard/superAdmin/businesses/${createdBusinessId}`}
                className="group rounded-xl border-2 border-[#e8edf3] bg-white p-5 text-left transition-all hover:border-[var(--brand-secondary)] hover:shadow-[0_4px_16px_rgba(0,80,248,0.1)]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]">
                  <Settings2 className="h-5 w-5" />
                </span>
                <p className="mt-4 text-base font-semibold text-[#0f172a]">Additional details</p>
                <p className="mt-1 text-sm text-[#64748b]">Logo, contact, plan and staff for this business.</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-secondary)]">
                  View profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/superAdmin/businesses")}
                className="text-sm font-medium text-[#64748b] hover:text-[#0f172a]"
              >
                Back to all businesses
              </button>
            </div>
          </section>
        ) : step === "generate" ? (
          <section className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-center">
            <p className="wizard-help">Go to review and tap create business.</p>
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
