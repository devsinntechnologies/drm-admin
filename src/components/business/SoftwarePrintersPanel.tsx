"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Cable, Loader2, Plus, Printer, RefreshCw, Trash2, Wifi } from "lucide-react";
import { toast } from "sonner";
import { ControlSection } from "@/components/business/ControlSection";
import Loading from "@/components/common/Loading";
import { FeatureTip } from "@/components/ui/FeatureTip";
import { useAuth } from "@/hooks/useAuth";
import { usePrinters } from "@/hooks/usePrinters";
import {
  emptyPrinterDraft,
  printerRoleLabel,
  printerStatusLabel,
  toPrinterDraft,
  type PrinterDraft,
  type PrinterRole,
} from "@/lib/printers";
import {
  deletePrintJob,
  listPrintJobs,
  type PrintJob,
} from "@/lib/print-jobs";
import { cn, normalizeErrorMessage } from "@/lib/utils";

type SoftwarePrintersPanelProps = {
  businessId: string;
  controlHref: string;
};

function formatSeenAt(value: string | null): string {
  if (!value) return "Not reported yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not reported yet";
  return date.toLocaleString();
}

function statusTone(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "FAILED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    case "PRINTING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function SoftwarePrintersPanel({ businessId, controlHref }: SoftwarePrintersPanelProps) {
  const { role, token } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const { data, loading, saving, error, save } = usePrinters(businessId);
  const [drafts, setDrafts] = useState<PrinterDraft[]>([]);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const refreshJobs = useCallback(async () => {
    if (!token || !businessId) return;
    setJobsLoading(true);
    try {
      const payload = await listPrintJobs(token, businessId, { limit: 40 });
      setJobs(payload.jobs ?? []);
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Could not load print queue"));
    } finally {
      setJobsLoading(false);
    }
  }, [token, businessId]);

  useEffect(() => {
    if (data?.printers) {
      setDrafts(data.printers.map(toPrinterDraft));
    }
  }, [data]);

  useEffect(() => {
    void refreshJobs();
    const onJobs = () => {
      void refreshJobs();
    };
    window.addEventListener("print_jobs:updated", onJobs);
    return () => window.removeEventListener("print_jobs:updated", onJobs);
  }, [refreshJobs]);

  const usedRoles = useMemo(() => new Set(drafts.map((item) => item.role)), [drafts]);
  const canAddKitchen = isSuperAdmin && !usedRoles.has("kitchen");
  const canAddReceipt = isSuperAdmin && !usedRoles.has("receipt");

  function updateDraft(index: number, patch: Partial<PrinterDraft>) {
    setDrafts((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function onSave() {
    try {
      await save(drafts);
      toast.success("Printer configuration saved. POS devices sync on next login or refresh.");
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Could not save printers"));
    }
  }

  async function onDeleteJob(jobId: string) {
    try {
      await deletePrintJob(token, businessId, jobId);
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      toast.success("Print job removed");
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Could not remove print job"));
    }
  }

  if (loading && !data) {
    return <Loading className="py-16" label="Loading printers…" />;
  }

  if (!data?.allowPrinter) {
    return (
      <ControlSection
        index={1}
        title="Printers"
        description="Turn on printer access in Software Control to configure receipt and kitchen printers."
        icon={Printer}
      >
        <p className="text-sm text-[#64748b]">
          Printer configuration stays hidden until printing is enabled for this business.
        </p>
        <Link
          href={controlHref}
          className="mt-4 inline-flex rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white"
        >
          Open Software Control
        </Link>
      </ControlSection>
    );
  }

  return (
    <div className="space-y-6">
      <ControlSection
        index={1}
        title="Printers"
        description="Configure receipt and kitchen printers for the Windows and mobile app. Status is reported by a POS device on the shop network — this portal cannot reach the printer itself."
        icon={Printer}
      >
        <p className="mb-4 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-xs text-[#64748b]">
          Static IP: type the printer address. Assign: the POS scans the LAN, stores the last IP locally, and reports it here.
          Printing works offline as long as the POS and printer are on the same Ethernet or Wi-Fi network.
        </p>

        {error ? (
          <p className="mb-4 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#dc2626]">{error}</p>
        ) : null}

        <div className="space-y-4">
          {drafts.map((draft, index) => {
            const live = data.printers.find((item) => item.id === draft.id);
            const connected = Boolean(live?.isConnected && live.lastStatus !== "unreachable");
            return (
              <article key={draft.id ?? `${draft.role}-${index}`} className="rounded-xl border border-[#e2e8f0] p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">
                      {printerRoleLabel(draft.role)} printer
                    </p>
                    <p className="text-xs text-[#64748b]">
                      {live
                        ? `${printerStatusLabel(live)}${live.lastSeenDeviceName ? ` · ${live.lastSeenDeviceName}` : ""}`
                        : "Not saved yet"}
                    </p>
                    {live?.ip ? (
                      <p className="mt-0.5 text-[11px] text-[#64748b]">
                        {live.ip.startsWith("system:") ? live.ip.slice(7) : `${live.ip}:${live.port}`}
                      </p>
                    ) : null}
                    {live?.lastSeenAt ? (
                      <p className="mt-0.5 text-[11px] text-[#94a3b8]">Last probe {formatSeenAt(live.lastSeenAt)}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {connected ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                        Connected
                      </span>
                    ) : null}
                    <label className="flex items-center gap-2 text-xs font-medium text-[#0f172a]">
                      <input
                        type="checkbox"
                        checked={draft.isEnabled}
                        onChange={(event) => updateDraft(index, { isEnabled: event.target.checked })}
                      />
                      Enabled
                    </label>
                    {isSuperAdmin && drafts.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setDrafts((prev) => prev.filter((_, i) => i !== index))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#fee2e2] text-[#ef4444]"
                        title="Remove printer role"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-[#64748b]">
                    Name
                    <input
                      className="mt-1 w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172a]"
                      value={draft.name}
                      onChange={(event) => updateDraft(index, { name: event.target.value })}
                    />
                  </label>
                  <label className="text-xs font-semibold text-[#64748b]">
                    Connection
                    <span className="mt-1 flex gap-2">
                      {(["ethernet", "wifi", "usb"] as const).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateDraft(index, { connectionType: value })}
                          className={cn(
                            "inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold",
                            draft.connectionType === value
                              ? "border-[#0f172a] bg-[#0f172a] text-white"
                              : "border-[#e2e8f0] bg-white text-[#475569]",
                          )}
                        >
                          {value === "wifi" ? (
                            <Wifi className="h-3.5 w-3.5" />
                          ) : value === "usb" ? (
                            <Printer className="h-3.5 w-3.5" />
                          ) : (
                            <Cable className="h-3.5 w-3.5" />
                          )}
                          {value === "wifi"
                            ? "Wi-Fi IP"
                            : value === "usb"
                              ? "USB / Windows"
                              : "Ethernet"}
                        </button>
                      ))}
                    </span>
                  </label>
                  <label className="text-xs font-semibold text-[#64748b]">
                    Address mode
                    <select
                      className="mt-1 w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172a]"
                      value={draft.ipMode}
                      onChange={(event) =>
                        updateDraft(index, { ipMode: event.target.value as PrinterDraft["ipMode"] })
                      }
                    >
                      <option value="static">Static IP</option>
                      <option value="assign">Assign from POS scan</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-[#64748b]">
                    Port
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172a]"
                      value={draft.port}
                      onChange={(event) => updateDraft(index, { port: Number(event.target.value) || 9100 })}
                    />
                  </label>
                  <label className="text-xs font-semibold text-[#64748b] sm:col-span-2">
                    IP address
                    <input
                      className="mt-1 w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172a]"
                      value={draft.ip}
                      placeholder={draft.ipMode === "assign" ? "Last assigned IP from the POS" : "192.168.1.101"}
                      readOnly={draft.ipMode === "assign"}
                      onChange={(event) => updateDraft(index, { ip: event.target.value })}
                    />
                    {draft.ipMode === "assign" ? (
                      <span className="mt-1 block font-normal text-[#94a3b8]">
                        The POS fills this after a LAN scan. Last known IP is cached on the device for offline printing.
                      </span>
                    ) : null}
                  </label>
                </div>
              </article>
            );
          })}
        </div>

        {isSuperAdmin && (canAddReceipt || canAddKitchen) ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {canAddReceipt ? (
              <AddRoleButton role="receipt" onClick={() => setDrafts((prev) => [...prev, emptyPrinterDraft("receipt")])} />
            ) : null}
            {canAddKitchen ? (
              <AddRoleButton role="kitchen" onClick={() => setDrafts((prev) => [...prev, emptyPrinterDraft("kitchen")])} />
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-xs text-[#94a3b8]">
            Super admin sets which printer roles exist. Business admin can change IP, Ethernet/Wi-Fi, and static vs assign.
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save printers
          </button>
          <FeatureTip text="Windows and mobile apps pull this list with module config and keep the last IPs locally if internet drops." />
        </div>
      </ControlSection>

      <ControlSection
        index={2}
        title="Printer Queue"
        description="Invoice and test print jobs shared between the web portal and DigiNizam app. The connected POS prints USB/Windows jobs."
        icon={Printer}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs text-[#64748b]">
            {jobs.length} recent job{jobs.length === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={() => void refreshJobs()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#0f172a]"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", jobsLoading && "animate-spin")} />
            Refresh
          </button>
        </div>
        {jobs.length === 0 ? (
          <p className="text-sm text-[#94a3b8]">No print jobs yet.</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0f172a]">
                    {job.jobType === "TEST_INVOICE" ? "Test" : "Invoice"} #
                    {job.referenceNumber || job.referenceId || job.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {[job.printerName || "Printer", new Date(job.createdAt).toLocaleString(), job.status]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {job.lastError ? (
                    <p className="mt-0.5 text-[11px] text-[#dc2626]">{job.lastError}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-bold", statusTone(job.status))}>
                    {job.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => void onDeleteJob(job.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#fee2e2] text-[#ef4444]"
                    title="Cancel / delete job"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ControlSection>
    </div>
  );
}

function AddRoleButton({ role, onClick }: { role: PrinterRole; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-2 text-xs font-semibold text-[#0f172a]"
    >
      <Plus className="h-3.5 w-3.5" />
      Add {printerRoleLabel(role)} printer
    </button>
  );
}
