"use client";

import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import { NumberInput } from "@/components/common/NumberInput";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";

export type MedicineProfileForm = {
  genericName: string;
  saltName: string;
  barcode: string;
  hsnCode: string;
  gstRate: number;
  rxRequired: boolean;
  controlledSchedule: string;
  reorderLevel: number;
  baseUnit: string;
  boxToStrip: number;
  stripToTablet: number;
};

export const EMPTY_MEDICINE_PROFILE: MedicineProfileForm = {
  genericName: "",
  saltName: "",
  barcode: "",
  hsnCode: "",
  gstRate: 0,
  rxRequired: false,
  controlledSchedule: "",
  reorderLevel: 0,
  baseUnit: "tablet",
  boxToStrip: 10,
  stripToTablet: 10,
};

export function MedicineProfileFields({
  value,
  onChange,
}: {
  value: MedicineProfileForm;
  onChange: (value: MedicineProfileForm) => void;
}) {
  const { market } = usePharmacyMarket();
  const set = (patch: Partial<MedicineProfileForm>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3 rounded-xl border border-[#dcfce7] bg-[#f0fdf4] p-4">
      <p className="text-sm font-semibold text-[#166534]">
        Medicine details · {market.regulator}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <FormField label="Generic name" required>
          <input className={portalInputClass} placeholder="e.g. Paracetamol" value={value.genericName} onChange={(e) => set({ genericName: e.target.value })} />
        </FormField>
        <FormField label="Salt / composition" required>
          <input className={portalInputClass} placeholder="e.g. Acetaminophen" value={value.saltName} onChange={(e) => set({ saltName: e.target.value })} />
        </FormField>
        <FormField label="Barcode">
          <input className={portalInputClass} placeholder="Scan or type barcode" value={value.barcode} onChange={(e) => set({ barcode: e.target.value })} />
        </FormField>
        <FormField label={market.productCodeHint || "Product code"}>
          <input className={portalInputClass} placeholder={market.productCodeHint} value={value.hsnCode} onChange={(e) => set({ hsnCode: e.target.value })} />
        </FormField>
        <FormField label={`${market.taxName} %`}>
          <NumberInput className={portalInputClass} placeholder="0" value={value.gstRate} onChange={(gstRate) => set({ gstRate })} />
        </FormField>
        <FormField label="Reorder level">
          <NumberInput className={portalInputClass} placeholder="0" value={value.reorderLevel} onChange={(reorderLevel) => set({ reorderLevel })} />
        </FormField>
        <FormField label="Controlled schedule">
          <select
            className={portalInputClass}
            value={value.controlledSchedule}
            onChange={(e) => {
              const next = e.target.value;
              const rx = ["POM", "H", "H1", "X", "CD2", "CD3", "CD4", "CD5"].includes(next);
              set({ controlledSchedule: next, rxRequired: rx ? true : value.rxRequired });
            }}
          >
            {market.schedules.map((option) => (
              <option key={option.value || "otc"} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FormField>
        <label className="flex items-end gap-2 pb-3 text-sm font-medium">
          <input type="checkbox" checked={value.rxRequired} onChange={(e) => set({ rxRequired: e.target.checked })} />
          Rx / POM required
        </label>
        <FormField label="Tablets per strip">
          <NumberInput className={portalInputClass} placeholder="10" value={value.stripToTablet} onChange={(stripToTablet) => set({ stripToTablet })} />
        </FormField>
        <FormField label="Strips per box">
          <NumberInput className={portalInputClass} placeholder="10" value={value.boxToStrip} onChange={(boxToStrip) => set({ boxToStrip })} />
        </FormField>
      </div>
    </div>
  );
}

export function profileToPayload(value: MedicineProfileForm) {
  return {
    genericName: value.genericName || undefined,
    saltName: value.saltName || undefined,
    barcode: value.barcode || undefined,
    hsnCode: value.hsnCode || undefined,
    gstRate: value.gstRate,
    rxRequired: value.rxRequired,
    controlledSchedule: value.controlledSchedule || undefined,
    reorderLevel: value.reorderLevel,
    baseUnit: value.baseUnit,
    units: [
      { unit: "tablet", factorToBase: 1, isSellUnit: true },
      { unit: "strip", factorToBase: value.stripToTablet || 1, isSellUnit: true },
      { unit: "box", factorToBase: (value.stripToTablet || 1) * (value.boxToStrip || 1), isSellUnit: true },
    ],
  };
}
