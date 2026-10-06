"use client";

import { useMemo, useState } from "react";
import { Loader2, Pause, Play, Plus, Square, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  useSnooker,
  type SnookerTableRow,
} from "@/hooks/useSnooker";
import { cn } from "@/lib/utils";
import {
  CenturyTimer,
  FeltTableVisual,
  FlowRail,
  GlassPanel,
  HudLabel,
  HudStat,
  RingMeter,
} from "./snooker-ui";
import { money, type SnookerGameType, type SnookerTable } from "./snooker-mock";
import { SNOOKER_OPERATIONAL_FLOW } from "@/templates/snooker-pos";

function toUiTable(row: SnookerTableRow): SnookerTable {
  const snap = row.session?.rateSnapshot as
    | { singleRate?: number; doubleRate?: number; centuryPerMinute?: number }
    | undefined;
  const code = (row.session?.gameTypeCode ?? "single") as SnookerGameType;
  return {
    id: row.id,
    name: row.name,
    type: code === "century" ? "century" : "snooker",
    status: row.status,
    singleRate: Number(row.singleRate ?? snap?.singleRate ?? 300),
    doubleRate: Number(row.doubleRate ?? snap?.doubleRate ?? 500),
    centuryPerMinute: Number(row.centuryPerMinute ?? snap?.centuryPerMinute ?? 20),
    session: row.session
      ? {
          gameType: (["single", "double", "century"].includes(code)
            ? code
            : "single") as SnookerGameType,
          player: row.session.playerLabel || "Guest",
          startedAt: new Date(row.session.startedAt).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          elapsedMin: Math.floor((row.session.timing?.elapsedSeconds ?? 0) / 60),
          paused: row.session.status === "paused",
        }
      : undefined,
  };
}

export function LiveDashboardView() {
  const { tables, dashboard, loading, error } = useSnooker();
  const uiTables = useMemo(() => tables.map(toUiTable), [tables]);
  const occupied = dashboard?.tablesOccupied ?? uiTables.filter((t) => t.status === "occupied").length;
  const available = dashboard?.tablesAvailable ?? uiTables.filter((t) => t.status === "available").length;

  if (error) {
    return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <RingMeter
          value={occupied}
          max={dashboard?.tablesTotal || uiTables.length || 1}
          label="Floor occupancy"
          hint={`${dashboard?.activeSessions ?? 0} active · ${available} open`}
          accent="#059669"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <HudStat label="Today’s sales" value={money(dashboard?.salesToday ?? 0)} hint="Closed bills" accent="#0f766e" />
          <HudStat label="Collections" value={money(dashboard?.collectionsToday ?? 0)} hint="Cash / digital received" />
          <HudStat label="Credit sales" value={money(dashboard?.creditSalesToday ?? 0)} hint="Udhar posted" accent="#d97706" />
          <HudStat label="Active sessions" value={String(dashboard?.activeSessions ?? 0)} hint={loading ? "Refreshing…" : "Live"} />
        </div>
      </div>
      <GlassPanel>
        <HudLabel>Live table floor</HudLabel>
        <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {uiTables.map((table) => (
            <FeltTableVisual key={table.id} table={table} compact />
          ))}
          {!uiTables.length && !loading ? (
            <p className="col-span-full text-sm text-[#64748b]">No tables yet — add some under Tables or Pricing.</p>
          ) : null}
        </div>
      </GlassPanel>
      <GlassPanel>
        <HudLabel>Session pipeline</HudLabel>
        <div className="mt-3">
          <FlowRail steps={SNOOKER_OPERATIONAL_FLOW} active={3} />
        </div>
      </GlassPanel>
    </>
  );
}

export function LiveTablesView() {
  const { tables, categories, createTable, loading, busy, error } = useSnooker();
  const uiTables = useMemo(() => tables.map(toUiTable), [tables]);
  const [name, setName] = useState("");

  const counts = {
    available: uiTables.filter((t) => t.status === "available").length,
    occupied: uiTables.filter((t) => t.status === "occupied").length,
    reserved: uiTables.filter((t) => t.status === "reserved").length,
    maintenance: uiTables.filter((t) => t.status === "maintenance").length,
  };

  return (
    <>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-4">
        <HudStat label="Available" value={String(counts.available)} accent="#059669" />
        <HudStat label="Occupied" value={String(counts.occupied)} accent="#0f766e" />
        <HudStat label="Reserved" value={String(counts.reserved)} accent="#d97706" />
        <HudStat label="Maintenance" value={String(counts.maintenance)} accent="#f87171" />
      </div>
      <GlassPanel>
        <HudLabel>Add table</HudLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="portal-input max-w-xs"
            placeholder="Table name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="button"
            className="dn-btn dn-btn-primary"
            disabled={busy || !name.trim()}
            onClick={async () => {
              try {
                await createTable({
                  name: name.trim(),
                  categoryId: categories[0]?.id,
                  allowedGameTypes: ["single", "double", "century"],
                });
                setName("");
                toast.success("Table created");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Create failed");
              }
            }}
          >
            <Plus className="h-4 w-4" /> Add table
          </button>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#64748b]" /> : null}
        </div>
      </GlassPanel>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {uiTables.map((table) => (
          <FeltTableVisual key={table.id} table={table} />
        ))}
      </div>
    </>
  );
}

export function LivePricingView() {
  const { categories, updateCategory, createCategory, busy, error } = useSnooker();
  const [draft, setDraft] = useState({
    name: "VIP",
    defaultSingleRate: 350,
    defaultDoubleRate: 600,
    defaultCenturyPerMinute: 25,
  });

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}
      <GlassPanel>
        <HudLabel>Table categories & rates</HudLabel>
        <div className="mt-4 space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="grid gap-2 rounded-xl border border-[#e2e8f0] p-3 md:grid-cols-4">
              <div>
                <p className="font-semibold text-[#0f172a]">{cat.name}</p>
                <p className="text-xs text-[#64748b]">
                  Min {cat.minDurationMinutes}m · round {cat.roundingSeconds}s · pause{" "}
                  {cat.pauseStopsBilling ? "stops billing" : "keeps billing"}
                </p>
              </div>
              {(
                [
                  ["defaultSingleRate", "Single"],
                  ["defaultDoubleRate", "Double"],
                  ["defaultCenturyPerMinute", "Century /min"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-xs font-semibold text-[#64748b]">
                  {label}
                  <input
                    type="number"
                    className="portal-input mt-1"
                    defaultValue={Number(cat[key])}
                    onBlur={async (e) => {
                      const value = Number(e.target.value);
                      if (!Number.isFinite(value)) return;
                      try {
                        await updateCategory(cat.id, { [key]: value });
                        toast.success(`${cat.name} ${label} updated`);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Update failed");
                      }
                    }}
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
      </GlassPanel>
      <GlassPanel>
        <HudLabel>New category</HudLabel>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input
            className="portal-input"
            placeholder="Name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <input
            type="number"
            className="portal-input"
            placeholder="Single"
            value={draft.defaultSingleRate}
            onChange={(e) =>
              setDraft((d) => ({ ...d, defaultSingleRate: Number(e.target.value) || 0 }))
            }
          />
          <input
            type="number"
            className="portal-input"
            placeholder="Double"
            value={draft.defaultDoubleRate}
            onChange={(e) =>
              setDraft((d) => ({ ...d, defaultDoubleRate: Number(e.target.value) || 0 }))
            }
          />
          <button
            type="button"
            className="dn-btn dn-btn-primary"
            disabled={busy}
            onClick={async () => {
              try {
                await createCategory(draft);
                toast.success("Category created");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Create failed");
              }
            }}
          >
            Create
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}

export function LivePosSessionView() {
  const {
    tables,
    gameTypes,
    startSession,
    previewSession,
    pauseSession,
    resumeSession,
    extendSession,
    endSession,
    addLineItem,
    payBill,
    busy,
    error,
  } = useSnooker(5000);

  const [step, setStep] = useState(0);
  const [tableId, setTableId] = useState<string | null>(null);
  const [gameType, setGameType] = useState("single");
  const [billingKind, setBillingKind] = useState<
    "standard_flat" | "standard_per_minute" | "custom_fixed" | "custom_rate"
  >("standard_flat");
  const [playerLabel, setPlayerLabel] = useState("");
  const [packageMinutes, setPackageMinutes] = useState(45);
  const [customFixedPrice, setCustomFixedPrice] = useState(350);
  const [customRatePerMinute, setCustomRatePerMinute] = useState(8);
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [billId, setBillId] = useState<string | null>(null);
  const [billTotal, setBillTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState("Regular player");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const available = tables.filter((t) => t.status === "available" && t.isActive);
  const live = tables.filter((t) => t.session);
  const selectedTable = tables.find((t) => t.id === tableId) ?? null;
  const activeLive = live.find((t) => t.session?.id === activeSessionId)?.session;

  async function runPreview() {
    if (!tableId) return;
    const kind =
      billingKind === "standard_flat" && gameType === "century"
        ? "standard_per_minute"
        : billingKind;
    const result = await previewSession({
      tableId,
      gameTypeCode: gameType,
      billingKind: kind,
      packageMinutes:
        kind === "custom_fixed" || kind === "custom_rate" || kind === "standard_per_minute"
          ? packageMinutes
          : undefined,
      customFixedPrice: kind === "custom_fixed" ? customFixedPrice : undefined,
      customRatePerMinute: kind === "custom_rate" ? customRatePerMinute : undefined,
    });
    setPreviewAmount(result.estimatedAmount);
  }

  function reset() {
    setStep(0);
    setTableId(null);
    setGameType("single");
    setBillingKind("standard_flat");
    setPlayerLabel("");
    setPreviewAmount(null);
    setActiveSessionId(null);
    setBillId(null);
    setBillTotal(0);
    setDiscount(0);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <GlassPanel>
        <HudLabel>Live POS flow</HudLabel>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-3">
          <FlowRail steps={SNOOKER_OPERATIONAL_FLOW} active={step} onSelect={(i) => setStep(Math.min(i, 7))} />
        </div>

        <div className="mt-6 space-y-4">
          {step === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {available.map((item) => (
                <FeltTableVisual
                  key={item.id}
                  table={toUiTable(item)}
                  compact
                  selected={tableId === item.id}
                  onClick={() => {
                    setTableId(item.id);
                    setStep(1);
                  }}
                />
              ))}
              {!available.length ? (
                <p className="text-sm text-[#64748b]">No available tables. Add tables or end a session.</p>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                {(gameTypes.length
                  ? gameTypes
                  : [
                      { id: "1", code: "single", name: "Single", billingMode: "flat" as const, isActive: true },
                      { id: "2", code: "double", name: "Double", billingMode: "flat" as const, isActive: true },
                      { id: "3", code: "century", name: "Century", billingMode: "per_minute" as const, isActive: true },
                    ]
                ).map((model) => (
                  <button
                    key={model.code}
                    type="button"
                    onClick={() => {
                      setGameType(model.code);
                      setBillingKind(
                        model.billingMode === "per_minute"
                          ? "standard_per_minute"
                          : "standard_flat",
                      );
                    }}
                    className={cn(
                      "snooker-glass p-4 text-left",
                      gameType === model.code && "snooker-table-card-selected",
                    )}
                  >
                    <p className="text-lg font-semibold text-[#0f172a]">{model.name}</p>
                    <p className="mt-1 text-xs text-[#64748b]">{model.billingMode}</p>
                  </button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-sm">
                  Player / group
                  <input
                    className="portal-input mt-1"
                    value={playerLabel}
                    onChange={(e) => setPlayerLabel(e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  Billing
                  <select
                    className="portal-input mt-1"
                    value={billingKind}
                    onChange={(e) =>
                      setBillingKind(e.target.value as typeof billingKind)
                    }
                  >
                    <option value="standard_flat">Standard flat</option>
                    <option value="standard_per_minute">Standard per-minute</option>
                    <option value="custom_fixed">Custom duration + price</option>
                    <option value="custom_rate">Open-ended custom rate</option>
                  </select>
                </label>
                {billingKind === "custom_fixed" || billingKind === "custom_rate" || billingKind === "standard_per_minute" ? (
                  <label className="text-sm">
                    Minutes
                    <input
                      type="number"
                      className="portal-input mt-1"
                      value={packageMinutes}
                      onChange={(e) => setPackageMinutes(Number(e.target.value) || 0)}
                    />
                  </label>
                ) : null}
                {billingKind === "custom_fixed" ? (
                  <label className="text-sm">
                    Agreed price
                    <input
                      type="number"
                      className="portal-input mt-1"
                      value={customFixedPrice}
                      onChange={(e) => setCustomFixedPrice(Number(e.target.value) || 0)}
                    />
                  </label>
                ) : null}
                {billingKind === "custom_rate" ? (
                  <label className="text-sm">
                    Rate / minute
                    <input
                      type="number"
                      className="portal-input mt-1"
                      value={customRatePerMinute}
                      onChange={(e) => setCustomRatePerMinute(Number(e.target.value) || 0)}
                    />
                  </label>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="dn-btn dn-btn-outline"
                  disabled={busy || !tableId}
                  onClick={() => void runPreview().then(() => toast.message(`Preview ${money(previewAmount ?? 0)}`)).catch((e) => toast.error(String(e.message || e)))}
                >
                  Preview {previewAmount != null ? money(previewAmount) : ""}
                </button>
                <button
                  type="button"
                  className="dn-btn dn-btn-primary"
                  disabled={busy || !tableId}
                  onClick={async () => {
                    try {
                      const kind =
                        billingKind === "standard_flat" && gameType === "century"
                          ? "standard_per_minute"
                          : billingKind;
                      const session = await startSession({
                        tableId,
                        gameTypeCode: gameType,
                        billingKind: kind,
                        playerLabel: playerLabel || undefined,
                        packageMinutes:
                          kind === "custom_fixed" || kind === "custom_rate"
                            ? packageMinutes
                            : undefined,
                        customFixedPrice:
                          kind === "custom_fixed" ? customFixedPrice : undefined,
                        customRatePerMinute:
                          kind === "custom_rate" ? customRatePerMinute : undefined,
                      });
                      setActiveSessionId(session.id);
                      setStep(2);
                      toast.success("Session started");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Start failed");
                    }
                  }}
                >
                  Start session
                </button>
              </div>
            </div>
          ) : null}

          {step >= 2 && step <= 3 && activeSessionId ? (
            <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
              {gameType === "century" || billingKind.includes("minute") || billingKind === "custom_rate" ? (
                <CenturyTimer
                  minutes={Math.floor((activeLive?.timing?.billableSeconds ?? 0) / 60)}
                  paused={activeLive?.status === "paused"}
                />
              ) : null}
              <div>
                <p className="text-xl font-semibold text-[#0f172a]">
                  {selectedTable?.name} · {gameType}
                </p>
                <p className="mt-1 text-sm text-[#64748b]">
                  {activeLive?.status ?? "active"} · now{" "}
                  {money(activeLive?.amounts?.currentAmount ?? previewAmount ?? 0)}
                  {activeLive?.timing?.isExpired ? " · TIME EXPIRED" : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="dn-btn dn-btn-outline !h-10 px-3 text-xs"
                    disabled={busy}
                    onClick={() => void resumeSession(activeSessionId)}
                  >
                    <Play className="h-3.5 w-3.5" /> Resume
                  </button>
                  <button
                    type="button"
                    className="dn-btn dn-btn-outline !h-10 px-3 text-xs"
                    disabled={busy}
                    onClick={() => void pauseSession(activeSessionId)}
                  >
                    <Pause className="h-3.5 w-3.5" /> Pause
                  </button>
                  <button
                    type="button"
                    className="dn-btn dn-btn-outline !h-10 px-3 text-xs"
                    disabled={busy}
                    onClick={async () => {
                      try {
                        await extendSession(activeSessionId, {
                          extraMinutes: 5,
                          agreedAmount: 50,
                          reason: "+5 min",
                        });
                        toast.success("Extended +5 min");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Extend failed");
                      }
                    }}
                  >
                    +5 min
                  </button>
                  <button
                    type="button"
                    className="dn-btn dn-btn-primary !h-10 px-4 text-xs"
                    disabled={busy}
                    onClick={() => setStep(4)}
                  >
                    <Square className="h-3.5 w-3.5" /> Finish session
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 && activeSessionId ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-medium text-[#334155]">
                Discount amount
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="portal-input mt-1"
                />
              </label>
              <label className="block text-sm font-medium text-[#334155]">
                Mandatory reason
                <input
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="portal-input mt-1"
                />
              </label>
              <button
                type="button"
                className="dn-btn dn-btn-primary md:col-span-2"
                disabled={busy}
                onClick={async () => {
                  try {
                    if (discount > 0) {
                      await addLineItem(activeSessionId, {
                        kind: "discount",
                        label: discountReason || "Discount",
                        amount: discount,
                      });
                    }
                    const ended = await endSession(activeSessionId);
                    setBillId(ended.bill.id);
                    setBillTotal(Number(ended.bill.totalAmount));
                    setStep(5);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "End failed");
                  }
                }}
              >
                End & continue to payment
              </button>
            </div>
          ) : null}

          {step === 5 && billId ? (
            <div className="space-y-3">
              <p className="font-mono text-sm">Total due {money(billTotal)}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="snooker-glass p-5 text-left"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      await payBill(billId, { method: "cash", amount: billTotal });
                      setStep(6);
                      toast.success("Paid in cash");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Pay failed");
                    }
                  }}
                >
                  <p className="text-lg font-semibold">Cash</p>
                  <p className="mt-1 font-mono text-sm text-[#0f766e]">Collect {money(billTotal)}</p>
                </button>
                <div className="snooker-glass space-y-2 p-5">
                  <p className="inline-flex items-center gap-2 text-lg font-semibold">
                    <Wallet className="h-4 w-4" /> Udhar
                  </p>
                  <input
                    className="portal-input"
                    placeholder="Customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <input
                    className="portal-input"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <button
                    type="button"
                    className="dn-btn dn-btn-primary w-full"
                    disabled={busy || !customerName.trim()}
                    onClick={async () => {
                      try {
                        await payBill(billId, {
                          method: "credit",
                          amount: billTotal,
                          customerName,
                          customerPhone: customerPhone || undefined,
                        });
                        setStep(6);
                        toast.success("Posted to credit");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Credit failed");
                      }
                    }}
                  >
                    Post credit
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {step >= 6 ? (
            <div className="snooker-glass p-5">
              <p className="font-semibold text-[#0f172a]">Session closed · table released</p>
              <p className="mt-2 font-mono text-sm text-[#64748b]">Bill {billId}</p>
              <button type="button" className="dn-btn dn-btn-outline mt-4" onClick={reset}>
                Start another
              </button>
            </div>
          ) : null}
        </div>
      </GlassPanel>

      <aside className="space-y-4">
        <GlassPanel>
          <HudLabel>Live sessions</HudLabel>
          <ul className="mt-3 space-y-3">
            {live.map((t) => (
              <li key={t.id} className="rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold">{t.name}</span>
                  <span className="font-mono text-[#0f766e]">
                    {money(t.session?.amounts?.currentAmount ?? 0)}
                  </span>
                </div>
                <p className="text-xs text-[#64748b]">
                  {t.session?.gameTypeCode} · {t.session?.status} ·{" "}
                  {Math.floor((t.session?.timing?.billableSeconds ?? 0) / 60)}m
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-[#0f766e]"
                  onClick={() => {
                    setActiveSessionId(t.session!.id);
                    setTableId(t.id);
                    setGameType(t.session!.gameTypeCode);
                    setStep(2);
                  }}
                >
                  Manage
                </button>
              </li>
            ))}
            {!live.length ? <li className="text-sm text-[#64748b]">No active sessions</li> : null}
          </ul>
        </GlassPanel>
      </aside>
    </div>
  );
}
