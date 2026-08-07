"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type GptPreviewButtonProps = {
  onClick: () => void;
  className?: string;
};

export function GptPreviewButton({ onClick, className }: GptPreviewButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="GPT Preview Template"
      aria-label="GPT Preview Template"
      className={cn(
        "group inline-flex items-center gap-2 rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-sm font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#dbeafe]",
        className,
      )}
    >
      <Sparkles className="h-4 w-4 transition group-hover:scale-110" />
      <span className="hidden sm:inline">GPT Preview Template</span>
      <span className="sm:hidden">AI Preview</span>
    </button>
  );
}
