"use client";

import { Suspense } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { DataTable } from "@/components/workspace/DataTable";
import { Button } from "@/components/ui/button";
import { PortalStatCard } from "@/components/admin/PortalPage";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";

function AccountingContent() {
  const { token, businessId, run } = usePharmacyAction();
  const { data: pnl } = usePharmacyQuery<any>("/pharmacy/accounting/profit-loss");
  const { data: bs } = usePharmacyQuery<any>("/pharmacy/accounting/balance-sheet");
  const { data: ledger } = usePharmacyQuery<any>("/pharmacy/accounting/ledger");
  const { rows: apRows, reload } = usePharmacyQuery<any[]>("/pharmacy/accounting/ap");
  const { data: tax } = usePharmacyQuery<any>("/pharmacy/accounting/tax-export");

  return (
    <PharmacyPage
      moduleId="accounting"
      icon={CreditCard}
      title="Accounting"
      subtitle="Ledger, AP, P&L, balance sheet, and GST/VAT export"
      actions={
        <Button variant="outline" onClick={() => {
          const blob = new Blob([tax?.csv || ""], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "gst-export.csv";
          a.click();
        }}>Export GST CSV</Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <PortalStatCard label="Income" value={Number(pnl?.income || 0).toFixed(2)} />
        <PortalStatCard label="Expense" value={Number(pnl?.expense || 0).toFixed(2)} tone="secondary" />
        <PortalStatCard label="Net" value={Number(pnl?.net || 0).toFixed(2)} tone="accent" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard label="Assets" value={Number(bs?.asset || 0).toFixed(2)} />
        <PortalStatCard label="Liabilities" value={Number(bs?.liability || 0).toFixed(2)} />
        <PortalStatCard label="Equity" value={Number(bs?.equity || 0).toFixed(2)} />
        <PortalStatCard label="COGS / Exp" value={Number(bs?.expense || 0).toFixed(2)} />
      </div>
      <h2 className="text-sm font-semibold text-[#64748b]">Accounts payable</h2>
      <DataTable
        columns={[{ key: "supplier", label: "Supplier" }, { key: "amount", label: "Amount" }, { key: "paid", label: "Paid" }, { key: "status", label: "Status" }, { key: "actions", label: "" }]}
        rows={apRows.map((row: any) => ({
          supplier: row.supplier?.name,
          amount: Number(row.amount).toFixed(2),
          paid: Number(row.paidAmount).toFixed(2),
          status: row.status,
          actions: row.status !== "paid" ? (
            <Button size="sm" onClick={() => run(async () => {
              await apiClient.post(`/pharmacy/accounting/ap/${row.id}/pay`, { amount: Number(row.amount) - Number(row.paidAmount), method: "bank" }, token, businessId);
              toast.success("Bill paid");
              reload();
            })}>Pay</Button>
          ) : null,
        }))}
      />
      <h2 className="mt-6 text-sm font-semibold text-[#64748b]">Journal</h2>
      <DataTable
        columns={[{ key: "memo", label: "Memo" }, { key: "source", label: "Source" }, { key: "date", label: "Date" }]}
        rows={asList<any>(ledger).map((row: any) => ({ memo: row.memo, source: row.sourceType, date: new Date(row.createdAt).toLocaleString() }))}
      />
    </PharmacyPage>
  );
}

export default function AccountingPage() {
  return <Suspense fallback={<Loading fullScreen />}><AccountingContent /></Suspense>;
}
