"use client";

import { useEffect, useState } from "react";
import { Clock3, Pause, Play, Plus } from "lucide-react";
import {
  formatSessionClock,
  isSessionPaused,
  sessionMinutesForRemaining,
  sessionRemainingSeconds,
  type SessionOrderLike,
} from "@/lib/session-timer-web";
import { SNOOKER_MINUTE_PRESETS } from "@/lib/snooker-session-options";

type Props = {
  order: SessionOrderLike & {
    id: string;
    tableGuestName?: string | null;
    gameType?: string | null;
    totalPrice?: string | number;
  };
  allowPause?: boolean;
  allowAddTime?: boolean;
  allowEditTime?: boolean;
  onPatch: (payload: { paused?: boolean; sessionMinutes?: number }) => Promise<void>;
  busy?: boolean;
};

export function OrderSessionPanel({
  order,
  allowPause = true,
  allowAddTime = true,
  allowEditTime = true,
  onPatch,
  busy,
}: Props) {
  const minutes = order.sessionMinutes ?? 0;
  const [remainingSec, setRemainingSec] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editMinutes, setEditMinutes] = useState(15);

  useEffect(() => {
    const tick = () => setRemainingSec(sessionRemainingSeconds(order));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [
    order.id,
    order.createdAt,
    order.sessionMinutes,
    order.sessionPausedAt,
    order.sessionPausedMs,
  ]);

  if (!minutes || minutes <= 0) return null;

  const paused = isSessionPaused(order);
  const overtime = remainingSec < 0;

  const addMinutes = async (add: number) => {
    const currentRemaining = sessionRemainingSeconds(order);
    const base = currentRemaining > 0 ? currentRemaining : 0;
    const nextMin = Math.ceil((base + add * 60) / 60);
    const absolute = sessionMinutesForRemaining(order, nextMin < 1 ? add : nextMin);
    await onPatch({ sessionMinutes: absolute });
  };

  const saveEdit = async () => {
    const absolute = sessionMinutesForRemaining(order, editMinutes);
    await onPatch({ sessionMinutes: absolute });
    setEditOpen(false);
  };

  return (
    <div className="mt-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3">
      {order.tableGuestName ? (
        <p className="text-sm font-black text-[#14532d]">{order.tableGuestName}</p>
      ) : null}
      <p className="text-xs font-semibold text-[#166534]">
        {order.gameType ?? "Session"} · {minutes}m booked
        {paused ? " · Paused" : ""}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-black ${
            overtime ? "bg-[#fef2f2] text-[#dc2626]" : "bg-white text-[#001840]"
          }`}
        >
          <Clock3 className="h-4 w-4" />
          {formatSessionClock(remainingSec)}
        </span>
        {order.totalPrice != null ? (
          <span className="text-sm font-bold text-[#001840]">
            Rs. {Number(order.totalPrice).toLocaleString()}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {allowPause ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onPatch({ paused: !paused })}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#001840] shadow-sm disabled:opacity-50"
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? "Resume" : "Pause"}
          </button>
        ) : null}
        {allowAddTime ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void addMinutes(5)}
              className="inline-flex items-center gap-1 rounded-full bg-[#001840] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> 5m
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void addMinutes(15)}
              className="inline-flex items-center gap-1 rounded-full bg-[#001840] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> 15m
            </button>
          </>
        ) : null}
        {allowEditTime ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const rem = sessionRemainingSeconds(order);
              setEditMinutes(rem > 0 ? Math.ceil(rem / 60) : 15);
              setEditOpen(true);
            }}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0050F8] shadow-sm disabled:opacity-50"
          >
            Edit time
          </button>
        ) : null}
      </div>
      {editOpen ? (
        <div className="mt-3 rounded-lg border border-[#bbf7d0] bg-white p-3">
          <p className="mb-2 text-xs font-bold text-[#64748b]">Minutes remaining</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SNOOKER_MINUTE_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setEditMinutes(m)}
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  editMinutes === m ? "bg-[#16a34a] text-white" : "bg-[#f1f5f9] text-[#334155]"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            className="mb-2 w-full rounded-lg border border-[#dbe4ef] px-3 py-2 text-sm font-semibold"
            value={editMinutes}
            onChange={(e) => setEditMinutes(Math.max(1, Number(e.target.value) || 1))}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#64748b]"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-[#16a34a] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              onClick={() => void saveEdit()}
            >
              Save
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
