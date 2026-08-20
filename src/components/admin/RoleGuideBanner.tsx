"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { appendBusinessId } from "@/lib/module-routes";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

type Step = { label: string; href?: string };

const PHARMACY_STEPS: Record<string, Step[]> = {
  business_admin: [
    { label: "1. Categories", href: "/dashboard/businessAdmin/categories" },
    { label: "2. Medicines", href: "/dashboard/businessAdmin/products" },
    { label: "3. Stock / batches", href: "/dashboard/businessAdmin/batches" },
    { label: "4. Patients", href: "/dashboard/businessAdmin/customers" },
    { label: "5. Open POS", href: "/dashboard/businessAdmin/pos" },
  ],
  pharmacy_manager: [
    { label: "1. Medicines", href: "/dashboard/businessAdmin/products" },
    { label: "2. Purchases", href: "/dashboard/businessAdmin/purchases" },
    { label: "3. Prescriptions", href: "/dashboard/businessAdmin/prescriptions" },
    { label: "4. POS", href: "/dashboard/businessAdmin/pos" },
  ],
  pharmacist: [
    { label: "1. Prescriptions", href: "/dashboard/businessAdmin/prescriptions" },
    { label: "2. Clinical checks", href: "/dashboard/businessAdmin/cdss" },
    { label: "3. Dispense on POS", href: "/dashboard/businessAdmin/pos" },
  ],
  cashier: [
    { label: "1. Open shift on POS", href: "/dashboard/businessAdmin/pos" },
    { label: "2. Sell OTC / linked Rx", href: "/dashboard/businessAdmin/pos" },
    { label: "3. Close shift", href: "/dashboard/businessAdmin/shifts" },
  ],
  inventory_manager: [
    { label: "1. Inventory", href: "/dashboard/businessAdmin/inventory" },
    { label: "2. Receive GRN", href: "/dashboard/businessAdmin/purchases" },
    { label: "3. Expiry check", href: "/dashboard/businessAdmin/expiry" },
  ],
  shift_incharge: [
    { label: "1. Open / close shifts", href: "/dashboard/businessAdmin/shifts" },
    { label: "2. Monitor POS", href: "/dashboard/businessAdmin/pos" },
  ],
};

const RESTAURANT_STEPS: Step[] = [
  { label: "1. Categories", href: "/dashboard/businessAdmin/categories" },
  { label: "2. Menu items", href: "/dashboard/businessAdmin/products" },
  { label: "3. Tables", href: "/dashboard/businessAdmin/tables" },
  { label: "4. Take orders", href: "/dashboard/businessAdmin/orders" },
  { label: "5. Kitchen", href: "/dashboard/businessAdmin/kitchen" },
];

/** Compact “what to do next” strip so each role sees a clear path. */
export function RoleGuideBanner() {
  const { role } = useAuth();
  const { templateConfig } = useBusinessTemplate();
  const businessId = useActiveBusinessId();
  const key = (role || "").trim();
  const industryId = templateConfig?.industryId;

  const steps =
    industryId === "pharmacy"
      ? PHARMACY_STEPS[key] || PHARMACY_STEPS.business_admin
      : industryId === "restaurant" || industryId === "food-cafe"
        ? RESTAURANT_STEPS
        : null;

  if (!steps?.length) return null;

  return (
    <div className="mb-5 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
        Suggested steps
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {steps.map((step) => {
          const href = step.href ? appendBusinessId(step.href, businessId) : undefined;
          if (!href) {
            return (
              <span
                key={step.label}
                className="rounded-lg border border-[#e2e8f0] bg-white px-2.5 py-1 text-xs font-medium text-[#475569]"
              >
                {step.label}
              </span>
            );
          }
          return (
            <Link
              key={step.label}
              href={href}
              className="rounded-lg border border-[#dbeafe] bg-white px-2.5 py-1 text-xs font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#eff6ff]"
            >
              {step.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
