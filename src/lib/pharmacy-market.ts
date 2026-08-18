export type PharmacyMarketCode = "PK" | "UK";

export type PharmacyMarketProfile = {
  code: PharmacyMarketCode;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  taxName: string;
  taxRate: number;
  taxIdLabel: string;
  productCodeLabel: string;
  productCodeHint: string;
  patientIdLabel: string;
  patientIdHint: string;
  staffLicenseLabel: string;
  doctorLicenseLabel: string;
  regulator: string;
  taxAuthority: string;
  controlledTitle: string;
  posSubtitle: string;
  catalogSubtitle: string;
  prescriptionsSubtitle: string;
  paymentMethods: Array<{ id: string; label: string }>;
  schedules: Array<{ value: string; label: string }>;
  prescriptionChannels: Array<{ id: string; label: string }>;
  exemptionOptions: Array<{ code: string; label: string }>;
  prescriptionCharge: number;
};

export const PHARMACY_MARKETS: Record<PharmacyMarketCode, PharmacyMarketProfile> = {
  PK: {
    code: "PK",
    name: "Pakistan",
    currency: "PKR",
    currencySymbol: "Rs",
    locale: "en-PK",
    taxName: "GST",
    taxRate: 17,
    taxIdLabel: "NTN / STRN",
    productCodeLabel: "HSN / PCT",
    productCodeHint: "FBR PCT code",
    patientIdLabel: "CNIC",
    patientIdHint: "13-digit CNIC",
    staffLicenseLabel: "PCP license",
    doctorLicenseLabel: "PMC license",
    regulator: "DRAP",
    taxAuthority: "FBR",
    controlledTitle: "DRAP controlled schedule",
    posSubtitle: "Search by brand, salt, or barcode. GST, JazzCash/EasyPaisa, and FEFO dispatch.",
    catalogSubtitle: "Salt, barcode, GST, Rx, and DRAP schedule flags",
    prescriptionsSubtitle: "Paper Rx, scan intake, partial fill, and refill reminders",
    paymentMethods: [
      { id: "cash", label: "Cash" },
      { id: "card", label: "Card" },
      { id: "jazzcash", label: "JazzCash" },
      { id: "easypaisa", label: "EasyPaisa" },
    ],
    schedules: [
      { value: "", label: "OTC" },
      { value: "POM", label: "POM — prescription only" },
      { value: "H", label: "Schedule H" },
      { value: "H1", label: "Schedule H1" },
      { value: "X", label: "Schedule X (narcotic)" },
    ],
    prescriptionChannels: [
      { id: "paper", label: "Paper prescription" },
      { id: "scan", label: "Scanned Rx" },
      { id: "e-rx", label: "E-prescription" },
    ],
    exemptionOptions: [],
    prescriptionCharge: 0,
  },
  UK: {
    code: "UK",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    locale: "en-GB",
    taxName: "VAT",
    taxRate: 0,
    taxIdLabel: "VAT number",
    productCodeLabel: "PIP / GTIN",
    productCodeHint: "NHS dm+d / PIP code",
    patientIdLabel: "NHS number",
    patientIdHint: "10-digit NHS number",
    staffLicenseLabel: "GPhC registration",
    doctorLicenseLabel: "GMC number",
    regulator: "MHRA",
    taxAuthority: "HMRC",
    controlledTitle: "Misuse of Drugs schedule",
    posSubtitle: "Search by brand, generic, or barcode. NHS charge, EPS, and FEFO dispatch.",
    catalogSubtitle: "Generic, PIP/GTIN, VAT, POM, and CD schedule flags",
    prescriptionsSubtitle: "EPS, NHS, private Rx, partial fill, and refill reminders",
    paymentMethods: [
      { id: "cash", label: "Cash" },
      { id: "card", label: "Card" },
      { id: "contactless", label: "Contactless" },
    ],
    schedules: [
      { value: "", label: "GSL — general sale" },
      { value: "P", label: "P — pharmacy medicine" },
      { value: "POM", label: "POM — prescription only" },
      { value: "CD2", label: "CD Schedule 2" },
      { value: "CD3", label: "CD Schedule 3" },
      { value: "CD4", label: "CD Schedule 4" },
      { value: "CD5", label: "CD Schedule 5" },
    ],
    prescriptionChannels: [
      { id: "nhs", label: "NHS prescription" },
      { id: "eps", label: "EPS token" },
      { id: "private", label: "Private prescription" },
      { id: "paper", label: "Paper FP10" },
      { id: "scan", label: "Scanned Rx" },
    ],
    exemptionOptions: [
      { code: "PAID", label: "Pay NHS prescription charge" },
      { code: "A", label: "A — 60 or over" },
      { code: "B", label: "B — under 16" },
      { code: "D", label: "D — 16–18 in education" },
      { code: "E", label: "E — maternity" },
      { code: "F", label: "F — medical exemption" },
      { code: "H", label: "H — income-related benefit" },
      { code: "M", label: "M — prescription prepayment" },
    ],
    prescriptionCharge: 9.9,
  },
};

export function resolvePharmacyMarket(input?: {
  market?: string | null;
  currency?: string | null;
  location?: string | null;
}): PharmacyMarketCode {
  const explicit = String(input?.market || "").trim().toUpperCase();
  if (explicit === "UK" || explicit === "GB") return "UK";
  if (explicit === "PK" || explicit === "PAKISTAN") return "PK";
  const currency = String(input?.currency || "").trim().toUpperCase();
  if (currency === "GBP") return "UK";
  if (currency === "PKR") return "PK";
  const location = String(input?.location || "").toLowerCase();
  if (/(uk|united kingdom|england|london|manchester|birmingham|glasgow|cardiff)/.test(location)) return "UK";
  return "PK";
}

export function getPharmacyMarket(input?: {
  market?: string | null;
  currency?: string | null;
  location?: string | null;
}): PharmacyMarketProfile {
  return PHARMACY_MARKETS[resolvePharmacyMarket(input)];
}

export function formatPharmacyMoney(
  amount: number,
  market: Pick<PharmacyMarketProfile, "currency" | "locale"> | string = "PKR",
): string {
  const profile = typeof market === "string" ? getPharmacyMarket({ currency: market }) : market;
  try {
    return new Intl.NumberFormat(profile.locale, {
      style: "currency",
      currency: profile.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch {
    return `${profile.currency} ${(Number(amount) || 0).toFixed(2)}`;
  }
}

export function isControlledSchedule(schedule?: string | null): boolean {
  const value = String(schedule || "").trim().toUpperCase();
  return ["H", "H1", "X", "CD2", "CD3", "CD4", "CD5", "II", "III"].includes(value);
}

export function prescriptionChargeAmount(
  market: Pick<PharmacyMarketProfile, "code" | "prescriptionCharge">,
  input: {
    hasRxItem?: boolean;
    prescriptionChannel?: string | null;
    nhsExemptionCode?: string | null;
  },
): number {
  const channel = String(input.prescriptionChannel || "").toLowerCase();
  const nhsSale =
    market.code === "UK" &&
    Boolean(input.hasRxItem) &&
    (channel === "nhs" || channel === "eps" || !channel);
  const exemption = String(input.nhsExemptionCode || "").toUpperCase();
  return nhsSale && (!exemption || exemption === "PAID") ? market.prescriptionCharge : 0;
}

export const PHARMACY_COUNTRY_OPTIONS: Array<{
  code: PharmacyMarketCode;
  label: string;
  hint: string;
  phonePrefix: string;
  city: string;
}> = [
  {
    code: "PK",
    label: "Pakistan",
    hint: "GST, CNIC, DRAP schedules, JazzCash / EasyPaisa",
    phonePrefix: "+92",
    city: "Karachi",
  },
  {
    code: "UK",
    label: "United Kingdom",
    hint: "VAT, NHS number, GPhC, EPS and NHS charge",
    phonePrefix: "+44",
    city: "London",
  },
];

export function pharmacyCountryDefaults(code: PharmacyMarketCode) {
  const option = PHARMACY_COUNTRY_OPTIONS.find((item) => item.code === code) ?? PHARMACY_COUNTRY_OPTIONS[0];
  const profile = PHARMACY_MARKETS[option.code];
  return {
    market: option.code,
    currency: profile.currency,
    location: option.city,
    phonePrefix: option.phonePrefix,
    taxName: profile.taxName,
    regulator: profile.regulator,
  };
}
