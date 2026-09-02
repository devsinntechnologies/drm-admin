"use client";

import { useState } from "react";
import { Users, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SoftwareStaffOverview } from "@/components/business/SoftwareStaffOverview";
import type { BusinessRecord } from "@/hooks/useBusiness";
import type { ModuleId } from "@/templates/types";
import { cn } from "@/lib/utils";

type StaffManageDialogProps = {
  businessId: string;
  business: BusinessRecord;
  industryId?: string | null;
  enabledModules?: ModuleId[] | string[] | null;
  className?: string;
};

export function StaffManageDialog({
  businessId,
  business,
  industryId,
  enabledModules,
  className,
}: StaffManageDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "dn-btn dn-btn-outline inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm",
          className,
        )}
      >
        <Users className="h-4 w-4" />
        Staff
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent align="top" className="max-w-5xl">
          <DialogHeader className="relative pr-12">
            <DialogTitle>Staff · {business.businessName}</DialogTitle>
            <DialogDescription>
              Create logins for the team. A new password does not lock them out unless you choose Replace now.
            </DialogDescription>
            <DialogClose className="absolute right-0 top-0 grid h-9 w-9 place-items-center rounded-full bg-[#0f172a] text-white transition hover:bg-[#1e293b]">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          <SoftwareStaffOverview
            businessId={businessId}
            business={business}
            industryId={industryId}
            enabledModules={enabledModules}
            compact
            hidePortalLink
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
