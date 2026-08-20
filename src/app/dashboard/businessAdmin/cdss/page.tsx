"use client";

import { Suspense, useState } from "react";
import { Pill } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable, StatusBadge } from "@/components/workspace/DataTable";
import { Button } from "@/components/ui/button";
import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";

function CdssContent() {
  const { token, businessId, run } = usePharmacyAction();
  const { data, reload } = usePharmacyQuery<any[]>("/cdss/interactions");
  const [form, setForm] = useState({ saltA: "", saltB: "", severity: "warning", message: "" });

  return (
    <PharmacyPage moduleId="cdss" icon={Pill} title="Clinical decision support" subtitle="Local salt-interaction catalog used by POS and prescriptions">
      <form className="grid gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 md:grid-cols-5" onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await apiClient.post("/cdss/interactions", form, token, businessId);
          toast.success("Rule saved");
          reload();
        });
      }}>
        <FormField label="Salt A" required>
          <input className={portalInputClass} placeholder="First salt" value={form.saltA} onChange={(e) => setForm({ ...form, saltA: e.target.value })} required />
        </FormField>
        <FormField label="Salt B" required>
          <input className={portalInputClass} placeholder="Second salt" value={form.saltB} onChange={(e) => setForm({ ...form, saltB: e.target.value })} required />
        </FormField>
        <FormField label="Severity">
          <select className={portalInputClass} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            <option value="warning">Warning</option>
            <option value="high">High / block</option>
          </select>
        </FormField>
        <FormField label="Message">
          <input className={portalInputClass} placeholder="Alert message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Add rule</Button>
        </div>
      </form>
      <DataTable
        columns={[{ key: "a", label: "Salt A" }, { key: "b", label: "Salt B" }, { key: "severity", label: "Severity" }, { key: "message", label: "Message" }]}
        rows={asList<any>(data).map((row) => ({ a: row.saltA, b: row.saltB, severity: <StatusBadge value={row.severity} tone={row.severity === "warning" ? "warn" : "danger"} />, message: row.message }))}
        empty={<p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] py-10 text-center text-sm text-[var(--text-muted)]">No interaction rules yet</p>}
      />
    </PharmacyPage>
  );
}

export default function CdssPage() {
  return <Suspense fallback={<Loading fullScreen />}><CdssContent /></Suspense>;
}
