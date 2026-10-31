"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  User,
  Wallet,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import {
  creditPartyLabel,
  hasCreditIdentifier,
  type CreditParty,
  type OrderCreditDetails,
} from "@/lib/credit-types";
import { normalizeCreditParties } from "@/lib/credit-data";

type CreditPartyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string | null;
  businessId: string | null;
  initial?: OrderCreditDetails | null;
  onSave: (details: OrderCreditDetails) => void;
};

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function formatDueDisplay(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function money(value: number) {
  return `Rs ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const fieldClass =
  "w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3.5 text-[15px] font-bold text-[#0f172a] outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20";

export default function CreditPartyDialog({
  open,
  onOpenChange,
  token,
  businessId,
  initial,
  onSave,
}: CreditPartyDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partyId, setPartyId] = useState<string | undefined>();
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CreditParty[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setPhone(initial?.phone ?? "");
    setEmail(initial?.email ?? "");
    setPartyId(initial?.partyId);
    setDueDate(initial?.dueDate ?? defaultDueDate());
    setError(null);
  }, [open, initial]);

  const loadSuggestions = useCallback(
    async (query: string) => {
      if (!token) {
        setSuggestions([]);
        setError("Sign in again to load credit customers.");
        return;
      }
      if (!businessId) {
        setSuggestions([]);
        setError("Select a business workspace to load existing credit.");
        return;
      }
      setSearching(true);
      try {
        const suffix = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : "";
        // List responses come wrapped as { data, pagination }; read them the
        // same way the Credit / Udhar page does instead of expecting an array.
        const result = await apiClient.get<unknown>(`/credits/parties${suffix}`, token, businessId);
        const list = normalizeCreditParties(result);
        list.sort((a, b) => Number(b.outstanding ?? 0) - Number(a.outstanding ?? 0));
        setSuggestions(list);
        setError(null);
      } catch (err) {
        setSuggestions([]);
        setError(err instanceof Error ? err.message : "Could not load existing credit customers.");
      } finally {
        setSearching(false);
      }
    },
    [token, businessId],
  );

  useEffect(() => {
    if (!open) return;
    void loadSuggestions("");
  }, [open, loadSuggestions]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void loadSuggestions(name || phone || email);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, name, phone, email, loadSuggestions]);

  const applyParty = (party: CreditParty) => {
    setPartyId(party.id);
    if (party.name) setName(party.name);
    if (party.phone) setPhone(party.phone);
    if (party.email) setEmail(party.email);
    setError(null);
  };

  const handleSave = () => {
    const details: OrderCreditDetails = {
      partyId,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      dueDate: dueDate || undefined,
      clientCreditId: initial?.clientCreditId ?? crypto.randomUUID(),
    };
    if (!hasCreditIdentifier(details)) {
      setError("Add a name, phone, or email");
      return;
    }
    onSave(details);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[460px] gap-0 overflow-hidden rounded-[18px] p-0">
        <DialogTitle className="sr-only">Put on credit</DialogTitle>
        <div className="bg-gradient-to-br from-[#0a9954] via-[#16a34a] to-[#22c55e] px-4 py-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-white/20">
              <Wallet className="h-[22px] w-[22px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-black leading-tight">Put on credit</p>
              <p className="text-[13px] font-semibold text-white/80">Bill this sale to a credit customer</p>
            </div>
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-full p-1 hover:bg-white/15">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-[18px] py-4">
          <p className="text-sm font-semibold leading-relaxed text-slate-600">
            Who should this sale be billed to? Pick someone from <strong>Existing credit</strong>, or enter details for a
            new person. Use a <strong>phone number</strong> when two customers share the same name — we never merge
            credit by name alone.
          </p>

          <div className="mt-3.5 space-y-3">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-600">
                <User className="h-4 w-4 text-[#059669]" /> Name
              </span>
              <input
                className={fieldClass}
                value={name}
                onChange={(e) => {
                  setPartyId(undefined);
                  setName(e.target.value);
                }}
                placeholder="Customer name"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-600">
                <Phone className="h-4 w-4 text-[#059669]" /> Phone
              </span>
              <input
                className={fieldClass}
                value={phone}
                onChange={(e) => {
                  setPartyId(undefined);
                  setPhone(e.target.value);
                }}
                placeholder="03xx xxxxxxx"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-600">
                <Mail className="h-4 w-4 text-[#059669]" /> Email
              </span>
              <input
                className={fieldClass}
                value={email}
                onChange={(e) => {
                  setPartyId(undefined);
                  setEmail(e.target.value);
                }}
                placeholder="Optional"
              />
            </label>
          </div>

          {searching ? (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#dcfce7]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#059669]" />
            </div>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="mt-3.5">
              <p className="text-sm font-black text-[#0f172a]">Existing credit</p>
              <ul className="mt-2 max-h-[170px] space-y-1.5 overflow-y-auto">
                {suggestions.map((party) => {
                  const selected = party.id === partyId;
                  return (
                    <li key={party.id}>
                      <button
                        type="button"
                        onClick={() => applyParty(party)}
                        className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                          selected
                            ? "border-[#059669] bg-[#ecfdf5]"
                            : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#cbd5e1]"
                        }`}
                      >
                        {selected ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" />
                        ) : (
                          <User className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-[#0f172a]">{creditPartyLabel(party)}</span>
                          <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                            Outstanding {money(Number(party.outstanding ?? 0))}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : !searching && token && businessId && !error ? (
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {name || phone || email
                ? "No matching credit customer — this will create a new one."
                : "No saved credit customers yet — enter details above to create one."}
            </p>
          ) : !businessId ? (
            <p className="mt-3 text-xs font-semibold text-amber-700">Open this business from the portal to load credit customers.</p>
          ) : null}

          <label className="mt-4 block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-[#059669]">
              <Calendar className="h-4 w-4" /> Return / pay by
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-[#059669]/40 bg-[#ecfdf5] px-3 py-3">
              <input
                type="date"
                className="min-w-0 flex-1 bg-transparent text-[15px] font-black text-[#0f172a] outline-none"
                value={dueDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <span className="text-xs font-bold text-[#059669]">{formatDueDisplay(dueDate)}</span>
            </div>
          </label>

          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
        </div>

        <div className="flex gap-2 border-t border-[#e2e8f0] px-4 py-4">
          <button
            type="button"
            className="h-12 flex-1 rounded-xl border border-[#cbd5e1] text-sm font-extrabold text-[#475569]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-12 flex-[1.4] rounded-xl bg-[#16a34a] text-sm font-extrabold text-white"
            onClick={handleSave}
          >
            Save credit
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
