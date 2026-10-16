export const ORDER_PAYMENT_METHODS = [
  { id: "cash", label: "Cash", image: "/checkout-payments/money.png" },
  { id: "card", label: "Card", image: null as string | null },
  { id: "bank_transfer", label: "Bank transfer", image: "/checkout-payments/bank.jpg" },
  { id: "jazzcash", label: "JazzCash", image: "/checkout-payments/JazzCash.png" },
  { id: "easypaisa", label: "Easypaisa", image: "/checkout-payments/Easypaisa.png" },
] as const;

export type OrderPaymentMethodId =
  | (typeof ORDER_PAYMENT_METHODS)[number]["id"]
  | "credit";

export type CheckoutPaymentOption = {
  id: string;
  label: string;
  image: string | null;
};

export function checkoutPaymentOptions(includeCredit: boolean): CheckoutPaymentOption[] {
  const base: CheckoutPaymentOption[] = ORDER_PAYMENT_METHODS.map((m) => ({
    id: m.id,
    label: m.label,
    image: m.image,
  }));
  if (includeCredit) {
    base.push({ id: "credit", label: "Credit / Udhaar", image: null });
  }
  return base;
}
