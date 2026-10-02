"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Factory } from "lucide-react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage } from "@/components/admin/PortalPage";
import { ProductionJobWorkWorkspace } from "@/components/business/ProductionJobWorkWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";

function ProductionJobWorkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const businessId = useActiveBusinessId();
  const { role } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating =
      currentRole === "super_admin" && !!impersonatedBusinessId;
    if (
      !canAccessWorkspacePage(currentRole, "production-job-work") &&
      !isSuperAdminImpersonating
    ) {
      router.replace("/dashboard");
      return;
    }
    if (currentRole === "super_admin" && !businessId) {
      router.replace("/dashboard/superAdmin/businesses");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId, businessId]);

  if (!isAuthorized) return null;

  return (
    <AdminShell
      activeTab="production-job-work"
      pageTitle="Production & Job Work"
      pageSubtitle="Batches, vendor job work, and material issue/receive"
      headerIcon={Factory}
    >
      <PortalPage>
        <ProductionJobWorkWorkspace />
      </PortalPage>
    </AdminShell>
  );
}

export default function ProductionJobWorkPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductionJobWorkContent />
    </Suspense>
  );
}
