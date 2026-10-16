"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3, Pause, Pencil, Play, Plus, Timer } from "lucide-react";
import {
  formatSessionClock,
  isSessionPaused,
  sessionBookedMinutes,
  sessionMinutesForRemaining,
  sessionPlayedSeconds,
  sessionProgress,
  sessionRemainingSeconds,
  type SessionOrderLike,
} from "@/lib/session-timer-web";
import {
  hasTimedTableSession,
  isOpenEndedSession,
  liveSessionCharge,
  packageOvertimeMinutes,
  scheduledEndAt,
  snookerOptionFor,
} from "@/lib/session-billing.util";
import { SNOOKER_MINUTE_PRESETS } from "@/lib/snooker-session-options";

type Props = {
  order: SessionOrderLike & {
    id: string;
    tableGuestName?: string | null;
    gameType?: string | null;
    sessionPricing?: import("@/lib/session-billing.util").SnookerGameTypeOption | null;
    totalPrice?: string | number;
    createdAt: string;
  };
  allowPause?: boolean;
  allowAddTime?: boolean;
  allowEditTime?: boolean;
  onPatch: (payload: { paused?: boolean; sessionMinutes?: number }) => Promise<void>;
  busy?: boolean;
};

function TimerRing({ progress, accent }: { progress: number; accent: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, Math.max(0, progress));
  return (
    <svg width="108" height="108" className="shrink-0 -rotate-90">
      <circle cx="54" cy="54" r={r} fill="none" stroke={`${accent}33`} strokeWidth="8" />
      <circle
        cx="54"
        cy="54"
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
      />
    </svg>
  );
}

export function OrderSessionPanel({
  order,
  allowPause = true,
  allowAddTime = true,
  allowEditTime = true,
  onPatch,
  busy,
}: Props) {
  const openEnded = isOpenEndedSession(order);
  const [remainingSec, setRemainingSec] = useState(0);
  const [liveCharge, setLiveCharge] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editMinutes, setEditMinutes] = useState(15);
  const [patching, setPatching] = useState(false);
  const heldRemainingRef = useRef<number | null>(null);
  const pauseKeyRef = useRef<string | null>(null);

  const paused = isSessionPaused(order);

  useEffect(() => {
    const pauseKey = order.sessionPausedAt ?? "running";
    if (pauseKey !== pauseKeyRef.current) {
      pauseKeyRef.current = pauseKey;
      heldRemainingRef.current = paused ? sessionRemainingSeconds(order) : null;
    }
  }, [order.sessionPausedAt, order.sessionPausedMs, order.sessionMinutes, order.id, paused]);

  useEffect(() => {
    const tick = () => {
      if (paused && heldRemainingRef.current != null) {
        setRemainingSec(heldRemainingRef.current);
      } else {
        setRemainingSec(sessionRemainingSeconds(order));
      }
      setLiveCharge(liveSessionCharge(order));
    };
    tick();
    if (paused) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [
    order.id,
    order.createdAt,
    order.sessionMinutes,
    order.sessionPausedAt,
    order.sessionPausedMs,
    order.gameType,
    paused,
  ]);

  if (!hasTimedTableSession(order)) return null;
  const expired = !openEnded && remainingSec <= 0;
  const overtimeSec = expired ? Math.abs(remainingSec) : 0;
  const playedSec = sessionPlayedSeconds(order);
  const booked = sessionBookedMinutes(order);
  const game = (order.gameType ?? "").trim();
  const opt = order.sessionPricing ?? snookerOptionFor(game);
  const otBillMins = packageOvertimeMinutes(order);
  const progress = openEnded ? 1 : sessionProgress(order, Math.max(0, remainingSec));

  const accent = expired ? "#dc2626" : paused ? "#475569" : "#059669";
  const panelBg = expired ? "#fef2f2" : paused ? "#f8fafc" : "#ecfdf5";
  const clock = openEnded
    ? formatSessionClock(playedSec)
    : expired
      ? `+${formatSessionClock(overtimeSec)}`
      : formatSessionClock(Math.max(0, remainingSec));

  const statusText = openEnded
    ? paused
      ? "PAUSED"
      : "LIVE"
    : expired
      ? "OVERTIME"
      : paused
        ? `PAUSED · ${formatSessionClock(Math.max(0, remainingSec))} held`
        : `${Math.ceil(Math.max(0, remainingSec) / 60)} min left`;

  const metaLine = openEnded
    ? [
        opt ? `Rs ${opt.perMinuteRate}/min` : null,
        game,
        `Table Rs ${liveCharge.toLocaleString()}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : expired
      ? [
          `Running +${formatSessionClock(overtimeSec)}`,
          game,
          otBillMins > 0 && opt && !opt.isPerMinute
            ? `OT ${otBillMins}m × Rs ${opt.perMinuteRate}/min`
            : null,
          `Total Rs ${liveCharge.toLocaleString()}`,
        ]
          .filter(Boolean)
          .join(" · ")
      : [
          `Booked ${booked}m`,
          game,
          otBillMins > 0 && opt ? `+${otBillMins}m billed OT` : null,
          `Table Rs ${liveCharge.toLocaleString()}`,
        ]
          .filter(Boolean)
          .join(" · ");

  const start = new Date(order.createdAt);
  const end = openEnded ? null : scheduledEndAt(order);

  const runPatch = async (payload: { paused?: boolean; sessionMinutes?: number }) => {
    setPatching(true);
    try {
      await onPatch(payload);
      if (payload.paused === false) {
        heldRemainingRef.current = null;
      }
    } finally {
      setPatching(false);
    }
  };

  const addMinutes = async (add: number) => {
    const currentRemaining =
      paused && heldRemainingRef.current != null
        ? heldRemainingRef.current
        : sessionRemainingSeconds(order);
    const base = currentRemaining > 0 ? currentRemaining : 0;
    const nextMin = Math.ceil((base + add * 60) / 60);
    const absolute = sessionMinutesForRemaining(order, nextMin < 1 ? add : nextMin);
    await runPatch({ sessionMinutes: absolute });
  };

  const saveEdit = async () => {
    const absolute = sessionMinutesForRemaining(order, editMinutes);
    await runPatch({ sessionMinutes: absolute });
    setEditOpen(false);
  };

  const sessionBusy = Boolean(busy || patching);

  return (
    <div
      className="rounded-[14px] border-[1.5px] p-3 sm:p-3.5"
      style={{ backgroundColor: panelBg, borderColor: `${accent}80` }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative mx-auto sm:mx-0">
          <TimerRing progress={progress} accent={accent} />
          <div
            className="absolute left-1/2 top-1/2 flex h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-white shadow-md"
            style={{ backgroundColor: expired ? "#450a0a" : paused ? "#1e293b" : "#064e3b" }}
          >
            {expired && !openEnded ? (
              <Timer className="mb-0.5 h-4 w-4" style={{ color: accent }} />
            ) : paused ? (
              <Pause className="mb-0.5 h-4 w-4" style={{ color: accent }} />
            ) : (
              <Clock3 className="mb-0.5 h-4 w-4" style={{ color: accent }} />
            )}
            <span className="text-sm font-black leading-none">{clock}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-black sm:text-xl" style={{ color: accent }}>
              {statusText}
            </p>
            {allowEditTime && !openEnded ? (
              <button
                type="button"
                disabled={sessionBusy}
                onClick={() => {
                  setEditMinutes(Math.max(1, Math.ceil(Math.max(0, remainingSec) / 60)));
                  setEditOpen(true);
                }}
                className="rounded-full p-1 text-slate-600 hover:bg-white/60 disabled:opacity-50"
                aria-label="Edit time"
              >
                <Pencil className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm font-bold text-slate-600">{metaLine}</p>

          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase tracking-wide text-slate-500 sm:max-w-md">
            <div>
              <p>Start</p>
              <p className="mt-0.5 text-sm normal-case text-[#064e3b]">
                {start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
            <div>
              <p>{openEnded ? "Mode" : "End"}</p>
              <p className="mt-0.5 text-sm normal-case text-[#064e3b]">
                {openEnded
                  ? "Open"
                  : end?.toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
              </p>
            </div>
            <div>
              <p>Played</p>
              <p className="mt-0.5 text-sm normal-case text-[#064e3b]">
                {Math.floor(playedSec / 60)} min
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {allowPause ? (
              <button
                type="button"
                disabled={sessionBusy}
                onClick={() => {
                  if (!paused) {
                    heldRemainingRef.current = sessionRemainingSeconds(order);
                  }
                  void runPatch({ paused: !paused });
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#001840] shadow-sm disabled:opacity-50"
              >
                {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {sessionBusy ? "…" : paused ? "Resume" : "Pause"}
              </button>
            ) : null}
            {allowAddTime && !openEnded ? (
              <>
                <button
                  type="button"
                  disabled={sessionBusy}
                  onClick={() => void addMinutes(5)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#064e3b] text-sm font-black text-[#064e3b] disabled:opacity-50"
                >
                  +5
                </button>
                <button
                  type="button"
                  disabled={sessionBusy}
                  onClick={() => void addMinutes(15)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#001840] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" /> 15m
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {editOpen ? (
        <div className="mt-3 rounded-xl border border-[#e2e8f0] bg-white p-3">
          <p className="text-sm font-black text-[#0f172a]">Edit remaining time</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={1}
              className="w-20 rounded-lg border px-2 py-2 text-center font-black"
              value={editMinutes}
              onChange={(e) => setEditMinutes(Number(e.target.value) || 1)}
            />
            <span className="text-sm font-bold text-slate-600">minutes left</span>
            {SNOOKER_MINUTE_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-full bg-[#ecfdf5] px-2.5 py-1 text-xs font-bold text-[#059669]"
                onClick={() => setEditMinutes(m)}
              >
                {m}m
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="rounded-lg px-3 py-1.5 text-sm font-bold" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={sessionBusy}
              className="rounded-lg bg-[#16a34a] px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
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
