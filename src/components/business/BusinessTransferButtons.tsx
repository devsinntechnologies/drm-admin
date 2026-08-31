"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BusinessDataTransferPanel } from "@/components/business/BusinessDataTransferPanel";
import { cn } from "@/lib/utils";

type TransferMode = "import" | "export";

type BusinessTransferButtonsProps = {
  businessId: string;
  businessName?: string;
  className?: string;
};

export function BusinessTransferButtons({
  businessId,
  businessName,
  className,
}: BusinessTransferButtonsProps) {
  const [mode, setMode] = useState<TransferMode | null>(null);

  return (
    <>
      <div
        className={cn(
          "inline-flex overflow-hidden rounded-lg border border-[#e2e8f0] bg-white",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setMode("import")}
          className="inline-flex h-9 items-center gap-1.5 border-r border-[#e2e8f0] px-3 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
        >
          <Upload className="h-3.5 w-3.5" />
          Import
        </button>
        <button
          type="button"
          onClick={() => setMode("export")}
          className="inline-flex h-9 items-center gap-1.5 px-3 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === "import" ? "Import business data" : "Export business data"}</DialogTitle>
            <DialogDescription>
              {mode === "import"
                ? `Upload a DigiNizam export ZIP into ${businessName || "this business"}. Images in the ZIP are restored. Import appends records and never wipes existing data.`
                : `Choose which sections to include, then download a ZIP from ${businessName || "this business"}. Product and logo images are packed into the ZIP.`}
            </DialogDescription>
          </DialogHeader>
          {mode ? (
            <BusinessDataTransferPanel
              businessId={businessId}
              businessName={businessName}
              mode={mode}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
