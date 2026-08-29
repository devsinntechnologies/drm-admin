"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import {
  useBusinessTransfer,
  type TransferImportResult,
  type TransferSectionId,
} from "@/hooks/useBusinessTransfer";
import { cn } from "@/lib/utils";

type Props = {
  businessId: string;
  businessName?: string;
  mode?: "full" | "export" | "import";
};

export function BusinessDataTransferPanel({
  businessId,
  businessName,
  mode = "full",
}: Props) {
  const {
    sectionsData,
    sectionsLoading,
    exporting,
    importing,
    loadSections,
    exportZip,
    importZip,
  } = useBusinessTransfer(businessId);

  const [selectedExport, setSelectedExport] = useState<Set<TransferSectionId>>(
    new Set(),
  );
  const [selectedImport, setSelectedImport] = useState<Set<TransferSectionId>>(
    new Set(),
  );
  const [importFile, setImportFile] = useState<File | null>(null);
  const [lastResult, setLastResult] = useState<TransferImportResult | null>(null);

  useEffect(() => {
    void loadSections().then((data) => {
      if (!data) return;
      setSelectedExport(new Set(data.defaults));
    });
  }, [loadSections]);

  const sections = sectionsData?.sections ?? [];

  const allExportSelected = useMemo(
    () => sections.length > 0 && sections.every((s) => selectedExport.has(s.id)),
    [sections, selectedExport],
  );

  const toggleExport = (id: TransferSectionId) => {
    setSelectedExport((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleImport = (id: TransferSectionId) => {
    setSelectedImport((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSelectAllExport = () => {
    if (allExportSelected) setSelectedExport(new Set());
    else setSelectedExport(new Set(sections.map((s) => s.id)));
  };

  const onExport = async () => {
    const list = [...selectedExport];
    if (!list.length) return;
    await exportZip(list);
  };

  const onImport = async () => {
    if (!importFile) return;
    const list = [...selectedImport];
    const result = await importZip(importFile, list.length ? list : undefined);
    setLastResult(result);
    await loadSections();
  };

  return (
    <div className="space-y-6">
      {mode === "full" ? (
        <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e40af]">
          Move data between environments (e.g. staging → production). Export a ZIP from
          one business, then import into another. Import <strong>appends</strong> — it
          never wipes the target. Staff emails that already exist are skipped.
        </div>
      ) : null}

      {(exporting || importing) ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#bbf7d0] bg-[#ecfdf5] px-4 py-3 text-sm text-[#047857]">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span>
            {exporting
              ? "Preparing the export package. Keep this window open until the download starts."
              : "Importing into this business. This can take a minute for large catalogs."}
          </span>
        </div>
      ) : null}

      {mode !== "import" ? (
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">Export</h2>
            <p className="text-sm text-[#64748b]">
              Download a package from {businessName || "this business"}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadSections()}
            className="text-sm text-[var(--brand-secondary)] hover:underline"
          >
            Refresh counts
          </button>
        </div>

        {sectionsLoading && !sections.length ? (
          <div className="flex items-center gap-2 py-8 text-sm text-[#64748b]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading sections…
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-[#334155]">
                <input
                  type="checkbox"
                  checked={allExportSelected}
                  onChange={onSelectAllExport}
                />
                Select all
              </label>
              <span className="text-xs text-[#94a3b8]">
                Industry: {sectionsData?.industryId || "—"}
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {sections.map((section) => (
                <label
                  key={section.id}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5",
                    selectedExport.has(section.id)
                      ? "border-[var(--brand-secondary)] bg-[#f8fafc]"
                      : "border-[#e2e8f0]",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedExport.has(section.id)}
                    onChange={() => toggleExport(section.id)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[#0f172a]">
                      {section.label}{" "}
                      <span className="font-normal text-[#94a3b8]">
                        ({section.count})
                      </span>
                    </span>
                    <span className="block text-xs text-[#64748b]">
                      {section.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <button
                type="button"
                disabled={exporting || selectedExport.size === 0}
                onClick={() => void onExport()}
                className="dn-btn dn-btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download ZIP
              </button>
            </div>
          </>
        )}
      </section>
      ) : null}

      {mode !== "export" ? (
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h2 className="text-base font-semibold text-[#0f172a]">Import (append)</h2>
        <p className="mb-4 text-sm text-[#64748b]">
          Upload a business-export ZIP into this business. Leave section boxes empty
          to import everything present in the package.
        </p>

        <input
          type="file"
          accept=".zip,application/zip"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setImportFile(file);
            setLastResult(null);
            if (file && sections.length) {
              setSelectedImport(new Set(sections.map((s) => s.id)));
            }
          }}
          className="block w-full text-sm text-[#334155] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eff6ff] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#1e40af]"
        />

        {importFile && sections.length > 0 ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {sections.map((section) => (
              <label
                key={`imp-${section.id}`}
                className="flex cursor-pointer gap-3 rounded-lg border border-[#e2e8f0] px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedImport.has(section.id)}
                  onChange={() => toggleImport(section.id)}
                />
                <span className="text-sm text-[#0f172a]">{section.label}</span>
              </label>
            ))}
          </div>
        ) : null}

        <div className="mt-4">
          <button
            type="button"
            disabled={!importFile || importing}
            onClick={() => void onImport()}
            className="dn-btn dn-btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import into this business
          </button>
        </div>

        {lastResult ? (
          <div className="mt-4 space-y-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm">
            <p className="font-medium text-[#0f172a]">Import result</p>
            <pre className="overflow-auto text-xs text-[#475569]">
              {JSON.stringify(lastResult.imported, null, 2)}
            </pre>
            {lastResult.skippedStaff.length > 0 ? (
              <div>
                <p className="font-medium text-[#b45309]">Skipped staff</p>
                <ul className="list-disc pl-5 text-xs text-[#78716c]">
                  {lastResult.skippedStaff.map((row) => (
                    <li key={row.email}>
                      {row.email} — {row.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lastResult.warnings.length > 0 ? (
              <div>
                <p className="font-medium text-[#b45309]">Warnings</p>
                <ul className="list-disc pl-5 text-xs text-[#78716c]">
                  {lastResult.warnings.slice(0, 20).map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
      ) : null}
    </div>
  );
}
