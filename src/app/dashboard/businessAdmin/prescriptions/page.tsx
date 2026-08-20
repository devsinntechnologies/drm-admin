"use client";

import { Suspense, useState } from "react";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable, StatusBadge } from "@/components/workspace/DataTable";
import { Button } from "@/components/ui/button";
import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";
import { useProducts } from "@/hooks/useProducts";

function PrescriptionsContent() {
  const { token, businessId, run } = usePharmacyAction();
  const { market } = usePharmacyMarket();
  const { data, loading, error, reload } = usePharmacyQuery<any>("/pharmacy/prescriptions");
  const { data: reminders } = usePharmacyQuery<any[]>("/pharmacy/prescriptions/reminders");
  const { data: customers } = usePharmacyQuery<any>("/pharmacy/customers?limit=50");
  const { products } = useProducts({ limit: 100 });
  const [form, setForm] = useState({ customerId: "", doctorName: "", doctorLicense: "", productId: "", qtyPrescribed: 1, dosage: "", refillDate: "", channel: "", exemptionCode: "" });
  const [image, setImage] = useState<File | null>(null);

  return (
    <PharmacyPage moduleId="prescriptions" icon={Stethoscope} title="Prescriptions" subtitle={market.prescriptionsSubtitle} loading={loading} error={error}>
      <form className="grid gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 md:grid-cols-3" onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const payload = new FormData();
          payload.append("customerId", form.customerId);
          payload.append("doctorName", form.doctorName);
          payload.append("doctorLicense", form.doctorLicense);
          payload.append("channel", form.channel);
          payload.append("exemptionCode", form.exemptionCode);
          payload.append("refillDate", form.refillDate);
          payload.append("items", JSON.stringify([{ productId: form.productId, qtyPrescribed: form.qtyPrescribed, dosage: form.dosage }]));
          if (image) payload.append("image", image);
          try {
            await apiClient.upload("/pharmacy/prescriptions", payload, token, businessId);
          } catch {
            await apiClient.post("/pharmacy/prescriptions", {
              ...form,
              items: [{ productId: form.productId, qtyPrescribed: form.qtyPrescribed, dosage: form.dosage }],
            }, token, businessId);
          }
          toast.success("Prescription saved");
          reload();
        });
      }}>
        <FormField label="Patient" required>
          <select className={portalInputClass} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
            <option value="">Select patient</option>
            {asList(customers).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Doctor">
          <input className={portalInputClass} placeholder="Doctor name" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} />
        </FormField>
        <FormField label={market.doctorLicenseLabel}>
          <input className={portalInputClass} placeholder={market.doctorLicenseLabel} value={form.doctorLicense} onChange={(e) => setForm({ ...form, doctorLicense: e.target.value })} />
        </FormField>
        <FormField label="Channel">
          <select className={portalInputClass} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
            <option value="">Select channel</option>
            {market.prescriptionChannels.map((channel) => (
              <option key={channel.id} value={channel.id}>{channel.label}</option>
            ))}
          </select>
        </FormField>
        {market.exemptionOptions.length ? (
          <FormField label="Exemption">
            <select className={portalInputClass} value={form.exemptionCode} onChange={(e) => setForm({ ...form, exemptionCode: e.target.value })}>
              <option value="">Select exemption</option>
              {market.exemptionOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </FormField>
        ) : null}
        <FormField label="Medicine" required>
          <select className={portalInputClass} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
            <option value="">Select medicine</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <FormField label="Quantity">
          <input className={portalInputClass} type="number" placeholder="0" value={form.qtyPrescribed} onChange={(e) => setForm({ ...form, qtyPrescribed: Number(e.target.value) })} />
        </FormField>
        <FormField label="Dosage">
          <input className={portalInputClass} placeholder="e.g. 1 tab BD" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
        </FormField>
        <FormField label="Refill date">
          <input className={portalInputClass} type="date" value={form.refillDate} onChange={(e) => setForm({ ...form, refillDate: e.target.value })} />
        </FormField>
        <FormField label="Rx image">
          <input className={portalInputClass} type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Save Rx</Button>
        </div>
      </form>
      <DataTable
        columns={[{ key: "patient", label: "Patient" }, { key: "doctor", label: "Doctor" }, { key: "status", label: "Status" }, { key: "items", label: "Lines" }, { key: "actions", label: "" }]}
        rows={asList(data).map((row: any) => ({
          patient: row.customer?.name || "—",
          doctor: [row.doctorName, row.channel].filter(Boolean).join(" · ") || "—",
          status: <StatusBadge value={row.status} tone={row.status === "filled" ? "success" : "warn"} />,
          items: (row.items || []).map((item: any) => `${item.product?.name} ${item.qtyFilled}/${item.qtyPrescribed}`).join(", "),
          actions: row.status !== "filled" && row.status !== "cancelled" ? (
            <Button size="sm" onClick={() => run(async () => {
              await apiClient.post(`/pharmacy/prescriptions/${row.id}/fill`, { items: (row.items || []).map((item: any) => ({ itemId: item.id, qty: Number(item.qtyPrescribed) - Number(item.qtyFilled) })) }, token, businessId);
              toast.success("Filled");
              reload();
            })}>Fill remaining</Button>
          ) : null,
        }))}
        empty={<p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] py-10 text-center text-sm text-[var(--text-muted)]">No prescriptions yet</p>}
      />
      <h2 className="mt-6 text-sm font-semibold text-[#64748b]">Refill reminders</h2>
      <DataTable columns={[{ key: "patient", label: "Patient" }, { key: "date", label: "Refill date" }]} rows={asList(reminders).map((row: any) => ({ patient: row.customer?.name || "—", date: row.refillDate || "—" }))} />
    </PharmacyPage>
  );
}

export default function PrescriptionsPage() {
  return <Suspense fallback={<Loading fullScreen />}><PrescriptionsContent /></Suspense>;
}
