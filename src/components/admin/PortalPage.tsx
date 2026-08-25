"use client";

import { cn } from "@/lib/utils";
import Loading from "@/components/common/Loading";
import { RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── Shared DigiNizam portal layout primitives ── */

export function PortalPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("portal-page mx-auto w-full max-w-[1440px] space-y-6", className)}>{children}</div>;
}

export function PortalPageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  className,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("portal-header", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="portal-icon-box">
            <Icon className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] md:text-2xl">{title}</h1>
            {subtitle ? <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function PortalStatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: "primary" | "secondary" | "accent" | "neutral";
  className?: string;
}) {
  const tones = {
    primary: "bg-[var(--brand-primary,#001840)]",
    secondary: "bg-[var(--brand-secondary,#0050F8)]",
    accent: "bg-[#0f766e]",
    neutral: "bg-[#334155]",
  };

  return (
    <article className={cn("portal-stat-card", className)}>
      <div className="flex items-center gap-4">
        {Icon ? (
          <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-white/10 text-white", tones[tone])}>
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
        ) : null}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        </div>
      </div>
    </article>
  );
}

export function PortalMetricRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="portal-metric-row">
      <div className="portal-icon-box !h-12 !w-12">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  );
}

export function PortalCard({
  children,
  title,
  subtitle,
  icon: Icon,
  headerClassName,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  headerClassName?: string;
  className?: string;
}) {
  return (
    <section className={cn("portal-card", className)}>
      {title ? (
        <div className={cn("portal-card-header", headerClassName)}>
          {Icon ? (
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
          ) : null}
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
            {subtitle ? <p className="text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
          </div>
        </div>
      ) : null}
      <div className="portal-card-body">{children}</div>
    </section>
  );
}

export function PortalErrorAlert({ title = "Something went wrong", message }: { title?: string; message: string }) {
  return (
    <div className="portal-error">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm opacity-90">{message}</p>
    </div>
  );
}

export function PortalEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="portal-empty">
      <div className="portal-icon-box !h-16 !w-16 !rounded-2xl">
        <Icon className="h-8 w-8" strokeWidth={1.6} />
      </div>
      <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PortalLoading({ className }: { className?: string }) {
  return <Loading className={className} size="md" />;
}

export function PortalRefreshFab({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="portal-refresh-fab"
      aria-label="Refresh"
    >
      <RotateCcw className={cn("h-6 w-6", loading && "animate-spin")} />
    </button>
  );
}

export const portalInputClass =
  "w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/20";

export const portalSearchClass =
  "h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] pl-10 pr-4 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/20";

export const portalPanelClass =
  "rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-sm";

export const portalPanelMutedClass =
  "rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-6";

export const portalBtnPrimaryClass =
  "dn-btn dn-btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold disabled:opacity-60";

export const portalBtnSecondaryClass =
  "dn-btn dn-btn-secondary rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-60";

export const portalBtnOutlineClass =
  "rounded-2xl border-2 border-[var(--border-subtle)] bg-[var(--surface)] py-3 text-sm font-bold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]";

export const portalLinkClass = "text-sm font-semibold text-[var(--brand-secondary)] hover:underline";

export const portalTableWrapClass =
  "overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]";

export const portalTableHeadClass =
  "bg-[var(--surface-muted)] text-left text-xs uppercase text-[var(--text-muted)]";

export const portalListRowClass =
  "rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3 transition hover:border-[var(--brand-secondary)]/40";

export const portalCartRowClass =
  "flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3";

/** Visible label wrapper for portal inputs, selects, and textareas. */
export function FormField({
  label,
  children,
  className,
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="block text-sm font-semibold text-[var(--text-muted,#64748b)]">
        {label}
        {required ? <span className="ml-0.5 text-[#dc2626]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
