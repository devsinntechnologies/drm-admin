"use client";

import { useEffect, useMemo, useState } from "react";
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
  const rawCode = row.session?.gameTypeCode ?? "single";
  const code = (
    ["single", "double", "fifty", "century"].includes(rawCode)
      ? rawCode
      : "single"
  ) as SnookerGameType;
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
          gameType: code,
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
  const {
    categories,
    gameTypes,
    updateCategory,
    updateGameType,
    createCategory,
    busy,
    error,
  } = useSnooker();
  const [draft, setDraft] = useState({
    name: "VIP",
    defaultSingleRate: 100,
    defaultDoubleRate: 200,
    defaultCenturyPerMinute: 12,
  });

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}
      <GlassPanel>
        <HudLabel>Game types & billing</HudLabel>
        <p className="mt-1 text-xs text-[#64748b]">
          Configure Single, Double, Fifty, and Century. Included minutes and maximum duration are separate.
          Prices are snapshotted onto each session so later edits do not change past bills.
        </p>
        <div className="mt-4 space-y-3">
          {gameTypes.map((game) => (
            <div
              key={game.id}
              className="grid gap-2 rounded-xl border border-[#e2e8f0] p-3 md:grid-cols-3 lg:grid-cols-6"
            >
              <div className="lg:col-span-2">
                <p className="text-sm font-bold text-[#0f172a]">
                  {game.name}{" "}
                  <span className="font-normal text-[#64748b]">({game.code})</span>
                </p>
                <select
                  className="portal-input mt-2"
                  defaultValue={game.billingMethod || "fixed"}
                  onChange={(e) =>
                    void updateGameType(game.id, {
                      billingMethod: e.target.value,
                    }).then(() => toast.success(`${game.name} billing method updated`))
                  }
                >
                  <option value="fixed">Fixed price</option>
                  <option value="fixed_plus_overtime">Fixed + overtime</option>
                  <option value="per_minute">Per minute</option>
                </select>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      defaultChecked={game.isActive}
                      onChange={(e) =>
                        void updateGameType(game.id, { isActive: e.target.checked })
                      }
                    />
                    Enabled
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      defaultChecked={game.overtimeEnabled}
                      onChange={(e) =>
                        void updateGameType(game.id, {
                          overtimeEnabled: e.target.checked,
                        })
                      }
                    />
                    Overtime
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      defaultChecked={game.pauseBillable}
                      onChange={(e) =>
                        void updateGameType(game.id, {
                          pauseBillable: e.target.checked,
                        })
                      }
                    />
                    Pause billable
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      defaultChecked={game.autoStopAtMax}
                      onChange={(e) =>
                        void updateGameType(game.id, {
                          autoStopAtMax: e.target.checked,
                        })
                      }
                    />
                    Auto-stop at max
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      defaultChecked={game.allowManualAdjust !== false}
                      onChange={(e) =>
                        void updateGameType(game.id, {
                          allowManualAdjust: e.target.checked,
                        })
                      }
                    />
                    Manual duration
                  </label>
                </div>
              </div>
              {(
                [
                  ["basePrice", "Base price"],
                  ["includedMinutes", "Included minutes"],
                  ["maxDurationMinutes", "Max minutes"],
                  ["perMinuteRate", "Per-minute rate"],
                  ["overtimeRate", "Overtime / min"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-xs font-semibold text-[#64748b]">
                  {label}
                  <input
                    type="number"
                    className="portal-input mt-1"
                    defaultValue={
                      key === "maxDurationMinutes"
                        ? Number(game.maxDurationMinutes ?? "") || ""
                        : Number((game as Record<string, unknown>)[key] ?? 0)
                    }
                    onBlur={async (e) => {
                      const raw = e.target.value.trim();
                      const value =
                        key === "maxDurationMinutes" && raw === ""
                          ? null
                          : Number(raw);
                      if (value !== null && !Number.isFinite(value)) return;
                      try {
                        await updateGameType(game.id, { [key]: value });
                        toast.success(`${game.name} ${label} updated`);
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Update failed",
                        );
                      }
                    }}
                  />
                </label>
              ))}
            </div>
          ))}
          {gameTypes.length === 0 ? (
            <p className="text-sm text-[#64748b]">
              Game types will appear after the snooker module loads for this business.
            </p>
          ) : null}
        </div>
      </GlassPanel>
      <GlassPanel>
        <HudLabel>Session categories (optional)</HudLabel>
        <p className="mt-1 text-xs text-[#64748b]">
          Optional labels for custom counter orders. Primary pricing is controlled by game types above.
        </p>
        <div className="mt-4 space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="grid gap-2 rounded-xl border border-[#e2e8f0] p-3 md:grid-cols-4">
              <div>
                <input
                  className="portal-input"
                  defaultValue={cat.name}
                  onBlur={async (e) => {
                    const name = e.target.value.trim();
                    if (!name || name === cat.name) return;
                    try {
                      await updateCategory(cat.id, { name });
                      toast.success("Category renamed. Past orders keep the previous name.");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Rename failed");
                    }
                  }}
                />
                <p className="mt-1 text-xs text-[#64748b]">
                  {cat.isActive ? "Enabled" : "Disabled"} · order {cat.sortOrder ?? 0} · min {cat.minDurationMinutes}m · round {cat.roundingSeconds}s
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#0f766e]"
                    onClick={() => void updateCategory(cat.id, { isActive: !cat.isActive })}
                  >
                    {cat.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#0f766e]"
                    onClick={() => void updateCategory(cat.id, { sortOrder: (cat.sortOrder ?? 0) - 1 })}
                  >
                    Move up
                  </button>
                </div>
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
    categories,
    startSession,
    previewSession,
    pauseSession,
    resumeSession,
    extendSession,
    endSession,
    addLineItem,
    payBill,
    acknowledgeExpiry,
    resolveConflict,
    dashboard,
    busy,
    error,
  } = useSnooker(5000);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const [step, setStep] = useState(0);
  const [tableId, setTableId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [pricingMethod, setPricingMethod] = useState<"fixed" | "time_based">("fixed");
  const [billingUnit, setBillingUnit] = useState<"hour" | "minute">("hour");
  const [playerLabel, setPlayerLabel] = useState("");
  const [packageMinutes, setPackageMinutes] = useState(45);
  const [customMinutes, setCustomMinutes] = useState("");
  const [price, setPrice] = useState(500);
  const [extraMinutes, setExtraMinutes] = useState(15);
  const [extraPrice, setExtraPrice] = useState(0);
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [billId, setBillId] = useState<string | null>(null);
  const [billTotal, setBillTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState("Regular player");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const enabledCategories = categories.filter((c) => c.isActive);
  const durationMinutes = customMinutes.trim()
    ? Number(customMinutes)
    : packageMinutes;
  const available = tables.filter((t) => t.status === "available" && t.isActive);
  const live = tables.filter((t) => t.session && t.session.listBucket !== "upcoming" && t.session.status !== "scheduled");
  const running = live.filter((t) => t.session?.status === "active" || t.session?.status === "paused");
  const awaiting = live.filter((t) => t.session?.status === "time_expired");
  const upcoming = tables.filter((t) => t.session?.status === "scheduled");
  const selectedTable = tables.find((t) => t.id === tableId) ?? null;
  const activeLive = live.find((t) => t.session?.id === activeSessionId)?.session;

  async function runPreview() {
    if (!tableId || !categoryId) return;
    const result = await previewSession({
      tableId,
      categoryId,
      gameTypeCode: "session",
      billingKind: pricingMethod === "fixed" ? "custom_fixed" : "custom_rate",
      billingUnit: pricingMethod === "fixed" ? "session" : billingUnit,
      timingMode: "timed",
      packageMinutes: durationMinutes,
      customFixedPrice: pricingMethod === "fixed" ? price : undefined,
      customHourlyRate: pricingMethod === "time_based" && billingUnit === "hour" ? price : undefined,
      customRatePerMinute: pricingMethod === "time_based" && billingUnit === "minute" ? price : undefined,
    });
    setPreviewAmount(result.estimatedAmount);
  }

  function reset() {
    setStep(0);
    setTableId(null);
    setCategoryId("");
    setPricingMethod("fixed");
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
              <p className="text-sm text-[#64748b]">
                {selectedTable?.name}. The price and duration are saved on this order only.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-sm">
                  Category
                  <select
                    className="portal-input mt-1"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Select an enabled category</option>
                    {enabledCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Customer (optional)
                  <input
                    className="portal-input mt-1"
                    value={playerLabel}
                    onChange={(e) => setPlayerLabel(e.target.value)}
                    placeholder="Required only for credit"
                  />
                </label>
                <label className="text-sm">
                  Pricing method
                  <select
                    className="portal-input mt-1"
                    value={pricingMethod}
                    onChange={(e) => setPricingMethod(e.target.value as "fixed" | "time_based")}
                  >
                    <option value="fixed">Fixed session price</option>
                    <option value="time_based">Time-based rate</option>
                  </select>
                </label>
                {pricingMethod === "time_based" ? (
                  <label className="text-sm">
                    Billing unit
                    <select
                      className="portal-input mt-1"
                      value={billingUnit}
                      onChange={(e) => setBillingUnit(e.target.value as "hour" | "minute")}
                    >
                      <option value="hour">Per hour</option>
                      <option value="minute">Per minute</option>
                    </select>
                  </label>
                ) : (
                  <p className="self-end text-xs text-[#64748b]">
                    One price for the whole session, for example PKR 500 for 45 minutes.
                  </p>
                )}
                <label className="text-sm">
                  {pricingMethod === "fixed" ? "Session price" : billingUnit === "hour" ? "Rate per hour" : "Rate per minute"}
                  <input
                    type="number"
                    min={1}
                    className="portal-input mt-1"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  />
                </label>
                <div className="text-sm">
                  Duration
                  <div className="mt-1 flex flex-wrap gap-2">
                    {[30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs",
                          !customMinutes && packageMinutes === mins
                            ? "border-[#0f766e] bg-[#ecfdf5]"
                            : "border-[#e2e8f0]",
                        )}
                        onClick={() => {
                          setPackageMinutes(mins);
                          setCustomMinutes("");
                        }}
                      >
                        {mins} min
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      className="portal-input max-w-28"
                      placeholder="Custom"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#64748b]">
                Starts now. Ends after {Number.isFinite(durationMinutes) ? durationMinutes : 0} minutes.
                {pricingMethod === "time_based"
                  ? ` ${price} per ${billingUnit} is not the same as a fixed price for that duration.`
                  : ` Fixed price stays ${price} for the whole session.`}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="dn-btn dn-btn-outline"
                  disabled={busy || !tableId || !categoryId}
                  onClick={() => void runPreview().then(() => toast.message(`Preview ${money(previewAmount ?? 0)}`)).catch((e) => toast.error(String(e.message || e)))}
                >
                  Preview {previewAmount != null ? money(previewAmount) : ""}
                </button>
                <button
                  type="button"
                  className="dn-btn dn-btn-primary"
                  disabled={busy || !tableId || !categoryId || price <= 0 || !(durationMinutes > 0)}
                  onClick={async () => {
                    try {
                      const session = await startSession({
                        tableId,
                        categoryId,
                        categoryName: enabledCategories.find((c) => c.id === categoryId)?.name,
                        gameTypeCode: "session",
                        billingKind: pricingMethod === "fixed" ? "custom_fixed" : "custom_rate",
                        billingUnit: pricingMethod === "fixed" ? "session" : billingUnit,
                        playerLabel: playerLabel || undefined,
                        timingMode: "timed",
                        packageMinutes: durationMinutes,
                        customFixedPrice: pricingMethod === "fixed" ? price : undefined,
                        customHourlyRate:
                          pricingMethod === "time_based" && billingUnit === "hour" ? price : undefined,
                        customRatePerMinute:
                          pricingMethod === "time_based" && billingUnit === "minute" ? price : undefined,
                      });
                      setActiveSessionId(session.id);
                      setStep(2);
                      toast.success("Order created");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Start failed");
                    }
                  }}
                >
                  Create order
                </button>
              </div>
            </div>
          ) : null}

          {step >= 2 && step <= 3 && activeSessionId ? (
            <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
              <CenturyTimer
                minutes={Math.floor((activeLive?.timing?.remainingSeconds ?? activeLive?.timing?.billableSeconds ?? 0) / 60)}
                paused={activeLive?.status === "paused"}
              />
              <div>
                <p className="text-xl font-semibold text-[#0f172a]">
                  {selectedTable?.name} · {(activeLive?.rateSnapshot?.orderCategoryName as string) || "Session"}
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
                  <input
                    type="number"
                    min={1}
                    className="portal-input !h-10 w-20 text-xs"
                    value={extraMinutes}
                    onChange={(e) => setExtraMinutes(Number(e.target.value) || 0)}
                    title="Extra minutes"
                  />
                  <input
                    type="number"
                    min={0}
                    className="portal-input !h-10 w-24 text-xs"
                    value={extraPrice}
                    onChange={(e) => setExtraPrice(Number(e.target.value) || 0)}
                    title="Additional price"
                  />
                  <button
                    type="button"
                    className="dn-btn dn-btn-outline !h-10 px-3 text-xs"
                    disabled={busy || extraMinutes < 1}
                    onClick={async () => {
                      try {
                        await extendSession(activeSessionId, {
                          extraMinutes,
                          agreedAmount: extraPrice,
                          reason: `+${extraMinutes} min`,
                        });
                        toast.success(`Extended +${extraMinutes} min`);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Extend failed");
                      }
                    }}
                  >
                    Extend
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
        {(dashboard?.alerts ?? []).map((alert) => (
          <div key={alert.id} className="rounded-lg border border-[#fecaca] bg-[#fff5f5] px-3 py-2 text-sm text-[#991b1b]">
            <p className="font-semibold">{alert.message}</p>
            <button
              type="button"
              className="mt-2 text-xs font-semibold underline"
              onClick={() => void acknowledgeExpiry(alert.sessionId)}
            >
              Acknowledge
            </button>
          </div>
        ))}
        <GlassPanel>
          <HudLabel>Running</HudLabel>
          <SessionList
            rows={running}
            nowMs={nowMs}
            empty="No running sessions"
            onResolve={(id) =>
              void resolveConflict(id, "Reviewed overlapping session").catch((e) =>
                toast.error(e instanceof Error ? e.message : "Resolve failed"),
              )
            }
            onManage={(t) => {
              setActiveSessionId(t.session!.id);
              setTableId(t.id);
              setStep(2);
            }}
          />
        </GlassPanel>
        <GlassPanel>
          <HudLabel>Ended / awaiting checkout</HudLabel>
          <SessionList
            rows={awaiting}
            nowMs={nowMs}
            empty="No sessions waiting for checkout"
            expired
            onResolve={(id) =>
              void resolveConflict(id, "Reviewed overlapping session").catch((e) =>
                toast.error(e instanceof Error ? e.message : "Resolve failed"),
              )
            }
            onManage={(t) => {
              setActiveSessionId(t.session!.id);
              setTableId(t.id);
              setStep(2);
            }}
          />
        </GlassPanel>
        {upcoming.length ? (
          <GlassPanel>
            <HudLabel>Upcoming</HudLabel>
            <SessionList rows={upcoming} nowMs={nowMs} empty="" onManage={() => undefined} />
          </GlassPanel>
        ) : null}
      </aside>
    </div>
  );
}

function SessionList({
  rows,
  nowMs,
  empty,
  expired,
  onManage,
  onResolve,
}: {
  rows: SnookerTableRow[];
  nowMs: number;
  empty: string;
  expired?: boolean;
  onManage: (row: SnookerTableRow) => void;
  onResolve?: (sessionId: string) => void;
}) {
  return (
    <ul className="mt-3 space-y-3">
      {rows.map((t) => {
        const session = t.session;
        const ends = session?.endsAt ? new Date(session.endsAt).getTime() : null;
        const started = session?.startedAt ? new Date(session.startedAt).getTime() : nowMs;
        const remaining =
          session?.timingMode === "timed" && ends != null
            ? Math.max(0, Math.floor((ends - nowMs) / 1000))
            : null;
        const elapsed = Math.max(0, Math.floor((nowMs - started) / 1000));
        return (
          <li
            key={t.id}
            className={
              expired
                ? "rounded-lg border border-[#fecaca] bg-[#fff5f5] px-3 py-2 text-sm"
                : "rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm"
            }
          >
            <div className="flex justify-between gap-2">
              <span className="font-semibold">{t.name}</span>
              <span className="font-mono text-[#0f766e]">
                {money(session?.amounts?.currentAmount ?? 0)}
              </span>
            </div>
            <p className="text-xs text-[#64748b]">
              {session?.id?.slice(0, 8)} · {(session?.rateSnapshot?.orderCategoryName as string) || session?.gameTypeCode} · {session?.playerLabel || "Walk-in"} ·{" "}
              {expired ? "Time Ended / Awaiting Checkout" : session?.status} ·{" "}
              {session?.billingUnit === "hour"
                ? `${session.customHourlyRate}/hour`
                : session?.billingKind === "custom_fixed"
                  ? `${session.customFixedPrice} fixed`
                  : session?.billingKind} ·{" "}
              {Math.floor(elapsed / 60)}m elapsed
              {remaining != null ? ` · ${Math.floor(remaining / 60)}m left` : ""}
            </p>
            {session?.conflictFlag ? (
              <div className="mt-1">
                <p className="text-xs font-semibold text-[#b45309]">
                  Conflict: {session.conflictNote || session.categoryReview || "Overlapping session"}
                </p>
                {onResolve && session.id ? (
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-[#0f766e]"
                    onClick={() => onResolve(session.id)}
                  >
                    Mark resolved
                  </button>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-[#0f766e]"
              onClick={() => onManage(t)}
            >
              Manage
            </button>
          </li>
        );
      })}
      {!rows.length && empty ? <li className="text-sm text-[#64748b]">{empty}</li> : null}
    </ul>
  );
}
