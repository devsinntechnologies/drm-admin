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
  finishLabel = "Generate",
  isFirstStep,
  isLastStep,
  nextDisabled,
  finishDisabled,
  showGptPreview = true,
  onOpenGptPreview,
  className,
}: WizardLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a] lg:text-xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[#64748b]">{subtitle}</p> : null}
        </div>
        {showGptPreview && onOpenGptPreview ? (
          <GptPreviewButton onClick={onOpenGptPreview} />
        ) : null}
      </div>

      {preview ? <div>{preview}</div> : null}

      <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">{children}</div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirstStep || !onBack}
          className="dn-btn dn-btn-ghost inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={onFinish}
            disabled={finishDisabled}
            className="dn-btn dn-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {finishLabel} <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="dn-btn dn-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {nextLabel} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
