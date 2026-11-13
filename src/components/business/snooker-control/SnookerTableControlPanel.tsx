"use client";

import { useState } from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { SnookerGameTypeRow } from "@/hooks/useSnooker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isOfferedGameType } from "@/lib/snooker-session-options";
import { cn, normalizeErrorMessage } from "@/lib/utils";
import { GameTypeCard } from "./GameTypeCard";
import { GameTypeDialog } from "./GameTypeDialog";
import type { GameTypePayload } from "./game-type-form";
import { useSnookerTableControl } from "./useSnookerTableControl";

type Editing = { mode: "create" } | { mode: "edit"; row: SnookerGameTypeRow } | null;

/**
 * Super admin: Snooker Table Control for one business — game types, prices,
 * POS durations, enable/disable, hide/show and price lock.
 */
export function SnookerTableControlPanel({ businessId, businessName }: { businessId: string; businessName?: string }) {
  const { rows, loading, error, reload, create, update, remove } = useSnookerTableControl(businessId);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [removing, setRemoving] = useState<SnookerGameTypeRow | null>(null);

  /** Runs a quick action for one card with a busy state and toast feedback. */
  const runQuick = async (row: SnookerGameTypeRow, action: () => Promise<unknown>, success: string) => {
    setBusyId(row.id);
    try {
      await action();
      toast.success(success);
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Update failed."));
    } finally {
      setBusyId(null);
    }
  };

  const patch = (row: SnookerGameTypeRow, body: Partial<GameTypePayload>, success: string) =>
    runQuick(row, () => update(row.id, body), success);

  const confirmRemove = () => {
    if (!removing) return;
    const row = removing;
    setRemoving(null);
    void runQuick(row, () => remove(row.id), `${row.name} removed`);
  };

  const liveCount = rows.filter(isOfferedGameType).length;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[#0f172a]">Snooker Table Control</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#64748b]">
            Game types, prices and session durations for {businessName ?? "this business"}. Changes apply to new
            sessions on the web portal and the DigiNizam app; running sessions keep the price they started with.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-xs font-medium text-[#475569]">
            {liveCount} of {rows.length} live in POS
          </span>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm font-medium text-[#0f172a] hover:bg-[#f8fafc]"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setEditing({ mode: "create" })}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0f172a] px-3 text-sm font-semibold text-white hover:bg-[#1e293b]"
          >
            <Plus className="h-4 w-4" /> Add game type
          </button>
        </div>
      </header>

      {error ? (
        <div role="alert" className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#991b1b]">
          {error}
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <div className="flex items-center gap-2 py-12 text-sm text-[#64748b]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading game types…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <GameTypeCard
              key={row.id}
              row={row}
              busy={busyId === row.id}
              onEdit={() => setEditing({ mode: "edit", row })}
              onRemove={() => setRemoving(row)}
              onToggleActive={() =>
                void patch(row, { isActive: !row.isActive }, row.isActive ? `${row.name} disabled` : `${row.name} enabled`)
              }
              onToggleVisible={() => {
                const show = row.visibleToBusiness === false;
                void patch(
                  row,
                  { visibleToBusiness: show },
                  show ? `${row.name} is now shown to the business` : `${row.name} hidden from the business`,
                );
              }}
              onToggleLock={() =>
                void patch(row, { priceLocked: !row.priceLocked }, row.priceLocked ? `${row.name} unlocked` : `${row.name} price locked`)
              }
            />
          ))}
          <button
            type="button"
            onClick={() => setEditing({ mode: "create" })}
            className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#cbd5e1] bg-white/60 text-sm font-medium text-[#64748b] hover:border-[#94a3b8] hover:text-[#0f172a]"
          >
            <Plus className="h-6 w-6" /> New game type
          </button>
        </div>
      )}

      <p className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-xs leading-relaxed text-[#475569]">
        <strong className="text-[#0f172a]">Disabled</strong> game types are not offered when starting a session.{" "}
        <strong className="text-[#0f172a]">Hidden</strong> ones disappear from the business admin and the POS.{" "}
        <strong className="text-[#0f172a]">Locked</strong> ones stay visible, but business staff cannot change their
        price or durations. Business admins can still add their own game types; you see them here too.
      </p>

      {editing ? (
        <GameTypeDialog
          key={editing.mode === "edit" ? editing.row.id : "create"}
          open
          row={editing.mode === "edit" ? editing.row : null}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => (editing.mode === "edit" ? update(editing.row.id, payload) : create(payload))}
        />
      ) : null}

      <AlertDialog open={removing !== null} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will no longer appear for this business or in the POS. Running sessions and past bills keep their
              price. Adding a game type with the same code later restores it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-[#dc2626] hover:bg-[#b91c1c]">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
