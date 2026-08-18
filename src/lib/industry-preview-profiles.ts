/** Industry-specific preview content for the business template preview system. */

export type PreviewModule = {
  id: string;
  label: string;
  description: string;
  metrics?: Array<{ label: string; value: string }>;
};

export type IndustryPreviewProfile = {
  id: string;
  label: string;
  dashboardMetrics: Array<{ label: string; value: string; delta?: string }>;
  modules: PreviewModule[];
  navItems: string[];
};

const PROFILES: Record<string, IndustryPreviewProfile> = {
  gym: {
    id: "gym",
    label: "Gym & Fitness",
    dashboardMetrics: [
      { label: "Total Members", value: "1,248", delta: "+12%" },
      { label: "Active Memberships", value: "986", delta: "+5%" },
      { label: "Attendance Rate", value: "74%", delta: "+3%" },
      { label: "Monthly Revenue", value: "Rs 842K", delta: "+18%" },
    ],
    navItems: ["Dashboard", "Members", "Memberships", "Trainers", "Attendance", "Billing", "Reports"],
    modules: [
      {
        id: "memberships",
        label: "Membership Module",
        description: "Plans, renewals, and expiry tracking",
        metrics: [
          { label: "Active Plans", value: "6" },
          { label: "Renewals Due", value: "42" },
          { label: "Expiring (7d)", value: "18" },
        ],
      },
      {
        id: "trainers",
        label: "Trainer Module",
        description: "Trainer profiles, schedules, and assignments",
        metrics: [
          { label: "Trainers", value: "14" },
          { label: "Sessions Today", value: "38" },
        ],
      },
      {
        id: "attendance",
        label: "Attendance Module",
        description: "Check-ins, gate access, and attendance reports",
        metrics: [
          { label: "Check-ins Today", value: "312" },
          { label: "Peak Hour", value: "6–8 PM" },
        ],
      },
    ],
  },
  clinic: {
    id: "clinic",
    label: "Healthcare Clinic",
    dashboardMetrics: [
      { label: "Patients", value: "3,420", delta: "+8%" },
      { label: "Doctors", value: "18", delta: "—" },
      { label: "Appointments Today", value: "64", delta: "+6%" },
      { label: "Revenue", value: "Rs 1.2M", delta: "+11%" },
    ],
    navItems: ["Dashboard", "Patients", "Doctors", "Appointments", "Records", "Billing", "Reports"],
    modules: [
      {
        id: "patients",
        label: "Patient Management",
        description: "Profiles, history, and visit tracking",
        metrics: [
          { label: "Registered", value: "3,420" },
          { label: "New This Month", value: "186" },
        ],
      },
      {
        id: "records",
        label: "Medical Records",
        description: "Diagnoses, prescriptions, and lab results",
        metrics: [
          { label: "Records", value: "12.4K" },
          { label: "Pending Review", value: "23" },
        ],
      },
      {
        id: "billing",
        label: "Billing & Insurance",
        description: "Invoices, claims, and payment tracking",
        metrics: [
          { label: "Outstanding", value: "Rs 84K" },
          { label: "Claims Pending", value: "12" },
        ],
      },
    ],
  },
  "retail-store": {
    id: "retail-store",
    label: "Retail Store",
    dashboardMetrics: [
      { label: "Products", value: "2,840", delta: "+4%" },
      { label: "Sales Today", value: "Rs 248K", delta: "+9%" },
      { label: "Inventory Value", value: "Rs 8.4M", delta: "—" },
      { label: "Customers", value: "1,102", delta: "+7%" },
    ],
    navItems: ["Dashboard", "POS", "Products", "Inventory", "Customers", "Orders", "Reports"],
    modules: [
      {
        id: "inventory",
        label: "Inventory",
        description: "Stock levels, adjustments, and low-stock alerts",
        metrics: [
          { label: "SKUs", value: "2,840" },
          { label: "Low Stock", value: "14" },
        ],
      },
      {
        id: "pos",
        label: "Point of Sale",
        description: "Fast checkout, barcode scan, and receipts",
        metrics: [
          { label: "Transactions", value: "186" },
          { label: "Avg. Basket", value: "Rs 1,340" },
        ],
      },
      {
        id: "customers",
        label: "Customers",
        description: "CRM, loyalty, and purchase history",
        metrics: [
          { label: "Active", value: "1,102" },
          { label: "Returning", value: "68%" },
        ],
      },
    ],
  },
  restaurant: {
    id: "restaurant",
    label: "Restaurant",
    dashboardMetrics: [
      { label: "Active Orders", value: "11", delta: "Live" },
      { label: "Tables Occupied", value: "9/24", delta: "—" },
      { label: "Kitchen Delays", value: "3", delta: "-2" },
      { label: "Today Sales", value: "Rs 186K", delta: "+14%" },
    ],
    navItems: ["Dashboard", "Orders", "Tables", "Kitchen", "Menu", "Inventory", "Reports"],
    modules: [
      {
        id: "kitchen",
        label: "Kitchen Display",
        description: "Order queue, prep status, and timing",
        metrics: [
          { label: "In Prep", value: "7" },
          { label: "Ready", value: "4" },
        ],
      },
      {
        id: "tables",
        label: "Floor & Tables",
        description: "Table map, reservations, and seating",
        metrics: [
          { label: "Occupied", value: "9" },
          { label: "Available", value: "15" },
        ],
      },
    ],
  },
  pharmacy: {
    id: "pharmacy",
    label: "Pharmacy",
    dashboardMetrics: [
      { label: "Medicines", value: "4,200", delta: "—" },
      { label: "Expiring (30d)", value: "8", delta: "Alert" },
      { label: "Prescriptions", value: "6 pending", delta: "—" },
      { label: "Sales Today", value: "Rs 92K", delta: "+5%" },
    ],
    navItems: ["Dashboard", "Medicines", "Batches", "Prescriptions", "POS", "Reports"],
    modules: [
      {
        id: "batches",
        label: "Batch & Expiry",
        description: "Batch tracking and expiry management",
        metrics: [
          { label: "Batches", value: "840" },
          { label: "Expiring Soon", value: "8" },
        ],
      },
      {
        id: "prescriptions",
        label: "Prescriptions",
        description: "Intake, fill workflow, and history",
        metrics: [
          { label: "Pending", value: "6" },
          { label: "Filled Today", value: "42" },
        ],
      },
    ],
  },
  "salon-spa": {
    id: "salon-spa",
    label: "Salon & Spa",
    dashboardMetrics: [
      { label: "Appointments", value: "18 today", delta: "+2" },
      { label: "Staff Available", value: "5", delta: "—" },
      { label: "Expected Revenue", value: "Rs 96K", delta: "+8%" },
      { label: "Walk-ins", value: "4", delta: "—" },
    ],
    navItems: ["Dashboard", "Appointments", "Services", "Staff", "Packages", "Billing"],
    modules: [
      {
        id: "appointments",
        label: "Appointments",
        description: "Calendar, booking, and reminders",
        metrics: [
          { label: "Today", value: "18" },
          { label: "Pending", value: "2" },
        ],
      },
      {
        id: "services",
        label: "Services & Packages",
        description: "Service catalog, packages, and pricing",
        metrics: [
          { label: "Services", value: "32" },
          { label: "Packages", value: "8" },
        ],
      },
    ],
  },
  "snooker-pos": {
    id: "snooker-pos",
    label: "Snooker POS",
    dashboardMetrics: [
      { label: "Tables Occupied", value: "8 / 12", delta: "Live" },
      { label: "Active Sessions", value: "6", delta: "2 Century" },
      { label: "Today Sales", value: "Rs 86K", delta: "+11%" },
      { label: "Overdue Udhar", value: "Rs 18.5K", delta: "Alert" },
    ],
    navItems: [
      "Dashboard",
      "Tables",
      "POS Sessions",
      "Billing",
      "Customers",
      "Credit",
      "Reports",
    ],
    modules: [
      {
        id: "tables",
        label: "Table Management",
        description: "Snooker/pool tables, live status, reservations, and table pricing",
        metrics: [
          { label: "Occupied", value: "8" },
          { label: "Available", value: "4" },
        ],
      },
      {
        id: "pos",
        label: "POS Sessions",
        description: "Single, Double, and Century sessions through to cash or Udhar",
        metrics: [
          { label: "Live", value: "6" },
          { label: "Closed Today", value: "41" },
        ],
      },
      {
        id: "credit-udhar",
        label: "Credit / Udhar",
        description: "Limits, recoveries, partial payments, and statements",
        metrics: [
          { label: "Outstanding", value: "Rs 64K" },
          { label: "Overdue", value: "Rs 18.5K" },
        ],
      },
    ],
  },
};

export function getIndustryPreviewProfile(industryId: string): IndustryPreviewProfile {
  if (PROFILES[industryId]) return PROFILES[industryId];
  return (
    PROFILES["retail-store"] ?? {
      id: industryId,
      label: industryId,
      dashboardMetrics: [],
      modules: [],
      navItems: ["Dashboard", "Products", "Sales", "Reports", "Settings"],
    }
  );
}

/** Platform-wide industry distribution for Super Admin dashboard. */
export const PLATFORM_INDUSTRY_DISTRIBUTION = [
  { label: "Retail", value: 26, color: "#0050f8" },
  { label: "Restaurants", value: 17, color: "#ea580c" },
  { label: "Clinics", value: 13, color: "#059669" },
  { label: "Gyms", value: 11, color: "#7c3aed" },
  { label: "Snooker clubs", value: 9, color: "#16a34a" },
  { label: "Salons", value: 9, color: "#db2777" },
  { label: "Real Estate", value: 7, color: "#0891b2" },
  { label: "Others", value: 8, color: "#64748b" },
];
