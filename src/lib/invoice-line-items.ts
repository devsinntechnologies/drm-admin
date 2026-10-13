export type InvoiceLineItemLike = {
  id?: string;
  productName: string;
  quantity: number;
  price: number | string;
  total?: number | string;
  variantName?: string;
  isSessionService?: boolean;
};

function lineKey(item: InvoiceLineItemLike) {
  const unit = Number(item.price) || 0;
  return `${item.productName.trim().toLowerCase()}|${unit}|${item.quantity ?? 1}`;
}

export function dedupeInvoiceLineItems<T extends InvoiceLineItemLike>(items: T[]): T[] {
  const byKey = new Map<string, T>();
  const order: string[] = [];
  for (const item of items) {
    const key = lineKey(item);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      order.push(key);
      continue;
    }
    if (item.isSessionService && !existing.isSessionService) {
      byKey.set(key, { ...existing, isSessionService: true });
    }
  }
  return order.map((key) => byKey.get(key)!);
}

export function isTableSessionLine(
  item: InvoiceLineItemLike,
  all: InvoiceLineItemLike[],
  hasSessionMeta: boolean,
) {
  if (item.isSessionService) return true;
  const name = item.productName.trim().toUpperCase();
  if (!name.includes("TABLE")) return false;
  if (hasSessionMeta) return true;
  const key = item.productName.trim().toLowerCase();
  return all.some(
    (other) =>
      other.isSessionService &&
      other.productName.trim().toLowerCase() === key,
  );
}

export function sessionLineItems<T extends InvoiceLineItemLike>(
  items: T[],
  hasSessionMeta: boolean,
): T[] {
  const visible = dedupeInvoiceLineItems(items);
  return visible.filter((i) => isTableSessionLine(i, visible, hasSessionMeta));
}

export function addonLineItems<T extends InvoiceLineItemLike>(
  items: T[],
  hasSessionMeta: boolean,
): T[] {
  const session = sessionLineItems(items, hasSessionMeta);
  const sessionNames = new Set(
    session.map((i) => i.productName.trim().toLowerCase()),
  );
  const visible = dedupeInvoiceLineItems(items);
  return visible.filter(
    (i) =>
      !isTableSessionLine(i, visible, hasSessionMeta) &&
      !sessionNames.has(i.productName.trim().toLowerCase()),
  );
}

export function billableLineItems<T extends InvoiceLineItemLike>(
  items: T[],
  hasSessionMeta: boolean,
): T[] {
  return [...sessionLineItems(items, hasSessionMeta), ...addonLineItems(items, hasSessionMeta)];
}
