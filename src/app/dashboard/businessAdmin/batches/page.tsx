"use client";

import { Suspense, useState } from "react";
import { Package } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable, StatusBadge } from "@/components/workspace/DataTable";
import { Button } from "@/components/ui/button";
import { portalInputClass, PortalEmptyState } from "@/components/admin/PortalPage";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { useProducts } from "@/hooks/useProducts";

function BatchesContent() {
  const { token, businessId, run } = usePharmacyAction();
  const { data, loading, error, reload } = usePharmacyQuery<any>("/pharmacy/inventory/batches");
  const { products } = useProducts({ limit: 100 });
  const [form, setForm] = useState({ productId: "", batchNo: "", expiryDate: "", qtyBase: 0, mrp: 0, purchaseRate: 0, rack: "", shelf: "" });
  const rows = asList<any>(data).map((batch: any) => ({
    product: batch.product?.name,
    batchNo: batch.batchNo,
    expiry: batch.expiryDate,
    qty: Number(batch.qtyBase).toFixed(2),
    rack: `${batch.rack || "—"} / ${batch.shelf || "—"}`,
    status: <StatusBadge value={batch.status} tone={batch.status === "active" ? "success" : "warn"} />,
    actions: (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => run(async () => { await apiClient.post(`/pharmacy/inventory/batches/${batch.id}/quarantine`, {}, token, businessId); reload(); })}>Quarantine</Button>
      </div>
    ),
  }));

  return (
    <PharmacyPage moduleId="batches" icon={Package} title="Batches" subtitle="Batch-wise stock with rack/shelf mapping" loading={loading} error={error}>
      <form
        className="grid gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            try {
              await apiClient.post("/pharmacy/inventory/batches", form, token, businessId);
              toast.success("Batch saved");
              reload();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save batch");
            }
          });
        }}
      >
        <select className={portalInputClass} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
          <option value="">Medicine</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
        <input className={portalInputClass} placeholder="Batch no" value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })} required />
        <input className={portalInputClass} type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required />
        <input className={portalInputClass} type="number" placeholder="Qty (base)" value={form.qtyBase} onChange={(e) => setForm({ ...form, qtyBase: Number(e.target.value) })} />
        <input className={portalInputClass} placeholder="Rack" value={form.rack} onChange={(e) => setForm({ ...form, rack: e.target.value })} />
        <input className={portalInputClass} placeholder="Shelf" value={form.shelf} onChange={(e) => setForm({ ...form, shelf: e.target.value })} />
        <input className={portalInputClass} type="number" placeholder="MRP" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })} />
        <Button type="submit">Add batch</Button>
      </form>
      <DataTable
        columns={[
          { key: "product", label: "Medicine" },
          { key: "batchNo", label: "Batch" },
          { key: "expiry", label: "Expiry" },
          { key: "qty", label: "Qty" },
          { key: "rack", label: "Rack / Shelf" },
          { key: "status", label: "Status" },
          { key: "actions", label: "" },
        ]}
        rows={rows}
        empty={<PortalEmptyState icon={Package} title="No batches" description="Add a batch or receive a GRN." />}
      />
    </PharmacyPage>
  );
}

export default function BatchesPage() {
  return <Suspense fallback={<Loading fullScreen />}><BatchesContent /></Suspense>;
}
