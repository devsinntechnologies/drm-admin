"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePatchBusinessByIdMutation, type BusinessRecord } from "@/hooks/useBusiness";
import {
  isBusinessProductEnabled,
  type BusinessProductId,
} from "@/lib/business-products";
import { cn, normalizeErrorMessage } from "@/lib/utils";

const COPY: Record<
  BusinessProductId,
  { label: string; flag: "websiteEnabled" | "portalEnabled" | "softwareEnabled" }
> = {
  website: { label: "Website", flag: "websiteEnabled" },
  portal: { label: "Portal", flag: "portalEnabled" },
  software: { label: "Software & Mobile", flag: "softwareEnabled" },
};

type BusinessProductToggleProps = {
  business: BusinessRecord;
  product: BusinessProductId;
  className?: string;
};

export function BusinessProductToggle({
  business,
  product,
  className,
}: BusinessProductToggleProps) {
  const [patchBusiness, { isLoading }] = usePatchBusinessByIdMutation();
  const meta = COPY[product];
  const enabled = isBusinessProductEnabled(business[meta.flag]);

  const onToggle = async () => {
    const next = !enabled;
    const toastId = toast.loading(next ? `Enabling ${meta.label}…` : `Turning off ${meta.label}…`);
    try {
      await patchBusiness({
        id: business.id,
        body: { [meta.flag]: next },
      }).unwrap();
      toast.success(next ? `${meta.label} is now active.` : `${meta.label} is turned off.`, {
        id: toastId,
      });
    } catch (error) {
      toast.error(normalizeErrorMessage(error, `Could not update ${meta.label}.`), { id: toastId });
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${meta.label} ${enabled ? "on" : "off"}`}
      disabled={isLoading}
      onClick={() => void onToggle()}
      className={cn("inline-flex items-center gap-2 text-sm text-[#64748b]", className)}
    >
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
          enabled ? "bg-[#059669]" : "bg-[#cbd5e1]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            enabled && "translate-x-4",
          )}
        />
      </span>
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <span className={cn("font-medium", enabled ? "text-[#047857]" : "text-[#94a3b8]")}>
          {enabled ? "Active" : "Off"}
        </span>
      )}
    </button>
  );
}
