"use client";

import { useMemo, useState } from "react";
import { TemplatePreviewFrame } from "@/components/templates/TemplatePreviewFrame";
import { buildDefaultNavigation } from "@/template-engine/builder";
import { getIndustryById } from "@/templates/industries";
import { getIndustryLabel, type BusinessProfileConfig } from "@/lib/business-profile";
import { cn } from "@/lib/utils";

type Props = {
  profile: BusinessProfileConfig;
  businessName: string;
  className?: string;
};

export function BusinessTemplatePreview({ profile, businessName, className }: Props) {
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const industry = useMemo(() => getIndustryById(profile.industryId), [profile.industryId]);

  const navItems = useMemo(() => {
    if (!industry) return [{ moduleId: "dashboard", label: "Dashboard", visible: true }];
    return buildDefaultNavigation(industry.modules, industry.labels);
  }, [industry]);

  const dashboardCards = industry?.dashboardCards ?? [];
  const industryLabel = getIndustryLabel(profile.industryId);

  if (!industry) {
    return (
      <div className={cn("rounded-xl border border-[#e2e8f0] bg-white p-6 text-sm text-[#64748b]", className)}>
        Select an industry template to preview the business workspace.
      </div>
    );
  }

  return (
    <TemplatePreviewFrame
      className={className}
      businessName={businessName}
      industryIcon={industry.theme.icon}
      industryId={industry.id}
      themeMode={profile.themeMode}
      primaryColor={profile.primaryColor}
      secondaryColor={profile.secondaryColor}
      currency="PKR"
      labels={industry.labels}
      navItems={navItems}
      dashboardCards={dashboardCards}
      productsLabel={industry.labels.products}
      device={previewDevice}
      onDeviceChange={setPreviewDevice}
      moduleCount={industry.modules.length}
      cardCount={dashboardCards.length}
      headerKicker="Live template preview"
      headerTitle={`${industryLabel} · ${businessName}`}
      footerLeft={`${industry.modules.length} modules · ${dashboardCards.length} dashboard cards`}
      footerRight="Live preview · updates when you change theme"
    />
  );
}
