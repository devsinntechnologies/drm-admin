"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { useWebsite, type WebsitePageRecord } from "@/hooks/useWebsite";
import { normalizeErrorMessage } from "@/lib/utils";

export default function WebsitePagesPage() {
  const { website, loading, listPages, createPage, updatePage, deletePage } = useWebsite();
  const [pages, setPages] = useState<WebsitePageRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");

  const refresh = async () => {
    const next = await listPages();
    setPages(next);
  };

  useEffect(() => {
    if (!website || website.status === "failed" || website.status === "provisioning") return;
    refresh().catch((err) => {
      toast.error(normalizeErrorMessage(err, "Failed to load pages"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [website?.id, website?.status]);

  if (loading) return <Loading className="py-16" />;

  if (!website || website.status === "failed" || website.status === "provisioning") {
    return (
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 text-sm text-[#64748b]">
        Finish website setup on the Overview tab before managing pages.
      </section>
    );
  }

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const toastId = toast.loading("Creating page...");
    try {
      const next = await createPage(name.trim());
      setPages(next);
      setName("");
      toast.success("Page created", { id: toastId });
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to create page"), { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const onToggle = async (page: WebsitePageRecord) => {
    setBusy(true);
    try {
      const next = await updatePage(page.id, { isPublished: !page.isPublished });
      setPages(next);
      toast.success(page.isPublished ? "Page unpublished" : "Page published");
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to update page"));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (page: WebsitePageRecord) => {
    setBusy(true);
    try {
      const next = await deletePage(page.id);
      setPages(next);
      toast.success("Page deleted");
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to delete page"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={onCreate} className="flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-5 sm:flex-row sm:items-end">
        <label className="block flex-1 space-y-1.5">
          <span className="block text-sm font-semibold text-[#64748b]">Page name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. About Us"
            className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm outline-none focus:border-[#0050F8]"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="dn-btn dn-btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add page
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
        {pages.length === 0 ? (
          <p className="p-6 text-sm text-[#64748b]">No pages yet. Create your first DigiNizam page.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#94a3b8]">
              <tr>
                <th className="px-5 py-3 font-semibold">Page</th>
                <th className="px-5 py-3 font-semibold">URL</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-t border-[#eef2f7]">
                  <td className="px-5 py-3 font-medium text-[#0f172a]">{page.name}</td>
                  <td className="px-5 py-3 text-[#64748b]">{page.url}</td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => onToggle(page)}
                      disabled={busy}
                      className="text-xs font-semibold text-[#0050F8]"
                    >
                      {page.isPublished ? "Published" : "Unpublished"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(page)}
                      disabled={busy}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#dc2626]"
                      aria-label={`Delete ${page.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
