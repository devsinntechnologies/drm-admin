"use client";

import { Bell, ChevronDown, Clock3, Cloud, RefreshCw, UserCircle2 } from "lucide-react";

type MobileHeaderPreviewProps = {
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  enabled: boolean;
  showLogout: boolean;
  showOnlineStatus: boolean;
  showDateTime: boolean;
  logoBackgroundColor: string;
};

/** Mirrors the Flutter BrandedHeaderBar (desktop layout, scaled down). */
export function MobileHeaderPreview({
  businessName,
  logoUrl,
  primaryColor,
  secondaryColor,
  enabled,
  showLogout,
  showOnlineStatus,
  showDateTime,
  logoBackgroundColor,
}: MobileHeaderPreviewProps) {
  if (!enabled) {
    return (
      <div className="overflow-hidden rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc]">
        <div className="flex min-h-[88px] items-center justify-center px-4 py-6 text-center">
          <p className="text-sm text-[#64748b]">
            Mobile app header is off — Flutter will hide the branded navbar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl bg-[#f4f6f5] p-2">
        <div
          className="flex h-12 items-center gap-2.5 rounded-[12px] px-3 text-white shadow-md"
          style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <div
            className="flex h-8 w-11 shrink-0 items-center justify-center rounded-lg p-1 shadow"
            style={{ backgroundColor: logoBackgroundColor }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="max-h-6 w-auto object-contain" />
            ) : (
              <span className="text-[8px] font-bold uppercase text-[#94a3b8]">Logo</span>
            )}
          </div>
          <p className="min-w-0 truncate text-sm font-bold">{businessName}</p>
          {showOnlineStatus ? (
            <>
              <span className="h-5 w-px shrink-0 bg-white/55" />
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2 py-1 text-[10px] backdrop-blur">
                <span className="relative inline-flex">
                  <Cloud className="h-4 w-4" />
                  <RefreshCw className="absolute left-1/2 top-[55%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 animate-spin [animation-duration:3s]" />
                </span>
                <strong>Cloud Sync</strong>
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80]" />
                Live
              </span>
            </>
          ) : null}
          <span className="flex-1" />
          {showDateTime ? (
            <>
              <span className="h-5 w-px shrink-0 bg-white/55" />
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <Clock3 className="h-4 w-4" />
                <span className="leading-tight">
                  <strong className="block text-[11px]">10:45 AM</strong>
                  <span className="block text-[9px] text-white/90">Nov 06, 2026</span>
                </span>
              </span>
            </>
          ) : null}
          <span className="h-5 w-px shrink-0 bg-white/55" />
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/30 bg-white/10">
            <Bell className="h-3.5 w-3.5" />
          </span>
          <span className="inline-flex shrink-0 items-center">
            <UserCircle2 className="h-6 w-6" />
            <ChevronDown className="h-3 w-3" />
          </span>
        </div>
      </div>
      <p className="px-1 text-xs text-[#64748b]">
        Profile menu shows the staff name, role, app version
        {showLogout ? " and Logout" : " (Logout hidden)"}. Time and date are hidden on phones.
      </p>
    </div>
  );
}
