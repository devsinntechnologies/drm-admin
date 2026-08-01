"use client";

import { Suspense, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Inbox,
  LayoutDashboard,
  LockKeyhole,
  RefreshCcw,
  ReceiptText,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";

type Business = {
  id: string;
  name: string;
  plan: "Basic" | "Premium" | "Enterprise";
  location: string;
};

type Feature = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: ReactNode;
};

type MockMode = "normal" | "loading" | "empty-businesses" | "empty-features" | "error";

type NotificationState = {
  type: "success" | "error";
  message: string;
} | null;

const businesses: Business[] = [
  { id: "golden-spoon", name: "The Golden Spoon", plan: "Enterprise", location: "New York" },
  { id: "pasta-palace", name: "Pasta Palace", plan: "Premium", location: "Chicago" },
  { id: "burger-haven", name: "Burger Haven", plan: "Basic", location: "Austin" },
  { id: "sushi-world", name: "Sushi World", plan: "Premium", location: "Seattle" },
  { id: "taco-fiesta", name: "Taco Fiesta", plan: "Basic", location: "Phoenix" },
];

const features: Feature[] = [
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "View operational metrics, revenue trends, and performance summaries across the business.",
    category: "Insights",
    icon: <LayoutDashboard className="h-5 w-5" strokeWidth={1.8} />,
  },
  {
    id: "order-management",
    name: "Order Management",
    description: "Create, track, and update dine-in, takeaway, and delivery orders from one workspace.",
    category: "Operations",
    icon: <ReceiptText className="h-5 w-5" strokeWidth={1.8} />,
  },
  {
    id: "kitchen-display",
    name: "Kitchen Display",
    description: "Give kitchen staff a real-time queue for preparing and completing customer orders.",
    category: "Operations",
    icon: <UtensilsCrossed className="h-5 w-5" strokeWidth={1.8} />,
  },
  {
    id: "table-management",
    name: "Table Management",
    description: "Manage restaurant floors, table availability, seating, and table-linked orders.",
    category: "Restaurant",
    icon: <Store className="h-5 w-5" strokeWidth={1.8} />,
  },
  {
    id: "staff-users",
    name: "Staff Users",
    description: "Invite managers, waiters, and kitchen users with role-based access permissions.",
    category: "Access",
    icon: <Users className="h-5 w-5" strokeWidth={1.8} />,
  },
  {
    id: "business-profile",
    name: "Business Profile",
    description: "Allow business administrators to update company details, contact information, and branding.",
    category: "Settings",
    icon: <Building2 className="h-5 w-5" strokeWidth={1.8} />,
  },
  {
    id: "subscription-controls",
    name: "Subscription Controls",
    description: "Manage plan visibility, billing status, and subscription feature entitlement checks.",
    category: "Billing",
    icon: <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />,
  },
  {
    id: "advanced-permissions",
    name: "Advanced Permissions",
    description: "Control sensitive workflows such as refunds, discounts, exports, and admin-only reports.",
    category: "Access",
    icon: <LockKeyhole className="h-5 w-5" strokeWidth={1.8} />,
  },
];

const initialAccessByBusiness: Record<string, Record<string, boolean>> = {
  "golden-spoon": {
    "analytics-dashboard": true,
    "order-management": true,
    "kitchen-display": true,
    "table-management": true,
    "staff-users": true,
    "business-profile": true,
    "subscription-controls": true,
    "advanced-permissions": true,
  },
  "pasta-palace": {
    "analytics-dashboard": true,
    "order-management": true,
    "kitchen-display": true,
    "table-management": true,
    "staff-users": true,
    "business-profile": true,
    "subscription-controls": false,
    "advanced-permissions": false,
  },
  "burger-haven": {
    "analytics-dashboard": false,
    "order-management": true,
    "kitchen-display": true,
    "table-management": false,
    "staff-users": true,
    "business-profile": true,
    "subscription-controls": false,
    "advanced-permissions": false,
  },
  "sushi-world": {
    "analytics-dashboard": true,
    "order-management": true,
    "kitchen-display": true,
    "table-management": true,
    "staff-users": false,
    "business-profile": true,
    "subscription-controls": false,
    "advanced-permissions": true,
  },
  "taco-fiesta": {
    "analytics-dashboard": false,
    "order-management": true,
    "kitchen-display": false,
    "table-management": false,
    "staff-users": true,
    "business-profile": true,
    "subscription-controls": false,
    "advanced-permissions": false,
  },
};

const emptyBusinesses: Business[] = [];
const emptyFeatures: Feature[] = [];

function BusinessSelector({
  businesses,
  selectedBusinessId,
  disabled,
  onChange,
}: {
  businesses: Business[];
  selectedBusinessId: string;
  disabled?: boolean;
  onChange: (businessId: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#334155]">
      Business
      <div className="relative">
        <select
          value={selectedBusinessId}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || businesses.length === 0}
          className="h-12 w-full appearance-none rounded-2xl border border-[#d8e3ef] bg-white px-4 pr-11 text-sm font-medium text-[#0f172a] outline-none shadow-[0_8px_18px_rgba(15,23,42,0.06)] focus:border-[#001840] focus:ring-4 focus:ring-[#001840]/10 disabled:bg-[#f1f5f9] disabled:text-[#94a3b8]"
        >
          {businesses.length > 0 ? (
            businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))
          ) : (
            <option value="">No businesses available</option>
          )}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
      </div>
    </label>
  );
}

function FeatureToggle({
  enabled,
  label,
  onToggle,
}: {
  enabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
      onClick={onToggle}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001840] focus-visible:ring-offset-2",
        enabled ? "bg-[#059669]" : "bg-[#cbd5e1]",
      )}
    >
      <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition", enabled ? "left-6" : "left-1")} />
    </button>
  );
}

function NotificationPlaceholder({ notification }: { notification: NotificationState }) {
  if (!notification) {
    return null;
  }

  const isSuccess = notification.type === "success";

  return (
    <div
      aria-live="polite"
      className={cn(
        "mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_10px_22px_rgba(10,17,31,0.07)]",
        isSuccess
          ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#047857]"
          : "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
      )}
    >
      {isSuccess ? <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.8} /> : <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={1.8} />}
      <span>{notification.message}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-white text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8699]">
            <tr className="border-b border-[#edf2f7]">
              <th className="px-5 py-4">Feature</th>
              <th className="px-5 py-4">Description</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4 text-right">Access</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, index) => (
              <tr key={index} className="border-b border-[#edf2f7] last:border-0">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 animate-pulse rounded-2xl bg-[#edf2f7]" />
                    <span className="h-4 w-42 animate-pulse rounded bg-[#edf2f7]" />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-2">
                    <div className="h-3 w-full max-w-lg animate-pulse rounded bg-[#edf2f7]" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-[#edf2f7]" />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="block h-7 w-24 animate-pulse rounded-full bg-[#edf2f7]" />
                </td>
                <td className="px-5 py-4">
                  <div className="ml-auto h-7 w-28 animate-pulse rounded-full bg-[#edf2f7]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 lg:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index} className="rounded-2xl border border-[#e4ebf4] bg-[#f8fbff] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-1 items-start gap-3">
                <span className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-[#edf2f7]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-[#edf2f7]" />
                  <div className="h-3 w-full animate-pulse rounded bg-[#edf2f7]" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-[#edf2f7]" />
                </div>
              </div>
              <span className="h-7 w-12 shrink-0 animate-pulse rounded-full bg-[#edf2f7]" />
            </div>
            <div className="mt-4 flex gap-2">
              <span className="h-7 w-20 animate-pulse rounded-full bg-[#edf2f7]" />
              <span className="h-7 w-24 animate-pulse rounded-full bg-[#edf2f7]" />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="grid min-h-80 place-items-center px-5 py-12 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#EEF3FF] text-[#001840]">
          {icon}
        </div>
        <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#657084]">{description}</p>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#001840] px-4 text-sm font-semibold text-[#ffffff] shadow-[0_10px_20px_rgba(0,24,64,0.18)]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-80 place-items-center px-5 py-12 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fef2f2] text-[#dc2626]">
          <AlertCircle className="h-7 w-7" strokeWidth={1.8} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">Unable to load feature access</h3>
        <p className="mt-2 text-sm leading-6 text-[#657084]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#001840] px-4 text-sm font-semibold text-[#ffffff] shadow-[0_10px_20px_rgba(0,24,64,0.18)]"
        >
          <RefreshCcw className="h-4 w-4" strokeWidth={1.8} />
          Retry
        </button>
      </div>
    </div>
  );
}

function MockStateControls({
  mode,
  onModeChange,
}: {
  mode: MockMode;
  onModeChange: (mode: MockMode) => void;
}) {
  const controls: Array<{ mode: MockMode; label: string }> = [
    { mode: "normal", label: "Normal" },
    { mode: "loading", label: "Loading" },
    { mode: "empty-businesses", label: "Empty Businesses" },
    { mode: "empty-features", label: "Empty Features" },
    { mode: "error", label: "Error" },
  ];

  return (
    <section className="mb-5 rounded-3xl border border-[#e3ebf5] bg-white/90 p-4 shadow-[0_10px_24px_rgba(10,17,31,0.08)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8699]">Development Mock State</p>
          <p className="mt-1 text-sm text-[#657084]">Temporary controls for verifying frontend states before API integration.</p>
        </div>
        <div className="dn-tab-bar !w-auto">
          {controls.map((control) => (
            <button
              key={control.mode}
              type="button"
              onClick={() => onModeChange(control.mode)}
              data-active={mode === control.mode ? "true" : "false"}
              className="dn-tab !h-9 !text-xs"
            >
              {control.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureManagementContent() {
  const [selectedBusinessId, setSelectedBusinessId] = useState(businesses[0].id);
  const [accessByBusiness, setAccessByBusiness] = useState(initialAccessByBusiness);
  const [mockMode, setMockMode] = useState<MockMode>("normal");
  const [notification, setNotification] = useState<NotificationState>(null);
  const showMockControls = process.env.NODE_ENV !== "production";

  const visibleBusinesses = mockMode === "empty-businesses" ? emptyBusinesses : businesses;
  const visibleFeatures = mockMode === "empty-features" ? emptyFeatures : features;
  const selectedBusiness = visibleBusinesses.find((business) => business.id === selectedBusinessId) ?? visibleBusinesses[0];
  const selectedAccess = useMemo(
    () => (selectedBusiness ? accessByBusiness[selectedBusiness.id] ?? {} : {}),
    [accessByBusiness, selectedBusiness],
  );
  const enabledCount = useMemo(
    () => visibleFeatures.filter((feature) => selectedAccess[feature.id]).length,
    [selectedAccess, visibleFeatures],
  );
  const disabledCount = visibleFeatures.length - enabledCount;

  const toggleFeature = (featureId: string) => {
    if (!selectedBusiness) {
      return;
    }

    setAccessByBusiness((current) => ({
      ...current,
      [selectedBusiness.id]: {
        ...current[selectedBusiness.id],
        [featureId]: !current[selectedBusiness.id]?.[featureId],
      },
    }));
    setNotification({ type: "success", message: "Feature updated successfully" });
  };

  const handleMockModeChange = (mode: MockMode) => {
    setMockMode(mode);
    setNotification(mode === "error" ? { type: "error", message: "Failed to update feature" } : null);
    if (mode === "normal" || mode === "loading" || mode === "empty-features") {
      setSelectedBusinessId((current) => businesses.some((business) => business.id === current) ? current : businesses[0].id);
    }
  };

  const handleRetry = () => {
    setMockMode("normal");
    setNotification(null);
  };

  const renderFeatureContent = () => {
    if (mockMode === "loading") {
      return <LoadingState />;
    }

    if (mockMode === "error") {
      return <ErrorState message="Something went wrong while preparing this business feature configuration." onRetry={handleRetry} />;
    }

    if (visibleBusinesses.length === 0) {
      return (
        <EmptyState
          icon={<Building2 className="h-7 w-7" strokeWidth={1.8} />}
          title="No businesses available"
          description="Once businesses are created, Super Admins will be able to select one and manage its feature access here."
          actionLabel="Show mock businesses"
          onAction={() => handleMockModeChange("normal")}
        />
      );
    }

    if (visibleFeatures.length === 0) {
      return (
        <EmptyState
          icon={<Inbox className="h-7 w-7" strokeWidth={1.8} />}
          title="No features assigned"
          description="This business does not have any available features to configure yet."
          actionLabel="Show mock features"
          onAction={() => handleMockModeChange("normal")}
        />
      );
    }

    return (
      <>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-white text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8699]">
              <tr className="border-b border-[#edf2f7]">
                <th className="px-5 py-4">Feature</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4 text-right">Access</th>
              </tr>
            </thead>
            <tbody>
              {visibleFeatures.map((feature) => {
                const enabled = Boolean(selectedAccess[feature.id]);

                return (
                  <tr key={feature.id} className="border-b border-[#edf2f7] last:border-0 hover:bg-[#f8fbff]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={cn("grid h-10 w-10 place-items-center rounded-2xl", enabled ? "bg-[#e6f7ef] text-[#059669]" : "bg-[#eef2f7] text-[#64748b]")}>
                          {feature.icon}
                        </span>
                        <span className="font-semibold text-[#0f172a]">{feature.name}</span>
                      </div>
                    </td>
                    <td className="max-w-xl px-5 py-4 text-[#657084]">{feature.description}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold text-[#40516a]">{feature.category}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <span className={cn("text-sm font-semibold", enabled ? "text-[#059669]" : "text-[#64748b]")}>
                          {enabled ? "Enabled" : "Disabled"}
                        </span>
                        <FeatureToggle enabled={enabled} label={feature.name} onToggle={() => toggleFeature(feature.id)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 lg:hidden">
          {visibleFeatures.map((feature) => {
            const enabled = Boolean(selectedAccess[feature.id]);

            return (
              <article key={feature.id} className="rounded-2xl border border-[#e4ebf4] bg-[#f8fbff] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", enabled ? "bg-[#e6f7ef] text-[#059669]" : "bg-[#eef2f7] text-[#64748b]")}>
                      {feature.icon}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-[#0f172a]">{feature.name}</h4>
                      <p className="mt-1 text-sm leading-6 text-[#657084]">{feature.description}</p>
                    </div>
                  </div>
                  <FeatureToggle enabled={enabled} label={feature.name} onToggle={() => toggleFeature(feature.id)} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#40516a]">{feature.category}</span>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", enabled ? "bg-[#dcfce7] text-[#047857]" : "bg-[#e5e7eb] text-[#64748b]")}>
                    {enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <AdminShell activeTab="features">
      <section className="mb-5 grid w-full grid-cols-1 gap-4 rounded-3xl border border-white bg-[linear-gradient(120deg,rgba(255,255,255,0.92),rgba(240,249,255,0.78))] p-5 shadow-[0_12px_28px_rgba(7,16,34,0.1)] xl:grid-cols-[1fr_360px]">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#001840] text-[#ffffff] shadow-[0_10px_18px_rgba(0,24,64,0.25)]">
            <SlidersHorizontal className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#001840]">Super Admin</p>
            <h2 className="mt-1 text-xl font-semibold text-[#0f172a] lg:text-2xl">Feature Management Dashboard</h2>
            <p className="mt-2 max-w-3xl text-sm text-[#657084] lg:text-base">
              Select a business and manage which system features are available to its administrators and staff.
            </p>
          </div>
        </div>

        <BusinessSelector
          businesses={visibleBusinesses}
          selectedBusinessId={selectedBusiness?.id ?? ""}
          disabled={mockMode === "loading" || mockMode === "error"}
          onChange={setSelectedBusinessId}
        />
      </section>

      {showMockControls ? <MockStateControls mode={mockMode} onModeChange={handleMockModeChange} /> : null}
      <NotificationPlaceholder notification={notification} />

      <section className="mb-5 grid w-full grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { label: "Selected Business", value: selectedBusiness?.name ?? "No business", sub: selectedBusiness ? `${selectedBusiness.plan} plan` : "Select a business", tone: "bg-[#001840]" },
          { label: "Enabled Features", value: String(enabledCount), sub: `${visibleFeatures.length} total features`, tone: "bg-[#059669]" },
          { label: "Disabled Features", value: String(disabledCount), sub: "Can be enabled anytime", tone: "bg-[#b45309]" },
        ].map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-[#e3ebf5] bg-white/90 p-4 shadow-[0_10px_24px_rgba(10,17,31,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8699]">{stat.label}</p>
                <strong className="mt-2 block truncate text-xl font-semibold text-[#0f172a] lg:text-2xl">{stat.value}</strong>
                <span className="mt-1 block text-sm text-[#657084]">{stat.sub}</span>
              </div>
              <span className={cn("h-10 w-1.5 shrink-0 rounded-full", stat.tone)} />
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#e3ebf5] bg-white/90 shadow-[0_12px_26px_rgba(10,17,31,0.08)]">
        <div className="flex flex-col gap-2 border-b border-[#edf2f7] bg-[#f8fbff] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#0f172a]">Available System Features</h3>
            <p className="text-sm text-[#657084]">
              {selectedBusiness ? `${selectedBusiness.location} business access configuration` : "Business access configuration"}
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-[#d9e4ef] bg-white px-3 py-1 text-xs font-semibold text-[#334155]">
            Frontend preview only
          </span>
        </div>

        {renderFeatureContent()}
      </section>
    </AdminShell>
  );
}

export default function FeatureManagementPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Feature Management...</div>}>
      <FeatureManagementContent />
    </Suspense>
  );
}
