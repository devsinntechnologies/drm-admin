"use client";

import type { ReactNode } from "react";
import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import type { PublicCrmField } from "@/lib/crm";
import { formFields } from "@/lib/crm";
import type { CrmModuleSchema } from "@/lib/crm";

type CrmRecordFieldsProps = {
  schema: CrmModuleSchema | null | undefined;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  inputClassName?: string;
};

function asString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export function CrmRecordFields({
  schema,
  values,
  onChange,
  inputClassName = portalInputClass,
}: CrmRecordFieldsProps) {
  const fields = formFields(schema);
  if (!fields.length) return null;

  const setValue = (key: string, value: unknown) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Custom fields</p>
      {fields.map((field) => (
        <FieldInput
          key={field.key}
          field={field}
          value={values[field.key]}
          onChange={(value) => setValue(field.key, value)}
          inputClassName={inputClassName}
        />
      ))}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  inputClassName,
}: {
  field: PublicCrmField;
  value: unknown;
  onChange: (value: unknown) => void;
  inputClassName: string;
}) {
  const common = {
    className: inputClassName,
    placeholder: field.placeholder || undefined,
    required: field.required,
  };

  let control: ReactNode;
  switch (field.type) {
    case "textarea":
      control = (
        <textarea
          {...common}
          rows={3}
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
    case "number":
    case "currency":
      control = (
        <input
          {...common}
          type="number"
          value={asString(value)}
          onChange={(event) =>
            onChange(event.target.value === "" ? "" : Number(event.target.value))
          }
        />
      );
      break;
    case "boolean":
      control = (
        <label className="flex items-center gap-2 rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={value === true || value === "true"}
            onChange={(event) => onChange(event.target.checked)}
          />
          Yes
        </label>
      );
      break;
    case "select":
      control = (
        <select
          {...common}
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
    case "multiselect":
      control = (
        <div className="space-y-2 rounded-xl bg-[#f3f4f6] px-4 py-3">
          {field.options.map((option) => {
            const selected = asStringArray(value);
            const checked = selected.includes(option.value);
            return (
              <label key={option.value} className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    onChange(
                      event.target.checked
                        ? [...selected, option.value]
                        : selected.filter((item) => item !== option.value),
                    );
                  }}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      );
      break;
    case "date":
      control = (
        <input
          {...common}
          type="date"
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
    case "email":
      control = (
        <input
          {...common}
          type="email"
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
    case "url":
      control = (
        <input
          {...common}
          type="url"
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
    case "phone":
      control = (
        <input
          {...common}
          type="tel"
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
    default:
      control = (
        <input
          {...common}
          type="text"
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }

  return (
    <FormField label={field.label} required={field.required} tip={field.helpText || undefined}>
      {control}
      {field.helpText ? <p className="text-xs text-[#94a3b8]">{field.helpText}</p> : null}
    </FormField>
  );
}
