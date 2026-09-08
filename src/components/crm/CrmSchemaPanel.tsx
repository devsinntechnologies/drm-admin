"use client";

import { SlidersHorizontal } from "lucide-react";
import { ControlSection } from "@/components/business/ControlSection";
import { CrmSchemaBuilder } from "@/components/crm/CrmSchemaBuilder";

type CrmSchemaPanelProps = {
  businessId: string;
  sectionIndex: number;
};

export function CrmSchemaPanel({ businessId, sectionIndex }: CrmSchemaPanelProps) {
  return (
    <ControlSection
      index={sectionIndex}
      title="Custom fields & cards"
      description="Add extra fields to products, categories, and other modules. Control which fields appear on forms and on list cards. The same schema is sent to the mobile app in software config."
      icon={SlidersHorizontal}
    >
      <CrmSchemaBuilder businessId={businessId} />
    </ControlSection>
  );
}
