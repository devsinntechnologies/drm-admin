export const ORDER_PAYMENT_METHODS = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "bank_transfer", label: "Bank transfer" },
  { id: "jazzcash", label: "JazzCash" },
  { id: "easypaisa", label: "Easypaisa" },
] as const;

export type OrderPaymentMethodId =
  | (typeof ORDER_PAYMENT_METHODS)[number]["id"]
  | "credit";

export function checkoutPaymentOptions(includeCredit: boolean): Array<{ id: string; label: string }> {
  const base: Array<{ id: string; label: string }> = ORDER_PAYMENT_METHODS.map((m) => ({
    id: m.id,
    label: m.label,
  }));
  if (includeCredit) {
    base.push({ id: "credit", label: "Credit / Udhaar" });
  }
  return base;
}
