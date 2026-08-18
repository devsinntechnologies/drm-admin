"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { SnookerWorkspace } from "@/components/snooker/SnookerWorkspace";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { MODULE_CATALOG } from "@/templates/modules";
import type { ModuleId } from "@/templates/types";

function SnookerModuleContent() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId;
  const { templateConfig } = useBusinessTemplate();
  const navItem = templateConfig?.navigation.find((item) => item.moduleId === moduleId);
  const moduleLabel =
    navItem?.label ??
    MODULE_CATALOG[moduleId as ModuleId]?.label ??
    moduleId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AdminShell activeTab={moduleId} pageTitle={moduleLabel}>
      <SnookerWorkspace moduleId={moduleId} moduleLabel={moduleLabel} />
    </AdminShell>
  );
}

export default function SnookerModulePage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <SnookerModuleContent />
    </Suspense>
  );
}
