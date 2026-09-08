"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Cable, Loader2, Plus, Printer, Trash2, Wifi } from "lucide-react";
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

export function SoftwarePrintersPanel({ businessId, controlHref }: SoftwarePrintersPanelProps) {
  const { role } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const { data, loading, saving, error, save } = usePrinters(businessId);
  const [drafts, setDrafts] = useState<PrinterDraft[]>([]);

  useEffect(() => {
    if (data?.printers) {
      setDrafts(data.printers.map(toPrinterDraft));
    }
  }, [data]);

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
                  {live?.lastSeenAt ? (
                    <p className="mt-0.5 text-[11px] text-[#94a3b8]">Last probe {formatSeenAt(live.lastSeenAt)}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
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
                    {(["ethernet", "wifi"] as const).map((value) => (
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
                        {value === "wifi" ? <Wifi className="h-3.5 w-3.5" /> : <Cable className="h-3.5 w-3.5" />}
                        {value === "wifi" ? "Wi-Fi IP" : "Ethernet"}
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
