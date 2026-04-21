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

    if (currentRole === "business_admin") {
      router.replace("/dashboard/businessAdmin");
    } else if (currentRole === "kitchen" || currentRole === "waiter") {
      router.replace("/dashboard/businessAdmin/orders");
    } else {
      // Default to Super Admin for super_admin or any other roles
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
