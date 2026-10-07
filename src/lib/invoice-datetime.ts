/**
 * Format invoice clocks using only the timezone of the computer
 * running this admin app (the OS setting in the browser).
 */
export function formatInvoiceDateTime(value?: string | Date | null): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : parseUtcInstant(value);
  if (Number.isNaN(date.getTime())) return "-";
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return date.toLocaleString(undefined, {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Minutes east of UTC on this machine (e.g. 300 for UTC+5). */
export function machineTzOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/** YYYY-MM-DD in this machine's calendar, not UTC. */
export function localIsoDate(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function localMonthStartIso(date = new Date()): string {
  return localIsoDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function parseUtcInstant(raw: string): Date {
  const value = raw.trim();
  if (!value) return new Date(NaN);
  if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  return new Date(`${iso}Z`);
}
