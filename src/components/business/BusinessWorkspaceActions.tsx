"use client";

import { BusinessProductToggle } from "@/components/business/BusinessProductToggle";
import { BusinessTransferButtons } from "@/components/business/BusinessTransferButtons";
import { OpenPortalButton } from "@/components/business/BusinessSectionTabs";
import { StaffManageDialog } from "@/components/business/StaffManageDialog";
import type { BusinessRecord } from "@/hooks/useBusiness";
import { hydrateWorkspaceTemplate } from "@/lib/hydrate-workspace-template";
import type { BusinessProductId } from "@/lib/business-products";

type BusinessWorkspaceActionsProps = {
  businessId: string;
  business?: BusinessRecord;
  area: "website" | "portal" | "software" | "profile";
};

export function BusinessWorkspaceActions({
  businessId,
  business,
  area,
}: BusinessWorkspaceActionsProps) {
  const product: BusinessProductId | null =
    area === "website" || area === "portal" || area === "software" ? area : null;
  const templateConfig =
    hydrateWorkspaceTemplate(business?.templateConfig) ?? business?.templateConfig ?? null;
  const showStaff = area === "portal" || area === "software";
  const showOpenPortal = area === "portal" || area === "software";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {business && product ? (
        <BusinessProductToggle business={business} product={product} className="mr-1" />
      ) : null}
      <BusinessTransferButtons
        businessId={businessId}
        businessName={business?.businessName}
      />
      {showStaff && business ? (
        <StaffManageDialog
          businessId={businessId}
          business={business}
          industryId={templateConfig?.industryId}
          enabledModules={templateConfig?.enabledModules}
        />
      ) : null}
      {showOpenPortal ? <OpenPortalButton businessId={businessId} /> : null}
    </div>
  );
}
