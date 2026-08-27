"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

type SoftwareTemplateNotConfiguredProps = {
  businessId: string;
  isSuperAdmin?: boolean;
};

export function SoftwareTemplateNotConfigured({
  businessId,
  isSuperAdmin = true,
}: SoftwareTemplateNotConfiguredProps) {
  return (
    <section className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#d97706]" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#92400e]">Software template not set up</h3>
          <p className="mt-1 text-sm text-[#b45309]">
            Role permissions and mobile features need an industry template. Run setup or save features from the
            Features tab first.
          </p>
          {isSuperAdmin ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/dashboard/superAdmin/businesses/setup"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-secondary)] hover:underline"
              >
                Run setup wizard <ArrowRight className="h-4 w-4" />
              </Link>
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
