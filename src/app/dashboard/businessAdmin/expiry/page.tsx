"use client";

import { Suspense, useState } from "react";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable } from "@/components/workspace/DataTable";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";

function ExpiryContent() {
  const [days, setDays] = useState(90);
  const { token, businessId, run } = usePharmacyAction();
  const { data, loading, error, reload } = usePharmacyQuery<any>(`/pharmacy/inventory/expiry?days=${days}`, days);

  const mapRows = (list: any[] = []) =>
    list.map((batch) => ({
      product: batch.product?.name,
      batchNo: batch.batchNo,
      expiry: batch.expiryDate,
      qty: Number(batch.qtyBase).toFixed(2),
      actions: (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => run(async () => { await apiClient.post(`/pharmacy/inventory/batches/${batch.id}/quarantine`, {}, token, businessId); toast.success("Quarantined"); reload(); })}>Quarantine</Button>
          <Button size="sm" variant="destructive" onClick={() => run(async () => { await apiClient.post(`/pharmacy/inventory/batches/${batch.id}/write-off`, {}, token, businessId); toast.success("Written off"); reload(); })}>Write off</Button>
        </div>
      ),
    }));

  return (
    <PharmacyPage
      moduleId="expiry"
      icon={Calendar}
      title="Expiry & breakage"
      subtitle="Near-expiry alerts at 30 / 60 / 90 days, quarantine, and write-off"
      loading={loading}
      error={error}
      actions={
        <div className="flex flex-wrap gap-2">
          {[30, 60, 90].map((value) => (
            <Button key={value} variant={days === value ? "default" : "outline"} onClick={() => setDays(value)}>
              {value} days
            </Button>
          ))}
        </div>
      }
    >
      <h2 className="text-sm font-semibold text-[#64748b]">Near expiry</h2>
      <DataTable columns={[{ key: "product", label: "Medicine" }, { key: "batchNo", label: "Batch" }, { key: "expiry", label: "Expiry" }, { key: "qty", label: "Qty" }, { key: "actions", label: "" }]} rows={mapRows(data?.nearExpiry)} empty={<p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] py-8 text-center text-sm text-[var(--text-muted)]">No batches nearing expiry in this window.</p>} />
      <h2 className="mt-6 text-sm font-semibold text-[#64748b]">Expired / overdue</h2>
      <DataTable columns={[{ key: "product", label: "Medicine" }, { key: "batchNo", label: "Batch" }, { key: "expiry", label: "Expiry" }, { key: "qty", label: "Qty" }, { key: "actions", label: "" }]} rows={mapRows(data?.expired)} empty={<p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] py-8 text-center text-sm text-[var(--text-muted)]">No expired stock.</p>} />
    </PharmacyPage>
  );
}

export default function ExpiryPage() {
  return <Suspense fallback={<Loading fullScreen />}><ExpiryContent /></Suspense>;
}
