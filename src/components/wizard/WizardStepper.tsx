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
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
          Step {currentIndex + 1} of {steps.length}
        </p>
        <p className="text-base font-semibold text-[#0f172a]">{currentStep?.label}</p>
      </div>

      {currentStep?.description ? (
        <p className="mt-1 text-sm text-[#64748b]">{currentStep.description}</p>
      ) : null}

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#e2e8f0]"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-label={`Step ${currentIndex + 1} of ${steps.length}`}
      >
        <div
          className="h-full rounded-full bg-[#0050F8] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="mt-4 flex items-center justify-between gap-1">
        {steps.map((step, index) => {
          const isActive = step.id === currentStepId;
          const isCompleted = completedStepIds.includes(step.id) || index < currentIndex;
          const canJump = allowJumpToCompleted && isCompleted && !isActive && onStepClick;

          return (
            <li key={step.id} className="flex flex-1 flex-col items-center gap-1.5">
              <button
                type="button"
                disabled={!canJump}
                title={step.label}
                aria-label={`${step.label}${isCompleted ? ", completed" : ""}${isActive ? ", current" : ""}`}
                aria-current={isActive ? "step" : undefined}
                onClick={() => canJump && onStepClick?.(step.id)}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition",
                  isActive && "bg-[#001840] text-white ring-4 ring-[#001840]/15",
                  isCompleted && !isActive && "bg-[#059669] text-white",
                  !isActive && !isCompleted && "border-2 border-[#e2e8f0] bg-white text-[#94a3b8]",
                  canJump && "cursor-pointer hover:scale-105 hover:ring-2 hover:ring-[#059669]/30",
                  !canJump && "cursor-default",
                )}
              >
                {isCompleted && !isActive ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
              </button>
              <span
                className={cn(
                  "hidden max-w-[4.5rem] truncate text-center text-[10px] font-medium sm:block",
                  isActive ? "text-[#001840]" : isCompleted ? "text-[#059669]" : "text-[#94a3b8]",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {allowJumpToCompleted && completedStepIds.length > 0 ? (
        <p className="mt-3 text-center text-xs text-[#94a3b8]">
          Tap a completed step to go back and edit
        </p>
      ) : null}
    </nav>
  );
}
