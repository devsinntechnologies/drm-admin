"use client";

import { useMemo, useState } from "react";
import { Check, Infinity as InfinityIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SnookerGameTypeRow } from "@/hooks/useSnooker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { estimatePackageCharge } from "@/lib/session-billing.util";
import { gameTypeRowToOption, snookerDurationChoices } from "@/lib/snooker-session-options";
import { cn, normalizeErrorMessage } from "@/lib/utils";
import { BILLING_METHODS, DURATION_PRESETS, MAX_DURATION_MINUTES, formatDuration, formatRs } from "./format";
import {
  EMPTY_GAME_TYPE_FORM,
  formFromRow,
  payloadFromForm,
  validateGameTypeForm,
  type GameTypeFormState,
  type GameTypePayload,
} from "./game-type-form";
import { Field, SwitchRow, inputClass } from "./ui";

type Props = {
  open: boolean;
  /** null = create a new game type. */
  row: SnookerGameTypeRow | null;
  onClose: () => void;
  onSubmit: (payload: GameTypePayload) => Promise<SnookerGameTypeRow>;
};

/** Add / edit one game type: price, billing method, durations and visibility. */
export function GameTypeDialog({ open, row, onClose, onSubmit }: Props) {
  const creating = row === null;
  const [form, setForm] = useState<GameTypeFormState>(() => (row ? formFromRow(row) : EMPTY_GAME_TYPE_FORM));
  const [customMinutes, setCustomMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof GameTypeFormState>(key: K, value: GameTypeFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleDuration = (minutes: number) =>
    setForm((current) => ({
      ...current,
      durationOptions: current.durationOptions.includes(minutes)
        ? current.durationOptions.filter((m) => m !== minutes)
        : [...current.durationOptions, minutes].sort((a, b) => a - b),
    }));

  const addCustomDuration = () => {
    const minutes = Math.round(Number(customMinutes));
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > MAX_DURATION_MINUTES) {
      toast.error(`Enter minutes between 1 and ${MAX_DURATION_MINUTES}.`);
      return;
    }
    if (!form.durationOptions.includes(minutes)) toggleDuration(minutes);
    setCustomMinutes("");
  };

  /** What staff will see in the POS with the current (unsaved) values. */
  const preview = useMemo(() => {
    const payload = payloadFromForm(form, creating);
    return gameTypeRowToOption({ ...payload, name: payload.name || "Game" });
  }, [form, creating]);

  const save = async () => {
    const problem = validateGameTypeForm(form);
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(true);
    try {
      const saved = await onSubmit(payloadFromForm(form, creating));
      toast.success(creating ? `${saved.name} added` : `${saved.name} saved`);
      onClose();
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Save failed."));
    } finally {
      setSaving(false);
    }
  };

  const method = form.billingMethod;
  const durationChips = Array.from(new Set<number>([...DURATION_PRESETS, ...form.durationOptions])).sort((a, b) => a - b);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-2xl p-0">
        <DialogHeader className="border-b border-[#f1f5f9] px-6 py-4">
          <DialogTitle>{creating ? "Add game type" : `Edit ${row.name}`}</DialogTitle>
          <DialogDescription>Price and durations apply to new sessions on web and app.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Single" />
            </Field>
            <Field label="Code" hint={creating ? "Short id used by the POS. Leave empty to use the name." : "Code cannot be changed."}>
              <input
                className={cn(inputClass, !creating && "bg-[#f8fafc] text-[#94a3b8]")}
                value={form.code}
                disabled={!creating}
                onChange={(e) => set("code", e.target.value)}
                placeholder="single"
              />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-[#0f172a]">How is it billed?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {BILLING_METHODS.map(({ key, label, hint }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={method === key}
                  onClick={() => set("billingMethod", key)}
                  className={cn(
                    "rounded-xl border p-3 text-left text-sm",
                    method === key ? "border-[#0f172a] bg-[#f8fafc] ring-1 ring-[#0f172a]" : "border-[#e2e8f0] hover:bg-[#f8fafc]",
                  )}
                >
                  <span className="block font-semibold text-[#0f172a]">{label}</span>
                  <span className="mt-0.5 block text-xs text-[#64748b]">{hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            {method === "per_minute" ? (
              <NumberField label="Rate per minute (Rs)" step="0.5" value={form.perMinuteRate} onChange={(v) => set("perMinuteRate", v)} />
            ) : (
              <>
                <NumberField label="Package price (Rs)" value={form.basePrice} onChange={(v) => set("basePrice", v)} />
                <NumberField label="Minutes in package" value={form.includedMinutes} onChange={(v) => set("includedMinutes", v)} />
                {method === "fixed_plus_overtime" ? (
                  <NumberField label="Extra minute (Rs)" step="0.5" value={form.overtimeRate} onChange={(v) => set("overtimeRate", v)} />
                ) : null}
              </>
            )}
            <NumberField
              label="Max duration (min)"
              hint="Empty = no limit"
              value={form.maxDurationMinutes}
              onChange={(v) => set("maxDurationMinutes", v)}
            />
          </div>

          <section className="rounded-xl border border-[#e2e8f0] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#0f172a]">Duration options in POS</p>
                <p className="text-xs text-[#64748b]">Which time choices staff see for this game type.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#334155]">
                <input
                  type="checkbox"
                  checked={!form.useCustomDurations}
                  onChange={(e) => set("useCustomDurations", !e.target.checked)}
                />
                Use default durations
              </label>
            </div>

            {form.useCustomDurations ? (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  {durationChips.map((m) => {
                    const on = form.durationOptions.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDuration(m)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium",
                          on ? "border-[#0f172a] bg-[#0f172a] text-white" : "border-[#e2e8f0] bg-white text-[#334155] hover:bg-[#f8fafc]",
                        )}
                      >
                        {m === 0 ? <InfinityIcon className="h-3.5 w-3.5" /> : on ? <Check className="h-3.5 w-3.5" /> : null}
                        {formatDuration(m)}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex max-w-xs gap-2">
                  <input
                    type="number"
                    min={1}
                    max={MAX_DURATION_MINUTES}
                    className={inputClass}
                    placeholder="Custom minutes"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomDuration();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomDuration}
                    className="h-10 rounded-lg border border-[#e2e8f0] px-3 text-sm font-semibold hover:bg-[#f8fafc]"
                  >
                    Add
                  </button>
                </div>
              </>
            ) : null}

            <div className="mt-4 rounded-lg bg-[#f8fafc] p-3" aria-live="polite">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">Staff will see</p>
              <div className="flex flex-wrap gap-1.5">
                {snookerDurationChoices(preview).map((m) => (
                  <span key={m} className="rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-xs font-medium text-[#334155]">
                    {formatDuration(m)}
                    {m > 0 ? ` · ${formatRs(estimatePackageCharge(preview, m))}` : ""}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-3">
            <SwitchRow
              label="Show to business"
              hint="Off = hidden in admin and POS"
              checked={form.visibleToBusiness}
              onChange={(v) => set("visibleToBusiness", v)}
            />
            <SwitchRow label="Enabled" hint="Business can also switch this" checked={form.isActive} onChange={(v) => set("isActive", v)} />
            <SwitchRow
              label="Lock price"
              hint="Business cannot change price / durations"
              checked={form.priceLocked}
              onChange={(v) => set("priceLocked", v)}
            />
          </div>

          <Field label="Sort order" hint="Lower numbers show first. Empty = after existing game types">
            <input
              type="number"
              className={cn(inputClass, "max-w-[140px]")}
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
            />
          </Field>
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#f1f5f9] px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e2e8f0] px-4 text-sm font-semibold hover:bg-[#f8fafc]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f172a] px-4 text-sm font-semibold text-white hover:bg-[#1e293b] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {creating ? "Add game type" : "Save changes"}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function NumberField({
  label,
  hint,
  value,
  step,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <input type="number" min={0} step={step} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}
