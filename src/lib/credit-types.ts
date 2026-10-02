export interface CreditParty {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  outstanding: number;
}

export interface OrderCreditDetails {
  partyId?: string;
  name: string;
  phone: string;
  email: string;
  dueDate?: string;
  clientCreditId: string;
}

export function hasCreditIdentifier(details: Pick<OrderCreditDetails, "partyId" | "name" | "phone" | "email">) {
  return Boolean(
    details.partyId?.trim() ||
      details.name?.trim() ||
      details.phone?.trim() ||
      details.email?.trim(),
  );
}

export function creditPartyLabel(party: CreditParty) {
  const parts = [party.name];
  if (party.phone?.trim()) parts.push(party.phone.trim());
  return parts.filter(Boolean).join(" · ");
}
