"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import { apiClient } from "@/lib/api-client";
import {
  creditPartyLabel,
  hasCreditIdentifier,
  type CreditParty,
  type OrderCreditDetails,
} from "@/lib/credit-types";

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

function money(value: number) {
  return `Rs ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

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
      if (!token || !businessId) return;
      setSearching(true);
      try {
        const suffix = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : "";
        const result = await apiClient.get<CreditParty[]>(`/credits/parties${suffix}`, token, businessId);
        setSuggestions(Array.isArray(result) ? result : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    },
    [token, businessId],
  );

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
      <DialogContent className="max-w-md">
        <DialogTitle>Put on credit</DialogTitle>
        <p className="text-sm text-[var(--text-muted)]">
          Who should this sale be billed to? Search existing credit customers or add a new person.
        </p>

        <div className="mt-4 space-y-3">
          <FormField label="Name">
            <input
              className={portalInputClass}
              value={name}
              onChange={(e) => {
                setPartyId(undefined);
                setName(e.target.value);
              }}
              placeholder="Customer name"
            />
          </FormField>
          <FormField label="Phone">
            <input
              className={portalInputClass}
              value={phone}
              onChange={(e) => {
                setPartyId(undefined);
                setPhone(e.target.value);
              }}
              placeholder="03xx xxxxxxx"
            />
          </FormField>
          <FormField label="Email">
            <input
              className={portalInputClass}
              value={email}
              onChange={(e) => {
                setPartyId(undefined);
                setEmail(e.target.value);
              }}
              placeholder="Optional"
            />
          </FormField>
          <FormField label="Return / pay by">
            <input
              type="date"
              className={portalInputClass}
              value={dueDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </FormField>
        </div>

        {searching ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Searching credit customers...
          </div>
        ) : null}

        {suggestions.length > 0 ? (
          <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-[var(--border-subtle)]">
            <p className="border-b border-[var(--border-subtle)] px-3 py-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
              Existing credit
            </p>
            {suggestions.map((party) => {
              const selected = party.id === partyId;
              return (
                <button
                  key={party.id}
                  type="button"
                  onClick={() => applyParty(party)}
                  className={`flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-[var(--surface-muted)] ${
                    selected ? "bg-[var(--surface-muted)]" : ""
                  }`}
                >
                  <span>
                    <span className="font-semibold text-[var(--text-primary)]">{creditPartyLabel(party)}</span>
                    <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                      Outstanding {money(Number(party.outstanding ?? 0))}
                    </span>
                  </span>
                  {selected ? (
                    <span className="text-xs font-semibold text-[var(--brand-secondary)]">Selected</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white"
            onClick={handleSave}
          >
            Save credit
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
