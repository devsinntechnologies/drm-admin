"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { ModuleInProgress } from "@/components/business/ModuleInProgress";
import { TemplateModulePreview } from "@/components/templates/TemplateModulePreview";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { isModuleImplemented } from "@/lib/module-implementation";
import { MODULE_CATALOG } from "@/templates/modules";
import type { ModuleId } from "@/templates/types";

function ModuleWorkspaceContent() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId;
  const { templateConfig, primaryColor, secondaryColor, businessName, currency } = useBusinessTemplate();

  const navItem = templateConfig?.navigation.find((item) => item.moduleId === moduleId);
  const moduleLabel =
    navItem?.label ??
    MODULE_CATALOG[moduleId as ModuleId]?.label ??
    moduleId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (!isModuleImplemented(moduleId)) {
    return (
      <AdminShell activeTab={moduleId} pageTitle={moduleLabel}>
        <ModuleInProgress moduleId={moduleId} moduleLabel={moduleLabel} />
      </AdminShell>
    );
  }

  const config = {
    businessName: templateConfig?.businessName ?? businessName,
    industryId: templateConfig?.industryId ?? "general",
    currency: templateConfig?.currency ?? currency,
    labels: templateConfig?.labels ?? { product: "Product", products: "Products" },
    themeMode: templateConfig?.themeMode ?? "light",
  };

  return (
    <AdminShell activeTab={moduleId} pageTitle={moduleLabel}>
      <TemplateModulePreview
        moduleId={moduleId}
        moduleLabel={moduleLabel}
        config={config}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
    </AdminShell>
  );
}

export default function ModuleWorkspacePage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <ModuleWorkspaceContent />
    </Suspense>
  );
}
