"use client";

import { Suspense, useState } from "react";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable } from "@/components/workspace/DataTable";
import { Button } from "@/components/ui/button";
import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";

function ReturnsContent() {
  const { token, businessId, run } = usePharmacyAction();
  const { data: sales } = usePharmacyQuery<any>("/pos/sales");
  const { data, reload } = usePharmacyQuery<any>("/pos/returns");
  const [form, setForm] = useState({ saleId: "", batchId: "", qtyBase: 1, disposition: "restock", reason: "" });
  const selected = asList<any>(sales).find((row: any) => row.id === form.saleId);

  return (
    <PharmacyPage moduleId="returns" icon={Receipt} title="Returns & refunds" subtitle="Restock to FEFO batch or quarantine damaged returns">
      <form className="grid gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 md:grid-cols-5" onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await apiClient.post("/pos/returns", form, token, businessId);
          toast.success("Return posted");
          reload();
        });
      }}>
        <FormField label="Sale" required>
          <select className={portalInputClass} value={form.saleId} onChange={(e) => setForm({ ...form, saleId: e.target.value })} required>
            <option value="">Select sale</option>
            {asList<any>(sales).map((row: any) => <option key={row.id} value={row.id}>{row.id.slice(0, 8)} · {Number(row.total).toFixed(2)}</option>)}
          </select>
        </FormField>
        <FormField label="Batch" required>
          <select className={portalInputClass} value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} required>
            <option value="">Select batch</option>
            {(selected?.items || []).map((item: any) => <option key={item.batchId} value={item.batchId}>{item.product?.name} / {item.batchId.slice(0, 6)}</option>)}
          </select>
        </FormField>
        <FormField label="Quantity">
          <input className={portalInputClass} type="number" value={form.qtyBase} onChange={(e) => setForm({ ...form, qtyBase: Number(e.target.value) })} />
        </FormField>
        <FormField label="Disposition">
          <select className={portalInputClass} value={form.disposition} onChange={(e) => setForm({ ...form, disposition: e.target.value })}>
            <option value="restock">Restock</option>
            <option value="quarantine">Quarantine</option>
          </select>
        </FormField>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Refund</Button>
        </div>
      </form>
      <DataTable columns={[{ key: "sale", label: "Sale" }, { key: "qty", label: "Qty" }, { key: "amount", label: "Amount" }, { key: "disposition", label: "Disposition" }]} rows={asList<any>(data).map((row: any) => ({ sale: row.saleId?.slice(0, 8), qty: row.qtyBase, amount: Number(row.amount).toFixed(2), disposition: row.disposition }))} empty={<p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] py-10 text-center text-sm text-[var(--text-muted)]">No returns yet</p>} />
    </PharmacyPage>
  );
}

export default function ReturnsPage() {
  return <Suspense fallback={<Loading fullScreen />}><ReturnsContent /></Suspense>;
}
