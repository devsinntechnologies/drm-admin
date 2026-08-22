"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import Loading from "@/components/common/Loading";
import { useWebsite } from "@/hooks/useWebsite";
import { cn } from "@/lib/utils";

type WebsitePreviewContentProps = {
  businessId: string;
};

export function WebsitePreviewContent({ businessId }: WebsitePreviewContentProps) {
  const { website, loading } = useWebsite(businessId);
  const [mode, setMode] = useState<"staging" | "public">("public");

  if (loading) return <Loading className="py-16" />;

  if (!website) {
    return (
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-8 text-center">
        <h3 className="text-lg font-semibold text-[#0f172a]">No website to preview yet</h3>
        <p className="mt-2 text-sm text-[#64748b]">
          Create your website first from the overview, then come back here to preview it.
        </p>
      </section>
    );
  }

  const stagingUrl = website.defaultUrl;
  const publicUrl = website.publicUrl;
  const previewUrl = mode === "staging" && stagingUrl ? stagingUrl : publicUrl;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#0f172a]">Website preview</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              See the customer-facing site before or after publishing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stagingUrl ? (
              <button
                type="button"
                onClick={() => setMode("staging")}
                className={cn(
                  "h-9 rounded-lg px-3 text-sm font-medium",
                  mode === "staging"
                    ? "bg-[var(--brand-secondary)] text-white"
                    : "border border-[#e2e8f0] bg-white text-[#64748b]",
                )}
              >
                Staging
              </button>
            ) : null}
            {publicUrl ? (
              <button
                type="button"
                onClick={() => setMode("public")}
                className={cn(
                  "h-9 rounded-lg px-3 text-sm font-medium",
                  mode === "public"
                    ? "bg-[var(--brand-secondary)] text-white"
                    : "border border-[#e2e8f0] bg-white text-[#64748b]",
                )}
              >
                Public
              </button>
            ) : null}
            {previewUrl ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="dn-btn dn-btn-outline inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm"
              >
                Open in new tab <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
        {previewUrl ? (
          <p className="mt-3 text-xs font-medium text-[#64748b]">{previewUrl}</p>
        ) : null}
      </section>

      {previewUrl ? (
        <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
          <iframe
            title="Website preview"
            src={previewUrl}
            className="h-[min(72vh,720px)] w-full bg-white"
          />
        </section>
      ) : (
        <section className="rounded-xl border border-[#e2e8f0] bg-[var(--input-bg,#f8fafc)] p-8 text-center text-sm text-[#64748b]">
          Preview URL is not available yet. Finish website setup on the overview page.
        </section>
      )}
    </div>
  );
}
