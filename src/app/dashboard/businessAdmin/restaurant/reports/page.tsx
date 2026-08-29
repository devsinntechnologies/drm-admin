"use client";

import { Suspense } from "react";
import Loading from "@/components/common/Loading";
import { WorkspaceReportsPage } from "@/components/business/WorkspaceReportsPage";

export default function RestaurantReportsPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <WorkspaceReportsPage />
    </Suspense>
  );
}
