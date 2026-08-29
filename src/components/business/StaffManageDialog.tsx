"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import {
  Dialog,
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
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Staff for {business.businessName}</DialogTitle>
            <DialogDescription>
              Create and manage logins from Additional details. Changes apply to portal and mobile.
            </DialogDescription>
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
