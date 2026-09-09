"use client";

import { Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ControlSection } from "@/components/business/ControlSection";
import { FeatureTip } from "@/components/ui/FeatureTip";
import { useFbrActivity } from "@/hooks/useFbrActivity";
import { FBR_TIPS } from "@/lib/feature-tips";
import { normalizeErrorMessage } from "@/lib/utils";

function Stat({
  label,
  value,
  tone,
  tip,
}: {
  label: string;
  value: number;
  tone?: "ok" | "bad";
  tip: string;
}) {
  const color =
    tone === "ok" ? "text-[#15803d]" : tone === "bad" ? "text-[#dc2626]" : "text-[#0f172a]";
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3">
      <p className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]">
        {label}
        <FeatureTip text={tip} />
      </p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export function FbrActivityPanel({
  businessId,
  sectionIndex,
}: {
  businessId: string;
  sectionIndex: number;
}) {
  const {
    status,
    calls,
    submissions,
    callFilter,
    setCallFilter,
    loading,
    retryingId,
    error,
    refetch,
    retry,
  } = useFbrActivity(businessId);

  return (
    <ControlSection
      index={sectionIndex}
      title="FBR activity"
      description="Every FBR API call is stored here, plus a local invoice ledger. Paid invoices post in the background and never block the POS sale."
      icon={Activity}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#334155]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
        {status ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              status.ready
                ? "bg-[#dcfce7] text-[#166534]"
                : status.enabled
                  ? "bg-[#fef3c7] text-[#92400e]"
                  : "bg-[#f1f5f9] text-[#64748b]"
            }`}
          >
            {status.ready ? `${status.environment} ready` : status.enabled ? "Enabled, not ready" : "Disabled"}
          </span>
        ) : null}
      </div>

      {error ? <p className="mb-3 text-sm text-[#dc2626]">{error}</p> : null}
      {loading && !status ? <p className="text-sm text-[#64748b]">Loading FBR activity…</p> : null}

      {status ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="API calls" value={status.stats.apiCalls} tip={FBR_TIPS.apiCalls} />
          <Stat label="API success" value={status.stats.apiSuccess} tone="ok" tip={FBR_TIPS.apiSuccess} />
          <Stat label="API failed" value={status.stats.apiFailed} tone="bad" tip={FBR_TIPS.apiFailed} />
          <Stat label="Posted" value={status.stats.invoicesPosted} tone="ok" tip={FBR_TIPS.posted} />
          <Stat label="Pending" value={status.stats.invoicesPending} tip={FBR_TIPS.pending} />
          <Stat label="Failed invoices" value={status.stats.invoicesFailed} tone="bad" tip={FBR_TIPS.failedInvoices} />
        </div>
      ) : null}

      {status?.blockers?.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#92400e]">
          {status.blockers.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {status ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {status.features.map((feature) => (
            <article key={feature.id} className="rounded-xl border border-[#e2e8f0] p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#0f172a]">{feature.label}</h3>
                <span
                  className={`text-[11px] font-bold uppercase ${
                    feature.available ? "text-[#15803d]" : "text-[#94a3b8]"
                  }`}
                >
                  {feature.available ? "On" : "Off"}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#64748b]">{feature.description}</p>
              {feature.reason ? <p className="mt-1 text-xs text-[#b45309]">{feature.reason}</p> : null}
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0f172a]">
            API calls
            <FeatureTip text="Each validate or post request to FBR. Filter to see only failures." />
          </h3>
          <div className="flex gap-1">
            {(["all", "success", "failed"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCallFilter(value)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                  callFilter === value
                    ? "bg-[#001840] text-white"
                    : "border border-[#e2e8f0] bg-white text-[#64748b]"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[#64748b]">
              <tr>
                <th className="px-3 py-2 font-semibold">Time</th>
                <th className="px-3 py-2 font-semibold">Action</th>
                <th className="px-3 py-2 font-semibold">HTTP</th>
                <th className="px-3 py-2 font-semibold">Result</th>
                <th className="px-3 py-2 font-semibold">ms</th>
                <th className="px-3 py-2 font-semibold">Error</th>
              </tr>
            </thead>
            <tbody>
              {calls.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-[#94a3b8]" colSpan={6}>
                    No FBR API calls yet. They appear after a paid invoice posts.
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id} className="border-t border-[#f1f5f9]">
                    <td className="whitespace-nowrap px-3 py-2 text-[#334155]">
                      {new Date(call.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-semibold">{call.action}</td>
                    <td className="px-3 py-2">{call.httpStatus ?? "—"}</td>
                    <td className={`px-3 py-2 font-bold ${call.success ? "text-[#15803d]" : "text-[#dc2626]"}`}>
                      {call.success ? "Success" : "Failed"}
                    </td>
                    <td className="px-3 py-2">{call.durationMs}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-[#b45309]" title={call.errorMessage ?? ""}>
                      {call.errorMessage || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#0f172a]">
          Local FBR invoices
          <FeatureTip text="DigiNizam’s own copy of every invoice sent to FBR, including FBR invoice numbers and retry." />
        </h3>
        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[#64748b]">
              <tr>
                <th className="px-3 py-2 font-semibold">Invoice</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Attempts</th>
                <th className="px-3 py-2 font-semibold">FBR no.</th>
                <th className="px-3 py-2 font-semibold">Error</th>
                <th className="px-3 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-[#94a3b8]" colSpan={6}>
                    No local FBR rows yet.
                  </td>
                </tr>
              ) : (
                submissions.map((row) => (
                  <tr key={row.id} className="border-t border-[#f1f5f9]">
                    <td className="px-3 py-2 font-semibold">{row.invoiceNumber}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2">{row.attemptCount}</td>
                    <td className="px-3 py-2">{row.fbrInvoiceNumber || "—"}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-[#b45309]" title={row.lastError ?? ""}>
                      {row.lastError || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {row.status !== "posted" ? (
                        <button
                          type="button"
                          disabled={retryingId === row.id}
                          onClick={async () => {
                            try {
                              await retry(row.id);
                              toast.success("Retry sent");
                            } catch (err) {
                              toast.error(normalizeErrorMessage(err, "Retry failed"));
                            }
                          }}
                          className="text-xs font-bold text-[#1d4ed8]"
                        >
                          {retryingId === row.id ? "Retrying…" : "Retry"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ControlSection>
  );
}
