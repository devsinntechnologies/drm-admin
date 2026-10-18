"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eye,
  EyeOff,
  ImageIcon,
  LayoutTemplate,
  Loader2,
  ReceiptText,
  Type,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { ReceiptPreview } from "@/components/business/ReceiptPreview";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import { resolveMediaUrl } from "@/lib/media-url";
import {
  RECEIPT_DIVIDER_CHOICES,
  RECEIPT_LABEL_DEFAULTS,
  RECEIPT_LABEL_NAMES,
  RECEIPT_LOGO_MODES,
  RECEIPT_LOGO_WIDTH,
  RECEIPT_MAX_FEED_LINES,
  RECEIPT_MAX_PADDING,
  RECEIPT_SAMPLE_SCENARIOS,
  RECEIPT_TEMPLATES,
  buildReceiptSample,
  composeCustom,
  receiptSectionsOf,
  settingsForCustom,
  type CustomReceiptTemplate,
  type ReceiptAlign,
  type ReceiptSampleScenario,
  type ReceiptSectionStyle,
  type ReceiptSettings,
} from "@/lib/receipt-templates";
import { cn, normalizeErrorMessage } from "@/lib/utils";

type Store = { name?: string | null; address?: string | null; phone?: string | null };

const TABS = [
  { id: "layout", label: "Layout", icon: LayoutTemplate },
  { id: "logo", label: "Logo", icon: ImageIcon },
  { id: "sections", label: "Sections", icon: ReceiptText },
  { id: "titles", label: "Titles", icon: Type },
  { id: "details", label: "Details", icon: Bold },
] as const;
type TabId = (typeof TABS)[number]["id"];

const DIVIDER_LABELS: Record<string, string> = {
  default: "Template default",
  none: "No lines",
};

const ALIGNS: { id: ReceiptAlign; icon: typeof AlignLeft; label: string }[] = [
  { id: "left", icon: AlignLeft, label: "Left" },
  { id: "center", icon: AlignCenter, label: "Center" },
  { id: "right", icon: AlignRight, label: "Right" },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-[#0f172a]">{label}</span>
      {hint ? <span className="ml-2 text-xs text-[#64748b]">{hint}</span> : null}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-[#0f172a]">{label}</span>
        <span className="rounded-md bg-[#f1f5f9] px-2 py-0.5 text-xs font-semibold text-[#334155]">
          {display ?? value}
        </span>
      </div>
      <input
        type="range"
        className="mt-2 w-full accent-[var(--brand-secondary)]"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Small segmented toggle; clicking the active option clears the override. */
function Toggle({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "grid h-8 min-w-8 place-items-center rounded-md border px-1.5 text-xs font-semibold transition",
        active
          ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
          : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Invoice editor for one business copy: live 80mm preview on the left,
 * controls on the right. "Apply" hands the edited copy back to the panel,
 * which saves it with the rest of the receipt settings.
 */
export function InvoiceTemplateEditor({
  template,
  settings,
  store,
  businessId,
  onCancel,
  onApply,
}: {
  template: CustomReceiptTemplate;
  settings: ReceiptSettings;
  store: Store;
  businessId: string;
  onCancel: () => void;
  onApply: (template: CustomReceiptTemplate) => void;
}) {
  const { token } = useAuth();
  const [t, setT] = useState(template);
  const [tab, setTab] = useState<TabId>("layout");
  const [scenario, setScenario] = useState<ReceiptSampleScenario>("dineIn");
  const [uploading, setUploading] = useState(false);
  const [paymentText, setPaymentText] = useState((template.paymentLines ?? []).join("\n"));
  const fileRef = useRef<HTMLInputElement>(null);

  const base = RECEIPT_TEMPLATES.find((item) => item.id === t.baseTemplateId) ?? RECEIPT_TEMPLATES[0];
  const sample = useMemo(() => buildReceiptSample(scenario, store), [scenario, store]);
  const document = useMemo(() => composeCustom(t, sample, settings), [t, sample, settings]);
  const sections = useMemo(
    () => receiptSectionsOf(t.baseTemplateId, sample, settingsForCustom(settings, { ...t, hidden: [] })),
    [t, sample, settings],
  );
  const hidden = new Set(t.hidden);

  const patch = (next: Partial<CustomReceiptTemplate>) => setT((prev) => ({ ...prev, ...next }));

  function toggleSection(id: string) {
    patch({ hidden: hidden.has(id) ? t.hidden.filter((h) => h !== id) : [...t.hidden, id] });
  }

  function setStyle(section: string, key: keyof ReceiptSectionStyle, value: ReceiptSectionStyle[typeof key]) {
    const current = t.styles[section] ?? {};
    const nextStyle = { ...current, [key]: current[key] === value ? undefined : value };
    patch({ styles: { ...t.styles, [section]: nextStyle } });
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("logo", file);
      const result = await apiClient.upload<{ url: string }>("/receipt-templates/logo", form, token, businessId);
      patch({ logoMode: "custom", logoUrl: result.url });
      toast.success("Logo uploaded");
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Could not upload the logo."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function apply() {
    if (!t.name.trim()) {
      toast.error("Give this invoice a name.");
      setTab("layout");
      return;
    }
    if (t.logoMode === "custom" && !t.logoUrl) {
      toast.error("Upload a logo or pick another logo option.");
      setTab("logo");
      return;
    }
    onApply({ ...t, name: t.name.trim() });
  }

  const businessLogo = settings.businessLogoUrl;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-6xl p-0" align="top">
        <DialogHeader className="border-b border-[#e2e8f0] px-6 py-4">
          <DialogTitle>Edit invoice · {t.name || "Untitled"}</DialogTitle>
          <DialogDescription>
            Custom copy of {base.name}. The original template stays unchanged; POS devices print this copy once it is
            saved and selected.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,420px)_1fr]">
          {/* Live preview */}
          <div className="border-b border-[#e2e8f0] bg-[#f1f5f9] p-5 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Live preview</span>
              <div className="dn-tab-bar">
                {RECEIPT_SAMPLE_SCENARIOS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="dn-tab"
                    data-active={scenario === item.id ? "true" : "false"}
                    onClick={() => setScenario(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex max-h-[70vh] justify-center overflow-auto rounded-xl py-2">
              <ReceiptPreview document={document} fontSize={10} />
            </div>
          </div>

          {/* Controls */}
          <div className="flex min-h-[520px] flex-col">
            <nav className="flex gap-1 overflow-x-auto border-b border-[#e2e8f0] px-4 pt-3" aria-label="Editor sections">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2 text-sm font-semibold",
                    tab === id
                      ? "border-[var(--brand-secondary)] text-[var(--brand-secondary)]"
                      : "border-transparent text-[#64748b] hover:text-[#0f172a]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 lg:max-h-[64vh]">
              {tab === "layout" ? (
                <>
                  <Field label="Invoice name" hint="Shown to staff on the POS.">
                    <input
                      className="portal-input w-full"
                      maxLength={60}
                      value={t.name}
                      onChange={(e) => patch({ name: e.target.value })}
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Slider
                      label="Left padding"
                      value={t.paddingLeft}
                      min={0}
                      max={RECEIPT_MAX_PADDING}
                      display={`${t.paddingLeft} col`}
                      onChange={(v) => patch({ paddingLeft: v })}
                    />
                    <Slider
                      label="Right padding"
                      value={t.paddingRight}
                      min={0}
                      max={RECEIPT_MAX_PADDING}
                      display={`${t.paddingRight} col`}
                      onChange={(v) => patch({ paddingRight: v })}
                    />
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-[#0f172a]">Divider lines</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {RECEIPT_DIVIDER_CHOICES.map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => patch({ divider: choice })}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold",
                            t.divider === choice
                              ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                              : "border-[#e2e8f0] text-[#334155] hover:border-[#cbd5e1]",
                          )}
                        >
                          {DIVIDER_LABELS[choice] ?? choice.repeat(8)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Slider
                    label="Blank lines before cut"
                    value={t.feedLines}
                    min={0}
                    max={RECEIPT_MAX_FEED_LINES}
                    onChange={(v) => patch({ feedLines: v })}
                  />
                </>
              ) : null}

              {tab === "logo" ? (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {RECEIPT_LOGO_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => patch({ logoMode: mode.id })}
                        className={cn(
                          "rounded-xl border p-3 text-left text-sm",
                          t.logoMode === mode.id
                            ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)]"
                            : "border-[#e2e8f0] hover:border-[#cbd5e1]",
                        )}
                      >
                        <span className="font-semibold text-[#0f172a]">{mode.label}</span>
                        {mode.id === "business" && !businessLogo ? (
                          <span className="mt-0.5 block text-xs text-[#b45309]">
                            No business logo yet — upload one under Business details.
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>

                  {t.logoMode === "custom" ? (
                    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-[#cbd5e1] p-4">
                      {t.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveMediaUrl(t.logoUrl, "receipt-logos") ?? ""}
                          alt="Uploaded receipt logo"
                          className="h-16 max-w-[180px] rounded border border-[#e2e8f0] bg-white object-contain p-1"
                        />
                      ) : (
                        <span className="text-sm text-[#64748b]">No logo uploaded yet.</span>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void onUpload(file);
                        }}
                      />
                      <button
                        type="button"
                        className="dn-btn dn-btn-outline"
                        disabled={uploading}
                        onClick={() => fileRef.current?.click()}
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {t.logoUrl ? "Replace logo" : "Upload logo"}
                      </button>
                      <span className="w-full text-xs text-[#64748b]">
                        PNG, JPG or WebP up to 2 MB. Black-and-white logos print best on thermal paper.
                      </span>
                    </div>
                  ) : null}

                  {t.logoMode !== "none" ? (
                    <Slider
                      label="Logo size"
                      value={t.logoWidth}
                      min={RECEIPT_LOGO_WIDTH.min}
                      max={RECEIPT_LOGO_WIDTH.max}
                      step={10}
                      display={`${Math.round((t.logoWidth / 576) * 100)}% of paper`}
                      onChange={(v) => patch({ logoWidth: v })}
                    />
                  ) : null}
                </>
              ) : null}

              {tab === "sections" ? (
                <ul className="divide-y divide-[#f1f5f9] rounded-xl border border-[#e2e8f0]">
                  {sections.map((section) => {
                    const isHidden = hidden.has(section.id);
                    const style = t.styles[section.id] ?? {};
                    const styleable = !["logo", "qr"].includes(section.id);
                    return (
                      <li key={section.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggleSection(section.id)}
                          title={isHidden ? "Show on receipt" : "Hide from receipt"}
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-md border",
                            isHidden
                              ? "border-[#e2e8f0] text-[#94a3b8]"
                              : "border-[#bbf7d0] bg-[#ecfdf5] text-[#059669]",
                          )}
                        >
                          {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <span
                          className={cn(
                            "min-w-[150px] flex-1 text-sm font-medium",
                            isHidden ? "text-[#94a3b8] line-through" : "text-[#0f172a]",
                          )}
                        >
                          {section.name}
                        </span>
                        {!isHidden && styleable ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {section.hasText
                              ? ALIGNS.map(({ id, icon: Icon, label }) => (
                                  <Toggle
                                    key={id}
                                    title={`Align ${label.toLowerCase()}`}
                                    active={style.align === id}
                                    onClick={() => setStyle(section.id, "align", id)}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                  </Toggle>
                                ))
                              : null}
                            <span className="mx-1 h-5 w-px bg-[#e2e8f0]" />
                            <Toggle
                              title="Bold"
                              active={style.bold === true}
                              onClick={() => setStyle(section.id, "bold", true)}
                            >
                              <Bold className="h-3.5 w-3.5" />
                            </Toggle>
                            <Toggle
                              title="Regular weight"
                              active={style.bold === false}
                              onClick={() => setStyle(section.id, "bold", false)}
                            >
                              <span className="font-normal">Aa</span>
                            </Toggle>
                            <span className="mx-1 h-5 w-px bg-[#e2e8f0]" />
                            {[1, 2, 3].map((size) => (
                              <Toggle
                                key={size}
                                title={`Text size ${size}x`}
                                active={style.size === size}
                                onClick={() => setStyle(section.id, "size", size)}
                              >
                                {size}x
                              </Toggle>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                  <li className="px-3 py-2 text-xs text-[#64748b]">
                    Unselected style buttons keep the {base.name} default. Click an active button again to reset it.
                  </li>
                </ul>
              ) : null}

              {tab === "titles" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(RECEIPT_LABEL_DEFAULTS[t.baseTemplateId]).map(([key, fallback]) => (
                    <Field key={key} label={RECEIPT_LABEL_NAMES[key] ?? key}>
                      <input
                        className="portal-input w-full"
                        maxLength={40}
                        placeholder={fallback}
                        value={t.labels[key] ?? ""}
                        onChange={(e) => patch({ labels: { ...t.labels, [key]: e.target.value } })}
                      />
                    </Field>
                  ))}
                  <p className="text-xs text-[#64748b] sm:col-span-2">Leave a title empty to keep the default text.</p>
                </div>
              ) : null}

              {tab === "details" ? (
                <div className="grid gap-4">
                  <Field label="Header note" hint="Under the business name.">
                    <input
                      className="portal-input w-full"
                      maxLength={120}
                      placeholder="e.g. Desi taste since 1998"
                      value={t.headerNote}
                      onChange={(e) => patch({ headerNote: e.target.value })}
                    />
                  </Field>
                  <Field label="Footer note">
                    <input
                      className="portal-input w-full"
                      maxLength={120}
                      placeholder="e.g. Thank you! Please visit again"
                      value={t.footerNote}
                      onChange={(e) => patch({ footerNote: e.target.value })}
                    />
                  </Field>
                  <Field label="Payment / wallet numbers" hint="One per line, up to 4.">
                    <textarea
                      className="portal-input min-h-[84px] w-full font-mono"
                      placeholder={t.baseTemplateId === "classic" ? "Empty = Classic built-in numbers" : ""}
                      value={paymentText}
                      onChange={(e) => {
                        setPaymentText(e.target.value);
                        const lines = e.target.value
                          .split("\n")
                          .map((l) => l.trim())
                          .filter(Boolean)
                          .slice(0, 4);
                        patch({ paymentLines: lines.length ? lines : null });
                      }}
                    />
                  </Field>
                  <Field label="QR code link">
                    <input
                      className="portal-input w-full"
                      maxLength={300}
                      placeholder="https://diginizam.com/"
                      disabled={hidden.has("qr")}
                      value={t.qrUrl}
                      onChange={(e) => patch({ qrUrl: e.target.value })}
                    />
                  </Field>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#e2e8f0] px-5 py-3">
              <button type="button" className="dn-btn dn-btn-outline" onClick={onCancel}>
                Cancel
              </button>
              <button type="button" className="dn-btn dn-btn-primary" onClick={apply}>
                Apply changes
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
