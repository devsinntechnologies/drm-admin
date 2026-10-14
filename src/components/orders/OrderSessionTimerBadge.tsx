"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

function formatRemaining(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const core = `${m}:${s.toString().padStart(2, "0")}`;
  return totalSeconds < 0 ? `+${core}` : core;
}

type Props = {
  createdAt: string;
  sessionMinutes: number;
  gameType?: string | null;
  tableGuestName?: string | null;
  totalPrice?: string | number;
};

export function OrderSessionTimerBadge({
  createdAt,
  sessionMinutes,
  gameType,
  tableGuestName,
  totalPrice,
}: Props) {
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    const tick = () => {
      const start = new Date(createdAt).getTime();
      if (!Number.isFinite(start)) return;
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const budget = Math.max(0, sessionMinutes) * 60;
      setRemainingSec(budget - elapsed);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [createdAt, sessionMinutes]);

  if (!sessionMinutes || sessionMinutes <= 0) return null;

  const overtime = remainingSec < 0;

  return (
    <div className="mt-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3">
      {tableGuestName ? (
        <p className="text-sm font-black text-[#14532d]">{tableGuestName}</p>
      ) : null}
      <p className="text-xs font-semibold text-[#166534]">
        {gameType ?? "Session"} · {sessionMinutes}m booked
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-black ${
            overtime ? "bg-[#fef2f2] text-[#dc2626]" : "bg-white text-[#001840]"
          }`}
        >
          <Clock3 className="h-4 w-4" />
          {formatRemaining(remainingSec)}
        </span>
        {totalPrice != null ? (
          <span className="text-sm font-bold text-[#001840]">
            Rs. {Number(totalPrice).toLocaleString()}
          </span>
        ) : null}
      </div>
    </div>
  );
}
