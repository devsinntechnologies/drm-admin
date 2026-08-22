"use client";

import { Check, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardFormField, WizardFormSection } from "@/components/wizard/WizardFormField";
import { ACCENT_COLORS } from "@/templates/modules";
import type { AccentColor, ThemeMode } from "@/templates/types";

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

const THEME_MODES: Array<{ mode: ThemeMode; label: string; hint: string; icon: typeof Sun }> = [
  { mode: "light", label: "Light", hint: "Bright workspace", icon: Sun },
  { mode: "dark", label: "Dark", hint: "Easy on the eyes", icon: Moon },
];

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

  const activePreset = (Object.keys(ACCENT_COLORS) as AccentColor[]).find((key) => {
    const preset = ACCENT_COLORS[key];
    return (
      primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
      secondaryColor.toLowerCase() === preset.secondary.toLowerCase()
    );
  });

  return (
    <div className="wizard-form-stack">
      <WizardFormSection title="Screen mode" description="How the admin workspace should look.">
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {THEME_MODES.map(({ mode, label, hint, icon: Icon }) => {
            const selected = themeMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onThemeModeChange(mode)}
                className={cn(
                  "relative rounded-xl border-2 p-4 text-left transition-all duration-200",
                  selected
                    ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] shadow-[0_4px_16px_rgba(0,80,248,0.12)]"
                    : "border-[#e8edf3] bg-white hover:border-[var(--brand-secondary)]/40 hover:shadow-sm",
                )}
              >
                {selected ? (
                  <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[var(--brand-secondary)] text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : null}
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                      selected
                        ? "bg-[var(--brand-secondary)] text-white"
                        : "bg-[var(--app-bg)] text-[#64748b]",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 pr-4">
                    <p className={cn("font-semibold", selected ? "text-[var(--brand-secondary)]" : "text-[#475569]")}>
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs text-[#94a3b8]">{hint}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </WizardFormSection>

      <div className="wizard-form-divider" />

      <WizardFormSection title="Brand colours" description="Pick a colour theme for buttons and menus.">
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
            const preset = ACCENT_COLORS[key];
            const selected = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onPrimaryColorChange(preset.primary);
                  onSecondaryColorChange(preset.secondary);
                }}
                className={cn(
                  "relative rounded-xl border-2 p-3 text-left transition-all duration-200",
                  selected
                    ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)]"
                    : "border-[#e8edf3] bg-white hover:border-[#cbd5e1]",
                )}
              >
                {selected ? (
                  <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-[var(--brand-secondary)] text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                ) : null}
                <span className="flex h-6 w-full overflow-hidden rounded-lg border border-[#e2e8f0]">
                  <span className="h-full flex-1" style={{ backgroundColor: preset.primary }} />
                  <span className="h-full flex-1" style={{ backgroundColor: preset.secondary }} />
                </span>
                <p className={cn("mt-2 text-xs font-semibold", selected ? "text-[var(--brand-secondary)]" : "text-[#64748b]")}>
                  {preset.label}
                </p>
              </button>
            );
          })}
        </div>

        <details className="mt-4 rounded-xl border border-[#e8edf3] bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-[#64748b]">
            Fine-tune colours
          </summary>
          <div className="grid gap-4 border-t border-[#eef2f6] px-4 py-4 md:grid-cols-2">
            <WizardFormField label="Main colour">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => onPrimaryColorChange(e.target.value)}
                  className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-[#e2e8f0] bg-[var(--input-bg,#f8fafc)] p-1"
                />
                <input
                  value={primaryColor}
                  onChange={(e) => onPrimaryColorChange(e.target.value)}
                  className="wizard-input font-mono uppercase"
                />
              </div>
            </WizardFormField>
            <WizardFormField label="Accent colour">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => onSecondaryColorChange(e.target.value)}
                  className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-[#e2e8f0] bg-[var(--input-bg,#f8fafc)] p-1"
                />
                <input
                  value={secondaryColor}
                  onChange={(e) => onSecondaryColorChange(e.target.value)}
                  className="wizard-input font-mono uppercase"
                />
              </div>
            </WizardFormField>
          </div>
        </details>
      </WizardFormSection>

      {showLabelFields ? (
        <>
          <div className="wizard-form-divider" />
          <WizardFormSection title="Product wording" description="What items are called in this business.">
            <div className="wizard-form-grid mt-3">
              <WizardFormField label="Singular" hint="e.g. Medicine, Product, Item">
                <input
                  value={productLabel}
                  onChange={(e) => onProductLabelChange(e.target.value)}
                  className="wizard-input"
                  placeholder="Medicine"
                />
              </WizardFormField>
              <WizardFormField label="Plural" hint="e.g. Medicines, Products, Items">
                <input
                  value={productsLabel}
                  onChange={(e) => onProductsLabelChange(e.target.value)}
                  className="wizard-input"
                  placeholder="Medicines"
                />
              </WizardFormField>
            </div>
          </WizardFormSection>
        </>
      ) : null}
    </div>
  );
}
