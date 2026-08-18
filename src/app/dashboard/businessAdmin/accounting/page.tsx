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
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";

function AccountingContent() {
  const { token, businessId, run } = usePharmacyAction();
  const { market, money } = usePharmacyMarket();
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
      subtitle={`Ledger, AP, P&L, balance sheet, and ${market.taxName} export`}
      actions={
        <Button variant="outline" onClick={() => {
          const blob = new Blob([tax?.csv || ""], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${market.taxName.toLowerCase()}-export.csv`;
          a.click();
        }}>Export {market.taxName} CSV</Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <PortalStatCard label="Income" value={money(Number(pnl?.income || 0))} />
        <PortalStatCard label="Expense" value={money(Number(pnl?.expense || 0))} tone="secondary" />
        <PortalStatCard label="Net" value={money(Number(pnl?.net || 0))} tone="accent" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard label="Assets" value={money(Number(bs?.asset || 0))} />
        <PortalStatCard label="Liabilities" value={money(Number(bs?.liability || 0))} />
        <PortalStatCard label="Equity" value={money(Number(bs?.equity || 0))} />
        <PortalStatCard label="COGS / Exp" value={money(Number(bs?.expense || 0))} />
      </div>
      <h2 className="text-sm font-semibold text-[#64748b]">Accounts payable</h2>
      <DataTable
        columns={[{ key: "supplier", label: "Supplier" }, { key: "amount", label: "Amount" }, { key: "paid", label: "Paid" }, { key: "status", label: "Status" }, { key: "actions", label: "" }]}
        rows={apRows.map((row: any) => ({
          supplier: row.supplier?.name,
          amount: money(Number(row.amount)),
          paid: money(Number(row.paidAmount)),
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
