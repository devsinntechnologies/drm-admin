"use client";

import { Suspense } from "react";
import { Package } from "lucide-react";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable, StatusBadge } from "@/components/workspace/DataTable";
import { PortalEmptyState } from "@/components/admin/PortalPage";
import { asList } from "@/lib/api";
import { usePharmacyQuery } from "@/hooks/usePharmacyQuery";

function InventoryContent() {
  const { data, loading, error } = usePharmacyQuery<any[]>("/pharmacy/inventory");
  const rows = asList<any>(data).map((row) => ({
    name: row.name,
    salt: row.saltName || "—",
    qty: Number(row.qtyBase || 0).toFixed(2),
    batches: row.batchCount,
    reorder: row.reorderLevel,
    status: row.belowReorder ? <StatusBadge value="Reorder" tone="danger" /> : <StatusBadge value="OK" tone="success" />,
  }));

  return (
    <PharmacyPage moduleId="inventory" icon={Package} title="Pharmacy Inventory" subtitle="On-hand stock in base units, FEFO batches, and reorder flags" loading={loading} error={error}>
      <DataTable
        columns={[
          { key: "name", label: "Medicine" },
          { key: "salt", label: "Salt" },
          { key: "qty", label: "On hand" },
          { key: "batches", label: "Batches" },
          { key: "reorder", label: "Reorder" },
          { key: "status", label: "Status" },
        ]}
        rows={rows}
        empty={<PortalEmptyState icon={Package} title="No pharmacy stock yet" description="Receive a GRN or add a batch to see inventory here." />}
      />
    </PharmacyPage>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <InventoryContent />
    </Suspense>
  );
}
