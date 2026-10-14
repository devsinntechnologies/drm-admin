/** Invoice money — line items win over stored total when session orders under-report add-ons. */

export function parseInvoicePrice(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export type InvoiceTotalsInput = {
  Items?: Array<{
    price?: string | number;
    quantity?: number;
    total?: string | number;
  }>;
  deliveryCharges?: string | number | null;
  packagingPrice?: string | number | null;
  totalPrice?: string | number | null;
  subtotal?: number | null;
};

export function resolveInvoiceTotals(invoice: InvoiceTotalsInput) {
  let itemsSubtotal = (invoice.Items ?? []).reduce((sum, item) => {
    const explicit = Number(item.total);
    if (Number.isFinite(explicit) && explicit > 0) return sum + explicit;
    return sum + parseInvoicePrice(item.price) * Number(item.quantity || 0);
  }, 0);
  const apiSubtotal =
    typeof invoice.subtotal === "number" && invoice.subtotal > 0
      ? invoice.subtotal
      : 0;
  if (itemsSubtotal <= 0.009 && apiSubtotal > 0) {
    itemsSubtotal = apiSubtotal;
  }
  const delivery = parseInvoicePrice(invoice.deliveryCharges);
  const packaging = parseInvoicePrice(invoice.packagingPrice);
  const stored = parseInvoicePrice(invoice.totalPrice);
  const computed = itemsSubtotal + delivery + packaging;
  const total =
    itemsSubtotal > 0.009
      ? Math.max(computed, stored)
      : stored > 0
        ? stored
        : computed;
  const subtotal =
    itemsSubtotal > 0
      ? itemsSubtotal
      : apiSubtotal > 0
        ? apiSubtotal
        : Math.max(0, total - delivery - packaging);
  return { subtotal, delivery, packaging, total };
}
