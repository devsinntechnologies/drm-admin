"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { WizardFormField, WizardFormSection } from "@/components/wizard/WizardFormField";
import {
  useGetBusinessByIdQuery,
  usePatchBusinessByIdMutation,
  type BusinessRecord,
} from "@/hooks/useBusiness";
import { useGetPlansQuery } from "@/hooks/usePlan";
import {
  formatE164,
  resolveBusinessApiError,
  validateBusinessProfileFields,
} from "@/lib/form-validation";
import { getIndustryLabel } from "@/lib/business-profile";

const COUNTRY_OPTIONS = [
  { value: "+92", label: "Pakistan (+92)" },
  { value: "+44", label: "United Kingdom (+44)" },
];

function splitPhone(phone: string) {
  const normalized = phone.trim();
  if (normalized.startsWith("+44")) {
    return { countryCode: "+44", phoneNumber: normalized.slice(3).replace(/\D/g, "") };
  }
  if (normalized.startsWith("+92")) {
    return { countryCode: "+92", phoneNumber: normalized.slice(3).replace(/\D/g, "") };
  }
  return { countryCode: "+92", phoneNumber: normalized.replace(/\D/g, "") };
}

type BusinessBasicInfoFormProps = {
  business: BusinessRecord;
};

export function BusinessBasicInfoForm({ business }: BusinessBasicInfoFormProps) {
  const { data: planData, isLoading: plansLoading } = useGetPlansQuery();
  const [patchBusiness, { isLoading: saving }] = usePatchBusinessByIdMutation();
  const { refetch } = useGetBusinessByIdQuery(business.id);

  const initialPhone = useMemo(() => splitPhone(business.phone), [business.phone]);

  const [businessName, setBusinessName] = useState(business.businessName);
  const [address, setAddress] = useState(business.address);
  const [email, setEmail] = useState(business.email);
  const [manager, setManager] = useState(business.ownerName);
  const [countryCode, setCountryCode] = useState(initialPhone.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.phoneNumber);
  const [planId, setPlanId] = useState(business.planId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBusinessName(business.businessName);
    setAddress(business.address);
    setEmail(business.email);
    setManager(business.ownerName);
    const phone = splitPhone(business.phone);
    setCountryCode(phone.countryCode);
    setPhoneNumber(phone.phoneNumber);
    setPlanId(business.planId);
  }, [business]);

  const plans = useMemo(() => {
    if (!planData) return [];
    if (Array.isArray(planData)) return planData;
    if (planData.data && Array.isArray(planData.data.plans)) return planData.data.plans;
    if (planData.plans && Array.isArray(planData.plans)) return planData.plans;
    if (planData.data && Array.isArray(planData.data)) return planData.data;
    return [];
  }, [planData]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const validation = validateBusinessProfileFields({
      businessName,
      manager,
      email,
      address,
      countryCode,
      phoneNumber,
      planId,
    });

    if (validation) {
      setError(Object.values(validation)[0] ?? "Please fix the highlighted fields.");
      return;
    }

    const toastId = toast.loading("Saving business details...");
    try {
      await patchBusiness({
        id: business.id,
        body: {
          businessName: businessName.trim(),
          address: address.trim(),
          email: email.trim().toLowerCase(),
          manager: manager.trim(),
          phone: formatE164(countryCode, phoneNumber),
          planId,
        },
      }).unwrap();
      await refetch();
      toast.success("Business details updated", { id: toastId });
    } catch (err) {
      const { message } = resolveBusinessApiError(err);
      setError(message);
      toast.error(message, { id: toastId });
    }
  };

  const industryLabel = business.templateConfig?.industryId
    ? getIndustryLabel(business.templateConfig.industryId)
    : null;

  return (
    <form onSubmit={onSubmit} className="wizard-form-stack">
      {error ? (
        <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#dc2626]">
          {error}
        </p>
      ) : null}

      <WizardFormSection
        title="Business details"
        description="Name, address and subscription for this business."
      >
        <div className="wizard-form-grid mt-3">
          <WizardFormField label="Business name" required>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="wizard-input"
              placeholder="Business name"
            />
          </WizardFormField>

          <WizardFormField label="Industry">
            <input
              value={industryLabel ?? "Not set"}
              disabled
              className="wizard-input"
            />
          </WizardFormField>

          <WizardFormField label="Address" required className="sm:col-span-2">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="wizard-input"
              placeholder="Street, city"
            />
          </WizardFormField>

          <WizardFormField label="Plan" required>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              disabled={plansLoading}
              className="wizard-input"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.displayName || plan.planName}
                </option>
              ))}
            </select>
          </WizardFormField>

          <WizardFormField label="Status">
            <input value={business.status} disabled className="wizard-input capitalize" />
          </WizardFormField>
        </div>
      </WizardFormSection>

      <div className="wizard-form-divider" />

      <WizardFormSection title="Owner contact" description="Person who manages this business day to day.">
        <div className="wizard-form-grid mt-3">
          <WizardFormField label="Owner name" required>
            <input
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              className="wizard-input"
              placeholder="Owner name"
            />
          </WizardFormField>

          <WizardFormField label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="wizard-input"
              placeholder="owner@example.com"
            />
          </WizardFormField>

          <WizardFormField label="Phone" required>
            <div className="wizard-input-group">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="wizard-input-prefix border-0 bg-transparent outline-none"
              >
                {COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                className="wizard-input wizard-input--attached"
                placeholder="3001234567"
              />
            </div>
          </WizardFormField>
        </div>
      </WizardFormSection>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="wizard-btn-continue inline-flex min-w-[10rem] items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </button>
      </div>
    </form>
  );
}
