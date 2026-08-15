"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePublicDataSettings } from "@/hooks/usePublicData";
import { TableRecord } from "@/hooks/useTables";
import { BASE_URL } from "@/lib/constant";
import {
  downloadQrPdf,
  downloadQrPng,
  generateTableQrCard,
  storefrontSelfOrderUrl,
} from "@/lib/table-qr";

function imageUrl(path?: string | null) {
  if (!path?.trim()) return null;
  return path.startsWith("http") ? path : `${BASE_URL}/${path.replace(/^\//, "")}`;
}

export function TableQrDialog({
  table,
  open,
  onOpenChange,
}: {
  table: TableRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, loading: settingsLoading } = usePublicDataSettings();
  const [preview, setPreview] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open || !table) {
      setPreview(null);
      setTargetUrl(null);
      return;
    }

    const url = storefrontSelfOrderUrl(settings?.allowedOrigins, table.id);
    setTargetUrl(url);
    if (!url) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    setGenerating(true);
    generateTableQrCard({
      url,
      tableNumber: table.tableNumber,
      businessName: settings?.displayName || "Restaurant",
      businessLogoUrl: imageUrl(settings?.logo),
      poweredByLogoUrl: "/diginizam-logo.svg",
      primaryColor: settings?.primaryColor,
      secondaryColor: settings?.secondaryColor,
    })
      .then((dataUrl) => {
        if (!cancelled) setPreview(dataUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to generate QR");
        }
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, table, settings]);

  const fileBase = table
    ? `table-${table.tableNumber.replace(/\s+/g, "-").toLowerCase()}-qr`
    : "table-qr";

  const onDownloadPng = () => {
    if (!preview) return;
    void downloadQrPng(preview, `${fileBase}.png`);
  };

  const onDownloadPdf = () => {
    if (!preview) return;
    void downloadQrPdf(preview, `${fileBase}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-none">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-black text-[#111827]">
            Table QR Code
          </DialogTitle>
          <DialogDescription>
            Customers scan this QR to open the menu for {table?.tableNumber ?? "this table"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          {settingsLoading || generating ? (
            <div className="flex h-80 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
              <Loader2 className="h-6 w-6 animate-spin text-[#0050F8]" />
            </div>
          ) : !targetUrl ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              Set your public website domain in Public Catalog → Settings before generating QR codes.
            </div>
          ) : (
            <>
              {preview ? (
                <img
                  src={preview}
                  alt={`QR code for ${table?.tableNumber}`}
                  className="mx-auto w-full max-w-sm rounded-2xl border border-slate-100 shadow-sm"
                />
              ) : (
                <div className="flex h-80 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                  <QrCode className="h-10 w-10 text-slate-300" />
                </div>
              )}
              <p className="truncate text-center text-xs text-slate-500">{targetUrl}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onDownloadPng}
                  disabled={!preview}
                  className="dn-btn dn-btn-primary w-full disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  A4 PNG
                </button>
                <button
                  type="button"
                  onClick={onDownloadPdf}
                  disabled={!preview}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  A4 PDF
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
