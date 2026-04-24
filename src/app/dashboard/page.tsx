"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;

    if (!currentRole) {
      router.replace("/login");
      return;
    }

    const businessId = typeof window !== "undefined" ? localStorage.getItem("businessId") : null;

    if (currentRole === "business_admin") {
      router.replace(businessId ? `/dashboard/businessAdmin?businessId=${businessId}` : "/dashboard/businessAdmin");
    } else if (currentRole === "kitchen" || currentRole === "waiter") {
      router.replace(businessId ? `/dashboard/businessAdmin/orders?businessId=${businessId}` : "/dashboard/businessAdmin/orders");
    } else if (currentRole === "super_admin") {
      // If super_admin is impersonating, take them to the business dashboard
      if (businessId) {
        router.replace(`/dashboard/businessAdmin?businessId=${businessId}`);
      } else {
        router.replace("/dashboard/superAdmin");
      }
    } else {
      router.replace("/dashboard/superAdmin");
    }
  }, [role, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fbff]">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1E365B] border-t-transparent mx-auto"></div>
        <p className="text-lg font-medium text-[#1E365B]">Loading your dashboard...</p>
      </div>
    </div>
  );
}
