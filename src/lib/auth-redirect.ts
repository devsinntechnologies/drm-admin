import { isPharmacyStaffRole, workspaceHomePath } from "@/lib/pharmacy-role-nav";

function isSafeReturnTo(returnTo?: string | null): returnTo is string {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) return false;
  const path = returnTo.split("?")[0];
  return path !== "/" && path !== "/login" && !path.startsWith("/login/");
}

export function homePathAfterLogin(
  role: string | null | undefined,
  businessId?: string | null,
  returnTo?: string | null,
): string {
  if (isSafeReturnTo(returnTo)) return returnTo;

  const currentRole = (role ?? "").trim();
  const businessIdParam = businessId ? `?businessId=${encodeURIComponent(businessId)}` : "";

  if (currentRole === "kitchen" || currentRole === "waiter") {
    return `/dashboard/businessAdmin/orders${businessIdParam}`;
  }
  if (currentRole === "business_admin" || isPharmacyStaffRole(currentRole)) {
    return workspaceHomePath(currentRole, businessId);
  }
  if (currentRole === "super_admin") {
    return "/dashboard/superAdmin";
  }
  return "/dashboard";
}
