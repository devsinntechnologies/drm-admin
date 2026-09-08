"use client";

import { useEffect, useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { ControlSection } from "@/components/business/ControlSection";
import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import { FeatureTip } from "@/components/ui/FeatureTip";
import { FBR_TIPS } from "@/lib/feature-tips";
import { normalizeErrorMessage } from "@/lib/utils";
import {
  usePatchBusinessByIdMutation,
  type FbrSettings,
  type PublicFbrSettings,
} from "@/hooks/useBusiness";

const FBR_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu and Kashmir",
];

const emptyForm = (): FbrSettings => ({
  enabled: false,
  environment: "sandbox",
  sandboxToken: "",
  productionToken: "",
  sellerNtnCnic: "",
  sellerBusinessName: "",
  sellerProvince: "",
  sellerAddress: "",
  defaultSaleType: "Goods at standard rate (default)",
  defaultUom: "Numbers, pieces, units",
  defaultHsCode: "",
  defaultTaxRate: "18%",
  defaultBuyerRegistrationType: "Unregistered",
  defaultBuyerName: "Walk-in Customer",
  defaultBuyerProvince: "",
  defaultBuyerAddress: "",
  sandboxScenarioId: "SN001",
  furtherTaxEnabled: false,
});

function formFromPublic(
  settings: PublicFbrSettings | null | undefined,
  businessName: string,
  address: string,
): FbrSettings {
  const base = emptyForm();
  if (!settings) {
    return {
      ...base,
      sellerBusinessName: businessName,
      sellerAddress: address,
      defaultBuyerAddress: address,
    };
  }
  const {
    sandboxTokenConfigured: _sandboxConfigured,
    productionTokenConfigured: _productionConfigured,
    ...rest
  } = settings;
  return {
    ...base,
    ...rest,
    sandboxToken: "",
    productionToken: "",
    sellerBusinessName: rest.sellerBusinessName || businessName,
    sellerAddress: rest.sellerAddress || address,
  };
}

type FbrSettingsPanelProps = {
  businessId: string;
  businessName: string;
  address: string;
  fbrSettings?: PublicFbrSettings | null;
  sectionIndex: number;
};

export function FbrSettingsPanel({
  businessId,
  businessName,
  address,
  fbrSettings,
  sectionIndex,
}: FbrSettingsPanelProps) {
  const [form, setForm] = useState<FbrSettings>(() =>
    formFromPublic(fbrSettings, businessName, address),
  );
  const [patchBusiness, { isLoading }] = usePatchBusinessByIdMutation();

  useEffect(() => {
    setForm(formFromPublic(fbrSettings, businessName, address));
  }, [fbrSettings, businessName, address]);

  const tokenHint = useMemo(() => {
    if (form.environment === "production") {
      return fbrSettings?.productionTokenConfigured
        ? "Production token is saved. Leave blank to keep it."
        : "Paste the production Bearer token from IRIS.";
    }
    return fbrSettings?.sandboxTokenConfigured
      ? "Sandbox token is saved. Leave blank to keep it."
      : "Paste the sandbox Bearer token from IRIS.";
  }, [form.environment, fbrSettings]);

  const set = <K extends keyof FbrSettings>(key: K, value: FbrSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    try {
      await patchBusiness({
        id: businessId,
        body: { fbrSettings: form },
      }).unwrap();
      toast.success("FBR settings saved");
      setForm((prev) => ({ ...prev, sandboxToken: "", productionToken: "" }));
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Could not save FBR settings"));
    }
  };

  return (
    <ControlSection
      index={sectionIndex}
      title="FBR Digital Invoicing"
      description="Optional. When enabled, completed invoices will be posted to FBR after sandbox testing is done. Tokens stay on the server and are never shown again."
      icon={Receipt}
      scopeNote="Pakistan FBR DI API v1.12"
    >
      <div className="mb-4 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#475569]">
        Register this business on{" "}
        <a
          className="font-semibold text-[#1d4ed8] underline"
          href="https://iris.fbr.gov.pk"
          target="_blank"
          rel="noreferrer"
        >
          IRIS
        </a>
        , choose API Integration (PRAL is free), whitelist this server IP, then paste the sandbox token first. Production posting starts only after FBR issues a production token.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-lg border border-[#e2e8f0] px-4 py-3">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
          />
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f172a]">
            Enable FBR posting
            <FeatureTip text={FBR_TIPS.enabled} />
          </span>
        </label>
        <FormField label="Environment" tip={FBR_TIPS.environment}>
          <select
            className={portalInputClass}
            value={form.environment}
            onChange={(e) =>
              set("environment", e.target.value as FbrSettings["environment"])
            }
          >
            <option value="sandbox">Sandbox (testing)</option>
            <option value="production">Production (live FBR)</option>
          </select>
        </FormField>
        <FormField label="Seller NTN or CNIC" tip={FBR_TIPS.sellerNtn}>
          <input
            className={portalInputClass}
            value={form.sellerNtnCnic}
            onChange={(e) => set("sellerNtnCnic", e.target.value.replace(/\D/g, "").slice(0, 13))}
            placeholder="7-digit NTN or 13-digit CNIC"
          />
        </FormField>
        <FormField label="Seller business name" tip={FBR_TIPS.sellerName}>
          <input
            className={portalInputClass}
            value={form.sellerBusinessName}
            onChange={(e) => set("sellerBusinessName", e.target.value)}
          />
        </FormField>
        <FormField label="Seller province" tip={FBR_TIPS.sellerProvince}>
          <select
            className={portalInputClass}
            value={form.sellerProvince}
            onChange={(e) => set("sellerProvince", e.target.value)}
          >
            <option value="">Select province</option>
            {FBR_PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Seller address" tip={FBR_TIPS.sellerAddress}>
          <input
            className={portalInputClass}
            value={form.sellerAddress}
            onChange={(e) => set("sellerAddress", e.target.value)}
          />
        </FormField>
        <FormField label="Sandbox token" tip={FBR_TIPS.sandboxToken}>
          <input
            className={portalInputClass}
            type="password"
            autoComplete="off"
            value={form.sandboxToken}
            onChange={(e) => set("sandboxToken", e.target.value)}
            placeholder={
              fbrSettings?.sandboxTokenConfigured ? "Saved — leave blank to keep" : "Bearer token"
            }
          />
        </FormField>
        <FormField label="Production token" tip={FBR_TIPS.productionToken}>
          <input
            className={portalInputClass}
            type="password"
            autoComplete="off"
            value={form.productionToken}
            onChange={(e) => set("productionToken", e.target.value)}
            placeholder={
              fbrSettings?.productionTokenConfigured
                ? "Saved — leave blank to keep"
                : "Bearer token"
            }
          />
        </FormField>
        <p className="sm:col-span-2 text-xs text-[#64748b]">{tokenHint}</p>
        <FormField label="Default HS / PCT code" tip={FBR_TIPS.hsCode}>
          <input
            className={portalInputClass}
            value={form.defaultHsCode}
            onChange={(e) => set("defaultHsCode", e.target.value)}
            placeholder="Used when a product has no HS code"
          />
        </FormField>
        <FormField label="Default tax rate" tip={FBR_TIPS.taxRate}>
          <input
            className={portalInputClass}
            value={form.defaultTaxRate}
            onChange={(e) => set("defaultTaxRate", e.target.value)}
            placeholder="18%"
          />
        </FormField>
        <FormField label="Default sale type" tip={FBR_TIPS.saleType}>
          <input
            className={portalInputClass}
            value={form.defaultSaleType}
            onChange={(e) => set("defaultSaleType", e.target.value)}
          />
        </FormField>
        <FormField label="Default unit of measure" tip={FBR_TIPS.uom}>
          <input
            className={portalInputClass}
            value={form.defaultUom}
            onChange={(e) => set("defaultUom", e.target.value)}
          />
        </FormField>
        <FormField label="Walk-in buyer type" tip={FBR_TIPS.buyerType}>
          <select
            className={portalInputClass}
            value={form.defaultBuyerRegistrationType}
            onChange={(e) =>
              set(
                "defaultBuyerRegistrationType",
                e.target.value as FbrSettings["defaultBuyerRegistrationType"],
              )
            }
          >
            <option value="Unregistered">Unregistered</option>
            <option value="Registered">Registered</option>
          </select>
        </FormField>
        <FormField label="Walk-in buyer name" tip={FBR_TIPS.buyerName}>
          <input
            className={portalInputClass}
            value={form.defaultBuyerName}
            onChange={(e) => set("defaultBuyerName", e.target.value)}
          />
        </FormField>
        <FormField label="Walk-in buyer province" tip={FBR_TIPS.buyerProvince}>
          <select
            className={portalInputClass}
            value={form.defaultBuyerProvince}
            onChange={(e) => set("defaultBuyerProvince", e.target.value)}
          >
            <option value="">Same as seller, or select</option>
            {FBR_PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Walk-in buyer address" tip={FBR_TIPS.buyerAddress}>
          <input
            className={portalInputClass}
            value={form.defaultBuyerAddress}
            onChange={(e) => set("defaultBuyerAddress", e.target.value)}
          />
        </FormField>
        <FormField label="Sandbox scenario ID" tip={FBR_TIPS.scenarioId}>
          <input
            className={portalInputClass}
            value={form.sandboxScenarioId}
            onChange={(e) => set("sandboxScenarioId", e.target.value)}
            placeholder="SN001 — required in sandbox only"
          />
        </FormField>
        <label className="flex items-center gap-3 rounded-lg border border-[#e2e8f0] px-4 py-3">
          <input
            type="checkbox"
            checked={form.furtherTaxEnabled}
            onChange={(e) => set("furtherTaxEnabled", e.target.checked)}
          />
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0f172a]">
            Apply further tax for non-ATL buyers
            <FeatureTip text={FBR_TIPS.furtherTax} />
          </span>
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading}
          className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isLoading ? "Saving…" : "Save FBR settings"}
        </button>
      </div>
    </ControlSection>
  );
}
