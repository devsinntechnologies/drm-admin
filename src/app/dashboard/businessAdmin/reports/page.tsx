"use client";

import { Suspense } from "react";
import { Activity } from "lucide-react";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable } from "@/components/workspace/DataTable";
import { PortalStatCard } from "@/components/admin/PortalPage";
import { asList } from "@/lib/api";
import { usePharmacyQuery } from "@/hooks/usePharmacyQuery";

function ReportsContent() {
  const { data: dash } = usePharmacyQuery<Record<string, number>>("/pharmacy-reports/dashboard");
  const { data: best } = usePharmacyQuery<any[]>("/pharmacy-reports/best-sellers");
  const { data: dead } = usePharmacyQuery<any[]>("/pharmacy-reports/dead-stock");
  const { data: margins } = usePharmacyQuery<any[]>("/pharmacy-reports/margins");
  const { data: salts } = usePharmacyQuery<any[]>("/pharmacy-reports/sales-by-salt");

  return (
    <PharmacyPage moduleId="reports" icon={Activity} title="Pharmacy MIS" subtitle="Best/slow movers, dead stock, margins, and sales-by-salt">
      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard label="Today sales" value={Number(dash?.["today-sales"] || 0).toFixed(2)} />
        <PortalStatCard label="Expiring" value={dash?.["expiring-items"] ?? 0} tone="accent" />
        <PortalStatCard label="Low stock" value={dash?.["low-stock"] ?? 0} tone="secondary" />
        <PortalStatCard label="Pending Rx" value={dash?.["pending-prescriptions"] ?? 0} />
      </div>
      <h2 className="text-sm font-semibold text-[#64748b]">Best sellers</h2>
      <DataTable columns={[{ key: "name", label: "Medicine" }, { key: "qty", label: "Qty" }, { key: "revenue", label: "Revenue" }]} rows={asList<any>(best).map((row) => ({ name: row.name, qty: Number(row.qty).toFixed(2), revenue: Number(row.revenue).toFixed(2) }))} />
      <h2 className="mt-6 text-sm font-semibold text-[#64748b]">Dead stock</h2>
      <DataTable columns={[{ key: "name", label: "Medicine" }, { key: "batch", label: "Batch" }, { key: "qty", label: "Qty" }]} rows={asList<any>(dead).map((row) => ({ name: row.product?.name, batch: row.batchNo, qty: Number(row.qtyBase).toFixed(2) }))} />
      <h2 className="mt-6 text-sm font-semibold text-[#64748b]">Margins</h2>
      <DataTable columns={[{ key: "name", label: "Medicine" }, { key: "gross", label: "Gross" }, { key: "margin", label: "Margin %" }]} rows={asList<any>(margins).map((row) => ({ name: row.name, gross: Number(row.gross).toFixed(2), margin: Number(row.marginPct).toFixed(1) }))} />
      <h2 className="mt-6 text-sm font-semibold text-[#64748b]">Sales by salt</h2>
      <DataTable columns={[{ key: "salt", label: "Salt" }, { key: "revenue", label: "Revenue" }]} rows={asList<any>(salts).map((row) => ({ salt: row.salt, revenue: Number(row.revenue).toFixed(2) }))} />
    </PharmacyPage>
  );
}

export default function ReportsPage() {
  return <Suspense fallback={<Loading fullScreen />}><ReportsContent /></Suspense>;
}
