"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, Link2, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAppUpdateWorkspaceQuery,
  useLinkAppReleaseBusinessMutation,
  useUnlinkAppReleaseBusinessMutation,
  type AppReleasePlatform,
  type AppReleaseRecord,
} from "@/hooks/useAppUpdates";
import { useAuth } from "@/hooks/useAuth";
import { cn, normalizeErrorMessage } from "@/lib/utils";

type SoftwareAppUpdatePanelProps = {
  businessId: string;
};

const PLATFORM_LABEL: Record<AppReleasePlatform, string> = {
  windows: "Windows",
  macos: "macOS",
  android: "Android",
};

const POLICY_LABEL: Record<string, string> = {
  forced: "Forced update",
  optional_snooze: "Skip then force",
  soft: "Reminder",
};

export function SoftwareAppUpdatePanel({ businessId }: SoftwareAppUpdatePanelProps) {
  const { role } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const { data, isLoading, isError, isFetching, refetch } = useGetAppUpdateWorkspaceQuery(businessId, {
    skip: !businessId,
    pollingInterval: 15_000,
  });
  const [linkRelease, { isLoading: linking }] = useLinkAppReleaseBusinessMutation();
  const [unlinkRelease, { isLoading: unlinking }] = useUnlinkAppReleaseBusinessMutation();
  const [selectedId, setSelectedId] = useState("");

  const published = data?.publishedReleases ?? [];
  const assignable = useMemo(
    () =>
      published.filter((release) => {
        if (release.status !== "published") return false;
        if (release.targetMode === "all") return false;
        return !release.businessIds.includes(businessId);
      }),
    [published, businessId],
  );

  async function handleLink() {
    if (!selectedId) {
      toast.error("Pick a published installer to link to this business.");
      return;
    }
    const toastId = toast.loading("Linking installer to this business…");
    try {
      await linkRelease({ id: selectedId, businessId }).unwrap();
      setSelectedId("");
      toast.success("This business is now on that app version.", { id: toastId });
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Could not link the installer."), { id: toastId });
    }
  }

  async function handleUnlink(release: AppReleaseRecord) {
    const toastId = toast.loading("Unlinking…");
    try {
      await unlinkRelease({ id: release.id, businessId }).unwrap();
      toast.success("This business is no longer targeted by that installer.", { id: toastId });
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Could not unlink the installer."), { id: toastId });
    }
  }

  const alert = data?.alert;
  const forced = alert?.policy === "forced";

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Download className="h-4 w-4 text-[var(--brand-secondary)]" />
            <h2 className="text-base font-semibold text-[#0f172a]">App version</h2>
          </div>
          <p className="text-sm text-[#64748b]">
            The installer live for this business. Forced updates show here as soon as they are
            published — POS apps also prompt on next login.
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

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#64748b]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading app version…
        </div>
      ) : isError ? (
        <p className="py-6 text-sm text-[#dc2626]">Could not load the app version for this business.</p>
      ) : (
        <>
          {alert ? (
            <div
              className={cn(
                "mb-4 flex gap-3 rounded-xl border px-4 py-3",
                forced
                  ? "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]"
                  : "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
              )}
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  {forced ? "Force update is live" : "Update available"}
                  {": "}
                  {alert.title} ({PLATFORM_LABEL[alert.platform]} {alert.versionName})
                </p>
                <p className="mt-0.5 text-sm">
                  {alert.deviceCount === 0
                    ? "No POS devices have checked in yet. They will be required to install this on next login."
                    : alert.outdatedCount > 0
                      ? `${alert.outdatedCount} of ${alert.deviceCount} device${alert.deviceCount === 1 ? "" : "s"} still need this version.`
                      : "All checked-in devices are on this version."}
                </p>
              </div>
            </div>
          ) : (
            <p className="mb-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#64748b]">
              No published installer is linked to this business yet.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {(data?.platforms ?? []).map((row) => (
              <div key={row.platform} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">
                  {PLATFORM_LABEL[row.platform]}
                </p>
                {row.active ? (
                  <>
                    <p className="mt-1 text-lg font-semibold text-[#0f172a]">
                      {row.active.versionName}
                      <span className="ml-1 text-sm font-medium text-[#64748b]">
                        ({row.active.versionCode})
                      </span>
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#475569]">
                      {POLICY_LABEL[row.active.policy] ?? row.active.policy}
                      {row.active.targetMode === "all" ? " · All businesses" : " · Linked"}
                    </p>
                    <p className="mt-2 text-xs text-[#64748b]">
                      {row.deviceCount} device{row.deviceCount === 1 ? "" : "s"}
                      {row.outdatedCount > 0 ? ` · ${row.outdatedCount} behind` : ""}
                    </p>
                    {isSuperAdmin && row.active.targetMode === "businesses" ? (
                      <button
                        type="button"
                        disabled={unlinking}
                        onClick={() => {
                          const release = published.find((item) => item.id === row.active?.id);
                          if (release) void handleUnlink(release);
                        }}
                        className="mt-3 text-xs font-semibold text-[#dc2626]"
                      >
                        Unlink from this business
                      </button>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-1 text-sm text-[#94a3b8]">None linked</p>
                )}
              </div>
            ))}
          </div>

          {isSuperAdmin ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#cbd5e1] bg-[#fafbfc] p-4">
              <p className="mb-2 text-sm font-semibold text-[#0f172a]">
                <Link2 className="mr-1 inline h-4 w-4" />
                Link a published installer
              </p>
              <p className="mb-3 text-xs text-[#64748b]">
                Targeted releases only. Installers published for all businesses already apply here.
              </p>
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="h-9 min-w-[16rem] rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm"
                >
                  <option value="">Select a published installer</option>
                  {assignable.map((release) => (
                    <option key={release.id} value={release.id}>
                      {PLATFORM_LABEL[release.platform]} {release.versionName} ({release.versionCode}) ·{" "}
                      {POLICY_LABEL[release.policy]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={linking || !selectedId}
                  onClick={() => void handleLink()}
                  className="dn-btn dn-btn-primary inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm"
                >
                  {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Link to this business
                </button>
              </div>
              {assignable.length === 0 ? (
                <p className="mt-2 text-xs text-[#94a3b8]">
                  Publish a targeted release in App Updates first, then link it here.
                </p>
              ) : null}
            </div>
          ) : null}

          {(data?.platforms ?? []).some((row) => row.devices.length > 0) ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                  <tr>
                    <th className="px-3 py-2">Device</th>
                    <th className="px-3 py-2">Installed</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {(data?.platforms ?? []).flatMap((row) =>
                    row.devices.map((device) => (
                      <tr key={device.id}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-[#94a3b8]" />
                            <div>
                              <p className="font-medium text-[#0f172a]">
                                {device.deviceName || device.deviceId}
                              </p>
                              <p className="text-xs text-[#94a3b8]">{PLATFORM_LABEL[row.platform]}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[#475569]">
                          {device.appVersion ?? "—"}
                          {device.versionCode != null ? ` (${device.versionCode})` : ""}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-semibold",
                              device.isUpToDate
                                ? "bg-[#ecfdf5] text-[#059669]"
                                : "bg-[#fef2f2] text-[#dc2626]",
                            )}
                          >
                            {device.isUpToDate ? "Up to date" : "Needs update"}
                          </span>
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
