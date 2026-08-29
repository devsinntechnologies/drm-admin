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

function parseUtcInstant(raw: string): Date {
  const value = raw.trim();
  if (!value) return new Date(NaN);
  if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  return new Date(`${iso}Z`);
}
