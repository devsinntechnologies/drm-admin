"use client";

import Image from "next/image";
import { useId } from "react";
import { cn } from "@/lib/utils";

const LOGO = { markW: 44, markH: 36, fullW: 220, fullH: 48 } as const;

function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={LOGO.markW}
      height={LOGO.markH}
      className={cn("h-auto w-auto object-contain", className)}
      priority
    />
  );
}

function LogoFull({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-full.png"
      alt=""
      width={LOGO.fullW}
      height={LOGO.fullH}
      className={cn("h-auto w-full max-w-[220px] object-contain", className)}
      priority
    />
  );
}

function ArcRing({ size = 96, stroke = 3, gradientId }: { size?: number; stroke?: number; gradientId: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg className="dn-loader-spin absolute inset-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#001840" />
          <stop offset="55%" stopColor="#0050F8" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference * 0.22} ${circumference * 0.78}`}
      />
    </svg>
  );
}

/** 1 — Current: arc ring + black logo tile + dots */
export function LoaderVariantArcRing({ className }: { className?: string }) {
  const gradientId = useId();
  const ring = 96;
  const inner = 84;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)} role="status" aria-label="Loading">
      <div className="relative grid place-items-center" style={{ width: ring, height: ring }}>
        <ArcRing size={ring} gradientId={gradientId} />
        <div
          className="dn-loader-pulse flex items-center justify-center rounded-2xl bg-black p-3 shadow-[0_10px_28px_rgba(0,24,64,0.18)]"
          style={{ width: inner, height: inner }}
        >
          <LogoMark />
        </div>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="dn-loader-dot h-1.5 w-1.5 rounded-full bg-[#0050F8]" style={{ animationDelay: `${i * 160}ms` }} />
        ))}
      </div>
    </div>
  );
}

/** 2 — Full logo + shimmer text */
export function LoaderVariantFullLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-4 px-4", className)} role="status" aria-label="Loading">
      <LogoFull />
      <p className="dn-loader-shimmer text-sm font-semibold tracking-[0.18em] uppercase">Loading</p>
    </div>
  );
}

/** 3 — Minimal: logo only + wave dots */
export function LoaderVariantMinimal({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-5 bg-white", className)} role="status" aria-label="Loading">
      <div className="rounded-2xl border border-[#e8eef7] bg-white p-4 shadow-[0_8px_24px_rgba(0,24,64,0.08)]">
        <LogoMark className="scale-110" />
      </div>
      <div className="flex items-end gap-2" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="dn-loader-dot h-2 w-2 rounded-full bg-[#0050F8]"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/** 4 — Orbit: logo center + spinning dot */
export function LoaderVariantOrbit({ className }: { className?: string }) {
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: 112, height: 112 }} role="status" aria-label="Loading">
      <div className="dn-loader-orbit absolute inset-0">
        <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-[#0050F8] shadow-[0_0_12px_rgba(0,80,248,0.6)]" />
      </div>
      <div className="relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#dbe4ef] bg-white shadow-[0_8px_24px_rgba(0,24,64,0.08)]">
        <div className="rounded-xl bg-black p-2">
          <LogoMark className="scale-90" />
        </div>
      </div>
    </div>
  );
}

/** 5 — Progress bar under logo */
export function LoaderVariantProgressBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full max-w-[240px] flex-col items-center gap-5", className)} role="status" aria-label="Loading">
      <div className="rounded-2xl bg-black p-3 shadow-[0_8px_20px_rgba(0,24,64,0.16)]">
        <LogoMark />
      </div>
      <div className="w-full space-y-2">
        <div className="dn-loader-bar-track h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
          <div className="dn-loader-bar-fill h-full w-2/5 rounded-full bg-linear-to-r from-[#001840] via-[#0050F8] to-[#3b82f6]" />
        </div>
        <p className="text-center text-xs font-medium text-[#64748b]">Please wait…</p>
      </div>
    </div>
  );
}

/** 6 — Glass card + glow pulse */
export function LoaderVariantGlass({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-3xl border border-white/80 bg-white/70 px-8 py-8 shadow-[0_16px_40px_rgba(0,24,64,0.1)] backdrop-blur-md",
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <div className="relative grid place-items-center" style={{ width: 88, height: 88 }}>
        <ArcRing size={88} stroke={2.5} gradientId={gradientId} />
        <div className="dn-loader-glow flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-black p-2.5">
          <LogoMark className="scale-95" />
        </div>
      </div>
      <p className="text-sm font-semibold text-[#001840]">DigiNizam</p>
      <p className="-mt-2 text-xs text-[#64748b]">Loading your workspace</p>
    </div>
  );
}

export const LOADER_VARIANTS = [
  {
    id: "arc-ring",
    name: "Arc Ring",
    description: "Current style — gradient arc, black logo tile, bouncing dots.",
    Component: LoaderVariantArcRing,
  },
  {
    id: "full-logo",
    name: "Full Logo",
    description: "Wide brand lockup with shimmer “Loading” text.",
    Component: LoaderVariantFullLogo,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean logo on white with a simple dot wave — no spinner ring.",
    Component: LoaderVariantMinimal,
  },
  {
    id: "orbit",
    name: "Orbit",
    description: "Logo in a white circle with a blue dot orbiting around it.",
    Component: LoaderVariantOrbit,
  },
  {
    id: "progress-bar",
    name: "Progress Bar",
    description: "Logo on top with an animated gradient progress strip.",
    Component: LoaderVariantProgressBar,
  },
  {
    id: "glass",
    name: "Glass Card",
    description: "Frosted card with glow pulse — good for full-screen loads.",
    Component: LoaderVariantGlass,
  },
] as const;

export type LoaderVariantId = (typeof LOADER_VARIANTS)[number]["id"];
