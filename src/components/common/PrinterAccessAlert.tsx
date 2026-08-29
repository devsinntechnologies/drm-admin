"use client";

import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function PrinterAccessAlert({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border-none p-0 shadow-2xl">
        <div className="px-6 pb-6 pt-8 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-primary-soft,#eef3ff)] text-[var(--brand-secondary,#0050F8)]">
            <Printer className="h-8 w-8" strokeWidth={1.8} />
          </div>
          <DialogTitle className="text-xl font-bold text-[#0f172a]">
            Printer access is not available
          </DialogTitle>
          <p className="mt-3 text-sm leading-relaxed text-[#64748b]">
            Printing has not been enabled for this business. Please contact your administrator to
            request access to printer and invoice printing features.
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="dn-btn dn-btn-primary mt-6 w-full"
          >
            Understood
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
