"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WizardFormFieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  hintTone?: "default" | "success" | "error";
  className?: string;
  children: ReactNode;
};

export function WizardFormField({
  label,
  required,
  hint,
  hintTone = "default",
  className,
  children,
}: WizardFormFieldProps) {
  return (
    <div className={cn("wizard-field", className)}>
      <span className="wizard-field-label">
        {label}
        {required ? <span className="wizard-required">*</span> : null}
      </span>
      {children}
      <span
        className={cn(
          "wizard-field-hint",
          hintTone === "success" && "wizard-field-hint--success",
          hintTone === "error" && "wizard-field-hint--error",
        )}
      >
        {hint || "\u00a0"}
      </span>
    </div>
  );
}

export function WizardFormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("wizard-form-section", className)}>
      {title ? <h3 className="wizard-form-section-title">{title}</h3> : null}
      {description ? <p className="wizard-form-section-desc">{description}</p> : null}
      {children}
    </section>
  );
}
