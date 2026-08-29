import { redirect } from "next/navigation";
import { appendBusinessId } from "@/lib/module-routes";

type SearchParams = { businessId?: string | string[] };

export async function redirectWithBusinessId(
  path: string,
  searchParams: Promise<SearchParams> | SearchParams,
) {
  const params = await searchParams;
  const raw = params?.businessId;
  const businessId = (Array.isArray(raw) ? raw[0] : raw)?.trim() || null;
  redirect(appendBusinessId(path, businessId));
}
