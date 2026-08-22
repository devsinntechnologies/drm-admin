"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GptPreviewButton } from "@/components/wizard/GptPreviewButton";
import { cn } from "@/lib/utils";

type WizardLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  preview?: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  backLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextDisabled?: boolean;
  finishDisabled?: boolean;
  showGptPreview?: boolean;
  onOpenGptPreview?: () => void;
  className?: string;
  accentBlue?: boolean;
};

export function WizardLayout({
  title,
  subtitle,
  children,
  preview,
  onBack,
  onNext,
  onFinish,
  backLabel = "Back",
  nextLabel = "Continue",
  finishLabel = "Create business",
  isFirstStep,
  isLastStep,
  nextDisabled,
  finishDisabled,
  showGptPreview = true,
  onOpenGptPreview,
  className,
  accentBlue = false,
}: WizardLayoutProps) {
  const continueClass = accentBlue
    ? "wizard-btn-continue"
    : "wizard-btn-continue !border-[var(--brand-primary)] !bg-[var(--brand-primary)] !shadow-[0_8px_20px_rgba(0,24,64,0.2)] hover:!bg-[var(--brand-primary-hover)]";

  return (
    <div className={cn("wizard-shell space-y-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="wizard-heading">{title}</h2>
          {subtitle ? <p className="wizard-subheading">{subtitle}</p> : null}
        </div>
        {showGptPreview && onOpenGptPreview ? (
          <GptPreviewButton onClick={onOpenGptPreview} />
        ) : null}
      </div>

      {preview ? <div>{preview}</div> : null}

      <div className="wizard-panel">{children}</div>

      <footer className="wizard-actions">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirstStep || !onBack}
          className="wizard-btn-back"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={onFinish}
            disabled={finishDisabled}
            className={continueClass}
          >
            {finishLabel}
            <ArrowRight className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={continueClass}
          >
            {nextLabel}
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </footer>
    </div>
  );
}
