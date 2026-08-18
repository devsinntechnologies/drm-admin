"use client";

import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable } from "@/components/workspace/DataTable";
import { asList } from "@/lib/api";
import { usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";

function ControlledContent() {
  const { market } = usePharmacyMarket();
  const { data, loading, error } = usePharmacyQuery<any[]>("/pos/controlled-logs");
  const rows = asList<any>(data).map((row) => ({
    product: row.product?.name,
    qty: Number(row.qtyBase).toFixed(2),
    schedule: row.schedule || "—",
    doctor: row.doctorLicense,
    patient: String(row.patientIdNumber || "").replace(/.(?=.{4})/g, "•"),
    when: new Date(row.createdAt).toLocaleString(),
  }));

  return (
    <PharmacyPage moduleId="controlled-substances" icon={ShieldAlert} title="Controlled substances" subtitle={`${market.controlledTitle} — immutable dispense log, ${market.patientIdLabel} masked`} loading={loading} error={error}>
      <DataTable
        columns={[
          { key: "product", label: "Drug" },
          { key: "qty", label: "Qty" },
          { key: "schedule", label: "Schedule" },
          { key: "doctor", label: market.doctorLicenseLabel },
          { key: "patient", label: market.patientIdLabel },
          { key: "when", label: "When" },
        ]}
        rows={rows}
        empty={<p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] py-10 text-center text-sm text-[var(--text-muted)]">No controlled dispenses logged</p>}
      />
    </PharmacyPage>
  );
}

export default function ControlledPage() {
  return <Suspense fallback={<Loading fullScreen />}><ControlledContent /></Suspense>;
}
