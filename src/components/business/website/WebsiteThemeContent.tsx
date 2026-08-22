"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { useWebsite, type WebsiteThemeRecord } from "@/hooks/useWebsite";
import { cn, normalizeErrorMessage } from "@/lib/utils";

export function WebsiteThemeContent({ businessId }: { businessId?: string } = {}) {
  const { website, loading, listThemes, applyTheme } = useWebsite(businessId);
  const [themes, setThemes] = useState<WebsiteThemeRecord[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [brokenPreviews, setBrokenPreviews] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!website || website.status === "failed" || website.status === "provisioning") return;
    listThemes()
      .then(setThemes)
      .catch((err) => toast.error(normalizeErrorMessage(err, "Failed to load themes")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [website?.id, website?.status]);

  if (loading) return <Loading className="py-16" />;

  if (!website || website.status === "failed" || website.status === "provisioning") {
    return (
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 text-sm text-[#64748b]">
        Finish website setup on the Overview tab before choosing a theme.
      </section>
    );
  }

  const onApply = async (themeName: string) => {
    setBusy(themeName);
    const toastId = toast.loading("Applying DigiNizam theme...");
    try {
      await applyTheme(themeName);
      const next = await listThemes();
      setThemes(next);
      toast.success("Theme applied", { id: toastId });
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to apply theme"), { id: toastId });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {themes.map((theme) => (
        <article key={theme.name} className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
          <div className="relative aspect-[16/10] bg-gradient-to-br from-[#001840] to-[#0050F8]">
            {theme.previewUrl && !brokenPreviews[theme.name] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={theme.previewUrl}
                alt={`${theme.label} preview`}
                className="h-full w-full object-cover"
                onError={() =>
                  setBrokenPreviews((current) => ({ ...current, [theme.name]: true }))
                }
              />
            ) : null}
            {theme.active ? (
              <span className="absolute left-3 top-3 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-xs font-semibold text-[#059669]">
                Active
              </span>
            ) : null}
          </div>
          <div className="p-5">
            <h3 className="text-base font-semibold text-[#0f172a]">{theme.label}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-[#64748b]">{theme.summary}</p>
            <button
              type="button"
              disabled={!!busy || theme.active}
              onClick={() => onApply(theme.name)}
              className={cn(
                "mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold",
                theme.active ? "bg-[#ecfdf5] text-[#059669]" : "dn-btn dn-btn-primary",
              )}
            >
              {busy === theme.name ? <Loader2 className="h-4 w-4 animate-spin" /> : theme.active ? <Check className="h-4 w-4" /> : null}
              {theme.active ? "Active" : "Use this theme"}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
