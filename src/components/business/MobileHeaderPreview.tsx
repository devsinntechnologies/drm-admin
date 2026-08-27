"use client";

import { Wifi } from "lucide-react";

type MobileHeaderPreviewProps = {
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  showLogout: boolean;
  showOnlineStatus: boolean;
  logoBackgroundColor: string;
};

export function MobileHeaderPreview({
  businessName,
  logoUrl,
  primaryColor,
  secondaryColor,
  showLogout,
  showOnlineStatus,
  logoBackgroundColor,
}: MobileHeaderPreviewProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e2e8f0] shadow-sm">
      <div
        className="px-4 py-3"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-fit items-center justify-center rounded-lg border border-white/80 px-2 shadow-md"
            style={{ backgroundColor: logoBackgroundColor }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="max-h-7 w-auto object-contain" />
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8]">
                Your logo
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{businessName}</p>
            <p className="truncate text-[11px] text-white/80">Mobile app header preview</p>
          </div>
          {showLogout ? (
            <div className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-semibold text-white">
              Logout
            </div>
          ) : null}
        </div>
        {showOnlineStatus ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
              <Wifi className="h-3 w-3" /> ONLINE
            </span>
            <span className="text-[10px] text-white/75">STAFF.WAITER</span>
          </div>
        ) : null}
      </div>
      <p className="bg-[#f8fafc] px-3 py-2 text-xs text-[#64748b]">
        This is how your logo and header controls appear on the Flutter app navbar.
      </p>
    </div>
  );
}
