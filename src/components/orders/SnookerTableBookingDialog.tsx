"use client";

import { useEffect, useState } from "react";
import { Clock3, UserRound, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  SNOOKER_GAME_TYPE_OPTIONS,
  SNOOKER_MINUTE_PRESETS,
  defaultSessionMinutesForGame,
  type SnookerBookingDetails,
} from "@/lib/snooker-session-options";
import { snookerOptionFor } from "@/lib/session-billing.util";

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
  const [guest, setGuest] = useState("");
  const [gameType, setGameType] = useState<string>(SNOOKER_GAME_TYPE_OPTIONS[0].name);
  const [minutes, setMinutes] = useState<number>(SNOOKER_MINUTE_PRESETS[0]);

  useEffect(() => {
    if (!open) return;
    setGuest("");
    setGameType(SNOOKER_GAME_TYPE_OPTIONS[0].name);
    setMinutes(defaultSessionMinutesForGame(SNOOKER_GAME_TYPE_OPTIONS[0].name));
  }, [open]);

  const onGameTypeChange = (name: string) => {
    setGameType(name);
    setMinutes(defaultSessionMinutesForGame(name));
  };

  const perMinute = snookerOptionFor(gameType)?.isPerMinute ?? false;

  const submit = () => {
    const name = guest.trim();
    onConfirm({
      ...(name ? { tableGuestName: name } : {}),
      gameType,
      sessionMinutes: perMinute ? 0 : minutes,
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
          <label className="block space-y-1.5">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#64748b]">
              <UserRound className="h-3.5 w-3.5" /> Customer name{" "}
              <span className="font-semibold normal-case text-[#94a3b8]">(optional)</span>
            </span>
            <input
              className="w-full rounded-xl border border-[#dbe4ef] px-4 py-3 text-sm font-semibold outline-none focus:border-[#0050F8]"
              placeholder="e.g. Ali Raza"
              value={guest}
              onChange={(e) => setGuest(e.target.value)}
            />
          </label>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748b]">Game type</p>
            <div className="flex flex-wrap gap-2">
              {SNOOKER_GAME_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => onGameTypeChange(opt.name)}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    gameType === opt.name
                      ? "bg-[#0050F8] text-white"
                      : "bg-[#f1f5f9] text-[#334155]"
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
          {!perMinute ? (
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#64748b]">
                <Clock3 className="h-3.5 w-3.5" /> Duration (minutes)
              </p>
              <div className="flex flex-wrap gap-2">
                {SNOOKER_MINUTE_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutes(m)}
                    className={`rounded-full px-3 py-1.5 text-sm font-bold ${
                      minutes === m ? "bg-[#16a34a] text-white" : "bg-[#f1f5f9] text-[#334155]"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-[#f1f5f9] px-4 py-3 text-sm font-semibold text-[#475569]">
              Open-ended session — billed per minute while playing (same as the app).
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            className="w-full rounded-xl bg-[#001840] py-3.5 text-sm font-bold text-white"
          >
            Start session & place order
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
