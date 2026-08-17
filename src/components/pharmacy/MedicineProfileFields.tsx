"use client";

import { portalInputClass } from "@/components/admin/PortalPage";

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
  const set = (patch: Partial<MedicineProfileForm>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3 rounded-xl border border-[#dcfce7] bg-[#f0fdf4] p-4">
      <p className="text-sm font-semibold text-[#166534]">Medicine details</p>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={portalInputClass} placeholder="Generic name" value={value.genericName} onChange={(e) => set({ genericName: e.target.value })} />
        <input className={portalInputClass} placeholder="Salt / composition" value={value.saltName} onChange={(e) => set({ saltName: e.target.value })} />
        <input className={portalInputClass} placeholder="Barcode" value={value.barcode} onChange={(e) => set({ barcode: e.target.value })} />
        <input className={portalInputClass} placeholder="HSN" value={value.hsnCode} onChange={(e) => set({ hsnCode: e.target.value })} />
        <input className={portalInputClass} type="number" placeholder="GST %" value={value.gstRate} onChange={(e) => set({ gstRate: Number(e.target.value) })} />
        <input className={portalInputClass} type="number" placeholder="Reorder level" value={value.reorderLevel} onChange={(e) => set({ reorderLevel: Number(e.target.value) })} />
        <input className={portalInputClass} placeholder="Schedule (e.g. H1)" value={value.controlledSchedule} onChange={(e) => set({ controlledSchedule: e.target.value })} />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={value.rxRequired} onChange={(e) => set({ rxRequired: e.target.checked })} />
          Rx required
        </label>
        <input className={portalInputClass} type="number" placeholder="Tablets per strip" value={value.stripToTablet} onChange={(e) => set({ stripToTablet: Number(e.target.value) })} />
        <input className={portalInputClass} type="number" placeholder="Strips per box" value={value.boxToStrip} onChange={(e) => set({ boxToStrip: Number(e.target.value) })} />
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
