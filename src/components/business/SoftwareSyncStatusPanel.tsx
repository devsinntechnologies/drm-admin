"use client";

import { Loader2, Radio, Smartphone, Wifi, WifiOff } from "lucide-react";
import { useGetMobileSyncDevicesQuery, useGetMobileSyncLiveStatusQuery } from "@/hooks/useMobileSync";
import { cn, formatLastActivity } from "@/lib/utils";

type SoftwareSyncStatusPanelProps = {
  businessId: string;
};

export function SoftwareSyncStatusPanel({ businessId }: SoftwareSyncStatusPanelProps) {
  const { data: devices = [], isLoading, isError, refetch, isFetching } = useGetMobileSyncDevicesQuery(
    businessId,
    { pollingInterval: 30_000, skip: !businessId },
  );
  // Two separate signals, shown separately -- see the admin control audit.
  // "Live" (this query) is the realtime order-socket connection; "Synced"
  // (the per-device rows below) is the heartbeat-based data sync status.
  // They answer different questions and won't always agree, on purpose.
  const { data: liveStatus, isFetching: isLiveFetching } = useGetMobileSyncLiveStatusQuery(businessId, {
    pollingInterval: 15_000,
    skip: !businessId,
  });

  const syncedCount = devices.filter((d) => d.isEffectivelyOnline).length;
  const pendingTotal = devices.reduce((sum, d) => sum + (d.pendingQueueCount ?? 0), 0);
  const failedTotal = devices.reduce((sum, d) => sum + (d.failedQueueCount ?? 0), 0);
  const isLive = liveStatus?.isLive ?? false;

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Wifi className="h-4 w-4 text-[var(--brand-secondary)]" />
            <h2 className="text-base font-semibold text-[#0f172a]">Live device sync</h2>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                isLive ? "bg-[#ecfdf5] text-[#059669]" : "bg-[#f1f5f9] text-[#64748b]",
              )}
              title="Whether any device has a live, realtime connection to this business right now — separate from the per-device sync status below."
            >
              <Radio className={cn("h-3 w-3", isLive && "animate-pulse")} />
              {isLiveFetching && !liveStatus ? "Checking…" : isLive ? "Live" : "No live connection"}
            </span>
          </div>
          <p className="text-sm text-[#64748b]">
            Tablets and desktops running the Flutter app report here. "Live" means a device has an open
            realtime connection right now; "Synced" means its data has checked in recently — a device can
            be synced without being live, or briefly live without a fresh sync.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="dn-btn dn-btn-outline inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Refresh
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Synced now</p>
          <p className="mt-1 text-2xl font-semibold text-[#0f172a]">{syncedCount}</p>
        </div>
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Pending queue</p>
          <p className="mt-1 text-2xl font-semibold text-[#0f172a]">{pendingTotal}</p>
        </div>
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Failed</p>
          <p className="mt-1 text-2xl font-semibold text-[#dc2626]">{failedTotal}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#64748b]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading devices…
        </div>
      ) : isError ? (
        <p className="py-8 text-sm text-[#dc2626]">Could not load device sync status.</p>
      ) : devices.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#64748b]">
          No mobile devices have checked in yet. Open the Flutter app while logged in to register this
          business.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              <tr>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Synced</th>
                <th className="px-4 py-3">Queue</th>
                <th className="px-4 py-3">Sync</th>
                <th className="px-4 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {devices.map((device) => (
                <tr key={device.id} className="text-[#334155]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-[#94a3b8]" />
                      <div>
                        <p className="font-medium text-[#0f172a]">
                          {device.deviceName || device.deviceId}
                        </p>
                        <p className="text-xs text-[#94a3b8]">
                          {device.platform ?? "unknown"} · {device.userRole ?? "staff"}
                          {device.appVersion
                            ? ` · v${device.appVersion}${device.versionCode != null ? ` (${device.versionCode})` : ""}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                        device.isEffectivelyOnline
                          ? "bg-[#ecfdf5] text-[#059669]"
                          : "bg-[#f1f5f9] text-[#64748b]",
                      )}
                    >
                      {device.isEffectivelyOnline ? (
                        <Wifi className="h-3 w-3" />
                      ) : (
                        <WifiOff className="h-3 w-3" />
                      )}
                      {device.isEffectivelyOnline ? "Synced" : "Not synced"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {device.pendingQueueCount} pending
                    {device.failedQueueCount > 0 ? (
                      <span className="text-[#dc2626]"> · {device.failedQueueCount} failed</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 capitalize">{device.syncState || "idle"}</td>
                  <td className="px-4 py-3 text-xs">
                    {(() => {
                      const activity = formatLastActivity(device.lastHeartbeatAt);
                      return (
                        <div>
                          <p className="font-medium text-[#0f172a]">{activity.relative}</p>
                          <p className="text-[#94a3b8]">{activity.absolute}</p>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
