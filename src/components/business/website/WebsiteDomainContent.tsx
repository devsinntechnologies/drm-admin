"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { useWebsite } from "@/hooks/useWebsite";
import { normalizeErrorMessage } from "@/lib/utils";

export function WebsiteDomainContent({ businessId }: { businessId?: string } = {}) {
  const { website, loading, actionLoading, attachDomain, verifyDomain, removeDomain } = useWebsite(businessId);
  const [domain, setDomain] = useState("");

  if (loading) return <Loading className="py-16" />;

  if (!website || website.status === "failed" || website.status === "provisioning") {
    return (
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 text-sm text-[#64748b]">
        Finish website setup on the Overview tab before connecting a domain.
      </section>
    );
  }

  const onAttach = async (event: React.FormEvent) => {
    event.preventDefault();
    const toastId = toast.loading("Connecting domain...");
    try {
      await attachDomain(domain.trim());
      setDomain("");
      toast.success("Domain saved. Add the DNS records below.", { id: toastId });
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to connect domain"), { id: toastId });
    }
  };

  const onVerify = async () => {
    const toastId = toast.loading("Verifying domain...");
    try {
      await verifyDomain();
      toast.success("Domain connected", { id: toastId });
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Verification failed"), { id: toastId });
    }
  };

  const onRemove = async () => {
    const toastId = toast.loading("Removing domain...");
    try {
      await removeDomain();
      toast.success("Custom domain removed", { id: toastId });
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to remove domain"), { id: toastId });
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
        <h3 className="text-lg font-semibold text-[#0f172a]">DigiNizam subdomain</h3>
        <p className="mt-2 text-sm text-[#64748b]">
          Every business website starts on a DigiNizam URL. Visitors will see a site built with DigiNizam.
        </p>
        <p className="mt-3 font-mono text-sm text-[#0050F8]">{website.defaultUrl}</p>
      </section>

      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
        <h3 className="text-lg font-semibold text-[#0f172a]">Custom domain</h3>
        <p className="mt-2 text-sm text-[#64748b]">
          Point your own domain at this website. After DNS is ready, verify it here.
        </p>

        {website.customDomain ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
              <div>
                <p className="font-semibold text-[#0f172a]">{website.customDomain}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-[#64748b]">
                  {website.customDomainStatus}
                </p>
              </div>
              <div className="flex gap-2">
                {website.customDomainStatus !== "connected" ? (
                  <button
                    type="button"
                    onClick={onVerify}
                    disabled={actionLoading}
                    className="dn-btn dn-btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Verify domain
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={actionLoading}
                  className="dn-btn dn-btn-outline inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>

            {website.dns ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#0f172a]">DNS records</p>
                {[website.dns.cname, website.dns.txt].map((record) => (
                  <div key={record.type} className="rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm">
                    <p className="font-semibold text-[#0f172a]">{record.type}</p>
                    <p className="mt-1 text-[#64748b]">Host: {record.host}</p>
                    <p className="break-all text-[#64748b]">Value: {record.value}</p>
                  </div>
                ))}
                <p className="text-xs text-[#64748b]">
                  Or publish `{website.dns.http.value}` at `{website.dns.http.path}`.
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <form onSubmit={onAttach} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1 space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Domain</span>
              <input
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="www.yourbusiness.com"
                className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm outline-none focus:border-[#0050F8]"
              />
            </label>
            <button
              type="submit"
              disabled={actionLoading || !domain.trim()}
              className="dn-btn dn-btn-primary h-11 rounded-xl px-4 text-sm"
            >
              Connect domain
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
