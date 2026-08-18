"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  tableStatusLabel,
  type SnookerTable,
  type SnookerTableStatus,
} from "./snooker-mock";

export const STATUS_GLOW: Record<SnookerTableStatus, string> = {
  available: "snooker-glow-available",
  occupied: "snooker-glow-occupied",
  reserved: "snooker-glow-reserved",
  maintenance: "snooker-glow-down",
};

const BALLS: Array<{ cx: number; cy: number; fill: string }> = [
  { cx: 42, cy: 28, fill: "#ef4444" },
  { cx: 50, cy: 24, fill: "#eab308" },
  { cx: 58, cy: 28, fill: "#22c55e" },
  { cx: 46, cy: 36, fill: "#92400e" },
  { cx: 54, cy: 36, fill: "#2563eb" },
  { cx: 50, cy: 44, fill: "#ec4899" },
  { cx: 28, cy: 48, fill: "#f8fafc" },
];

export function GlassPanel({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("snooker-glass", padded && "p-4 sm:p-5", className)}>
      {children}
    </section>
  );
}

export function HudLabel({ children }: { children: ReactNode }) {
  return <p className="snooker-kicker">{children}</p>;
}

export function RingMeter({
  value,
  max,
  label,
  hint,
  accent = "#059669",
}: {
  value: number;
  max: number;
  label: string;
  hint?: string;
  accent?: string;
}) {
  const pct = max ? Math.min(1, value / max) : 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = pct * c;

  return (
    <article className="snooker-glass flex items-center gap-4 p-4">
      <div className="relative h-[108px] w-[108px] shrink-0">
        <svg viewBox="0 0 108 108" className="h-full w-full -rotate-90">
          <circle cx="54" cy="54" r={r} fill="none" stroke="rgba(15,23,42,0.12)" strokeWidth="8" />
          <circle
            cx="54"
            cy="54"
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            className="snooker-ring-draw"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <p className="font-mono text-lg font-bold tracking-tight text-[#0f172a]">
            {value}
            <span className="text-xs font-medium text-[#94a3b8]">/{max}</span>
          </p>
        </div>
      </div>
      <div>
        <HudLabel>{label}</HudLabel>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[#0f172a]">{Math.round(pct * 100)}%</p>
        {hint ? <p className="mt-1 text-xs text-[#64748b]">{hint}</p> : null}
      </div>
    </article>
  );
}

export function HudStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <article className="snooker-glass relative overflow-hidden p-4">
      <div className="snooker-stat-sheen" />
      <HudLabel>{label}</HudLabel>
      <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-[#0f172a]" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[#64748b]">{hint}</p> : null}
    </article>
  );
}

export function FeltTableVisual({
  table,
  compact = false,
  selected = false,
  onClick,
}: {
  table: SnookerTable;
  compact?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const occupied = table.status === "occupied";
  const feltId = `felt-${table.id}`;
  const className = cn(
    "snooker-table-card group text-left",
    STATUS_GLOW[table.status],
    compact && "snooker-table-card-compact",
    selected && "snooker-table-card-selected",
    onClick && "cursor-pointer",
  );

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[#0f172a]">{table.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94a3b8]">{table.type}</p>
        </div>
        <span className={cn("snooker-led", `snooker-led-${table.status}`)}>
          <i />
          {tableStatusLabel(table.status)}
        </span>
      </div>

      <div className={cn("snooker-felt", compact ? "h-[92px]" : "h-[118px]")}>
        <svg viewBox="0 0 160 88" className="h-full w-full" aria-hidden>
          <rect x="6" y="6" width="148" height="76" rx="14" fill="#5c3317" />
          <rect x="14" y="12" width="132" height="64" rx="10" fill={`url(#${feltId})`} />
          <circle cx="18" cy="16" r="5" fill="#05080d" />
          <circle cx="142" cy="16" r="5" fill="#05080d" />
          <circle cx="18" cy="72" r="5" fill="#05080d" />
          <circle cx="142" cy="72" r="5" fill="#05080d" />
          <circle cx="80" cy="16" r="4.5" fill="#05080d" />
          <circle cx="80" cy="72" r="4.5" fill="#05080d" />
          {occupied
            ? BALLS.map((ball) => (
                <circle key={`${ball.cx}-${ball.fill}`} cx={ball.cx + 30} cy={ball.cy + 8} r="3.4" fill={ball.fill} className="snooker-ball" />
              ))
            : null}
          {table.status === "reserved" ? (
            <polygon points="80,32 88,48 80,44 72,48" fill="#fbbf24" opacity="0.9" />
          ) : null}
          {table.status === "maintenance" ? (
            <g stroke="#f87171" strokeWidth="2.2">
              <line x1="48" y1="28" x2="112" y2="60" />
              <line x1="112" y1="28" x2="48" y2="60" />
            </g>
          ) : null}
          <defs>
            <linearGradient id={feltId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#146b3a" />
              <stop offset="55%" stopColor="#0b3d24" />
              <stop offset="100%" stopColor="#082918" />
            </linearGradient>
          </defs>
        </svg>
        {table.session ? (
          <div className="snooker-session-chip">
            <span className={cn("snooker-pulse-dot", table.session.paused && "is-paused")} />
            {table.session.paused ? "PAUSED" : "LIVE"} · {table.session.elapsedMin}m
          </div>
        ) : null}
      </div>

      {table.session ? (
        <p className="mt-2 text-sm text-[#334155]">
          {table.session.player}
          <span className="mt-0.5 block text-[11px] uppercase tracking-[0.14em] text-[#94a3b8]">
            {table.session.gameType} · since {table.session.startedAt}
          </span>
        </p>
      ) : (
        <p className="mt-2 font-mono text-[11px] text-[#64748b]">
          S {table.singleRate} · D {table.doubleRate} · C {table.centuryPerMinute}/m
        </p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }

  return <article className={className}>{body}</article>;
}

export function FlowRail({
  steps,
  active,
  onSelect,
}: {
  steps: readonly string[];
  active: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <ol className="snooker-flow">
      {steps.map((step, index) => {
        const done = index < active;
        const current = index === active;
        return (
          <li key={step} className="snooker-flow-item">
            {index > 0 ? <span className={cn("snooker-flow-line", (done || current) && "is-on")} /> : null}
            <button
              type="button"
              onClick={() => onSelect?.(index)}
              className={cn("snooker-flow-node", done && "is-done", current && "is-active")}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function CenturyTimer({
  minutes,
  paused,
}: {
  minutes: number;
  paused: boolean;
}) {
  const cap = 90;
  const pct = Math.min(1, minutes / cap);
  const r = 54;
  const c = 2 * Math.PI * r;
  const hrs = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");

  return (
    <div className="relative mx-auto grid h-44 w-44 place-items-center">
      <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(15,23,42,0.12)" strokeWidth="6" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={paused ? "#d97706" : "#059669"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`}
          className="snooker-ring-draw"
        />
      </svg>
      <div className="text-center">
        <p className="snooker-kicker">{paused ? "Paused" : "Century live"}</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-[0.08em] text-[#0f172a]">
          {hrs}:{mins}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#94a3b8]">min billed</p>
      </div>
    </div>
  );
}
