"use client";

import { useEffect, useState } from "react";
import Loading from "@/components/common/Loading";
import { AlertCircle, Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { usePublicDataSettings, CatalogSyncStatusResponse } from "@/hooks/usePublicData";
import { normalizeErrorMessage } from "@/lib/utils";

export default function PublicDataSettingsPage() {
  const {
    settings,
    loading,
    actionLoading,
    error,
    updateSettings,
    queueSync,
    fetchSyncStatus,
    fetchSettings,
  } = usePublicDataSettings();

  const [form, setForm] = useState({
    enabled: false,
    syncOperationalCatalog: true,
    displayName: "",
    description: "",
    logo: "",
    allowedOriginsText: "",
  });
  const [syncStatus, setSyncStatus] = useState<CatalogSyncStatusResponse | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({
      enabled: !!settings.enabled,
      syncOperationalCatalog: settings.syncOperationalCatalog !== false,
      displayName: settings.displayName ?? "",
      description: settings.description ?? "",
      logo: settings.logo ?? "",
      allowedOriginsText: (settings.allowedOrigins ?? []).join("\n"),
    });
  }, [settings]);

  const loadSyncStatus = async () => {
    setSyncLoading(true);
    try {
      const status = await fetchSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load sync status");
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    loadSyncStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const allowedOrigins = form.allowedOriginsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (form.enabled && allowedOrigins.includes("*")) {
      toast.error("Enabled storefronts cannot use wildcard origin *");
      return;
    }

    const toastId = toast.loading("Saving settings...");
    try {
      await updateSettings({
        enabled: form.enabled,
        syncOperationalCatalog: form.syncOperationalCatalog,
        displayName: form.displayName.trim(),
        description: form.description.trim(),
        logo: form.logo.trim() || undefined,
        allowedOrigins,
      });
      toast.success("Settings saved successfully", { id: toastId });
      await fetchSettings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings", { id: toastId });
    }
  };

  const onQueueSync = async () => {
    const toastId = toast.loading("Queuing catalog sync...");
    try {
      const result = await queueSync();
      toast.success(`Sync queued (${result.status})`, { id: toastId });
      await loadSyncStatus();
      await fetchSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to queue sync";
      const alreadyActive = /already active/i.test(message);
      if (alreadyActive) {
        toast.info("A catalog sync is already running for this business. Check Sync Status below.", {
          id: toastId,
        });
        await loadSyncStatus();
        return;
      }
      toast.error(message, { id: toastId });
    }
  };

  if (loading && !settings) {
    return <Loading className="min-h-[40vh]" />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
      <form
        onSubmit={onSave}
        className="rounded-[28px] border border-[#e5edf5] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
      >
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#0f172a]">Storefront Settings</h3>
          <p className="text-sm text-[#64748b]">
            Control public website enablement, branding, and operational catalog sync.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-[#fecaca] bg-[#fff1f1] p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#ef4444]">Error loading settings</p>
              <p className="text-sm text-[#dc2626]">{normalizeErrorMessage(error)}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-5">
          <label className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">Enable public storefront</p>
              <p className="text-xs text-[#64748b]">Website APIs return catalog data only when enabled</p>
            </div>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="h-5 w-5 accent-[var(--brand-primary)]"
            />
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">Sync operational catalog</p>
              <p className="text-xs text-[#64748b]">Keep public records in sync with CRM categories and products</p>
            </div>
            <input
              type="checkbox"
              checked={form.syncOperationalCatalog}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, syncOperationalCatalog: e.target.checked }))
              }
              className="h-5 w-5 accent-[var(--brand-primary)]"
            />
          </label>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0f172a]">Display name</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
              placeholder="Restaurant display name"
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#001840]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0f172a]">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Short storefront description"
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#001840]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0f172a]">Logo path</label>
            <input
              value={form.logo}
              onChange={(e) => setForm((prev) => ({ ...prev, logo: e.target.value }))}
              placeholder="uploads/public-catalog/logo.webp"
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#001840]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0f172a]">Allowed origins</label>
            <textarea
              value={form.allowedOriginsText}
              onChange={(e) => setForm((prev) => ({ ...prev, allowedOriginsText: e.target.value }))}
              rows={4}
              placeholder={"https://shop.example.com\nhttps://menu.example.com"}
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#001840]"
            />
            <p className="mt-1 text-xs text-[#64748b]">One origin per line. Wildcard * is not allowed when enabled.</p>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="dn-btn dn-btn-primary disabled:opacity-60"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </button>
        </div>
      </form>

      <div className="space-y-6">
        <div className="rounded-[28px] border border-[#e5edf5] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-[#0f172a]">Catalog Sync</h3>
              <p className="text-sm text-[#64748b]">
                Queue a full reconciliation from the operational CRM catalog.
              </p>
            </div>
            <button
              type="button"
              onClick={loadSyncStatus}
              disabled={syncLoading}
              className="rounded-xl border border-[#d7e1ed] p-2 text-[#475569] hover:bg-[#f8fafc]"
            >
              <RefreshCw className={`h-4 w-4 ${syncLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="mb-4 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#334155]">
            <p>
              <span className="font-semibold">Last synced:</span>{" "}
              {settings?.lastSyncedAt ? new Date(settings.lastSyncedAt).toLocaleString() : "Never"}
            </p>
          </div>

          <button
            type="button"
            onClick={onQueueSync}
            disabled={actionLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00122E] disabled:opacity-60"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Queue Manual Sync
          </button>
          <p className="mt-3 text-xs text-[#64748b]">
            Only one reconciliation can run at a time. If you see a conflict, wait for the current sync to finish.
          </p>
        </div>

        <div className="rounded-[28px] border border-[#e5edf5] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <h3 className="mb-4 text-lg font-bold text-[#0f172a]">Sync Status</h3>
          {syncLoading && !syncStatus ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#001840]" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(syncStatus?.counts ?? {}).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-[#94a3b8]">{key}</p>
                    <p className="text-xl font-bold text-[#0f172a]">{value}</p>
                  </div>
                ))}
                {!syncStatus || Object.keys(syncStatus.counts ?? {}).length === 0 ? (
                  <p className="col-span-2 text-sm text-[#64748b]">No sync queue activity yet.</p>
                ) : null}
              </div>

              {(syncStatus?.failures?.length ?? 0) > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-[#b91c1c]">Recent failures</p>
                  {syncStatus!.failures.slice(0, 5).map((failure, index) => (
                    <pre
                      key={index}
                      className="overflow-x-auto rounded-xl bg-[#fff1f1] p-3 text-xs text-[#991b1b]"
                    >
                      {JSON.stringify(failure, null, 2)}
                    </pre>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
