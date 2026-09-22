"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage, PortalPageHeader, FormField, portalInputClass } from "@/components/admin/PortalPage";
import { NumberInput } from "@/components/common/NumberInput";
import { useAuth } from "@/hooks/useAuth";
import { canAccessWorkspacePage } from "@/lib/pharmacy-role-nav";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { apiClient } from "@/lib/api-client";
import { getStoredAuthToken } from "@/lib/utils";

interface CreditParty {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  outstanding: number;
}

interface CreditLedgerEntry {
  id: string;
  type: string;
  amount: number;
  dueDate?: string | null;
  orderId?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}

interface CreditPartyDetail extends CreditParty {
  ledger: CreditLedgerEntry[];
}

function money(value: number) {
  return `Rs ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CreditPartyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [repayAmount, setRepayAmount] = useState(0);
  const [repayNotes, setRepayNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;
    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;
    if (!canAccessWorkspacePage(currentRole, "credits") && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const loadParties = useCallback(async () => {
    if (!businessId || !token) return;
    setLoading(true);
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const result = await apiClient.get<CreditParty[]>(`/credits/parties${query}`, token, businessId);
      setParties(Array.isArray(result) ? result : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load credit parties");
    } finally {
      setLoading(false);
    }
  }, [businessId, token, search]);

  useEffect(() => {
    if (isAuthorized) void loadParties();
  }, [isAuthorized, loadParties]);

  const loadDetail = useCallback(
    async (partyId: string) => {
      if (!businessId || !token) return;
      setDetailLoading(true);
      try {
        const result = await apiClient.get<CreditPartyDetail>(`/credits/parties/${partyId}`, token, businessId);
        setDetail(result);
        setRepayAmount(Number(result.outstanding ?? 0));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load party ledger");
      } finally {
        setDetailLoading(false);
      }
    },
    [businessId, token],
  );

  const toggleParty = async (party: CreditParty) => {
    if (expandedId === party.id) {
      setExpandedId(null);
      setDetail(null);
      setRepayAmount(0);
      setRepayNotes("");
      return;
    }
    setExpandedId(party.id);
    setRepayNotes("");
    await loadDetail(party.id);
  };

  const outstandingTotal = useMemo(
    () => parties.reduce((sum, row) => sum + Number(row.outstanding ?? 0), 0),
    [parties],
  );

  const onRepay = async (partyId: string) => {
    if (!businessId || !token) return;
    if (repayAmount <= 0) {
      toast.error("Enter a valid repayment amount");
      return;
    }
    setSaving(true);
    const toastId = toast.loading("Recording repayment...");
    try {
      const party = parties.find((row) => row.id === partyId);
      await apiClient.post(
        "/credits/repayments",
        {
          partyId,
          phone: party?.phone?.trim() || undefined,
          amount: repayAmount,
          notes: repayNotes.trim() || undefined,
        },
        token,
        businessId,
      );
      toast.success("Repayment recorded", { id: toastId });
      await loadParties();
      await loadDetail(partyId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record repayment", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="credits" pageTitle="Credit" pageSubtitle="Customer udhar balances and repayments">
      <PortalPage>
        <PortalPageHeader
          icon={Wallet}
          title="Credit / Udhar"
          subtitle="Track outstanding customer credit and mark payments received"
        />

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Parties</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{parties.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total outstanding</p>
            <p className="mt-1 text-2xl font-semibold text-orange-700">{money(outstandingTotal)}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">With balance</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {parties.filter((p) => Number(p.outstanding) > 0.009).length}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`${portalInputClass} pl-9`}
              placeholder="Search by name, phone, or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void loadParties();
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => void loadParties()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Search
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading credit parties...
          </div>
        ) : parties.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            No credit parties yet. Credit sales from POS will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {parties.map((party) => {
              const expanded = expandedId === party.id;
              const activeDetail = expanded && detail?.id === party.id ? detail : null;
              const outstanding = Number(activeDetail?.outstanding ?? party.outstanding ?? 0);
              const settled = outstanding <= 0.009;

              return (
                <div key={party.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => void toggleParty(party)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{party.name || "Credit party"}</p>
                      <p className="text-sm text-slate-500">
                        {[party.phone, party.email].filter(Boolean).join(" · ") || "No contact on file"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${settled ? "text-emerald-700" : "text-orange-700"}`}>
                          {money(outstanding)}
                        </p>
                        <p className="text-xs text-slate-500">{settled ? "Settled" : "Outstanding"}</p>
                      </div>
                      {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t px-4 py-4">
                      {detailLoading && !activeDetail ? (
                        <div className="flex items-center py-6 text-slate-500">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading ledger...
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="border-b text-left text-slate-500">
                                  <th className="py-2 pr-4">Date</th>
                                  <th className="py-2 pr-4">Type</th>
                                  <th className="py-2 pr-4">Amount</th>
                                  <th className="py-2">Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(activeDetail?.ledger ?? []).length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="py-4 text-slate-500">
                                      No ledger entries yet.
                                    </td>
                                  </tr>
                                ) : (
                                  (activeDetail?.ledger ?? []).map((row) => (
                                    <tr key={row.id} className="border-b last:border-0">
                                      <td className="py-2 pr-4">
                                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                                      </td>
                                      <td className="py-2 pr-4 capitalize">{row.type}</td>
                                      <td className="py-2 pr-4">{money(Number(row.amount ?? 0))}</td>
                                      <td className="py-2">{row.notes || row.orderId || "—"}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>

                          {!settled && (
                            <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto]">
                              <FormField label="Repayment amount">
                                <NumberInput
                                  value={repayAmount}
                                  onChange={setRepayAmount}
                                  min={0}
                                  step={0.01}
                                  className={portalInputClass}
                                />
                              </FormField>
                              <FormField label="Notes (optional)">
                                <input
                                  className={portalInputClass}
                                  value={repayNotes}
                                  onChange={(e) => setRepayNotes(e.target.value)}
                                  placeholder="Cash received, bank transfer, etc."
                                />
                              </FormField>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void onRepay(party.id)}
                                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  {saving ? "Saving..." : "Mark received"}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PortalPage>
    </AdminShell>
  );
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreditsContent />
    </Suspense>
  );
}
