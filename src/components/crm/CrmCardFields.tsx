"use client";

import type { ReactNode } from "react";
import {
  cardLayoutOrDefault,
  formatCrmValue,
  type CrmModuleId,
  type CrmModuleSchema,
} from "@/lib/crm";

type CrmCardFieldsProps = {
  schema: CrmModuleSchema | null | undefined;
  moduleId: CrmModuleId;
  customFields?: Record<string, unknown> | null;
  builtin: Record<string, ReactNode>;
  className?: string;
};

export function CrmCardFields({
  schema,
  moduleId,
  customFields,
  builtin,
  className,
}: CrmCardFieldsProps) {
  const layout = cardLayoutOrDefault(schema, moduleId);
  const fieldsByKey = new Map((schema?.fields ?? []).map((field) => [field.key, field]));

  return (
    <div className={className}>
      {layout.fields.map((item) => {
        if (item.source === "builtin") {
          const node = builtin[item.key];
          return node ? <div key={`builtin-${item.key}`}>{node}</div> : null;
        }
        const field = fieldsByKey.get(item.key);
        const text = formatCrmValue(field, customFields?.[item.key]);
        if (!text) return null;
        return (
          <p key={`custom-${item.key}`} className="text-xs text-[#64748b]">
            <span className="font-semibold">{field?.label ?? item.key}: </span>
            {text}
          </p>
        );
      })}
    </div>
  );
}

export function crmShowsImage(schema: CrmModuleSchema | null | undefined, moduleId: CrmModuleId) {
  return cardLayoutOrDefault(schema, moduleId).showImage;
}
