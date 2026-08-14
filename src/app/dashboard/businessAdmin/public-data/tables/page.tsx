"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon, QrCode, Store } from "lucide-react";
import Loading from "@/components/common/Loading";
import { TableQrDialog } from "@/components/tables/TableQrDialog";
import { TableRecord, useTables } from "@/hooks/useTables";
import { BASE_URL } from "@/lib/constant";

export default function PublicCatalogTablesPage() {
  const { tables, loading, error } = useTables({ page: 1, limit: 100 });
  const [qrTable, setQrTable] = useState<TableRecord | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#e5edf5] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#0f172a]">Table QR Codes</h3>
          <p className="text-sm text-[#64748b]">
            Generate branded QR codes that open this storefront at <code>/self/tableId</code>.
            The public website domain is taken from Settings → Allowed origins.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
          </div>
        ) : loading ? (
          <Loading />
        ) : tables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dbe4ef] bg-[#f8fafc] px-6 py-16 text-center">
            <Store className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-[#475569]">No tables found</p>
            <p className="mt-1 text-sm text-[#94a3b8]">Add tables in Tables Management first.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tables.map((table) => {
              const imageUrl = table.image
                ? table.image.startsWith("http")
                  ? table.image
                  : `${BASE_URL}/${table.image}`
                : null;
              return (
                <article
                  key={table.id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                >
                  <div className="relative h-36 bg-slate-50">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={table.tableNumber} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h4 className="text-lg font-black text-[#111827]">{table.tableNumber}</h4>
                      <p className="text-sm text-slate-500">{table.capacity} seats</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQrTable(table)}
                      className="dn-btn dn-btn-primary w-full"
                    >
                      <QrCode className="h-4 w-4" />
                      Generate QR
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <TableQrDialog
        table={qrTable}
        open={!!qrTable}
        onOpenChange={(next) => {
          if (!next) setQrTable(null);
        }}
      />
    </div>
  );
}
