"use client";

import { Suspense, useMemo, useState } from "react";
import {
  Download,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage } from "@/components/admin/PortalPage";
import { EmptyState } from "@/components/design-system/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetBusinessesQuery } from "@/hooks/useBusiness";
import {
  useCreateAppReleaseMutation,
  useDeleteAppReleaseMutation,
  useGetAppReleasesQuery,
  useGetAppUpdateAdoptionQuery,
  usePublishAppReleaseMutation,
  useRollbackAppReleaseMutation,
  useUpdateAppReleaseMutation,
  useUploadAppReleaseAssetMutation,
  type AppReleasePlatform,
  type AppReleasePolicy,
  type AppReleaseRecord,
  type AppReleaseTargetMode,
} from "@/hooks/useAppUpdates";
import { formatLastActivity, normalizeErrorMessage } from "@/lib/utils";

type ReleaseFormState = {
  versionName: string;
  versionCode: string;
  platform: AppReleasePlatform;
  policy: AppReleasePolicy;
  maxSkips: string;
  title: string;
  notes: string;
  targetMode: AppReleaseTargetMode;
  businessIds: string[];
};

const emptyForm: ReleaseFormState = {
  versionName: "",
  versionCode: "",
  platform: "windows",
  policy: "optional_snooze",
  maxSkips: "3",
  title: "",
  notes: "",
  targetMode: "all",
  businessIds: [],
};

const PLATFORM_ACCEPT: Record<AppReleasePlatform, string> = {
  windows: ".exe,application/x-msdownload,application/octet-stream",
  macos: ".dmg,.zip,application/x-apple-diskimage,application/zip",
  android: ".apk,application/vnd.android.package-archive",
};

const PLATFORM_LABEL: Record<AppReleasePlatform, string> = {
  windows: "Windows (.exe)",
  macos: "macOS (.dmg / .zip)",
  android: "Android (.apk)",
};

const POLICY_LABEL: Record<AppReleasePolicy, string> = {
  optional_snooze: "Skip then force",
  forced: "Forced",
  soft: "Soft reminder",
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusClass(status: AppReleaseRecord["status"]) {
  if (status === "published") return "bg-emerald-50 text-emerald-700";
  if (status === "rolled_back") return "bg-amber-50 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

export default function AppUpdatesPage() {
  return (
    <Suspense fallback={<Loading fullScreen label="Loading app updates..." />}>
      <AppUpdatesContent />
    </Suspense>
  );
}

function AppUpdatesContent() {
  const { data: releases, isLoading } = useGetAppReleasesQuery(undefined, {
    pollingInterval: 15_000,
  });
  const { data: adoption } = useGetAppUpdateAdoptionQuery(undefined, {
    pollingInterval: 15_000,
  });
  const { data: businessData } = useGetBusinessesQuery({ page: 1 });
  const businesses = businessData?.data ?? [];

  const [createAppRelease, { isLoading: creating }] = useCreateAppReleaseMutation();
  const [updateAppRelease, { isLoading: updating }] = useUpdateAppReleaseMutation();
  const [uploadAsset, { isLoading: uploading }] = useUploadAppReleaseAssetMutation();
  const [publishRelease, { isLoading: publishing }] = usePublishAppReleaseMutation();
  const [rollbackRelease, { isLoading: rollingBack }] = useRollbackAppReleaseMutation();
  const [deleteRelease, { isLoading: deleting }] = useDeleteAppReleaseMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppReleaseRecord | null>(null);
  const [form, setForm] = useState<ReleaseFormState>(emptyForm);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppReleaseRecord | null>(null);

  const saving = creating || updating || uploading;

  const outdatedCount = useMemo(
    () => (adoption?.devices ?? []).filter((device) => !device.isUpToDate).length,
    [adoption],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setPendingFile(null);
    setDialogOpen(true);
  }

  function openEdit(release: AppReleaseRecord) {
    setEditing(release);
    setForm({
      versionName: release.versionName,
      versionCode: String(release.versionCode),
      platform: release.platform,
      policy: release.policy,
      maxSkips: String(release.maxSkips),
      title: release.title,
      notes: release.notes,
      targetMode: release.targetMode,
      businessIds: release.businessIds,
    });
    setPendingFile(null);
    setDialogOpen(true);
  }

  function toggleBusiness(id: string) {
    setForm((current) => ({
      ...current,
      businessIds: current.businessIds.includes(id)
        ? current.businessIds.filter((item) => item !== id)
        : [...current.businessIds, id],
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const versionCode = Number(form.versionCode);
    const maxSkips = Number(form.maxSkips);
    if (!form.versionName.trim() || !Number.isInteger(versionCode) || versionCode < 1) {
      toast.error("Version name and a whole version code (1+) are required.");
      return;
    }
    if (form.targetMode === "businesses" && form.businessIds.length === 0) {
      toast.error("Select at least one business, or switch audience to all businesses.");
      return;
    }

    const payload = {
      versionName: form.versionName.trim(),
      versionCode,
      platform: form.platform,
      policy: form.policy,
      maxSkips: Number.isInteger(maxSkips) ? Math.min(3, Math.max(0, maxSkips)) : 3,
      title: form.title.trim(),
      notes: form.notes.trim(),
      targetMode: form.targetMode,
      businessIds: form.targetMode === "businesses" ? form.businessIds : [],
    };

    const toastId = toast.loading(editing ? "Saving release…" : "Creating release…");
    try {
      const saved = editing
        ? await updateAppRelease({
            id: editing.id,
            body:
              editing.status === "published"
                ? {
                    policy: payload.policy,
                    maxSkips: payload.maxSkips,
                    title: payload.title,
                    notes: payload.notes,
                    targetMode: payload.targetMode,
                    businessIds: payload.businessIds,
                  }
                : payload,
          }).unwrap()
        : await createAppRelease(payload).unwrap();
      if (pendingFile && saved.status === "draft") {
        toast.loading("Uploading installer…", { id: toastId });
        await uploadAsset({ id: saved.id, file: pendingFile }).unwrap();
      }
      toast.success(
        editing?.status === "published" ? "Live release updated. POS apps pick this up within seconds." : editing ? "Release saved." : "Draft release created.",
        { id: toastId },
      );
      setDialogOpen(false);
      setPendingFile(null);
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Could not save the release."), { id: toastId });
    }
  }

  async function handleUpload(release: AppReleaseRecord, file?: File) {
    if (!file) return;
    const toastId = toast.loading("Uploading installer…");
    try {
      await uploadAsset({ id: release.id, file }).unwrap();
      toast.success(`Uploaded ${file.name}`, { id: toastId });
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Upload failed."), { id: toastId });
    }
  }

  async function handlePublish(release: AppReleaseRecord) {
    const toastId = toast.loading("Publishing…");
    try {
      await publishRelease(release.id).unwrap();
      toast.success(
        release.policy === "forced"
          ? `Force update ${release.versionName} is live. Open the business Software page to see the alert.`
          : `Published ${release.versionName} for ${release.platform}. Linked businesses see it under Software.`,
        { id: toastId },
      );
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Publish failed."), { id: toastId });
    }
  }

  async function handleRollback(release: AppReleaseRecord) {
    const toastId = toast.loading("Rolling back…");
    try {
      await rollbackRelease(release.id).unwrap();
      toast.success("Stopped. POS apps will no longer be offered this installer.", { id: toastId });
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Rollback failed."), { id: toastId });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRelease(deleteTarget.id).unwrap();
      toast.success("Release deleted.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Delete failed."));
    }
  }

  return (
    <AdminShell activeTab="app-updates">
      <PortalPage>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-[#64748b]">
            Publish a Windows, macOS, or Android installer. Link it to a business, switch force
            vs optional, or stop it. Assigned versions show on the business Software page and on
            POS login within seconds.
          </p>
          <button type="button" onClick={openCreate} className="dn-btn dn-btn-primary h-11 rounded-xl px-5">
            <Plus className="h-4 w-4" />
            New release
          </button>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#64748b]">
            Device adoption
          </h2>
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            {(["windows", "macos", "android"] as AppReleasePlatform[]).map((platform) => {
              const latest = adoption?.latestByPlatform?.[platform];
              return (
                <div key={platform} className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                    {PLATFORM_LABEL[platform]}
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#0f172a]">
                    {latest ? `${latest.versionName} (${latest.versionCode})` : "None published"}
                  </p>
                </div>
              );
            })}
          </div>
          {(adoption?.devices.length ?? 0) === 0 ? (
            <p className="text-sm text-[#64748b]">
              No POS devices have checked in yet. Versions appear here after the Flutter app sends a heartbeat.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-wider text-[#64748b]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Device</th>
                    <th className="px-4 py-3 font-semibold">Business</th>
                    <th className="px-4 py-3 font-semibold">Platform</th>
                    <th className="px-4 py-3 font-semibold">Installed</th>
                    <th className="px-4 py-3 font-semibold">Assigned</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {(adoption?.devices ?? []).map((device) => (
                    <tr key={device.id} className="border-t border-[#eef2f7]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0f172a]">{device.deviceName || device.deviceId}</div>
                        <div className="text-xs text-[#94a3b8]">{device.deviceId.slice(0, 8)}…</div>
                      </td>
                      <td className="px-4 py-3 text-[#334155]">{device.businessName || "—"}</td>
                      <td className="px-4 py-3 capitalize">{device.platform || "—"}</td>
                      <td className="px-4 py-3">
                        {device.appVersion || "—"}
                        {device.versionCode != null ? ` (${device.versionCode})` : ""}
                      </td>
                      <td className="px-4 py-3">
                        {device.latestVersionName
                          ? `${device.latestVersionName} (${device.latestVersionCode})`
                          : "—"}
                        {device.isForced ? (
                          <div className="text-xs font-semibold text-[#b91c1c]">Force update</div>
                        ) : device.assignedPolicy ? (
                          <div className="text-xs text-[#94a3b8]">
                            {POLICY_LABEL[device.assignedPolicy as AppReleasePolicy] ?? device.assignedPolicy}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            device.isUpToDate ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {device.isUpToDate
                            ? "Up to date"
                            : device.isForced
                              ? "Must update"
                              : "Needs update"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {(() => {
                          const activity = formatLastActivity(device.lastHeartbeatAt);
                          return (
                            <div>
                              <div className="font-medium text-[#0f172a]">{activity.relative}</div>
                              <div className="text-[#94a3b8]">{activity.absolute}</div>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {outdatedCount > 0 ? (
                <p className="border-t border-[#eef2f7] px-4 py-2 text-xs text-[#64748b]">
                  {outdatedCount} device{outdatedCount === 1 ? "" : "s"} behind the latest published build.
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#64748b]">
            Releases
          </h2>
          {isLoading ? (
            <Loading label="Loading releases..." />
          ) : !releases?.length ? (
            <EmptyState
              icon={Download}
              title="No app releases yet"
              description="Create a draft, upload the installer, then publish. The first build that contains the updater still has to be installed by hand."
              primaryAction={
                <button type="button" onClick={openCreate} className="dn-btn dn-btn-primary h-10 rounded-xl px-4">
                  New release
                </button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-wider text-[#64748b]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Version</th>
                    <th className="px-4 py-3 font-semibold">Platform</th>
                    <th className="px-4 py-3 font-semibold">Policy</th>
                    <th className="px-4 py-3 font-semibold">Audience</th>
                    <th className="px-4 py-3 font-semibold">Installer</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {releases.map((release) => (
                    <tr key={release.id} className="border-t border-[#eef2f7] align-top">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#0f172a]">{release.versionName}</div>
                        <div className="text-xs text-[#94a3b8]">code {release.versionCode}</div>
                        {release.title ? (
                          <div className="mt-1 text-xs text-[#64748b]">{release.title}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 capitalize">{release.platform}</td>
                      <td className="px-4 py-3">
                        {POLICY_LABEL[release.policy]}
                        {release.policy === "optional_snooze" ? (
                          <div className="text-xs text-[#94a3b8]">{release.maxSkips} skip(s)</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {release.targetMode === "all"
                          ? "All businesses"
                          : `${release.businessIds.length} business${release.businessIds.length === 1 ? "" : "es"}`}
                      </td>
                      <td className="px-4 py-3">
                        {release.asset ? (
                          <div>
                            <div className="max-w-[180px] truncate font-medium">{release.asset.fileName}</div>
                            <div className="text-xs text-[#94a3b8]">
                              {formatBytes(release.asset.fileSize)} · {release.asset.sha256.slice(0, 12)}…
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#94a3b8]">Not uploaded</span>
                        )}
                        {release.status === "draft" ? (
                          <label className="dn-btn dn-btn-outline mt-2 inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs">
                            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                            Upload
                            <input
                              type="file"
                              accept={PLATFORM_ACCEPT[release.platform]}
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                void handleUpload(release, file);
                              }}
                            />
                          </label>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(release.status)}`}>
                          {release.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {release.status === "draft" ? (
                            <>
                              <button
                                type="button"
                                className="dn-btn dn-btn-outline h-8 rounded-lg px-3 text-xs"
                                onClick={() => openEdit(release)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="dn-btn dn-btn-primary h-8 rounded-lg px-3 text-xs"
                                disabled={publishing}
                                onClick={() => void handlePublish(release)}
                              >
                                Publish
                              </button>
                              <button
                                type="button"
                                className="dn-btn dn-btn-ghost h-8 rounded-lg px-2 text-xs text-red-600"
                                onClick={() => setDeleteTarget(release)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : null}
                          {release.status === "published" ? (
                            <>
                              <button
                                type="button"
                                className="dn-btn dn-btn-outline h-8 rounded-lg px-3 text-xs"
                                onClick={() => openEdit(release)}
                              >
                                Manage
                              </button>
                              <button
                                type="button"
                                className="dn-btn dn-btn-outline h-8 rounded-lg px-3 text-xs"
                                disabled={rollingBack}
                                onClick={() => void handleRollback(release)}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Stop
                              </button>
                            </>
                          ) : null}
                          {release.status === "rolled_back" ? (
                            <>
                              <button
                                type="button"
                                className="dn-btn dn-btn-primary h-8 rounded-lg px-3 text-xs"
                                disabled={publishing}
                                onClick={() => void handlePublish(release)}
                              >
                                Serve again
                              </button>
                              <button
                                type="button"
                                className="dn-btn dn-btn-ghost h-8 rounded-lg px-2 text-xs text-red-600"
                                onClick={() => setDeleteTarget(release)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </PortalPage>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.status === "published"
                ? "Manage live release"
                : editing
                  ? "Edit draft release"
                  : "New app release"}
            </DialogTitle>
            <DialogDescription>
              {editing?.status === "published"
                ? "Change force vs optional, link or unlink businesses, or keep the same installer. POS apps pick this up within seconds — no republish needed."
                : "Upload comes after you save, or pick a file now. Publishing is a separate step so you can pilot one shop first."}
            </DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#334155]">
                Version name
                <input
                  required
                  disabled={editing?.status === "published"}
                  value={form.versionName}
                  onChange={(event) => setForm((current) => ({ ...current, versionName: event.target.value }))}
                  placeholder="1.2.0"
                  className="mt-1 h-11 w-full rounded-xl border border-[#e2e8f0] px-3 disabled:bg-[#f8fafc]"
                />
              </label>
              <label className="block text-sm font-medium text-[#334155]">
                Version code
                <input
                  required
                  type="number"
                  min={1}
                  disabled={editing?.status === "published"}
                  value={form.versionCode}
                  onChange={(event) => setForm((current) => ({ ...current, versionCode: event.target.value }))}
                  placeholder="2"
                  className="mt-1 h-11 w-full rounded-xl border border-[#e2e8f0] px-3 disabled:bg-[#f8fafc]"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#334155]">
                Platform
                <select
                  value={form.platform}
                  disabled={Boolean(editing)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      platform: event.target.value as AppReleasePlatform,
                    }))
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#e2e8f0] px-3 disabled:bg-[#f8fafc]"
                >
                  <option value="windows">{PLATFORM_LABEL.windows}</option>
                  <option value="macos">{PLATFORM_LABEL.macos}</option>
                  <option value="android">{PLATFORM_LABEL.android}</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-[#334155]">
                Alert policy
                <select
                  value={form.policy}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      policy: event.target.value as AppReleasePolicy,
                    }))
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#e2e8f0] px-3"
                >
                  <option value="optional_snooze">Skip 1–3 times, then required</option>
                  <option value="forced">Forced immediately</option>
                  <option value="soft">Soft reminder (never blocks)</option>
                </select>
              </label>
            </div>
            {form.policy === "optional_snooze" ? (
              <label className="block text-sm font-medium text-[#334155]">
                Allowed skips
                <select
                  value={form.maxSkips}
                  onChange={(event) => setForm((current) => ({ ...current, maxSkips: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-[#e2e8f0] px-3 sm:max-w-xs"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </label>
            ) : null}
            <label className="block text-sm font-medium text-[#334155]">
              Title shown on the POS
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Kitchen printer fix"
                className="mt-1 h-11 w-full rounded-xl border border-[#e2e8f0] px-3"
              />
            </label>
            <label className="block text-sm font-medium text-[#334155]">
              Release notes
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-3 py-2"
                placeholder="What changed, and that printers/orders pause briefly during install."
              />
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[#334155]">Audience</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.targetMode === "all"}
                  onChange={() => setForm((current) => ({ ...current, targetMode: "all" }))}
                />
                All businesses
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.targetMode === "businesses"}
                  onChange={() => setForm((current) => ({ ...current, targetMode: "businesses" }))}
                />
                Specific businesses
              </label>
              {form.targetMode === "businesses" ? (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[#e2e8f0] p-3">
                  {businesses.map((business) => (
                    <label key={business.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.businessIds.includes(business.id)}
                        onChange={() => toggleBusiness(business.id)}
                      />
                      {business.businessName}
                    </label>
                  ))}
                </div>
              ) : null}
            </fieldset>
            {editing?.status === "published" ? null : (
            <label className="block text-sm font-medium text-[#334155]">
              Installer file {editing?.asset ? `(current: ${editing.asset.fileName})` : ""}
              <input
                type="file"
                accept={PLATFORM_ACCEPT[form.platform]}
                className="mt-1 block w-full text-sm"
                onChange={(event) => setPendingFile(event.target.files?.[0] ?? null)}
              />
              {pendingFile ? (
                <span className="mt-1 block text-xs text-[#64748b]">
                  {pendingFile.name} · {formatBytes(pendingFile.size)}
                </span>
              ) : null}
            </label>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="dn-btn dn-btn-outline h-10 rounded-xl px-4" onClick={() => setDialogOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className="dn-btn dn-btn-primary h-10 rounded-xl px-4">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing?.status === "published" ? "Save live release" : editing ? "Save draft" : "Create draft"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => void handleDelete()}
        loading={deleting}
        title="Delete this release?"
        description="The uploaded installer will be removed. Published releases must be rolled back first."
      />
    </AdminShell>
  );
}
