"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStepItem = {
  id: string;
  label: string;
  description?: string;
};

type WizardStepperProps = {
  steps: WizardStepItem[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
  allowJumpToCompleted?: boolean;
  completedStepIds?: string[];
  className?: string;
};

export function WizardStepper({
  steps,
  currentStepId,
  onStepClick,
  allowJumpToCompleted = false,
  completedStepIds = [],
  className,
}: WizardStepperProps) {
  const currentIndex = Math.max(0, steps.findIndex((step) => step.id === currentStepId));
  const currentStep = steps[currentIndex];
  const progress = steps.length > 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;

  return (
    <nav aria-label="Setup progress" className={cn("w-full", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-secondary)]">
          Step {currentIndex + 1} of {steps.length}
        </p>
        <p className="text-xs text-[#64748b]">
          {currentIndex + 1}/{steps.length}
        </p>
      </div>

      <h2 className="mt-1 text-lg font-semibold text-[#64748b]">{currentStep?.label}</h2>
      {currentStep?.description ? (
        <p className="mt-0.5 text-sm text-[#94a3b8]">{currentStep.description}</p>
      ) : null}

      <div
        className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-label={`Step ${currentIndex + 1} of ${steps.length}`}
      >
        <div
          className="h-full rounded-full bg-[var(--brand-secondary)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol
        className="mt-4 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => {
          const isActive = step.id === currentStepId;
          const isCompleted = completedStepIds.includes(step.id) || index < currentIndex;
          const canJump = allowJumpToCompleted && isCompleted && !isActive && onStepClick;

          return (
            <li key={step.id} className="min-w-0">
              <button
                type="button"
                disabled={!canJump && !isActive}
                title={step.label}
                aria-label={`${step.label}${isCompleted ? ", completed" : ""}${isActive ? ", current" : ""}`}
                aria-current={isActive ? "step" : undefined}
                onClick={() => canJump && onStepClick?.(step.id)}
                className={cn(
                  "flex w-full flex-col items-center gap-1.5 rounded-lg px-0.5 py-1 transition",
                  canJump && "cursor-pointer hover:bg-[var(--brand-primary-soft)]",
                  !canJump && !isActive && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold",
                    isActive && "bg-[var(--brand-secondary)] text-white",
                    isCompleted && !isActive && "bg-[#059669] text-white",
                    !isActive && !isCompleted && "border border-[#e2e8f0] bg-white text-[#94a3b8]",
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center text-[10px] font-medium leading-tight sm:text-[11px]",
                    isActive && "text-[var(--brand-secondary)]",
                    isCompleted && !isActive && "text-[#059669]",
                    !isActive && !isCompleted && "text-[#94a3b8]",
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
