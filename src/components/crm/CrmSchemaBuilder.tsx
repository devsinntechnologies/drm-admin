"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import { FeatureTip } from "@/components/ui/FeatureTip";
import { CRM_TIPS, CRM_TYPE_TIPS } from "@/lib/feature-tips";
import { useCrmModules, useCrmSchema } from "@/hooks/useCrmSchema";
import {
  AVAILABLE_BUILTIN_CARD_FIELDS,
  BUILTIN_CARD_FIELD_LABELS,
  CRM_FIELD_TYPE_LABELS,
  CRM_FIELD_TYPES,
  CRM_MODULE_LABELS,
  CRM_MODULES,
  defaultCardLayout,
  slugifyFieldKey,
  type CrmCardField,
  type CrmFieldType,
  type CrmModuleId,
  type CrmModuleSchema,
  type PublicCrmField,
} from "@/lib/crm";
import { normalizeErrorMessage } from "@/lib/utils";

type DraftField = {
  key?: string;
  label: string;
  type: CrmFieldType;
  required: boolean;
  optionsText: string;
  placeholder: string;
  helpText: string;
  defaultValue: string;
  showOnForm: boolean;
  showOnCard: boolean;
  showOnDetail: boolean;
};

const emptyDraft = (): DraftField => ({
  label: "",
  type: "text",
  required: false,
  optionsText: "",
  placeholder: "",
  helpText: "",
  defaultValue: "",
  showOnForm: true,
  showOnCard: false,
  showOnDetail: true,
});

function optionsToText(options: PublicCrmField["options"]): string {
  return (options ?? [])
    .map((option) => (option.value === option.label ? option.value : `${option.value}|${option.label}`))
    .join("\n");
}

function textToOptions(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, label] = line.split("|").map((part) => part.trim());
      return { value, label: label || value };
    })
    .filter((option) => option.value);
}

function schemaToDrafts(schema: CrmModuleSchema | null): DraftField[] {
  return (schema?.fields ?? []).map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    optionsText: optionsToText(field.options),
    placeholder: field.placeholder ?? "",
    helpText: field.helpText ?? "",
    defaultValue: field.defaultValue == null ? "" : String(field.defaultValue),
    showOnForm: field.showOnForm !== false,
    showOnCard: field.showOnCard === true,
    showOnDetail: field.showOnDetail !== false,
  }));
}

type CrmSchemaBuilderProps = {
  businessId?: string | null;
};

export function CrmSchemaBuilder({ businessId }: CrmSchemaBuilderProps) {
  const { modules } = useCrmModules(businessId);
  const [moduleId, setModuleId] = useState<CrmModuleId>("products");
  const { schema, loading, saving, error, save } = useCrmSchema(moduleId, businessId);
  const [fields, setFields] = useState<DraftField[]>([]);
  const [showImage, setShowImage] = useState(true);
  const [cardFields, setCardFields] = useState<CrmCardField[]>([]);

  const moduleMeta = modules.find((item) => item.moduleId === moduleId);
  const builtinFields = AVAILABLE_BUILTIN_CARD_FIELDS[moduleId];

  useEffect(() => {
    if (!schema) return;
    setFields(schemaToDrafts(schema));
    setShowImage(schema.cardLayout?.showImage ?? defaultCardLayout(moduleId).showImage);
    setCardFields(schema.cardLayout?.fields?.length ? schema.cardLayout.fields : defaultCardLayout(moduleId).fields);
  }, [schema, moduleId]);

  const cardChoices = useMemo(() => {
    const custom = fields
      .filter((field) => field.label.trim())
      .map((field) => ({
        source: "custom" as const,
        key: field.key || field.label,
        label: field.label,
      }));
    const builtin = builtinFields.map((field) => ({
      source: "builtin" as const,
      key: field.key,
      label: BUILTIN_CARD_FIELD_LABELS[moduleId]?.[field.key] ?? field.key,
    }));
    return [...builtin, ...custom];
  }, [builtinFields, fields, moduleId]);

  const selectedKeys = new Set(cardFields.map((field) => `${field.source}:${field.key}`));

  const moveCard = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= cardFields.length) return;
    const copy = [...cardFields];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    setCardFields(copy);
  };

  const toggleCardField = (source: "builtin" | "custom", key: string, checked: boolean) => {
    if (checked) {
      if (selectedKeys.has(`${source}:${key}`)) return;
      setCardFields((prev) => [...prev, { source, key }]);
      if (source === "custom") {
        setFields((prev) =>
          prev.map((field) =>
            (field.key || field.label) === key ? { ...field, showOnCard: true } : field,
          ),
        );
      }
      return;
    }
    setCardFields((prev) => prev.filter((field) => !(field.source === source && field.key === key)));
    if (source === "custom") {
      setFields((prev) =>
        prev.map((field) =>
          (field.key || field.label) === key ? { ...field, showOnCard: false } : field,
        ),
      );
    }
  };

  const onSave = async () => {
    try {
      const used = new Set<string>();
      const payloadFields = fields.map((field, index) => {
        const label = field.label.trim();
        if (!label) {
          throw new Error("Every custom field needs a label");
        }
        const options = textToOptions(field.optionsText);
        if ((field.type === "select" || field.type === "multiselect") && options.length === 0) {
          throw new Error(`"${label}" needs at least one option (one per line)`);
        }
        let key = slugifyFieldKey(field.key || label, `field_${index + 1}`);
        if (used.has(key)) key = `${key}_${index + 1}`;
        used.add(key);
        return {
          key,
          label,
          type: field.type,
          required: field.required,
          options,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue === "" ? null : field.defaultValue,
          sortOrder: index,
          showOnForm: field.showOnForm,
          showOnCard: field.showOnCard,
          showOnDetail: field.showOnDetail,
        };
      });

      const keyByDraft = new Map(
        fields.map((field, index) => [field.key || field.label, payloadFields[index].key]),
      );
      const customKeys = new Set(payloadFields.map((field) => field.key));
      const layoutFields = cardFields
        .map((field) => {
          if (field.source === "builtin") return field;
          const resolved = keyByDraft.get(field.key) || slugifyFieldKey(field.key);
          return { source: "custom" as const, key: resolved };
        })
        .filter((field) =>
          field.source === "builtin"
            ? builtinFields.some((item) => item.key === field.key)
            : customKeys.has(field.key),
        );

      await save({
        moduleId,
        fields: payloadFields,
        cardLayout: {
          showImage,
          fields: layoutFields.length ? layoutFields : defaultCardLayout(moduleId).fields,
        },
      });
      toast.success(`Saved ${CRM_MODULE_LABELS[moduleId]} fields and card layout`);
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Could not save custom fields"));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {CRM_MODULES.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setModuleId(id)}
            title={CRM_TIPS.module}
            className={
              moduleId === id
                ? "rounded-full bg-[#001840] px-3 py-1.5 text-xs font-bold text-white"
                : "rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#334155] hover:bg-[#f8fafc]"
            }
          >
            {CRM_MODULE_LABELS[id]}
          </button>
        ))}
      </div>

      {moduleMeta && !moduleMeta.recordValuesEnabled ? (
        <p className="rounded-xl bg-[#fffbeb] px-3 py-2 text-xs text-[#92400e]">
          Field schema and card layout for {CRM_MODULE_LABELS[moduleId]} are saved now.
          Record values for this module will attach automatically when its form is wired.
        </p>
      ) : (
        <p className="text-xs text-[#64748b]">
          Add extra fields, then choose what appears on cards in the portal and later on the mobile app.
        </p>
      )}

      {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}
      {loading ? <p className="text-sm text-[#64748b]">Loading schema…</p> : null}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <article key={`${field.key ?? "new"}-${index}`} className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#0f172a]">{field.label || `Field ${index + 1}`}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[#64748b] hover:bg-white"
                  onClick={() => {
                    if (index === 0) return;
                    const copy = [...fields];
                    [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
                    setFields(copy);
                  }}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[#64748b] hover:bg-white"
                  onClick={() => {
                    if (index === fields.length - 1) return;
                    const copy = [...fields];
                    [copy[index + 1], copy[index]] = [copy[index], copy[index + 1]];
                    setFields(copy);
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[#ef4444] hover:bg-white"
                  onClick={() => {
                    const next = fields.filter((_, i) => i !== index);
                    setFields(next);
                    const removedKey = field.key || field.label;
                    setCardFields((prev) =>
                      prev.filter((item) => !(item.source === "custom" && item.key === removedKey)),
                    );
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Label" required tip={CRM_TIPS.label}>
                <input
                  className={portalInputClass}
                  value={field.label}
                  onChange={(event) => {
                    const copy = [...fields];
                    copy[index] = { ...field, label: event.target.value };
                    setFields(copy);
                  }}
                />
              </FormField>
              <FormField label="Type" tip={CRM_TYPE_TIPS[field.type] ?? CRM_TIPS.type}>
                <select
                  className={portalInputClass}
                  value={field.type}
                  onChange={(event) => {
                    const copy = [...fields];
                    copy[index] = { ...field, type: event.target.value as CrmFieldType };
                    setFields(copy);
                  }}
                >
                  {CRM_FIELD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CRM_FIELD_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Placeholder" tip={CRM_TIPS.placeholder}>
                <input
                  className={portalInputClass}
                  value={field.placeholder}
                  onChange={(event) => {
                    const copy = [...fields];
                    copy[index] = { ...field, placeholder: event.target.value };
                    setFields(copy);
                  }}
                />
              </FormField>
              <FormField label="Help text" tip={CRM_TIPS.helpText}>
                <input
                  className={portalInputClass}
                  value={field.helpText}
                  onChange={(event) => {
                    const copy = [...fields];
                    copy[index] = { ...field, helpText: event.target.value };
                    setFields(copy);
                  }}
                />
              </FormField>
              {field.type === "select" || field.type === "multiselect" ? (
                <FormField label="Options (one per line, optional value|label)" className="sm:col-span-2" tip={CRM_TIPS.options}>
                  <textarea
                    className={portalInputClass}
                    rows={3}
                    value={field.optionsText}
                    placeholder={"mild\nmedium\nhot"}
                    onChange={(event) => {
                      const copy = [...fields];
                      copy[index] = { ...field, optionsText: event.target.value };
                      setFields(copy);
                    }}
                  />
                </FormField>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-[#334155]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(event) => {
                    const copy = [...fields];
                    copy[index] = { ...field, required: event.target.checked };
                    setFields(copy);
                  }}
                />
                Required
                <FeatureTip text={CRM_TIPS.required} />
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={field.showOnForm}
                  onChange={(event) => {
                    const copy = [...fields];
                    copy[index] = { ...field, showOnForm: event.target.checked };
                    setFields(copy);
                  }}
                />
                Show on form
                <FeatureTip text={CRM_TIPS.showOnForm} />
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={field.showOnDetail}
                  onChange={(event) => {
                    const copy = [...fields];
                    copy[index] = { ...field, showOnDetail: event.target.checked };
                    setFields(copy);
                  }}
                />
                Show on detail
                <FeatureTip text={CRM_TIPS.showOnDetail} />
              </label>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setFields((prev) => [...prev, emptyDraft()])}
        className="inline-flex items-center gap-2 rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-sm font-semibold text-[#1d4ed8]"
      >
        <Plus className="h-4 w-4" /> Add field
      </button>

      <div className="rounded-2xl border border-[#e2e8f0] p-4">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0f172a]">
          Card layout
          <FeatureTip text={CRM_TIPS.cardLayout} />
        </h3>
        <p className="mb-3 text-xs text-[#64748b]">
          Choose which built-in and custom fields appear on list cards, and in what order.
        </p>
        <label className="mb-3 inline-flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={showImage} onChange={(event) => setShowImage(event.target.checked)} />
          Show image
          <FeatureTip text={CRM_TIPS.showImage} />
        </label>
        <div className="space-y-2">
          {cardChoices.map((choice) => {
            const identity = `${choice.source}:${choice.key}`;
            const checked = selectedKeys.has(identity);
            const orderIndex = cardFields.findIndex(
              (field) => field.source === choice.source && field.key === choice.key,
            );
            return (
              <div
                key={identity}
                className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-3 py-2"
              >
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => toggleCardField(choice.source, choice.key, event.target.checked)}
                  />
                  <span>
                    {choice.label}
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-[#94a3b8]">
                      {choice.source}
                    </span>
                  </span>
                </label>
                {checked ? (
                  <div className="flex items-center gap-1">
                    <button type="button" className="rounded p-1 hover:bg-[#f8fafc]" onClick={() => moveCard(orderIndex, -1)}>
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded p-1 hover:bg-[#f8fafc]" onClick={() => moveCard(orderIndex, 1)}>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={saving || loading}
        onClick={() => void onSave()}
        className="rounded-xl bg-[#001840] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save custom fields"}
      </button>
    </div>
  );
}
