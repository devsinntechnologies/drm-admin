"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Clock3, Loader2, RefreshCw, Search, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, FormField, portalInputClass } from "@/components/admin/PortalPage";
import { NumberInput } from "@/components/common/NumberInput";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { apiClient } from "@/lib/api-client";
import { creditAccountSummary, normalizeCreditParties } from "@/lib/credit-data";
import type { CreditParty } from "@/lib/credit-types";
import { getStoredAuthToken } from "@/lib/utils";
import { STAFF_REALTIME_EVENTS } from "@/lib/staff-realtime";

interface CreditLedgerEntry {
  id: string;
  type: string;
  amount: number;
  dueDate?: string | null;
  orderId?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}
interface CreditPartyDetail extends CreditParty { ledger: CreditLedgerEntry[] }
type AccountFilter = "all" | "outstanding" | "settled";
const ACCOUNTS_PER_PAGE = 8;
const panelClass = "overflow-hidden rounded-2xl border border-[var(--border-subtle,#e2e8f0)] bg-[var(--surface,#fff)]";
const mutedClass = "text-[var(--text-muted)]";
const textClass = "text-[var(--text-primary)]";

function money(value: number) {
  return `Rs ${value.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function invalidateRequest(request: { current: number }) {
  request.current += 1;
}

function CreditsContent() {
  const router = useRouter();
  const { role, token: reduxToken } = useAuth();
  const businessId = useActiveBusinessId();
  const token = reduxToken || getStoredAuthToken();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [parties, setParties] = useState<CreditParty[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AccountFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CreditPartyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState(0);
  const [repayNotes, setRepayNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const listRequest = useRef(0);
  const detailRequest = useRef(0);
  const repaymentInFlight = useRef(false);
  const repaymentAttempt = useRef<{ key: string; id: string } | null>(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    const currentRole = role ?? localStorage.getItem("roleName");
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const impersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "credits") && !impersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const loadParties = useCallback(async () => {
    if (!businessId || !token) return;
    const request = ++listRequest.current;
    setLoading(true);
    try {
      const response = await apiClient.get<unknown>("/credits/parties", token, businessId);
      const result = normalizeCreditParties(response);
      if (request !== listRequest.current) return;
      setParties(result);
      setLoadError(null);
      setLastUpdated(new Date());
      setSelectedId((current) => result.some((party) => party.id === current)
        ? current : [...result].sort((a, b) => b.outstanding - a.outstanding)[0]?.id ?? null);
    } catch (err) {
      if (request === listRequest.current) setLoadError(err instanceof Error ? err.message : "Failed to load credit accounts");
    } finally {
      if (request === listRequest.current) setLoading(false);
    }
  }, [businessId, token]);

  const loadDetail = useCallback(async (partyId: string, silent = false) => {
    if (!businessId || !token || selectedIdRef.current !== partyId) return;
    const request = ++detailRequest.current;
    setDetailLoading(true);
    try {
      const result = await apiClient.get<CreditPartyDetail>(`/credits/parties/${partyId}`, token, businessId);
      if (request !== detailRequest.current || selectedIdRef.current !== partyId) return;
      setDetail(result);
      setDetailError(null);
      setParties((current) => current.map((party) => party.id === partyId ? { ...party, outstanding: Number(result.outstanding) } : party));
      if (!silent) setRepayAmount(Number(result.outstanding ?? 0));
    } catch (err) {
      if (request === detailRequest.current) setDetailError(err instanceof Error ? err.message : "Failed to load transaction history");
    } finally {
      if (request === detailRequest.current) setDetailLoading(false);
    }
  }, [businessId, token]);

  useEffect(() => {
    setParties([]);
    setSelectedId(null);
    setDetail(null);
    setLastUpdated(null);
    setLoadError(null);
    if (isAuthorized) void loadParties();
    return () => { invalidateRequest(listRequest); invalidateRequest(detailRequest); };
  }, [isAuthorized, loadParties]);

  useEffect(() => {
    ++detailRequest.current;
    setDetail(null);
    setDetailError(null);
    setRepayAmount(0);
    setRepayNotes("");
    if (selectedId) void loadDetail(selectedId);
    return () => { invalidateRequest(detailRequest); };
  }, [selectedId, loadDetail]);

  const refresh = useCallback(() => {
    void loadParties();
    if (selectedId) void loadDetail(selectedId, true);
  }, [loadParties, loadDetail, selectedId]);

  useEffect(() => {
    if (!isAuthorized) return;
    const refreshVisible = () => { if (document.visibilityState !== "hidden") refresh(); };
    window.addEventListener(STAFF_REALTIME_EVENTS.CREDITS_CHANGED, refreshVisible);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    const interval = window.setInterval(refreshVisible, 30000);
    return () => {
      window.removeEventListener(STAFF_REALTIME_EVENTS.CREDITS_CHANGED, refreshVisible);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
      window.clearInterval(interval);
    };
  }, [isAuthorized, refresh]);

  const summary = useMemo(() => creditAccountSummary(parties), [parties]);
  const visibleParties = useMemo(() => {
    const query = search.trim().toLowerCase();
    return parties.filter((party) => {
      const matchesSearch = !query || [party.name, party.phone, party.email].some((value) => value?.toLowerCase().includes(query));
      const outstanding = party.outstanding > 0.009;
      return matchesSearch && (filter === "all" || (filter === "outstanding" ? outstanding : !outstanding));
    }).sort((a, b) => b.outstanding - a.outstanding || (a.name || "").localeCompare(b.name || ""));
  }, [parties, search, filter]);
  const totalPages = Math.max(1, Math.ceil(visibleParties.length / ACCOUNTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * ACCOUNTS_PER_PAGE;
  const pageParties = visibleParties.slice(start, start + ACCOUNTS_PER_PAGE);
  const selectedParty = parties.find((party) => party.id === selectedId);
  const activeDetail = detail?.id === selectedId ? detail : null;
  const outstanding = Number(activeDetail?.outstanding ?? selectedParty?.outstanding ?? 0);
  const settled = outstanding <= 0.009;

  const onRepay = async () => {
    if (!businessId || !token || !selectedId || !activeDetail || repaymentInFlight.current || detailLoading || detailError || loadError) return;
    if (!Number.isFinite(outstanding) || !Number.isFinite(repayAmount) || repayAmount < 0.01 || repayAmount > outstanding + 0.000001) {
      toast.error("Enter an amount between Rs 0.01 and the outstanding balance");
      return;
    }
    const attemptKey = JSON.stringify([businessId, selectedId, repayAmount, repayNotes.trim()]);
    if (repaymentAttempt.current?.key !== attemptKey) {
      repaymentAttempt.current = { key: attemptKey, id: crypto.randomUUID() };
    }
    repaymentInFlight.current = true;
    setSaving(true);
    const toastId = toast.loading("Recording payment...");
    try {
      await apiClient.post("/credits/repayments", {
        partyId: selectedId,
        phone: selectedParty?.phone?.trim() || undefined,
        amount: repayAmount,
        notes: repayNotes.trim() || undefined,
        clientTxnId: repaymentAttempt.current.id,
      }, token, businessId);
      toast.success("Payment received and balance updated", { id: toastId });
      repaymentAttempt.current = null;
      if (selectedIdRef.current === selectedId) setRepayNotes("");
      await Promise.all([loadParties(), loadDetail(selectedId)]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment", { id: toastId });
    } finally {
      repaymentInFlight.current = false;
      setSaving(false);
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="credits" pageTitle="Credit / Udhar" pageSubtitle="Customer balances and payment history">
      <PortalPage>
        <PortalPageHeader icon={Wallet} title="Credit / Udhar" subtitle="A clear view of customer balances, credit sales, and payments."
          actions={<button type="button" onClick={refresh} disabled={loading} className={`${panelClass} inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold ${textClass} transition hover:bg-[var(--surface-muted,#f8fafc)] disabled:opacity-60`}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{loading ? "Updating" : "Refresh balances"}</button>} />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between"><p className={`text-sm ${mutedClass}`}>Total outstanding</p><Wallet className="h-5 w-5 text-[var(--brand-primary,#001840)]" /></div>
            <p className={`mt-3 text-2xl font-bold tracking-tight tabular-nums ${textClass}`}>{lastUpdated ? money(summary.balance) : "—"}</p>
            <p className={`mt-1 text-xs ${mutedClass}`}>Amount to collect across all accounts</p>
          </div>
          <div className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between"><p className={`text-sm ${mutedClass}`}>Outstanding accounts</p><Users className="h-5 w-5 text-amber-600" /></div>
            <p className={`mt-3 text-2xl font-bold ${textClass}`}>{lastUpdated ? summary.outstanding : "—"}<span className={`ml-2 text-sm font-normal ${mutedClass}`}>of {summary.total} customers</span></p>
            <p className={`mt-1 text-xs ${mutedClass}`}>Customers with an unpaid balance</p>
          </div>
          <div className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between"><p className={`text-sm ${mutedClass}`}>Settled accounts</p><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
            <p className={`mt-3 text-2xl font-bold ${textClass}`}>{lastUpdated ? summary.settled : "—"}</p>
            <p className={`mt-1 text-xs ${mutedClass}`}>Customers with no balance to collect</p>
          </div>
        </div>

        {loadError && <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Balances could not be updated</p><p className="mt-1">{loadError}{lastUpdated ? " The last loaded balances are shown below." : ""}</p></div></div>}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <section aria-label="Customer credit accounts" className={panelClass}>
            <div className="space-y-4 border-b border-[var(--border-subtle,#e2e8f0)] p-5">
              <div className="flex items-center justify-between gap-3"><h2 className={`text-base font-semibold ${textClass}`}>Customer accounts</h2><span className={`rounded-full bg-[var(--surface-muted,#f1f5f9)] px-2.5 py-1 text-xs ${mutedClass}`}>{parties.length} total</span></div>
              <div className="relative"><Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedClass}`} /><input className={`${portalInputClass} pl-9`} placeholder="Search name, phone, or email" aria-label="Search credit accounts" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>
              <div className="flex flex-wrap gap-1 rounded-xl bg-[var(--surface-muted,#f1f5f9)] p-1" aria-label="Account status filter">
                {([ ["all", "All", summary.total], ["outstanding", "Outstanding", summary.outstanding], ["settled", "Settled", summary.settled] ] as const).map(([value, label, count]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(1); }} className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${filter === value ? `bg-[var(--surface,#fff)] shadow-sm ${textClass}` : mutedClass}`}>{label} <span className="ml-1 opacity-70">{count}</span></button>)}
              </div>
            </div>
            {loading && !lastUpdated ? <div className={`flex items-center justify-center gap-2 px-5 py-20 text-sm ${mutedClass}`}><Loader2 className="h-5 w-5 animate-spin" />Loading customer accounts...</div> : pageParties.length === 0 ? <div className="px-6 py-16 text-center"><Wallet className={`mx-auto mb-3 h-8 w-8 ${mutedClass}`} /><p className={`text-sm font-medium ${textClass}`}>{loadError && !lastUpdated ? "Accounts are unavailable" : search || filter !== "all" ? "No matching accounts" : "No credit accounts yet"}</p><p className={`mt-2 text-xs ${mutedClass}`}>{search || filter !== "all" ? "Try another search or account filter." : "Customer credit sales will appear here."}</p></div> : <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead className={`bg-[var(--surface-muted,#f8fafc)] text-xs ${mutedClass}`}><tr><th className="px-5 py-3 text-left font-medium">Customer</th><th className="px-5 py-3 text-right font-medium">Balance</th><th className="w-8"><span className="sr-only">View account</span></th></tr></thead>
                <tbody className="divide-y divide-[var(--border-subtle,#e2e8f0)]">{pageParties.map((party) => <tr key={party.id} className={selectedId === party.id ? "bg-[var(--surface-muted,#f1f5f9)]" : "hover:bg-[var(--surface-muted,#f8fafc)]"}>
                  <td className="pl-5"><button type="button" aria-pressed={selectedId === party.id} onClick={() => setSelectedId(party.id)} className="w-full py-4 text-left focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"><span className={`block font-semibold ${textClass}`}>{party.name || "Credit customer"}</span><span className={`mt-1 block text-xs ${mutedClass}`}>{party.phone || party.email || "No contact on file"}</span></button></td>
                  <td className="px-5 py-4 text-right"><p className={`font-semibold tabular-nums ${textClass}`}>{money(party.outstanding)}</p><span className={`mt-1 inline-block text-xs ${party.outstanding > 0.009 ? "text-amber-700" : "text-emerald-700"}`}>{party.outstanding > 0.009 ? "Outstanding" : "Settled"}</span></td>
                  <td className="pr-3"><button type="button" onClick={() => setSelectedId(party.id)} aria-label={`View ${party.name || "customer"} account`} className={`rounded-lg p-1 ${mutedClass} hover:bg-[var(--surface-muted,#e2e8f0)]`}><ChevronRight className="h-4 w-4" /></button></td>
                </tr>)}</tbody>
              </table>
            </div>}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle,#e2e8f0)] px-5 py-4"><p className={`text-xs ${mutedClass}`}>{visibleParties.length ? `${start + 1}–${Math.min(start + ACCOUNTS_PER_PAGE, visibleParties.length)} of ${visibleParties.length}` : "0 accounts"}</p><div className="flex items-center gap-2"><button type="button" aria-label="Previous account page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className={`rounded-lg border border-[var(--border-subtle,#e2e8f0)] p-1.5 ${textClass} disabled:opacity-30`}><ChevronLeft className="h-4 w-4" /></button><span className={`text-xs ${mutedClass}`}>{currentPage} / {totalPages}</span><button type="button" aria-label="Next account page" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} className={`rounded-lg border border-[var(--border-subtle,#e2e8f0)] p-1.5 ${textClass} disabled:opacity-30`}><ChevronRight className="h-4 w-4" /></button></div></div>
          </section>

          <section aria-label="Selected customer ledger" className={panelClass}>
            {!selectedParty ? <div className="px-6 py-24 text-center"><Users className={`mx-auto mb-3 h-9 w-9 ${mutedClass}`} /><h2 className={`text-base font-semibold ${textClass}`}>Customer ledger</h2><p className={`mt-2 text-sm ${mutedClass}`}>Select a customer to view credit sales and payments.</p></div> : <>
              <div className="border-b border-[var(--border-subtle,#e2e8f0)] p-5"><p className={`text-xs font-medium uppercase tracking-wide ${mutedClass}`}>Customer ledger</p><div className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><h2 className={`text-xl font-semibold ${textClass}`}>{selectedParty.name || "Credit customer"}</h2><p className={`mt-1 text-sm ${mutedClass}`}>{[selectedParty.phone, selectedParty.email].filter(Boolean).join(" · ") || "No contact on file"}</p></div><div className="text-right"><p className={`text-xs ${mutedClass}`}>Outstanding balance</p><p className={`mt-1 text-2xl font-bold tabular-nums ${settled ? "text-emerald-700" : textClass}`}>{money(outstanding)}</p></div></div></div>
              {detailError && <div role="alert" className="m-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{detailError}<button type="button" onClick={() => void loadDetail(selectedParty.id)} className="ml-2 font-semibold underline">Retry</button></div>}
              {detailLoading && !activeDetail ? <div className={`flex items-center justify-center gap-2 py-16 text-sm ${mutedClass}`}><Loader2 className="h-5 w-5 animate-spin" />Loading transactions...</div> : activeDetail ? <>
                {!settled ? <div className="m-5 rounded-xl border border-[var(--border-subtle,#e2e8f0)] bg-[var(--surface-muted,#f8fafc)] p-4"><div className={`mb-4 flex items-center gap-2 text-sm font-semibold ${textClass}`}><ArrowDownLeft className="h-4 w-4 text-emerald-600" />Receive payment</div>
                  <form onSubmit={(event) => { event.preventDefault(); void onRepay(); }} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><FormField label="Amount received (Rs)"><NumberInput value={repayAmount} onChange={setRepayAmount} min={0} max={outstanding} step={0.01} className={portalInputClass} /></FormField><FormField label="Note (optional)"><input className={portalInputClass} value={repayNotes} onChange={(event) => setRepayNotes(event.target.value)} placeholder="Payment reference or method" /></FormField></div><div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => setRepayAmount(outstanding)} className={`text-xs font-medium ${mutedClass} underline underline-offset-2`}>Use full balance: {money(outstanding)}</button><button type="submit" disabled={saving || detailLoading || !!detailError || !!loadError || repayAmount <= 0} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary,#001840)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{saving ? "Recording..." : "Record payment"}</button></div></form>
                </div> : <div className="m-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />This account is settled. No payment is due.</div>}
                <div className="flex items-center justify-between px-5 pb-3 pt-1"><h3 className={`text-sm font-semibold ${textClass}`}>Transaction history</h3><span className={`text-xs ${mutedClass}`}>{activeDetail.ledger.length} entries</span></div>
                {activeDetail.ledger.length === 0 ? <p className={`px-5 pb-8 pt-3 text-sm ${mutedClass}`}>No transactions recorded yet.</p> : <div className="max-h-[520px] overflow-auto"><table className="w-full text-sm"><thead className={`sticky top-0 bg-[var(--surface-muted,#f8fafc)] text-xs ${mutedClass}`}><tr><th className="px-5 py-3 text-left font-medium">Transaction</th><th className="px-3 py-3 text-left font-medium">Date</th><th className="px-5 py-3 text-right font-medium">Amount</th></tr></thead><tbody className="divide-y divide-[var(--border-subtle,#e2e8f0)]">{activeDetail.ledger.map((row) => {
                  const sale = row.type === "sale";
                  return <tr key={row.id}><td className="px-5 py-4"><div className="flex items-center gap-2"><span className={`rounded-lg p-1.5 ${sale ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{sale ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}</span><span className={`font-medium ${textClass}`}>{sale ? "Credit sale" : row.type === "return" ? "Sale returned" : "Payment received"}</span></div><p className={`mt-1.5 max-w-[220px] break-words text-xs ${mutedClass}`}>{row.notes || (row.orderId ? `Order ${row.orderId.slice(0, 8)}` : "—")}</p>{row.dueDate && <p className={`mt-1 text-xs ${mutedClass}`}>Due {new Date(`${row.dueDate.slice(0, 10)}T00:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</p>}</td><td className={`whitespace-nowrap px-3 py-4 text-xs ${mutedClass}`}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td><td className={`whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums ${sale ? textClass : "text-emerald-700"}`}>{sale ? "+" : "−"}{money(Number(row.amount))}</td></tr>;
                })}</tbody></table></div>}
              </> : null}
            </>}
          </section>
        </div>
        <p aria-live="polite" className={`flex items-center gap-2 text-xs ${mutedClass}`}><Clock3 className="h-3.5 w-3.5" />{loading ? "Updating balances..." : loadError ? "Refresh needed to verify the latest balances" : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })} · Balances refresh automatically` : "Waiting for credit accounts"}</p>
      </PortalPage>
    </AdminShell>
  );
}

export default function CreditsPage() {
  return <Suspense fallback={<Loading />}><CreditsContent /></Suspense>;
}
