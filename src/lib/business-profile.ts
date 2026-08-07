import { INDUSTRY_TEMPLATES } from "@/templates/industries";
import { colorsFromAccent } from "@/templates/modules";
import type { ThemeMode } from "@/templates/types";

export type BusinessProfileConfig = {
  industryId: string;
  primaryColor: string;
  secondaryColor: string;
  themeMode: ThemeMode;
  typography: string;
  layoutStyle: "compact" | "comfortable" | "spacious";
};

const STORAGE_KEY = "diginizam_business_profiles";

const INDUSTRY_KEYWORDS: Array<{ keywords: string[]; industryId: string }> = [
  { keywords: ["gym", "fitness", "workout"], industryId: "gym" },
  { keywords: ["clinic", "hospital", "medical", "health"], industryId: "clinic" },
  { keywords: ["pharmacy", "medicine", "drug"], industryId: "pharmacy" },
  { keywords: ["salon", "spa", "beauty"], industryId: "salon-spa" },
  { keywords: ["restaurant", "cafe", "food", "kitchen", "dining"], industryId: "restaurant" },
  { keywords: ["retail", "store", "shop", "mart"], industryId: "retail-store" },
  { keywords: ["real estate", "property", "estate"], industryId: "real-estate" },
  { keywords: ["logistics", "courier", "delivery", "freight"], industryId: "logistics" },
  { keywords: ["manufacturing", "factory", "production"], industryId: "manufacturing" },
  { keywords: ["auto", "motor", "vehicle"], industryId: "auto-parts" },
  { keywords: ["book", "library"], industryId: "book-store" },
  { keywords: ["jewel", "gold"], industryId: "jewellery" },
  { keywords: ["furniture", "home"], industryId: "furniture" },
  { keywords: ["education", "school", "academy", "institute"], industryId: "education" },
  { keywords: ["agency", "marketing", "creative"], industryId: "agency" },
];

function inferIndustryId(businessName: string): string {
  const lower = businessName.toLowerCase();
  for (const entry of INDUSTRY_KEYWORDS) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.industryId;
  }
  const templateIds = INDUSTRY_TEMPLATES.map((t) => t.id);
  let hash = 0;
  for (let i = 0; i < businessName.length; i++) hash += businessName.charCodeAt(i);
  return templateIds[hash % templateIds.length] ?? "retail-store";
}

function defaultProfile(industryId: string): BusinessProfileConfig {
  const template = INDUSTRY_TEMPLATES.find((t) => t.id === industryId);
  const palette = template ? colorsFromAccent(template.theme.accent) : colorsFromAccent("blue");
  return {
    industryId,
    primaryColor: palette.primary,
    secondaryColor: palette.secondary,
    themeMode: "light",
    typography: "Poppins",
    layoutStyle: "comfortable",
  };
}

function readAll(): Record<string, BusinessProfileConfig> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, BusinessProfileConfig>) : {};
  } catch {
    return {};
  }
}

export function getBusinessProfile(businessId: string, businessName = ""): BusinessProfileConfig {
  const stored = readAll()[businessId];
  if (stored) return stored;
  return defaultProfile(inferIndustryId(businessName));
}

export function saveBusinessProfile(businessId: string, profile: BusinessProfileConfig) {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[businessId] = profile;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getIndustryLabel(industryId: string): string {
  const fromTemplate = INDUSTRY_TEMPLATES.find((t) => t.id === industryId)?.name;
  if (fromTemplate) return fromTemplate;
  return industryId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
