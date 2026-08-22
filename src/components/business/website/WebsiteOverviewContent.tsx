"use client";

import Link from "next/link";
import { Globe2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { useWebsite } from "@/hooks/useWebsite";
import { normalizeErrorMessage } from "@/lib/utils";

function statusLabel(status?: string) {
  switch (status) {
    case "published":
      return "Published — live for customers";
    case "unpublished":
      return "Unpublished — hidden from customers";
    case "ready":
      return "Ready — open the builder to edit";
    case "provisioning":
      return "Setting up your website…";
    case "failed":
      return "Setup failed — try again";
    default:
      return "Not created yet";
  }
}

type WebsiteOverviewContentProps = {
  businessId?: string;
  websiteBasePath?: string;
};

export function WebsiteOverviewContent({
  businessId,
  websiteBasePath,
}: WebsiteOverviewContentProps = {}) {
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

  const base = websiteBasePath ?? (businessId ? `/dashboard/superAdmin/businesses/${businessId}/website` : "");

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
      toast.success(published ? "Website is now live" : "Website is now hidden", { id: toastId });
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to update website"), { id: toastId });
    }
  };

  const onOpenBuilder = async () => {
    const popup = window.open("about:blank", "diginizam-builder");
    const toastId = toast.loading(website ? "Opening builder..." : "Creating your website...");
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

      toast.loading("Opening builder...", { id: toastId });
      const session = await openBuilder();
      if (!session?.url) {
        throw new Error("Builder URL was not returned");
      }
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
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#001840] text-white">
            <Globe2 className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-semibold text-[#0f172a]">Create your website</h3>
          <p className="mt-2 text-sm text-[#64748b]">
            One click to launch a customer-facing site. Then add pages, pick a theme, and connect your domain.
          </p>
          {error ? <p className="mt-3 text-sm text-[#dc2626]">{error}</p> : null}
          <button
            type="button"
            onClick={onOpenBuilder}
            disabled={actionLoading}
            className="dn-btn dn-btn-primary mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
            Create website
          </button>
        </div>
      </section>
    );
  }

  const canEdit = website.status === "ready" || website.status === "published" || website.status === "unpublished";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Current status</p>
            <h3 className="mt-1 text-xl font-semibold text-[#0f172a]">{website.name}</h3>
            <p className="mt-2 text-sm text-[#64748b]">{statusLabel(website.status)}</p>
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
                Retry
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                onClick={() => onPublish(website.status !== "published")}
                disabled={actionLoading}
                className="dn-btn dn-btn-outline h-10 rounded-xl px-4 text-sm"
              >
                {website.status === "published" ? "Hide site" : "Go live"}
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

      {base ? (
        <p className="text-sm text-[#64748b]">
          Preview the site in{" "}
          <Link href={`${base}/preview`} className="font-semibold text-[var(--brand-secondary)]">
            Website preview
          </Link>
          . Custom domain: {website.customDomain || "Not connected"}
          {" · "}
          <Link href={`${base}/domain`} className="font-semibold text-[var(--brand-secondary)]">
            Set up domain
          </Link>
        </p>
      ) : null}
    </div>
  );
}
