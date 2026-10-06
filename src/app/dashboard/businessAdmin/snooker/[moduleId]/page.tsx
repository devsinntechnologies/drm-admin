import { redirectWithBusinessId } from "@/lib/redirect-with-business";
import { getModuleHref } from "@/lib/module-routes";
import type { ModuleId } from "@/templates/types";

type SearchParams = { businessId?: string | string[] };

/**
 * Legacy /snooker/* routes redirect to shared tables/products/orders UIs.
 * Snooker-pos day-to-day ops use the same modules as food/retail (Option A).
 */
export default async function SnookerModuleRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { moduleId } = await params;
  const href = getModuleHref(moduleId as ModuleId, "snooker-pos");
  await redirectWithBusinessId(href, searchParams);
}
