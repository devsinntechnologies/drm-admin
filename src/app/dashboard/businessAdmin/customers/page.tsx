"use client";

import { Suspense, useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable, FilterBar } from "@/components/workspace/DataTable";
import { Button } from "@/components/ui/button";
import { portalInputClass, PortalEmptyState } from "@/components/admin/PortalPage";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";

function CustomersContent() {
  const [search, setSearch] = useState("");
  const { token, businessId, run } = usePharmacyAction();
  const { market } = usePharmacyMarket();
  const { data, loading, error, reload } = usePharmacyQuery<any>(`/pharmacy/customers?search=${encodeURIComponent(search)}`, search);
  const [form, setForm] = useState({ name: "", phone: "", patientIdNumber: "", allergen: "" });
  const rows = asList<any>(data).map((row: any) => ({
    name: row.name,
    phone: row.phone || "—",
    id: row.patientIdNumber || "—",
    allergies: (row.allergies || []).map((a: any) => a.allergen).join(", ") || "—",
    points: row.loyaltyAccount?.points ?? 0,
  }));

  return (
    <PharmacyPage moduleId="customers" icon={Users} title="Patients & loyalty" subtitle={`${market.patientIdLabel}, allergies, and loyalty points`} loading={loading} error={error}>
      <FilterBar search={search} onSearch={setSearch} placeholder="Search patients" />
      <form className="mt-4 grid gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 md:grid-cols-5" onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await apiClient.post("/pharmacy/customers", {
            name: form.name,
            phone: form.phone,
            patientIdNumber: form.patientIdNumber,
            allergies: form.allergen ? [{ allergen: form.allergen, type: "salt" }] : [],
          }, token, businessId);
          toast.success("Patient saved");
          reload();
        });
      }}>
        <input className={portalInputClass} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={portalInputClass} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={portalInputClass} placeholder={market.patientIdHint} value={form.patientIdNumber} onChange={(e) => setForm({ ...form, patientIdNumber: e.target.value })} />
        <input className={portalInputClass} placeholder="Allergy (salt)" value={form.allergen} onChange={(e) => setForm({ ...form, allergen: e.target.value })} />
        <Button type="submit">Add patient</Button>
      </form>
      <DataTable columns={[{ key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "id", label: market.patientIdLabel }, { key: "allergies", label: "Allergies" }, { key: "points", label: "Points" }]} rows={rows} empty={<PortalEmptyState icon={Users} title="No patients yet" />} />
    </PharmacyPage>
  );
}

export default function CustomersPage() {
  return <Suspense fallback={<Loading fullScreen />}><CustomersContent /></Suspense>;
}
