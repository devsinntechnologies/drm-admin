"use client";

import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import type { SnookerGameTypeOption } from "@/lib/session-billing.util";
import type { SnookerGameTypeRow } from "@/hooks/useSnooker";
import { Clock3, UserRound, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  SNOOKER_GAME_TYPE_OPTIONS,
  SNOOKER_MINUTE_PRESETS,
  defaultSessionMinutesForGame,
  type SnookerBookingDetails,
} from "@/lib/snooker-session-options";
import { estimatePackageCharge } from "@/lib/session-billing.util";

type Props = {
  open: boolean;
  tableLabel?: string;
  onClose: () => void;
  onConfirm: (details: SnookerBookingDetails) => void;
};

export function SnookerTableBookingDialog({
  open,
  tableLabel,
  onClose,
  onConfirm,
}: Props) {
  const businessId = useActiveBusinessId();
  const [options, setOptions] = useState<SnookerGameTypeOption[]>(SNOOKER_GAME_TYPE_OPTIONS);
  const durationRef = useRef<HTMLSelectElement>(null);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(false);
  const [guest, setGuest] = useState("");
  const [gameType, setGameType] = useState<string>(SNOOKER_GAME_TYPE_OPTIONS[0].name);
  const [minutes, setMinutes] = useState<number>(SNOOKER_MINUTE_PRESETS[0]);

  useEffect(() => {
    if (!open) return;
    setGuest("");
    setGameType(SNOOKER_GAME_TYPE_OPTIONS[0].name);
    setMinutes(defaultSessionMinutesForGame(SNOOKER_GAME_TYPE_OPTIONS[0].name));
  }, [open]);

  useEffect(() => {
    if (!open || !businessId) return;
    let cancelled = false;
    setPricingLoading(true);
    setPricingError(false);
    apiClient.get<SnookerGameTypeRow[]>("/snooker/game-types", undefined, businessId).then((rows) => {
      if (cancelled || !Array.isArray(rows)) return;
      const configured = rows.filter((g) => g.isActive).map((g) => ({
        name: g.name, basePrice: Number(g.basePrice ?? 0),
        includedMinutes: Number(g.includedMinutes ?? 0),
        maxDurationMinutes: g.maxDurationMinutes,
        isPerMinute: g.billingMethod === "per_minute",
        perMinuteRate: Number(g.billingMethod === "per_minute" ? g.perMinuteRate ?? 0 : g.billingMethod === "fixed_plus_overtime" && g.overtimeEnabled ? g.overtimeRate ?? 0 : 0),
      }));
      if (configured.length) {
        setOptions(configured);
        setGameType(configured[0].name);
        setMinutes(configured[0].isPerMinute ? 0 : configured[0].includedMinutes || SNOOKER_MINUTE_PRESETS[0]);
      } else setPricingError(true);
    }).catch(() => { if (!cancelled) setPricingError(true); })
      .finally(() => { if (!cancelled) setPricingLoading(false); });
    return () => { cancelled = true; };
  }, [open, businessId]);
  const selectedOption = options.find((o) => o.name === gameType) ?? options[0];

  const onGameTypeChange = (name: string) => {
    setGameMenuOpen(false);
    setGameType(name);
    const option = options.find((o) => o.name === name);
    setMinutes((current) => option?.maxDurationMinutes && current > option.maxDurationMinutes ? option.maxDurationMinutes : current);
    requestAnimationFrame(() => {
      durationRef.current?.focus();
      try { durationRef.current?.showPicker(); } catch { /* Keyboard focus remains available. */ }
    });
  };

  const durationChoices = Array.from(new Set([
    selectedOption.includedMinutes,
    ...SNOOKER_MINUTE_PRESETS,
    ...(selectedOption.maxDurationMinutes ? [selectedOption.maxDurationMinutes] : []),
  ])).filter((m) => m > 0 && (!selectedOption.maxDurationMinutes || m <= selectedOption.maxDurationMinutes)).sort((a, b) => a - b);

  const submit = () => {
    const name = guest.trim();
    onConfirm({
      ...(name ? { tableGuestName: name } : {}),
      gameType,
      sessionMinutes: minutes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-[#001840] px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-lg font-bold text-white">Table session</DialogTitle>
              {tableLabel ? (
                <p className="mt-1 text-sm text-white/80">{tableLabel}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>
        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <label htmlFor="session-game" className="mb-2 block text-sm font-semibold text-slate-600">Game type</label>
            <button id="session-game" type="button" disabled={pricingLoading} aria-expanded={gameMenuOpen}
              aria-controls="session-game-options" onClick={() => setGameMenuOpen(!gameMenuOpen)}
              className="flex min-h-16 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left focus-visible:outline-emerald-600">
              <span><strong className="block text-slate-900">{selectedOption.name}</strong>
                <span className="mt-1 block text-sm text-emerald-700">Rs {selectedOption.perMinuteRate}/minute</span></span>
              <span aria-hidden="true">⌄</span>
            </button>
            {gameMenuOpen && <div id="session-game-options" className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1">
              {options.map((opt) => <button type="button" key={opt.name}
                aria-pressed={gameType === opt.name} onClick={() => onGameTypeChange(opt.name)}
                className={`block min-h-16 w-full rounded-lg px-3 py-2 text-left hover:bg-emerald-50 focus-visible:outline-emerald-600 ${gameType === opt.name ? "bg-emerald-50 ring-1 ring-inset ring-emerald-300" : ""}`}>
                <strong className="block text-slate-900">{opt.name}</strong>
                <span className="mt-1 block text-sm text-emerald-700">Rs {opt.perMinuteRate}/minute</span>
              </button>)}
            </div>}
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <label htmlFor="session-duration" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Clock3 className="h-4 w-4" /> Duration
            </label>
            <select id="session-duration" ref={durationRef} value={minutes} disabled={pricingLoading}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-900">
              <option value={0}>Open ended / billed while playing</option>
              {durationChoices.map((m) => <option key={m} value={m}>{m} minutes / Rs {estimatePackageCharge(selectedOption!, m)}</option>)}
            </select>
          </div>
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <UserRound className="h-4 w-4" /> Customer name <span className="font-normal">(optional)</span>
            </span>
            <input className="min-h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-emerald-600"
              placeholder="e.g. Ali Raza" value={guest} onChange={(e) => setGuest(e.target.value)} />
          </label>
          <div aria-live="polite" className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <span className="text-sm font-medium text-slate-600">{gameType} / {minutes === 0 ? "Open ended" : `${minutes} minutes`}</span>
            <strong className="text-xl text-emerald-700">Rs {estimatePackageCharge(selectedOption!, minutes)}</strong>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={pricingLoading || pricingError}
            className="w-full rounded-xl bg-[#001840] py-3.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-50"
          >
            {pricingLoading ? "Loading game prices..." : pricingError ? "Prices unavailable - reopen to retry" : "Start session & place order"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
