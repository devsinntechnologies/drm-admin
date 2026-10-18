"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Eye, Loader2, Pencil, ReceiptText, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ControlSection } from "@/components/business/ControlSection";
import { InvoiceTemplateEditor } from "@/components/business/InvoiceTemplateEditor";
import { ReceiptPreview } from "@/components/business/ReceiptPreview";
import Loading from "@/components/common/Loading";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetBusinessByIdQuery, type BusinessRecord } from "@/hooks/useBusiness";
import { useUpdateTemplateConfigMutation, type ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import {
  LEGACY_PAYMENT_LINES,
  RECEIPT_COLUMNS,
  RECEIPT_SAMPLE_SCENARIOS,
  RECEIPT_TEMPLATES,
  buildReceiptSample,
  composeReceipt,
  copyOfTemplate,
  newCustomTemplateId,
  parseReceiptSettings,
  serializeReceiptSettings,
  templateName,
  type CustomReceiptTemplate,
  type ReceiptData,
  type ReceiptSampleScenario,
  type ReceiptSettings,
  type ReceiptTemplateId,
} from "@/lib/receipt-templates";
import { cn, normalizeErrorMessage } from "@/lib/utils";

/** Most copies a business can keep (API limit). */
const MAX_CUSTOM_TEMPLATES = 12;

/** Scales the 48-column receipt to whatever width the card gives it. */
function FittedReceipt({ templateId, data, settings }: {
  templateId: string;
  data: ReceiptData;
  settings: ReceiptSettings;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(7);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      // ~0.62em per monospace glyph, 28px paper padding, 24px breathing room.
      const width = entry.contentRect.width - 28 - 24;
      setFontSize(Math.max(5, Math.min(11, width / (RECEIPT_COLUMNS * 0.62))));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const document = useMemo(() => composeReceipt(templateId, data, settings), [templateId, data, settings]);
  return (
    <div ref={ref} className="flex justify-center pt-4">
      <ReceiptPreview document={document} fontSize={fontSize} />
    </div>
  );
}

function linesToText(lines: string[]) {
  return lines.join("\n");
}

function textToLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function SoftwareInvoiceTemplatesPanel({ businessId }: { businessId: string }) {
  const { data: business, isLoading } = useGetBusinessByIdQuery(businessId, { skip: !businessId });
  const templateConfig = business?.templateConfig ?? null;

  if (isLoading) {
    return <Loading className="py-16" label="Loading invoice templates…" />;
  }

  if (!business || !templateConfig?.id) {
    return (
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-sm text-[#64748b]">
        Set up Software Control for this business first, then choose its POS invoice template here.
      </section>
    );
  }

  const saved = parseReceiptSettings(templateConfig.moduleSettings);
  // Remount the editor when the saved settings change so the draft resets.
  return (
    <InvoiceTemplatesEditor
      key={JSON.stringify(serializeReceiptSettings(saved))}
      businessId={businessId}
      business={business}
      templateConfig={templateConfig}
      saved={saved}
    />
  );
}

function InvoiceTemplatesEditor({
  businessId,
  business,
  templateConfig,
  saved,
}: {
  businessId: string;
  business: BusinessRecord;
  templateConfig: ApiTemplateConfig;
  saved: ReceiptSettings;
}) {
  const [updateConfig, { isLoading: saving }] = useUpdateTemplateConfigMutation();
  const [draft, setDraft] = useState<ReceiptSettings>(saved);
  const [paymentText, setPaymentText] = useState(() =>
    linesToText(saved.paymentLines ?? LEGACY_PAYMENT_LINES),
  );
  const [scenario, setScenario] = useState<ReceiptSampleScenario>("dineIn");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ template: CustomReceiptTemplate; isNew: boolean } | null>(null);

  const store = useMemo(
    () => ({ name: business.businessName, address: business.address, phone: business.phone }),
    [business.businessName, business.address, business.phone],
  );
  const sample = useMemo(() => buildReceiptSample(scenario, store), [scenario, store]);
  // "Business logo" copies preview with the logo from the business profile.
  const businessLogoUrl = business.logo || templateConfig.logoUrl || null;
  const previewSettings = useMemo(() => ({ ...draft, businessLogoUrl }), [draft, businessLogoUrl]);

  const dirty = JSON.stringify(serializeReceiptSettings(draft)) !== JSON.stringify(serializeReceiptSettings(saved));

  function patch(next: Partial<ReceiptSettings>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  function setDefault(id: string) {
    setDraft((prev) => ({
      ...prev,
      templateId: id,
      allowedTemplateIds: prev.allowedTemplateIds.includes(id)
        ? prev.allowedTemplateIds
        : [...prev.allowedTemplateIds, id],
    }));
  }

  function toggleAllowed(id: string) {
    if (id === draft.templateId) return;
    setDraft((prev) => ({
      ...prev,
      allowedTemplateIds: prev.allowedTemplateIds.includes(id)
        ? prev.allowedTemplateIds.filter((item) => item !== id)
        : [...prev.allowedTemplateIds, id],
    }));
  }

  function customize(baseId: ReceiptTemplateId) {
    if (draft.customTemplates.length >= MAX_CUSTOM_TEMPLATES) {
      toast.error(`A business can keep up to ${MAX_CUSTOM_TEMPLATES} custom invoices. Delete one first.`);
      return;
    }
    setEditing({ template: { ...copyOfTemplate(baseId, draft), id: newCustomTemplateId() }, isNew: true });
  }

  function applyEdit(template: CustomReceiptTemplate) {
    const isNew = editing?.isNew ?? false;
    setDraft((prev) => ({
      ...prev,
      customTemplates: isNew
        ? [...prev.customTemplates, template]
        : prev.customTemplates.map((item) => (item.id === template.id ? template : item)),
      allowedTemplateIds:
        isNew && !prev.allowedTemplateIds.includes(template.id)
          ? [...prev.allowedTemplateIds, template.id]
          : prev.allowedTemplateIds,
    }));
    setEditing(null);
    toast.success(`${isNew ? "Created" : "Updated"} "${template.name}". Click Save invoice templates to publish it.`);
  }

  function deleteCopy(copy: CustomReceiptTemplate) {
    if (!window.confirm(`Delete the custom invoice "${copy.name}"? POS devices using it go back to the default.`)) {
      return;
    }
    setDraft((prev) => ({
      ...prev,
      customTemplates: prev.customTemplates.filter((item) => item.id !== copy.id),
      templateId: prev.templateId === copy.id ? copy.baseTemplateId : prev.templateId,
      allowedTemplateIds: prev.allowedTemplateIds.filter((item) => item !== copy.id),
    }));
  }

  async function onSave() {
    const toastId = toast.loading("Saving invoice templates…");
    try {
      await updateConfig({
        id: templateConfig.id,
        body: {
          businessId,
          moduleSettings: {
            ...(templateConfig.moduleSettings ?? {}),
            receipt: serializeReceiptSettings(draft),
          },
        },
      }).unwrap();
      toast.success("Saved. POS devices use it after their next refresh or app resume.", { id: toastId });
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Could not save invoice templates."), { id: toastId });
    }
  }

  const canCustomize = draft.customTemplates.length < MAX_CUSTOM_TEMPLATES;

  return (
    <div className="space-y-5 pb-20">
      <ControlSection
        index={1}
        icon={ReceiptText}
        title="POS invoice templates"
        description="Previews use a sample order with this business's name, address and phone. The default prints on every POS device; staff can switch only to templates you enable. Customize a template to make this business's own copy — the original never changes."
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Sample order</span>
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

        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
          {RECEIPT_TEMPLATES.map((info) => (
            <TemplateCard
              key={info.id}
              id={info.id}
              name={info.name}
              summary={info.summary}
              highlights={info.highlights}
              data={sample}
              settings={previewSettings}
              isDefault={draft.templateId === info.id}
              allowed={draft.allowedTemplateIds.includes(info.id)}
              onPreview={() => setPreviewId(info.id)}
              onSetDefault={() => setDefault(info.id)}
              onToggleAllowed={() => toggleAllowed(info.id)}
              extraActions={
                <button
                  type="button"
                  className="dn-btn dn-btn-outline w-full justify-center"
                  disabled={!canCustomize}
                  onClick={() => customize(info.id)}
                >
                  <Copy className="h-4 w-4" />
                  Customize
                </button>
              }
            />
          ))}
          {draft.customTemplates.map((copy) => (
            <TemplateCard
              key={copy.id}
              id={copy.id}
              name={copy.name}
              badge={`Custom · based on ${templateName(draft, copy.baseTemplateId)}`}
              summary="This business's own copy, edited in the invoice editor."
              data={sample}
              settings={previewSettings}
              isDefault={draft.templateId === copy.id}
              allowed={draft.allowedTemplateIds.includes(copy.id)}
              onPreview={() => setPreviewId(copy.id)}
              onSetDefault={() => setDefault(copy.id)}
              onToggleAllowed={() => toggleAllowed(copy.id)}
              extraActions={
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="dn-btn dn-btn-outline flex-1 justify-center"
                    onClick={() => setEditing({ template: copy, isNew: false })}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="dn-btn dn-btn-outline justify-center text-[#dc2626]"
                    aria-label={`Delete ${copy.name}`}
                    onClick={() => deleteCopy(copy)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              }
            />
          ))}
        </div>
      </ControlSection>

      <ControlSection
        index={2}
        icon={Settings2}
        title="Receipt details"
        description="Printed by the built-in templates. Leave a note empty to hide it. Custom copies keep their own details — edit them in the invoice editor."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[#0f172a]">Header note</span>
            <input
              className="portal-input mt-1 w-full"
              maxLength={120}
              placeholder="e.g. Desi taste since 1998"
              value={draft.headerNote}
              onChange={(e) => patch({ headerNote: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#0f172a]">Footer note</span>
            <input
              className="portal-input mt-1 w-full"
              maxLength={120}
              placeholder="e.g. Thank you! Please visit again"
              value={draft.footerNote}
              onChange={(e) => patch({ footerNote: e.target.value })}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="font-medium text-[#0f172a]">Payment / wallet numbers</span>
            <span className="ml-2 text-xs text-[#64748b]">One per line, up to 4.</span>
            <textarea
              className="portal-input mt-1 min-h-[84px] w-full font-mono"
              value={paymentText}
              onChange={(e) => {
                setPaymentText(e.target.value);
                patch({ paymentLines: textToLines(e.target.value).slice(0, 4) });
              }}
            />
            {draft.paymentLines == null ? (
              <span className="mt-1 block text-xs text-[#b45309]">
                Using the built-in Classic numbers (printed when the invoice has a phone). Edit to replace them, or clear to hide.
              </span>
            ) : null}
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="font-medium text-[#0f172a]">QR code link</span>
            <input
              className="portal-input mt-1 w-full"
              maxLength={300}
              value={draft.qrUrl}
              disabled={!draft.showQr}
              onChange={(e) => patch({ qrUrl: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#0f172a]">
          {(
            [
              ["showLogo", "Print logo"],
              ["showQr", "Print QR code"],
              ["showPoweredBy", 'Print "Powered by DigiNizam"'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--brand-secondary)]"
                checked={draft[key]}
                onChange={(e) => patch({ [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      </ControlSection>

      <div className="pointer-events-none sticky bottom-4 z-10 flex justify-end">
        <button
          type="button"
          className="dn-btn dn-btn-primary pointer-events-auto shadow-lg"
          disabled={!dirty || saving}
          onClick={onSave}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {dirty ? "Save invoice templates" : "All changes saved"}
        </button>
      </div>

      <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent className="max-w-xl" align="top">
          {previewId ? (
            <>
              <DialogHeader>
                <DialogTitle>{templateName(draft, previewId)} invoice</DialogTitle>
                <DialogDescription>
                  {RECEIPT_SAMPLE_SCENARIOS.find((item) => item.id === scenario)?.label} sample on 80mm paper.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex justify-center rounded-xl bg-[#f1f5f9] p-5">
                <ReceiptPreview document={composeReceipt(previewId, sample, previewSettings)} fontSize={11} />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {editing ? (
        <InvoiceTemplateEditor
          key={editing.template.id}
          template={editing.template}
          settings={previewSettings}
          store={store}
          businessId={businessId}
          onCancel={() => setEditing(null)}
          onApply={applyEdit}
        />
      ) : null}
    </div>
  );
}

function TemplateCard({
  id,
  name,
  summary,
  highlights = [],
  badge,
  data,
  settings,
  isDefault,
  allowed,
  onPreview,
  onSetDefault,
  onToggleAllowed,
  extraActions,
}: {
  id: string;
  name: string;
  summary: string;
  highlights?: string[];
  /** e.g. "Custom · based on Classic". */
  badge?: string;
  data: ReceiptData;
  settings: ReceiptSettings;
  isDefault: boolean;
  allowed: boolean;
  onPreview: () => void;
  onSetDefault: () => void;
  onToggleAllowed: () => void;
  extraActions?: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-white",
        isDefault ? "border-[var(--brand-secondary)] ring-2 ring-[var(--brand-primary-soft)]" : "border-[#e2e8f0]",
      )}
    >
      <button
        type="button"
        onClick={onPreview}
        className="group relative h-[340px] overflow-hidden bg-[#f1f5f9] text-left"
        aria-label={`Preview ${name} invoice`}
      >
        <FittedReceipt templateId={id} data={data} settings={settings} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f1f5f9] to-transparent" />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#0f172a] opacity-0 shadow-sm transition group-hover:opacity-100">
          <Eye className="h-3.5 w-3.5" /> Full preview
        </span>
        {isDefault ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-xs font-semibold text-[#059669]">
            Default on POS
          </span>
        ) : null}
      </button>
      <div className="flex flex-1 flex-col p-4">
        {badge ? (
          <span className="mb-1 w-fit rounded-full bg-[#eef2ff] px-2 py-0.5 text-[11px] font-semibold text-[#4338ca]">
            {badge}
          </span>
        ) : null}
        <h3 className="text-base font-semibold text-[#0f172a]">{name}</h3>
        <p className="mt-1 text-sm text-[#64748b]">{summary}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {highlights.map((item) => (
            <span key={item} className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-medium text-[#475569]">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-4">
          <label
            className={cn(
              "mb-3 flex items-center gap-2 text-sm",
              isDefault ? "text-[#94a3b8]" : "text-[#0f172a]",
            )}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--brand-secondary)]"
              checked={allowed}
              disabled={isDefault}
              onChange={onToggleAllowed}
            />
            Staff can switch to this
          </label>
          <button
            type="button"
            disabled={isDefault}
            onClick={onSetDefault}
            className={cn(
              "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold",
              isDefault ? "bg-[#ecfdf5] text-[#059669]" : "dn-btn dn-btn-primary",
            )}
          >
            {isDefault ? <Check className="h-4 w-4" /> : null}
            {isDefault ? "Default template" : "Set as default"}
          </button>
          {extraActions ? <div className="mt-2">{extraActions}</div> : null}
        </div>
      </div>
    </article>
  );
}
