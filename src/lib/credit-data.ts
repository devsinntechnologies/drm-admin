import type { CreditParty } from "@/lib/credit-types";

/** Credit lists use a pagination envelope even when all rows are returned. */
export function normalizeCreditParties(payload: unknown): CreditParty[] {
  let current = payload;
  let expectedTotal: number | undefined;
  for (let depth = 0; depth < 5 && !Array.isArray(current); depth += 1) {
    if (!current || typeof current !== "object") break;
    const envelope = current as { data?: unknown; pagination?: { total?: unknown } };
    const total = Number(envelope.pagination?.total);
    if (Number.isFinite(total)) expectedTotal = total;
    current = envelope.data;
  }
  if (!Array.isArray(current)) throw new Error("Credit accounts could not be read. Please refresh to try again.");
  const parties = current.map((value) => {
    const party = value as CreditParty;
    const outstanding = Number(party?.outstanding);
    if (!party || typeof party.id !== "string" || !Number.isFinite(outstanding)) {
      throw new Error("A credit account has an invalid balance. Please refresh to try again.");
    }
    return { ...party, outstanding };
  });
  if (expectedTotal !== undefined && expectedTotal > parties.length) {
    throw new Error("Some credit accounts were not returned. Please refresh to load the complete ledger.");
  }
  return parties;
}

export function creditAccountSummary(parties: CreditParty[]) {
  const outstanding = parties.filter((party) => party.outstanding > 0.009);
  return {
    total: parties.length,
    outstanding: outstanding.length,
    settled: parties.length - outstanding.length,
    balance: Math.round(parties.reduce((sum, party) => sum + party.outstanding, 0) * 100) / 100,
  };
}
