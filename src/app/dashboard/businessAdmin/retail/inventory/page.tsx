"use client";

import { Suspense } from "react";
import Loading from "@/components/common/Loading";
import { ProductInventoryPanel } from "@/components/inventory/ProductInventoryPanel";

export default function RetailInventoryPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <ProductInventoryPanel />
    </Suspense>
  );
}
