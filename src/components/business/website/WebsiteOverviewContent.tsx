"use client";

import { ExternalLink, Globe2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { useWebsite } from "@/hooks/useWebsite";
import { normalizeErrorMessage } from "@/lib/utils";

function statusLabel(status?: string) {
  switch (status) {
    case "published":
      return "Published";
    case "unpublished":
      return "Unpublished";
    case "ready":
      return "Ready";
    case "provisioning":
      return "Preparing";
    case "failed":
      return "Needs retry";
    default:
      return "Not created";
  }
}

export function WebsiteOverviewContent({ businessId }: { businessId?: string } = {}) {
  const {
    website,
    loading,
    actionLoading,
    error,
    createWebsite,
    retryWebsite,
    updateWebsite,
    openBuilder,
  } = useWebsite(businessId);

  const onRetry = async () => {
    const toastId = toast.loading("Retrying website setup...");
    try {
      await retryWebsite();
      toast.success("Website setup retried", { id: toastId });
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Retry failed"), { id: toastId });
    }
  };

  const onPublish = async (published: boolean) => {
    const toastId = toast.loading(published ? "Publishing website..." : "Unpublishing website...");
    try {
      await updateWebsite({ published });
      toast.success(published ? "Website published" : "Website unpublished", { id: toastId });
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to update website"), { id: toastId });
    }
  };

  const onOpenBuilder = async () => {
    // Open the tab synchronously, in direct response to the click, so
    // popup blockers don't treat it as an unsolicited popup once the
    // async work below finishes.
    const popup = window.open("about:blank", "diginizam-builder");
    const toastId = toast.loading(website ? "Opening DigiNizam builder..." : "Creating your DigiNizam website...");
    try {
      let current = website;
      if (!current) {
        current = await createWebsite();
      } else if (current.status === "failed" || current.status === "provisioning") {
        current = await retryWebsite();
      }

      if (
        !current ||
        !(current.status === "ready" || current.status === "published" || current.status === "unpublished")
      ) {
        throw new Error(current?.lastError || "Website is not ready yet. Try again in a moment.");
      }

      toast.loading("Opening DigiNizam builder...", { id: toastId });
      const session = await openBuilder();
      if (!session?.url) {
        throw new Error("Builder URL was not returned");
      }
      // The website builder needs to be its own top-level browsing context
      // (window.top === window.self) — Odoo's editor assumes this and
      // throws a same-origin-policy error when run inside a cross-origin
      // iframe like this admin portal, so it can't be embedded inline.
      if (popup) {
        popup.location.replace(session.url);
      } else {
        window.open(session.url, "diginizam-builder");
      }
      toast.success("Builder opened in a new tab", { id: toastId });
    } catch (err) {
      popup?.close();
      toast.error(normalizeErrorMessage(err, "Failed to open builder"), { id: toastId });
    }
  };

  if (loading) {
    return <Loading className="py-16" />;
  }

  if (!website) {
    return (
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#001840] text-white">
            <Globe2 className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-semibold text-[#0f172a]">Create a DigiNizam website</h3>
          <p className="mt-2 text-sm text-[#64748b]">
            Launch a customer-facing website for this business. Pages, themes, and custom domains
            are all branded as DigiNizam.
          </p>
          {error ? <p className="mt-3 text-sm text-[#dc2626]">{error}</p> : null}
          <button
            type="button"
            onClick={onOpenBuilder}
            disabled={actionLoading}
            className="dn-btn dn-btn-primary mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
            Open builder
          </button>
        </div>
      </section>
    );
  }

  const canEdit = website.status === "ready" || website.status === "published" || website.status === "unpublished";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Website status</p>
            <h3 className="mt-1 text-2xl font-semibold text-[#0f172a]">{website.name}</h3>
            <p className="mt-2 text-sm text-[#64748b]">
              {statusLabel(website.status)} · Built with DigiNizam
            </p>
            {website.lastError ? (
              <p className="mt-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#dc2626]">
                {website.lastError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {website.status === "failed" || website.status === "provisioning" ? (
              <button
                type="button"
                onClick={onRetry}
                disabled={actionLoading}
                className="dn-btn dn-btn-outline inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Retry setup
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                onClick={() => onPublish(website.status !== "published")}
                disabled={actionLoading}
                className="dn-btn dn-btn-outline h-10 rounded-xl px-4 text-sm"
              >
                {website.status === "published" ? "Unpublish" : "Publish"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenBuilder}
              disabled={actionLoading}
              className="dn-btn dn-btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Open builder
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">DigiNizam URL</p>
          <a
            href={website.defaultUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#0050F8]"
          >
            {website.defaultUrl}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Public URL</p>
          <a
            href={website.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#0050F8]"
          >
            {website.publicUrl}
            <ExternalLink className="h-4 w-4" />
          </a>
          <p className="mt-2 text-xs text-[#64748b]">
            Custom domain: {website.customDomain || "Not connected"}
          </p>
        </div>
      </section>
    </div>
  );
}
