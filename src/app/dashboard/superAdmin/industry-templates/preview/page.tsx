"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
} from "lucide-react";
import Loading from "@/components/common/Loading";
import { IndustryIcon } from "@/components/templates/IndustryIcon";
import { getMockDashboardCards, getMockProducts } from "@/template-engine/mock-data";
import { resolveVisibleNav } from "@/template-engine/builder";
import { getTemplateConfigById } from "@/template-engine/storage";
import { getIndustryById } from "@/templates/industries";
import { colorsFromAccent } from "@/templates/modules";
import type { CustomizedTemplateConfig } from "@/templates/types";
import { cn } from "@/lib/utils";

function TemplatePreviewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [config, setConfig] = useState<CustomizedTemplateConfig | null>(null);
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    if (!id) return;
    setConfig(getTemplateConfigById(id) ?? null);
  }, [id]);

  const industry = useMemo(
    () => (config ? getIndustryById(config.industryId) : null),
    [config],
  );

  if (!id) {
    return (
      <EmptyShell message="Missing template id. Go back and generate a configuration first." />
    );
  }

  if (!config || !industry) {
    return (
      <EmptyShell message="Template not found in local storage. It may have been removed." />
    );
  }

  const fallback = colorsFromAccent(industry.theme.accent);
  const primary = config.primaryColor || fallback.primary;
  const secondary = config.secondaryColor || fallback.secondary;
  const soft = fallback.soft;
  const nav = resolveVisibleNav(config);
  const cards = getMockDashboardCards(config);
  const products = getMockProducts(config);
  const dark = config.themeMode === "dark";

  return (
    <div className={cn("min-h-screen", dark ? "bg-[#0b1220] text-white" : "bg-[#f5f5f5] text-[#0f172a]")}>
      <header
        className="sticky top-0 z-20 border-b px-4 py-3 backdrop-blur-md sm:px-6"
        style={{
          borderColor: dark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
          background: dark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.92)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard/superAdmin/industry-templates"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-xl border",
                dark ? "border-white/10 bg-white/5" : "border-[#e2e8f0] bg-white",
              )}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{ backgroundColor: soft, color: secondary }}
            >
              <IndustryIcon name={industry.theme.icon} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{config.businessName}</p>
              <p className={cn("truncate text-xs", dark ? "text-white/60" : "text-[#64748b]")}>
                {config.industryName} mock preview · {config.currency}
              </p>
            </div>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            Mock data
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-[260px_1fr]">
        <aside
          className={cn(
            "border-b p-4 lg:min-h-[calc(100vh-73px)] lg:border-b-0 lg:border-r",
            dark ? "border-white/10 bg-[#111827]" : "border-[#e2e8f0] bg-white",
          )}
        >
          <p className={cn("mb-3 px-2 text-xs font-semibold uppercase tracking-[0.14em]", dark ? "text-white/40" : "text-[#94a3b8]")}>
            Navigation
          </p>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {nav.map((item) => {
              const active = activeNav === item.moduleId;
              return (
                <button
                  key={item.moduleId}
                  type="button"
                  onClick={() => setActiveNav(item.moduleId)}
                  className={cn(
                    "whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                    active ? "text-white shadow-md" : dark ? "text-white/70 hover:bg-white/5" : "text-[#334155] hover:bg-[#f8fafc]",
                  )}
                  style={active ? { backgroundColor: primary } : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="p-4 sm:p-6">
          {activeNav === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className={cn("mt-1 text-sm", dark ? "text-white/60" : "text-[#64748b]")}>
                  Cards and terminology driven by the {config.industryName} template.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                  <article
                    key={card.id}
                    className={cn(
                      "rounded-3xl border p-5",
                      dark ? "border-white/10 bg-[#111827]" : "border-[#e2e8f0] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className={cn("text-sm font-medium", dark ? "text-white/60" : "text-[#64748b]")}>
                        {card.label}
                      </p>
                      <LayoutDashboard className="h-4 w-4" style={{ color: secondary }} />
                    </div>
                    <p className="text-2xl font-semibold" style={{ color: secondary }}>
                      {card.value}
                    </p>
                    <p className={cn("mt-2 text-xs", dark ? "text-white/40" : "text-[#94a3b8]")}>
                      {card.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {(activeNav === "products" || activeNav === "menu") && (
            <ProductTable
              title={config.labels.products}
              products={products}
              dark={dark}
              accent={secondary}
            />
          )}

          {activeNav === "pos" && (
            <PosPreview
              products={products}
              dark={dark}
              accent={secondary}
              primary={primary}
              productLabel={config.labels.product}
            />
          )}

          {activeNav !== "dashboard" &&
            activeNav !== "products" &&
            activeNav !== "menu" &&
            activeNav !== "pos" && (
              <SpecialScreenPlaceholder
                moduleId={activeNav}
                label={nav.find((n) => n.moduleId === activeNav)?.label ?? activeNav}
                specialScreens={industry.specialScreens}
                dark={dark}
                accent={secondary}
              />
            )}
        </main>
      </div>
    </div>
  );
}

function ProductTable({
  title,
  products,
  dark,
  accent,
}: {
  title: string;
  products: ReturnType<typeof getMockProducts>;
  dark: boolean;
  accent: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Package style={{ color: accent }} />
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className={cn("text-sm", dark ? "text-white/60" : "text-[#64748b]")}>
            Metadata-driven list using mock industry data
          </p>
        </div>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-3xl border",
          dark ? "border-white/10 bg-[#111827]" : "border-[#e2e8f0] bg-white",
        )}
      >
        <table className="w-full text-left text-sm">
          <thead className={cn(dark ? "bg-white/5 text-white/50" : "bg-[#f8fafc] text-[#64748b]")}>
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => (
              <tr key={item.id} className={cn("border-t", dark ? "border-white/10" : "border-[#edf2f7]")}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 opacity-70">{item.sku}</td>
                <td className="px-4 py-3">{item.stock}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: accent }}>
                  {item.price}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      item.status === "Low stock"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800",
                    )}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PosPreview({
  products,
  dark,
  accent,
  primary,
  productLabel,
}: {
  products: ReturnType<typeof getMockProducts>;
  dark: boolean;
  accent: string;
  primary: string;
  productLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ShoppingCart style={{ color: accent }} />
        <div>
          <h1 className="text-2xl font-semibold">POS / Billing</h1>
          <p className={cn("text-sm", dark ? "text-white/60" : "text-[#64748b]")}>
            Shared POS shell — grid labels use industry terminology
          </p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "rounded-3xl border p-4 text-left transition hover:-translate-y-0.5",
                dark ? "border-white/10 bg-[#111827]" : "border-[#e2e8f0] bg-white",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-50">
                {productLabel}
              </p>
              <p className="mt-2 font-semibold">{item.name}</p>
              <p className="mt-3 text-lg font-semibold" style={{ color: accent }}>
                {item.price}
              </p>
            </button>
          ))}
        </div>
        <aside
          className={cn(
            "rounded-3xl border p-5",
            dark ? "border-white/10 bg-[#111827]" : "border-[#e2e8f0] bg-white",
          )}
        >
          <p className="font-semibold">Current ticket</p>
          <p className={cn("mt-1 text-sm", dark ? "text-white/50" : "text-[#64748b]")}>
            Mock cart — connect real POS later
          </p>
          <div className="mt-4 space-y-2">
            {products.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <span className="font-semibold">{item.price}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            Charge
          </button>
        </aside>
      </div>
    </div>
  );
}

function SpecialScreenPlaceholder({
  moduleId,
  label,
  specialScreens,
  dark,
  accent,
}: {
  moduleId: string;
  label: string;
  specialScreens: string[];
  dark: boolean;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-8",
        dark ? "border-white/10 bg-[#111827]" : "border-[#e2e8f0] bg-white",
      )}
    >
      <div className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: accent }}>
        <Settings className="h-3.5 w-3.5" />
        Specialized module · {moduleId}
      </div>
      <h1 className="text-2xl font-semibold">{label}</h1>
      <p className={cn("mt-2 max-w-2xl text-sm", dark ? "text-white/60" : "text-[#64748b]")}>
        This screen is selected by the industry template and will use a shared reusable component
        (kitchen board, calendar, batch table, etc.) rather than a duplicated app.
      </p>
      <div className="mt-6">
        <p className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.12em]", dark ? "text-white/40" : "text-[#94a3b8]")}>
          Related special UI for this industry
        </p>
        <div className="flex flex-wrap gap-2">
          {specialScreens.map((screen) => (
            <span
              key={screen}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-sm",
                dark ? "border-white/10 bg-white/5" : "border-[#e2e8f0] bg-[#f8fafc]",
              )}
            >
              {screen}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyShell({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f5f5] px-4">
      <p className="max-w-md text-center text-sm text-[#64748b]">{message}</p>
      <Link
        href="/dashboard/superAdmin/industry-templates"
        className="rounded-xl bg-[#001840] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Back to Industry Templates
      </Link>
    </div>
  );
}

export default function TemplatePreviewPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <TemplatePreviewContent />
    </Suspense>
  );
}
