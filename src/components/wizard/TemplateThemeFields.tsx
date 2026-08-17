"use client";

import { cn } from "@/lib/utils";
import { ACCENT_COLORS } from "@/templates/modules";
import type { AccentColor, ThemeMode } from "@/templates/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-[#64748b]">{label}</span>
      {children}
    </label>
  );
}

type TemplateThemeFieldsProps = {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
  secondaryColor: string;
  onSecondaryColorChange: (color: string) => void;
  productLabel?: string;
  onProductLabelChange?: (value: string) => void;
  productsLabel?: string;
  onProductsLabelChange?: (value: string) => void;
};

export function TemplateThemeFields({
  themeMode,
  onThemeModeChange,
  primaryColor,
  onPrimaryColorChange,
  secondaryColor,
  onSecondaryColorChange,
  productLabel,
  onProductLabelChange,
  productsLabel,
  onProductsLabelChange,
}: TemplateThemeFieldsProps) {
  const showLabelFields =
    productLabel !== undefined &&
    onProductLabelChange &&
    productsLabel !== undefined &&
    onProductsLabelChange;

  return (
    <>
      <Field label="Interface">
        <div className="flex gap-2">
          {(["light", "dark"] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onThemeModeChange(mode)}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize",
                themeMode === mode
                  ? "border-transparent text-white"
                  : "border-[#e2e8f0] bg-white text-[#334155]",
              )}
              style={themeMode === mode ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
            >
              {mode}
            </button>
          ))}
        </div>
      </Field>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Primary colour">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="h-11 w-14 cursor-pointer rounded-xl border border-[#e2e8f0] bg-white p-1"
            />
            <input
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
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
              onChange={(e) => onSecondaryColorChange(e.target.value)}
              className="h-11 w-14 cursor-pointer rounded-xl border border-[#e2e8f0] bg-white p-1"
            />
            <input
              value={secondaryColor}
              onChange={(e) => onSecondaryColorChange(e.target.value)}
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
                  onPrimaryColorChange(preset.primary);
                  onSecondaryColorChange(preset.secondary);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold",
                  active ? "border-[#0f172a] bg-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#64748b]",
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

      {showLabelFields ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Singular label (was Product)">
            <input
              value={productLabel}
              onChange={(e) => onProductLabelChange(e.target.value)}
              className="portal-input"
            />
          </Field>
          <Field label="Plural label (was Products)">
            <input
              value={productsLabel}
              onChange={(e) => onProductsLabelChange(e.target.value)}
              className="portal-input"
            />
          </Field>
        </div>
      ) : null}
    </>
  );
}
