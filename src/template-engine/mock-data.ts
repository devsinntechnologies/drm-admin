import type { CustomizedTemplateConfig, DashboardCardId } from "@/templates/types";
import { DASHBOARD_CARD_CATALOG } from "@/templates/modules";

const MOCK_VALUES: Partial<Record<DashboardCardId, string>> = {
  "today-sales": "Rs 248,500",
  "total-transactions": "186",
  "gross-profit": "Rs 72,400",
  "low-stock": "14",
  "top-products": "12 SKUs",
  "pending-purchases": "5",
  "expiring-items": "8",
  "expired-items": "2",
  "batch-value": "Rs 1.2M",
  "pending-prescriptions": "6",
  "active-orders": "11",
  "tables-occupied": "9 / 24",
  "kitchen-delays": "3",
  "avg-order-value": "Rs 1,850",
  "low-stock-ingredients": "7",
  "best-collection": "Summer Linen",
  "low-stock-sizes": "M / L gaps",
  "pending-alterations": "4",
  "customer-orders": "9",
  "returns-exchanges": "3",
  "today-appointments": "18",
  "available-staff": "5",
  "expected-revenue": "Rs 96,000",
  "walk-ins": "4",
  "pending-appointments": "2",
  "top-service": "Hair Colour",
  "production-planned": "420 units",
  "custom-orders-due": "6",
  wastage: "Rs 3,200",
  "ingredient-shortage": "4",
  "warranty-claims": "3",
  "product-returns": "5",
  "top-brands": "Samsung",
  "inventory-value": "Rs 8.4M",
  "custom-orders": "7",
  "repairs-pending": "5",
  "metal-stock": "2.4 kg",
  "outstanding-balances": "Rs 185K",
  "top-age-group": "6–8 yrs",
  "seasonal-products": "22",
  "active-promotions": "3",
  "orders-in-progress": "8",
  "avg-prep-time": "7 min",
  "best-selling-item": "Cappuccino",
  "takeaway-orders": "42",
  "pending-quotations": "6",
  "scheduled-deliveries": "5",
  "installations-pending": "3",
  "active-counters": "4",
  "fast-selling": "28 SKUs",
  "purchase-value": "Rs 410K",
  "production-in-progress": "12 jobs",
  "raw-material-shortages": "5",
  "planned-production": "1,200",
  "completed-production": "860",
  "rejected-quantity": "18",
  "finished-stock-value": "Rs 3.1M",
  "fast-moving-parts": "Brake pads",
  "top-vehicle-brands": "Toyota",
  "best-selling-books": "Atomic Habits",
  "top-authors": "James Clear",
  "recently-added": "24 titles",
};

export function getMockDashboardCards(config: CustomizedTemplateConfig) {
  return config.dashboardCards.map((id) => ({
    id,
    label: DASHBOARD_CARD_CATALOG[id]?.label ?? id,
    value: MOCK_VALUES[id] ?? "—",
    description: DASHBOARD_CARD_CATALOG[id]?.description ?? "",
  }));
}

export function getMockProducts(config: CustomizedTemplateConfig) {
  const label = config.labels.product;
  const samples: Record<string, string[]> = {
    restaurant: ["Chicken Biryani", "Club Sandwich", "Mango Smoothie", "Grilled Steak"],
    "food-cafe": ["Cappuccino", "Croissant", "Club Sandwich", "Iced Latte"],
    bakery: ["Chocolate Cake", "Sourdough Loaf", "Cupcake Box", "Custom Tier Cake"],
    pharmacy: ["Paracetamol 500mg", "Amoxicillin 250mg", "Vitamin C", "Cough Syrup"],
    boutique: ["Linen Blazer", "Silk Scarf", "Denim Skirt", "Evening Gown"],
    "salon-spa": ["Hair Colour Kit", "Shampoo 500ml", "Face Serum", "Nail Polish"],
    jewellery: ["22K Necklace", "Diamond Ring", "Gold Bangle", "Pearl Set"],
    "auto-parts": ["Oil Filter", "Brake Pads", "Spark Plug", "Air Filter"],
    "book-store": ["Atomic Habits", "Rich Dad Poor Dad", "The Alchemist", "Clean Code"],
    manufacturing: ["Finished Unit A", "Finished Unit B", "Assembly Kit", "Spare Housing"],
  };

  const names = samples[config.industryId] ?? [`${label} Alpha`, `${label} Beta`, `${label} Gamma`, `${label} Delta`];

  return names.map((name, index) => ({
    id: `p-${index + 1}`,
    name,
    sku: `SKU-${1000 + index}`,
    stock: [42, 18, 7, 120][index] ?? 10,
    price: ["Rs 1,250", "Rs 890", "Rs 2,400", "Rs 3,100"][index] ?? "Rs 999",
    status: index === 2 ? "Low stock" : "In stock",
  }));
}
