"use client";

import { Suspense, useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable, StatusBadge } from "@/components/workspace/DataTable";
import { Button } from "@/components/ui/button";
import { portalInputClass } from "@/components/admin/PortalPage";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { useProducts } from "@/hooks/useProducts";

function PurchasesContent() {
  const { token, businessId, run } = usePharmacyAction();
  const { data: pos, reload } = usePharmacyQuery<any>("/pharmacy/procurement/purchase-orders");
  const { data: suppliers } = usePharmacyQuery<any>("/pharmacy/procurement/suppliers");
  const { products } = useProducts({ limit: 100 });
  const [po, setPo] = useState({ supplierId: "", productId: "", qty: 1, rate: 0 });
  const [grn, setGrn] = useState({ purchaseOrderId: "", productId: "", batchNo: "", expiryDate: "", qty: 1, rate: 0 });

  return (
    <PharmacyPage moduleId="purchases" icon={CreditCard} title="Purchases" subtitle="Purchase orders, GRN matching, and batch receiving">
      <div className="grid gap-4 lg:grid-cols-2">
        <form className="space-y-3 rounded-2xl border border-[#e2e8f0] bg-white p-4" onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await apiClient.post("/pharmacy/procurement/purchase-orders", {
              supplierId: po.supplierId,
              items: [{ productId: po.productId, qty: po.qty, rate: po.rate }],
            }, token, businessId);
            toast.success("PO created");
            reload();
          });
        }}>
          <h3 className="font-semibold">New purchase order</h3>
          <select className={portalInputClass} value={po.supplierId} onChange={(e) => setPo({ ...po, supplierId: e.target.value })} required>
            <option value="">Supplier</option>
            {asList<any>(suppliers).map((row: any) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
          <select className={portalInputClass} value={po.productId} onChange={(e) => setPo({ ...po, productId: e.target.value })} required>
            <option value="">Medicine</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input className={portalInputClass} type="number" placeholder="Qty" value={po.qty} onChange={(e) => setPo({ ...po, qty: Number(e.target.value) })} />
          <input className={portalInputClass} type="number" placeholder="Rate" value={po.rate} onChange={(e) => setPo({ ...po, rate: Number(e.target.value) })} />
          <Button type="submit">Create PO</Button>
        </form>

        <form className="space-y-3 rounded-2xl border border-[#e2e8f0] bg-white p-4" onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await apiClient.post("/pharmacy/procurement/grn", {
              purchaseOrderId: grn.purchaseOrderId,
              items: [{ productId: grn.productId, batchNo: grn.batchNo, expiryDate: grn.expiryDate, qty: grn.qty, rate: grn.rate }],
            }, token, businessId);
            toast.success("GRN posted — batch created");
            reload();
          });
        }}>
          <h3 className="font-semibold">Goods received note</h3>
          <select className={portalInputClass} value={grn.purchaseOrderId} onChange={(e) => setGrn({ ...grn, purchaseOrderId: e.target.value })} required>
            <option value="">PO</option>
            {asList<any>(pos).map((row: any) => <option key={row.id} value={row.id}>{row.poNumber}</option>)}
          </select>
          <select className={portalInputClass} value={grn.productId} onChange={(e) => setGrn({ ...grn, productId: e.target.value })} required>
            <option value="">Medicine</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input className={portalInputClass} placeholder="Batch no" value={grn.batchNo} onChange={(e) => setGrn({ ...grn, batchNo: e.target.value })} required />
          <input className={portalInputClass} type="date" value={grn.expiryDate} onChange={(e) => setGrn({ ...grn, expiryDate: e.target.value })} required />
          <input className={portalInputClass} type="number" placeholder="Qty" value={grn.qty} onChange={(e) => setGrn({ ...grn, qty: Number(e.target.value) })} />
          <input className={portalInputClass} type="number" placeholder="Rate" value={grn.rate} onChange={(e) => setGrn({ ...grn, rate: Number(e.target.value) })} />
          <Button type="submit">Receive GRN</Button>
        </form>
      </div>
      <DataTable
        columns={[{ key: "po", label: "PO" }, { key: "supplier", label: "Supplier" }, { key: "status", label: "Status" }, { key: "total", label: "Total" }, { key: "actions", label: "" }]}
        rows={asList<any>(pos).map((row: any) => ({
          po: row.poNumber,
          supplier: row.supplier?.name,
          status: <StatusBadge value={row.status} tone={row.status === "received" ? "success" : "warn"} />,
          total: Number(row.totalAmount).toFixed(2),
          actions: row.status === "draft" ? <Button size="sm" variant="outline" onClick={() => run(async () => { await apiClient.post(`/pharmacy/procurement/purchase-orders/${row.id}/send`, {}, token, businessId); reload(); })}>Send</Button> : null,
        }))}
      />
    </PharmacyPage>
  );
}

export default function PurchasesPage() {
  return <Suspense fallback={<Loading fullScreen />}><PurchasesContent /></Suspense>;
}
