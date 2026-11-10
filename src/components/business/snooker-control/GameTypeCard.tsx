"use client";

import { Check, Eye, EyeOff, Infinity as InfinityIcon, Loader2, Lock, Pencil, Trash2, Unlock } from "lucide-react";
import type { SnookerGameTypeRow } from "@/hooks/useSnooker";
import { estimatePackageCharge } from "@/lib/session-billing.util";
import { gameTypeRowToOption, snookerDurationChoices } from "@/lib/snooker-session-options";
import { cn } from "@/lib/utils";
import { BILLING_LABEL, billingMethodOf, formatDuration, formatRs } from "./format";
import { Badge, IconButton, SwitchRow } from "./ui";

type Props = {
  row: SnookerGameTypeRow;
  busy: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onToggleActive: () => void;
  onToggleVisible: () => void;
  onToggleLock: () => void;
};

/** Pricing-card view of one game type, with its quick actions. */
export function GameTypeCard({ row, busy, onEdit, onRemove, onToggleActive, onToggleVisible, onToggleLock }: Props) {
  const option = gameTypeRowToOption(row);
  const method = billingMethodOf(row);
  const hidden = row.visibleToBusiness === false;
  const customDurations = Array.isArray(row.durationOptions) && row.durationOptions.length > 0;

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border bg-white p-5 shadow-sm",
        hidden ? "border-dashed border-[#cbd5e1] opacity-70" : "border-[#e2e8f0]",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-[#0f172a]">{row.name}</h3>
          <p className="mt-0.5 font-mono text-xs text-[#94a3b8]">{row.code}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {hidden ? (
            <Badge tone="slate">Hidden</Badge>
          ) : row.isActive ? (
            <Badge tone="green">Live</Badge>
          ) : (
            <Badge tone="amber">Disabled</Badge>
          )}
          {row.priceLocked ? <Badge tone="blue">Locked</Badge> : null}
          {row.managedBy === "platform" ? <Badge tone="violet">Platform</Badge> : null}
        </div>
      </header>

      <div className="mt-4 border-b border-[#f1f5f9] pb-4">
        <p className="text-3xl font-bold tracking-tight text-[#0f172a]">
          {method === "per_minute" ? formatRs(row.perMinuteRate) : formatRs(row.basePrice)}
          <span className="ml-1 text-sm font-medium text-[#64748b]">
            {method === "per_minute" ? "/ minute" : `/ ${row.includedMinutes || 0} min`}
          </span>
        </p>
        <p className="mt-1 text-sm text-[#64748b]">
          {BILLING_LABEL[method]}
          {method === "fixed_plus_overtime" && row.overtimeEnabled ? ` · then ${formatRs(row.overtimeRate)}/min` : ""}
          {row.maxDurationMinutes ? ` · max ${formatDuration(row.maxDurationMinutes)}` : ""}
        </p>
      </div>

      <div className="mt-4 flex-1">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
          Durations{customDurations ? "" : " (default)"}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {snookerDurationChoices(option).map((m) => (
            <li
              key={m}
              className="inline-flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1 text-xs font-medium text-[#334155]"
            >
              {m === 0 ? <InfinityIcon className="h-3 w-3" /> : <Check className="h-3 w-3 text-[#16a34a]" />}
              {formatDuration(m)}
              {m > 0 ? <span className="text-[#94a3b8]">· {formatRs(estimatePackageCharge(option, m))}</span> : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <SwitchRow
          tone="green"
          label={row.isActive ? "Enabled" : "Disabled"}
          hint={row.isActive ? "Staff can start this game" : "Not offered when starting a session"}
          checked={row.isActive}
          onChange={onToggleActive}
          disabled={busy}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={busy}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-[#e2e8f0] bg-white text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />} Edit price
        </button>
        <IconButton label={hidden ? "Show to business" : "Hide from business"} onClick={onToggleVisible} disabled={busy}>
          {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </IconButton>
        <IconButton label={row.priceLocked ? "Unlock price" : "Lock price"} onClick={onToggleLock} disabled={busy}>
          {row.priceLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </IconButton>
        <IconButton label="Remove" onClick={onRemove} disabled={busy} danger>
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </article>
  );
}
