"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  printerRoleLabel,
  printerStatusLabel,
  type BusinessPrinter,
  type PrintersPayload,
} from "@/lib/printers";
import { STAFF_REALTIME_EVENTS } from "@/lib/staff-realtime";

type ConnectPrinterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectedChange?: (printer: BusinessPrinter | null) => void;
};

export function ConnectPrinterDialog({
  open,
  onOpenChange,
  onConnectedChange,
}: ConnectPrinterDialogProps) {
  const { token } = useAuth();
  const businessId = useActiveBusinessId();
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [printers, setPrinters] = useState<BusinessPrinter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const available = useMemo(
    () =>
      printers.filter(
        (printer) => printer.isEnabled && Boolean(printer.ip?.trim()),
      ),
    [printers],
  );

  const applyPayload = useCallback(
    (payload: PrintersPayload) => {
      setPrinters(payload.printers ?? []);
      const connected =
        payload.printers.find(
          (printer) => printer.isConnected && printer.lastStatus !== "unreachable",
        ) ?? null;
      onConnectedChange?.(connected);
      setSelectedId((prev) => {
        if (prev && payload.printers.some((printer) => printer.id === prev)) {
          return prev;
        }
        return connected?.id ?? payload.printers.find((p) => p.isEnabled && p.ip)?.id ?? null;
      });
    },
    [onConnectedChange],
  );

  const refetch = useCallback(async () => {
    if (!token || !businessId) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await apiClient.get<PrintersPayload>("/printers", token, businessId);
      applyPayload(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load printers");
    } finally {
      setLoading(false);
    }
  }, [token, businessId, applyPayload]);

  useEffect(() => {
    if (!open) return;
    void refetch();
  }, [open, refetch]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const onPrintersUpdated = (event: Event) => {
      const detail = (event as CustomEvent).detail as PrintersPayload | undefined;
      if (detail?.printers) {
        applyPayload(detail);
        return;
      }
      void refetch();
    };
    window.addEventListener(STAFF_REALTIME_EVENTS.PRINTERS_CHANGED, onPrintersUpdated);
    window.addEventListener("printers:updated", onPrintersUpdated);
    return () => {
      window.removeEventListener(STAFF_REALTIME_EVENTS.PRINTERS_CHANGED, onPrintersUpdated);
      window.removeEventListener("printers:updated", onPrintersUpdated);
    };
  }, [open, applyPayload, refetch]);

  const handleConnect = async () => {
    if (!token || !businessId || !selectedId) {
      toast.error("Select a printer first");
      return;
    }
    const selected = available.find((printer) => printer.id === selectedId);
    if (!selected?.ip) {
      toast.error("Selected printer has no IP address yet");
      return;
    }
    setConnecting(true);
    try {
      const payload = await apiClient.post<PrintersPayload>(
        `/printers/${selectedId}/connect`,
        { ip: selected.ip, port: selected.port || 9100 },
        token,
        businessId,
      );
      applyPayload(payload);
      toast.success("Printer connected for invoice printing");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not connect printer");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl border-none p-0 shadow-2xl">
        <div className="border-b border-[#edf2f7] bg-[#f8fbff] px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#0f172a]">
            <Printer className="h-5 w-5 text-[#0050F8]" />
            Connect Printer
          </DialogTitle>
          <p className="mt-1 text-sm text-[#64748b]">
            Choose a configured printer. Connection status stays synced with the app portal.
          </p>
        </div>

        <div className="space-y-3 px-6 py-5">
          {error ? (
            <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#dc2626]">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#64748b]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading printers…
            </div>
          ) : available.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-8 text-center text-sm text-[#64748b]">
              No available printers yet. Configure a receipt printer IP in Software → Printers,
              or connect from the DigiNizam app so it appears here.
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {available.map((printer) => {
                const selected = printer.id === selectedId;
                const connected =
                  Boolean(printer.isConnected) && printer.lastStatus !== "unreachable";
                return (
                  <button
                    key={printer.id}
                    type="button"
                    onClick={() => setSelectedId(printer.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
                      selected
                        ? "border-[#0050F8] bg-[#eef3ff]"
                        : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0 rounded-full border-2",
                        selected ? "border-[#0050F8] bg-[#0050F8]" : "border-[#94a3b8]",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#0f172a]">{printer.name}</span>
                        {connected ? (
                          <span className="rounded-full bg-[#16a34a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Connected
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#64748b]">
                        {printerRoleLabel(printer.role)} · {printer.ip}:{printer.port} ·{" "}
                        {printerStatusLabel(printer)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#edf2f7] bg-[#f8fbff] px-6 py-4">
          <button
            type="button"
            className="dn-btn dn-btn-soft !h-9 !px-3"
            onClick={() => void refetch()}
            disabled={loading || connecting}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            type="button"
            className="dn-btn dn-btn-soft !h-9 !px-3"
            onClick={() => onOpenChange(false)}
            disabled={connecting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="dn-btn dn-btn-primary !h-9 !px-3"
            onClick={() => void handleConnect()}
            disabled={connecting || loading || !selectedId || available.length === 0}
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            Connect
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
