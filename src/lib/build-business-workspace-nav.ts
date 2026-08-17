import { createElement } from "react";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { isModuleImplemented } from "@/lib/module-implementation";
import { resolveModuleIcon } from "@/lib/module-icons";
import { appendBusinessId, getModuleHref } from "@/lib/module-routes";
import type { ModuleId } from "@/templates/types";

export type WorkspaceNavTab = {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  inProgress?: boolean;
};

export function buildBusinessWorkspaceNav(
  templateConfig: ApiTemplateConfig,
  businessId?: string | null,
): WorkspaceNavTab[] {
  const enabled = new Set(templateConfig.enabledModules);

  return templateConfig.navigation
    .filter((item) => item.visible && enabled.has(item.moduleId as ModuleId))
    .map((item) => {
      const moduleId = item.moduleId as ModuleId;
      const href = appendBusinessId(getModuleHref(moduleId), businessId);
      const Icon = resolveModuleIcon(moduleId);
      const inProgress = !isModuleImplemented(moduleId);
      return {
        key: moduleId,
        label: item.label,
        href,
        icon: createElement(Icon, { className: "h-5 w-5" }),
        inProgress,
      };
    });
}
