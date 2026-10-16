/** Invoice money — detect inflated table lines vs checkout total; keep full line sums when header is low. */

export function parseInvoicePrice(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export type InvoiceTotalsInput = {
  Items?: Array<{
    productname?: string;
    price?: string | number;
    quantity?: number;
    total?: string | number;
    isSessionService?: boolean;
  }>;
  deliveryCharges?: string | number | null;
  packagingPrice?: string | number | null;
  totalPrice?: string | number | null;
  subtotal?: number | null;
  gameType?: string | null;
  sessionMinutes?: number | null;
};

function isSessionLine(item: NonNullable<InvoiceTotalsInput["Items"]>[number]) {
  // Only real TABLE SKUs — do not trust isSessionService alone (retail mis-flags).
  return /\bTABLE\b/i.test(String(item.productname ?? ""));
}

function lineAmount(item: NonNullable<InvoiceTotalsInput["Items"]>[number]) {
  const explicit = Number(item.total);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return parseInvoicePrice(item.price) * Number(item.quantity || 0);
}

function reconcileSessionLines(invoice: InvoiceTotalsInput): InvoiceTotalsInput {
  const checkout = parseInvoicePrice(invoice.totalPrice);
  const items = invoice.Items ?? [];
  if (!(checkout > 0) || items.length === 0) return invoice;

  const delivery = parseInvoicePrice(invoice.deliveryCharges);
  const packaging = parseInvoicePrice(invoice.packagingPrice);

  const retail = items
    .filter((item) => !isSessionLine(item))
    .reduce((sum, item) => sum + lineAmount(item), 0);

  let sessionDue = checkout - retail - delivery - packaging;
  if (sessionDue < 0) sessionDue = 0;
  sessionDue = Math.round(sessionDue * 100) / 100;

  let primaryApplied = false;
  const Items = items.map((item) => {
    if (!isSessionLine(item)) return item;
    if (primaryApplied) return item;
    primaryApplied = true;
    const qty = Math.max(1, Number(item.quantity || 1));
    return {
      ...item,
      total: sessionDue,
      price: sessionDue / qty,
    };
  });

  return { ...invoice, Items };
}

export function resolveInvoiceTotals(invoice: InvoiceTotalsInput) {
  const items = invoice.Items ?? [];
  const stored = parseInvoicePrice(invoice.totalPrice);
  const delivery = parseInvoicePrice(invoice.deliveryCharges);
  const packaging = parseInvoicePrice(invoice.packagingPrice);

  const rawSubtotal = items.reduce((sum, item) => sum + lineAmount(item), 0);
  const sessionLines = items.filter(isSessionLine);
  const sessionLineSum = sessionLines.reduce((sum, item) => sum + lineAmount(item), 0);
  const hasSessionContext =
    sessionLines.length > 0 ||
    (Boolean(String(invoice.gameType ?? "").trim()) &&
      invoice.sessionMinutes != null);

  const tableInflated =
    hasSessionContext &&
    stored > 0.009 &&
    sessionLineSum > stored + 0.02;

  const working = tableInflated ? reconcileSessionLines(invoice) : invoice;

  let itemsSubtotal = (working.Items ?? []).reduce(
    (sum, item) => sum + lineAmount(item),
    0,
  );
  const apiSubtotal =
    typeof working.subtotal === "number" && working.subtotal > 0
      ? working.subtotal
      : 0;
  if (itemsSubtotal <= 0.009 && apiSubtotal > 0) {
    itemsSubtotal = apiSubtotal;
  }

  const computed = itemsSubtotal + delivery + packaging;
  let total = computed;
  if (stored > 0.009) {
    if (tableInflated) {
      total = stored;
    } else if (rawSubtotal > stored + 0.02) {
      // With a real TABLE line, header may be session-only → use line sum.
      // Without TABLE lines, inflated retail stamps → trust checkout header.
      total = sessionLines.length > 0 ? computed : stored;
    } else {
      total = Math.max(computed, stored);
    }
  }

  const subtotal =
    itemsSubtotal > 0
      ? itemsSubtotal
      : apiSubtotal > 0
        ? apiSubtotal
        : Math.max(0, total - delivery - packaging);

  return { subtotal, delivery, packaging, total };
}
