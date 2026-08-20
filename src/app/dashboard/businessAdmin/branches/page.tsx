"use client";

import { Suspense, useState } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable, StatusBadge } from "@/components/workspace/DataTable";
import { Button } from "@/components/ui/button";
import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";

function BranchesContent() {
  const { token, businessId, run } = usePharmacyAction();
  const { data, loading, error, reload } = usePharmacyQuery<any>("/pharmacy/branches");
  const [form, setForm] = useState({ name: "", address: "", phone: "", isDefault: false });
  const [transfer, setTransfer] = useState({ sourceBatchId: "", fromBranchId: "", toBranchId: "", qtyBase: 1 });
  const { data: batches } = usePharmacyQuery<any>("/pharmacy/inventory/batches");

  return (
    <PharmacyPage moduleId="branches" icon={Building2} title="Branches" subtitle="Locations and inter-branch stock transfer" loading={loading} error={error}>
      <form className="grid gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 md:grid-cols-4" onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await apiClient.post("/pharmacy/branches", form, token, businessId);
          toast.success("Branch saved");
          reload();
        });
      }}>
        <FormField label="Name" required>
          <input className={portalInputClass} placeholder="Branch name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </FormField>
        <FormField label="Address">
          <input className={portalInputClass} placeholder="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </FormField>
        <FormField label="Phone">
          <input className={portalInputClass} placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Add branch</Button>
        </div>
      </form>
      <DataTable columns={[{ key: "name", label: "Branch" }, { key: "address", label: "Address" }, { key: "status", label: "Status" }]} rows={asList<any>(data).map((row: any) => ({ name: row.name, address: row.address, status: <StatusBadge value={row.isDefault ? "default" : "active"} tone="success" /> }))} />
      <h2 className="mt-6 text-sm font-semibold text-[#64748b]">Stock transfer</h2>
      <form className="grid gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 md:grid-cols-5" onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await apiClient.post("/pharmacy/inventory/transfers", transfer, token, businessId);
          toast.success("Transferred");
        });
      }}>
        <FormField label="Source batch" required>
          <select className={portalInputClass} value={transfer.sourceBatchId} onChange={(e) => setTransfer({ ...transfer, sourceBatchId: e.target.value })} required>
            <option value="">Select batch</option>
            {asList<any>(batches).map((b: any) => <option key={b.id} value={b.id}>{b.product?.name} {b.batchNo}</option>)}
          </select>
        </FormField>
        <FormField label="From branch" required>
          <select className={portalInputClass} value={transfer.fromBranchId} onChange={(e) => setTransfer({ ...transfer, fromBranchId: e.target.value })} required>
            <option value="">Select branch</option>
            {asList<any>(data).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </FormField>
        <FormField label="To branch" required>
          <select className={portalInputClass} value={transfer.toBranchId} onChange={(e) => setTransfer({ ...transfer, toBranchId: e.target.value })} required>
            <option value="">Select branch</option>
            {asList<any>(data).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </FormField>
        <FormField label="Quantity">
          <input className={portalInputClass} type="number" value={transfer.qtyBase} onChange={(e) => setTransfer({ ...transfer, qtyBase: Number(e.target.value) })} />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Transfer</Button>
        </div>
      </form>
    </PharmacyPage>
  );
}

export default function BranchesPage() {
  return <Suspense fallback={<Loading fullScreen />}><BranchesContent /></Suspense>;
}
