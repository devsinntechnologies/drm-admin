"use client";

import { Suspense, useState } from "react";
import { Truck } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable } from "@/components/workspace/DataTable";
import { Button } from "@/components/ui/button";
import { FormField, portalInputClass, PortalEmptyState } from "@/components/admin/PortalPage";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";

function SuppliersContent() {
  const { token, businessId, run } = usePharmacyAction();
  const { market } = usePharmacyMarket();
  const { data, loading, error, reload } = usePharmacyQuery<any>("/pharmacy/procurement/suppliers");
  const { data: aging } = usePharmacyQuery<any[]>("/pharmacy/procurement/aging");
  const [form, setForm] = useState({ name: "", phone: "", email: "", gstin: "" });
  const rows = asList<any>(data).map((row: any) => ({
    name: row.name,
    phone: row.phone || "—",
    email: row.email || "—",
    gstin: row.gstin || "—",
    terms: `${row.paymentTermsDays}d`,
  }));

  return (
    <PharmacyPage moduleId="suppliers" icon={Truck} title="Suppliers" subtitle="Vendor master, payment terms, and AP aging" loading={loading} error={error}>
      <form className="grid gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 md:grid-cols-5" onSubmit={(event) => {
        event.preventDefault();
        run(async () => {
          await apiClient.post("/pharmacy/procurement/suppliers", form, token, businessId);
          toast.success("Supplier saved");
          reload();
        });
      }}>
        <FormField label="Name" required>
          <input className={portalInputClass} placeholder="Supplier name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </FormField>
        <FormField label="Phone">
          <input className={portalInputClass} placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </FormField>
        <FormField label="Email">
          <input className={portalInputClass} type="email" placeholder="email@vendor.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField label={market.taxIdLabel}>
          <input className={portalInputClass} placeholder={market.taxIdLabel} value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Add supplier</Button>
        </div>
      </form>
      <DataTable columns={[{ key: "name", label: "Supplier" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" }, { key: "gstin", label: market.taxIdLabel }, { key: "terms", label: "Terms" }]} rows={rows} empty={<PortalEmptyState icon={Truck} title="No suppliers" />} />
      <h2 className="mt-6 text-sm font-semibold text-[#64748b]">Vendor aging</h2>
      <DataTable columns={[{ key: "supplier", label: "Supplier" }, { key: "outstanding", label: "Outstanding" }, { key: "bucket", label: "Bucket" }]} rows={asList<any>(aging).map((row: any) => ({ supplier: row.supplier?.name, outstanding: Number(row.outstanding || 0).toFixed(2), bucket: row.bucket }))} />
    </PharmacyPage>
  );
}

export default function SuppliersPage() {
  return <Suspense fallback={<Loading fullScreen />}><SuppliersContent /></Suspense>;
}
