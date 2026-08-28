"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getBusinessProfile, getIndustryLabel } from "@/lib/business-profile";
import { normalizeErrorMessage } from "@/lib/utils";
import { persistIndustryTemplateForBusiness } from "@/template-engine/persist-template-config";

type SoftwareTemplateNotConfiguredProps = {
  businessId: string;
  businessName?: string;
  isSuperAdmin?: boolean;
};

export function SoftwareTemplateNotConfigured({
  businessId,
  businessName = "",
  isSuperAdmin = true,
}: SoftwareTemplateNotConfiguredProps) {
  const router = useRouter();
  const [applying, setApplying] = useState(false);
  const profile = getBusinessProfile(businessId, businessName);
  const industryLabel = getIndustryLabel(profile.industryId);

  const handleApplyTemplate = async () => {
    setApplying(true);
    const toastId = toast.loading(`Applying ${industryLabel} template…`);
    try {
      await persistIndustryTemplateForBusiness({
        businessId,
        businessName: businessName || "Business",
        industryId: profile.industryId,
      });
      toast.success("Industry template applied. Mobile and portal software are ready.", { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error(
        normalizeErrorMessage(error, "Could not save the industry template. Check the API connection and try again."),
        { id: toastId },
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#d97706]" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#92400e]">Software template not set up</h3>
          <p className="mt-1 text-sm text-[#b45309]">
            The industry template was not saved to the server for this business. Apply the selected industry (
            {industryLabel}) once, or open Software control to customize modules.
          </p>
          {isSuperAdmin ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={applying}
                onClick={() => void handleApplyTemplate()}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-secondary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Apply {industryLabel} template
              </button>
              <Link
                href={`/dashboard/superAdmin/businesses/${businessId}/software/control`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-secondary)] hover:underline"
              >
                Go to Software control <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#b45309]">Contact your platform administrator to configure software.</p>
          )}
        </div>
      </div>
    </section>
  );
}
