import type { SnookerGameTypeRow } from "@/hooks/useSnooker";

export type BillingMethod = NonNullable<SnookerGameTypeRow["billingMethod"]>;

export const BILLING_METHODS: ReadonlyArray<{ key: BillingMethod; label: string; hint: string }> = [
  { key: "fixed", label: "Fixed package", hint: "One price for the package time" },
  { key: "fixed_plus_overtime", label: "Package + overtime", hint: "Package price, then a rate per extra minute" },
  { key: "per_minute", label: "Per minute", hint: "Charged for every played minute" },
];

export const BILLING_LABEL = Object.fromEntries(
  BILLING_METHODS.map((m) => [m.key, m.label]),
) as Record<BillingMethod, string>;

/** Quick-pick durations in the editor; 0 = open-ended / billed per played minute. */
export const DURATION_PRESETS = [0, 15, 30, 45, 60, 90, 120, 180] as const;

export const MAX_DURATION_MINUTES = 24 * 60;

export function formatRs(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `Rs ${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes === 0) return "Open / per min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h} hr`;
}

export function billingMethodOf(row: Pick<SnookerGameTypeRow, "billingMethod">): BillingMethod {
  return row.billingMethod ?? "fixed";
}
