"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Loader2, QrCode, X } from "lucide-react";
import { toast } from "sonner";
import { useSelfOrders, type SelfOrderRequest } from "@/hooks/useSelfOrders";

function RequestCard({
  request,
  busy,
  onApprove,
  onReject,
}: {
  request: SelfOrderRequest;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <article className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-amber-700">
            Order request · Pending approval
          </p>
          <h3 className="mt-1 text-3xl font-black text-[#001840]">
            {request.tableNumber || "Table"}
          </h3>
          {request.customerName ? (
            <p className="text-sm font-semibold text-slate-600">{request.customerName}</p>
          ) : null}
        </div>
        <span className="rounded-xl bg-white px-3 py-1 text-lg font-black text-[#001840] shadow-sm">
          Rs. {Number(request.totalPrice)}
        </span>
      </div>

      <ul className="mb-4 space-y-1.5 text-sm font-medium text-slate-700">
        {request.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>
              {item.quantity}× {item.productName}
              {item.variantName ? ` (${item.variantName})` : ""}
            </span>
            <span className="shrink-0 font-bold">
              Rs. {Number(item.unitPrice) * item.quantity}
            </span>
          </li>
        ))}
      </ul>

      {request.notes ? (
        <p className="mb-4 rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-600">
          Note: {request.notes}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          className="dn-btn dn-btn-primary disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Approve & Create Order
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          <X className="h-4 w-4" />
          Reject
        </button>
      </div>
    </article>
  );
}

export function SelfOrderRequestsPanel({
  onApproved,
}: {
  onApproved?: () => void;
}) {
  const { requests, loading, actionLoading, approve, reject } = useSelfOrders({
    status: "pending",
    pollMs: 8000,
  });
  const knownIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  useEffect(() => {
    if (!primed.current) {
      knownIds.current = new Set(requests.map((request) => request.id));
      primed.current = true;
      return;
    }
    const fresh = requests.filter((request) => !knownIds.current.has(request.id));
    if (fresh.length > 0) {
      toast.info(
        fresh.length === 1
          ? `New table order from ${fresh[0].tableNumber || "a table"}`
          : `${fresh.length} new table order requests`,
      );
    }
    knownIds.current = new Set(requests.map((request) => request.id));
  }, [requests]);

  if (!loading && requests.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-[#001840]">
        <QrCode className="h-5 w-5" />
        <h2 className="text-lg font-black">QR Order Requests</h2>
        {requests.length > 0 ? (
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-white">
            {requests.length}
          </span>
        ) : null}
      </div>
      {loading && requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-6 text-sm font-semibold text-amber-800">
          Checking for table order requests…
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              busy={actionLoading}
              onApprove={async () => {
                const toastId = toast.loading("Approving table order...");
                try {
                  await approve(request.id);
                  toast.success("Order created from table request", { id: toastId });
                  onApproved?.();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Approve failed", { id: toastId });
                }
              }}
              onReject={async () => {
                const toastId = toast.loading("Rejecting request...");
                try {
                  await reject(request.id);
                  toast.success("Request rejected", { id: toastId });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Reject failed", { id: toastId });
                }
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
