"use client";

import { Suspense } from "react";
import { Calendar } from "lucide-react";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable, StatusBadge } from "@/components/workspace/DataTable";
import { asList } from "@/lib/api";
import { usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { PortalEmptyState } from "@/components/admin/PortalPage";

function ShiftsContent() {
  const { data, loading, error } = usePharmacyQuery<any[]>("/pos/shifts");
  const { data: recon } = usePharmacyQuery<any[]>("/pharmacy-reports/cashier-recon");
  const shiftRows = asList<any>(data);
  const rows = (shiftRows.length ? shiftRows : asList<any>(recon)).map((row: any) => ({
    cashier: row.openedBy?.name || row.openedById,
    opened: new Date(row.openedAt).toLocaleString(),
    status: <StatusBadge value={row.status} tone={row.status === "open" ? "warn" : "success"} />,
    opening: Number(row.openingCash || 0).toFixed(2),
    expected: row.expectedCash != null ? Number(row.expectedCash).toFixed(2) : "—",
    counted: row.closingCash != null ? Number(row.closingCash).toFixed(2) : "—",
    variance: row.closingCash != null && row.expectedCash != null ? (Number(row.closingCash) - Number(row.expectedCash)).toFixed(2) : "—",
  }));

  return (
    <PharmacyPage moduleId="shifts" icon={Calendar} title="Shift handover" subtitle="Cash drawer expected vs counted" loading={loading} error={error}>
      <DataTable
        columns={[
          { key: "cashier", label: "Cashier" },
          { key: "opened", label: "Opened" },
          { key: "status", label: "Status" },
          { key: "opening", label: "Opening" },
          { key: "expected", label: "Expected" },
          { key: "counted", label: "Counted" },
          { key: "variance", label: "Variance" },
        ]}
        rows={rows}
        empty={<PortalEmptyState icon={Calendar} title="No shifts yet" description="Open a cash drawer from Point of Sale to start handover tracking." />}
      />
    </PharmacyPage>
  );
}

export default function ShiftsPage() {
  return <Suspense fallback={<Loading fullScreen />}><ShiftsContent /></Suspense>;
}
