"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Pause,
  Play,
  Receipt,
  Square,
  Wallet,
} from "lucide-react";
import { PortalPage } from "@/components/admin/PortalPage";
import { DataTable } from "@/components/workspace/DataTable";
import { MODULE_CATALOG } from "@/templates/modules";
import {
  SNOOKER_BILLING_MODELS,
  SNOOKER_OPERATIONAL_FLOW,
  SNOOKER_PRODUCT_SCOPE,
} from "@/templates/snooker-pos";
import type { ModuleId } from "@/templates/types";
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
import {
  SNOOKER_AUDIT,
  SNOOKER_BRANCHES,
  SNOOKER_CREDIT_LEDGER,
  SNOOKER_CUSTOMERS,
  SNOOKER_DISCOUNTS,
  SNOOKER_EXPENSES,
  SNOOKER_NOTIFICATIONS,
  SNOOKER_PRICING,
  SNOOKER_STAFF,
  SNOOKER_TABLES,
  gameTypeLabel,
  money,
  type SnookerGameType,
  type SnookerTable,
} from "./snooker-mock";

type SnookerWorkspaceProps = {
  moduleId: string;
  moduleLabel: string;
};

export function SnookerWorkspace({ moduleId, moduleLabel }: SnookerWorkspaceProps) {
  const catalog = MODULE_CATALOG[moduleId as ModuleId];
  const [clock, setClock] = useState("14:38:00");

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const occupied = SNOOKER_TABLES.filter((t) => t.status === "occupied").length;

  return (
    <PortalPage className="snooker-workspace">
      <header className="snooker-hud-bar">
        <div className="flex items-center gap-3">
          <span className="snooker-led snooker-led-occupied">
            <i />
            Live floor
          </span>
          <div>
            <p className="snooker-kicker">Snooker POS · {moduleLabel}</p>
            <p className="text-sm text-[#64748b]">{catalog?.description ?? "Club operations workspace."}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 font-mono text-xs text-[#64748b]">
          <span>{occupied}/{SNOOKER_TABLES.length} tables live</span>
          <span className="text-lg tracking-[0.18em] text-[#0f172a]">{clock}</span>
        </div>
      </header>

      {moduleId === "dashboard" ? <DashboardView /> : null}
      {moduleId === "tables" ? <TablesView /> : null}
      {moduleId === "pos" ? <PosSessionView /> : null}
      {moduleId === "billing-pricing" ? <PricingView /> : null}
      {moduleId === "customers" ? <CustomersView /> : null}
      {moduleId === "credit-udhar" ? <CreditView /> : null}
      {moduleId === "discounts" ? <DiscountsView /> : null}
      {moduleId === "expenses" ? <ExpensesView /> : null}
      {moduleId === "shifts" ? <ShiftsView /> : null}
      {moduleId === "reports" ? <ReportsView /> : null}
      {moduleId === "staff" ? <StaffView /> : null}
      {moduleId === "audit-logs" ? <AuditView /> : null}
      {moduleId === "notifications" ? <NotificationsView /> : null}
      {moduleId === "branches" ? <BranchesView /> : null}
      {moduleId === "settings" ? <SettingsView /> : null}
      {moduleId === "memberships" ||
      moduleId === "loyalty" ||
      moduleId === "tournaments" ||
      moduleId === "table-booking" ||
      moduleId === "subscriptions" ? (
        <FutureModuleView moduleId={moduleId} />
      ) : null}
    </PortalPage>
  );
}

function TableGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3")}>
      {SNOOKER_TABLES.map((table) => (
        <FeltTableVisual key={table.id} table={table} compact={compact} />
      ))}
    </div>
  );
}

function DashboardView() {
  const occupied = SNOOKER_TABLES.filter((t) => t.status === "occupied").length;
  const century = SNOOKER_TABLES.filter((t) => t.session?.gameType === "century").length;
  const available = SNOOKER_TABLES.filter((t) => t.status === "available").length;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <RingMeter
          value={occupied}
          max={SNOOKER_TABLES.length}
          label="Floor occupancy"
          hint={`${century} century timers · ${available} open`}
          accent="#059669"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <HudStat label="Today’s sales" value={money(86400)} hint="41 closed sessions" accent="#0f766e" />
          <HudStat label="Cash on hand" value={money(42800)} hint="Since 09:01 opening" />
          <HudStat label="Gross profit" value={money(31800)} hint="After expenses posted" />
          <HudStat label="Overdue credit" value={money(18500)} hint="3 player accounts" accent="#d97706" />
        </div>
      </div>

      <GlassPanel>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <HudLabel>Live table floor</HudLabel>
            <h2 className="mt-1 text-lg font-semibold text-[#0f172a]">Hall floor</h2>
          </div>
          <p className="font-mono text-xs text-[#64748b]">Gulberg Club · 12 tables</p>
        </div>
        <TableGrid compact />
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

function TablesView() {
  const counts = {
    available: SNOOKER_TABLES.filter((t) => t.status === "available").length,
    occupied: SNOOKER_TABLES.filter((t) => t.status === "occupied").length,
    reserved: SNOOKER_TABLES.filter((t) => t.status === "reserved").length,
    maintenance: SNOOKER_TABLES.filter((t) => t.status === "maintenance").length,
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-4">
        <HudStat label="Available" value={String(counts.available)} accent="#059669" />
        <HudStat label="Occupied" value={String(counts.occupied)} accent="#0f766e" />
        <HudStat label="Reserved" value={String(counts.reserved)} accent="#d97706" />
        <HudStat label="Maintenance" value={String(counts.maintenance)} accent="#f87171" />
      </div>
      <TableGrid />
    </>
  );
}

function PosSessionView() {
  const [step, setStep] = useState(0);
  const [table, setTable] = useState<SnookerTable | null>(null);
  const [gameType, setGameType] = useState<SnookerGameType>("single");
  const [paused, setPaused] = useState(false);
  const [minutes, setMinutes] = useState(22);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState("Regular player");
  const [payMethod, setPayMethod] = useState<"cash" | "udhar">("cash");

  const available = SNOOKER_TABLES.filter((t) => t.status === "available");
  const rate = table
    ? gameType === "single"
      ? table.singleRate
      : gameType === "double"
        ? table.doubleRate
        : table.centuryPerMinute * Math.max(minutes, 15)
    : 0;
  const total = Math.max(0, rate - discount);

  function reset() {
    setStep(0);
    setTable(null);
    setGameType("single");
    setPaused(false);
    setMinutes(22);
    setDiscount(0);
    setPayMethod("cash");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <GlassPanel>
        <HudLabel>Daily POS flow</HudLabel>
        <div className="mt-3">
          <FlowRail steps={SNOOKER_OPERATIONAL_FLOW} active={step} onSelect={(index) => setStep(Math.min(index, 7))} />
        </div>

        <div className="mt-6 space-y-4">
          {step === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {available.map((item) => (
                <FeltTableVisual
                  key={item.id}
                  table={item}
                  compact
                  selected={table?.id === item.id}
                  onClick={() => {
                    setTable(item);
                    setStep(1);
                  }}
                />
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {SNOOKER_BILLING_MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    setGameType(model.id);
                    setStep(2);
                  }}
                  className={cn(
                    "snooker-glass p-4 text-left",
                    gameType === model.id && "snooker-table-card-selected",
                  )}
                >
                  <p className="text-lg font-semibold text-[#0f172a]">{model.name}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{model.model}</p>
                  <p className="mt-3 font-mono text-sm text-[#0f766e]">
                    {money(model.defaultRate)}
                    {model.id === "century" ? "/min" : ""}
                  </p>
                </button>
              ))}
            </div>
          ) : null}

          {step >= 2 && step <= 3 ? (
            <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
              {gameType === "century" ? <CenturyTimer minutes={minutes} paused={paused} /> : null}
              <div>
                <p className="text-xl font-semibold text-[#0f172a]">
                  {table?.name} · {gameTypeLabel(gameType)}
                </p>
                <p className="mt-1 text-sm text-[#64748b]">
                  {gameType === "century"
                    ? `Minimum 15 min · round up 5 · now ${money(rate)}`
                    : `Flat rate ${money(rate)}`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {gameType === "century" ? (
                    <>
                      <button type="button" className="dn-btn dn-btn-outline !h-10 px-3 text-xs" onClick={() => setPaused(false)}>
                        <Play className="h-3.5 w-3.5" /> Resume
                      </button>
                      <button type="button" className="dn-btn dn-btn-outline !h-10 px-3 text-xs" onClick={() => setPaused(true)}>
                        <Pause className="h-3.5 w-3.5" /> Pause
                      </button>
                      <button type="button" className="dn-btn dn-btn-outline !h-10 px-3 text-xs" onClick={() => setMinutes((m) => m + 5)}>
                        +5 min
                      </button>
                    </>
                  ) : null}
                  <button type="button" className="dn-btn dn-btn-primary !h-10 px-4 text-xs" onClick={() => setStep(4)}>
                    <Square className="h-3.5 w-3.5" /> Finish session
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
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
              <button type="button" className="dn-btn dn-btn-primary md:col-span-2" onClick={() => setStep(5)}>
                Continue to payment
              </button>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => { setPayMethod("cash"); setStep(6); }} className="snooker-glass p-5 text-left">
                <p className="text-lg font-semibold text-[#0f172a]">Cash</p>
                <p className="mt-1 font-mono text-sm text-[#0f766e]">Collect {money(total)}</p>
              </button>
              <button type="button" onClick={() => { setPayMethod("udhar"); setStep(6); }} className="snooker-glass p-5 text-left">
                <p className="inline-flex items-center gap-2 text-lg font-semibold text-[#0f172a]">
                  <Wallet className="h-4 w-4" /> Udhar
                </p>
                <p className="mt-1 text-sm text-[#64748b]">Post to player credit ledger</p>
              </button>
            </div>
          ) : null}

          {step >= 6 ? (
            <div className="snooker-glass p-5">
              <p className="inline-flex items-center gap-2 font-semibold text-[#0f172a]">
                <Receipt className="h-4 w-4 text-[#059669]" /> Session receipt
              </p>
              <dl className="mt-4 space-y-2 font-mono text-sm">
                <div className="flex justify-between text-[#64748b]"><dt>Table</dt><dd className="text-[#0f172a]">{table?.name}</dd></div>
                <div className="flex justify-between text-[#64748b]"><dt>Game</dt><dd className="text-[#0f172a]">{gameTypeLabel(gameType)}</dd></div>
                <div className="flex justify-between text-[#64748b]"><dt>Subtotal</dt><dd className="text-[#0f172a]">{money(rate)}</dd></div>
                <div className="flex justify-between text-[#64748b]"><dt>Discount ({discountReason})</dt><dd className="text-[#d97706]">- {money(discount)}</dd></div>
                <div className="flex justify-between text-base font-semibold text-[#0f172a]"><dt>Total · {payMethod}</dt><dd className="text-[#0f766e]">{money(total)}</dd></div>
              </dl>
              <button type="button" className="dn-btn dn-btn-outline mt-4" onClick={reset}>
                Close · table available
              </button>
            </div>
          ) : null}
        </div>
      </GlassPanel>

      <aside className="space-y-4">
        <GlassPanel>
          <HudLabel>Live sessions</HudLabel>
          <ul className="mt-3 space-y-3">
            {SNOOKER_TABLES.filter((t) => t.session).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 border-b border-[#e2e8f0] pb-2 last:border-0">
                <span>
                  <span className="block text-sm font-semibold text-[#0f172a]">{t.name}</span>
                  <span className="text-xs text-[#64748b]">{t.session?.player} · {gameTypeLabel(t.session!.gameType)}</span>
                </span>
                <span className="font-mono text-sm text-[#0f766e]">{t.session?.elapsedMin}m</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
        <GlassPanel>
          <HudLabel>Billing models</HudLabel>
          <ul className="mt-3 space-y-3">
            {SNOOKER_BILLING_MODELS.map((model) => (
              <li key={model.id}>
                <p className="font-medium text-[#0f172a]">{model.name}</p>
                <p className="text-xs text-[#64748b]">
                  {model.model} · {money(model.defaultRate)}
                  {model.id === "century" ? "/min" : ""}
                </p>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </aside>
    </div>
  );
}

function wrapTable(node: ReactNode) {
  return <div className="snooker-table-wrap">{node}</div>;
}

function PricingView() {
  return wrapTable(
    <DataTable
      columns={[
        { key: "table", label: "Table group" },
        { key: "single", label: "Single Game" },
        { key: "double", label: "Double Game" },
        { key: "century", label: "Century / min" },
        { key: "minMinutes", label: "Min duration" },
        { key: "rounding", label: "Rounding" },
      ]}
      rows={SNOOKER_PRICING.map((row) => ({
        table: row.table,
        single: money(row.single),
        double: money(row.double),
        century: money(row.century),
        minMinutes: `${row.minMinutes} min`,
        rounding: row.rounding,
      }))}
    />,
  );
}

function CustomersView() {
  const maxSpend = Math.max(...SNOOKER_CUSTOMERS.map((row) => row.spend));
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {SNOOKER_CUSTOMERS.map((row) => (
        <article key={row.name} className="snooker-glass p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-lg font-semibold text-[#0f172a]">{row.name}</p>
              <p className="font-mono text-xs text-[#64748b]">{row.phone}</p>
            </div>
            <span className="snooker-led">{row.visits} visits</span>
          </div>
          <p className="mt-4 font-mono text-xl text-[#0f766e]">{money(row.spend)}</p>
          <div className="snooker-bar mt-2"><i style={{ width: `${(row.spend / maxSpend) * 100}%` }} /></div>
          <p className="mt-3 text-xs text-[#64748b]">
            Credit {money(row.credit)} · {row.notes}
          </p>
        </article>
      ))}
    </div>
  );
}

function CreditView() {
  return wrapTable(
    <DataTable
      columns={[
        { key: "date", label: "When" },
        { key: "player", label: "Player" },
        { key: "type", label: "Entry" },
        { key: "amount", label: "Amount" },
        { key: "balance", label: "Balance" },
        { key: "status", label: "Status" },
      ]}
      rows={SNOOKER_CREDIT_LEDGER.map((row) => ({
        ...row,
        amount: money(row.amount),
        balance: money(row.balance),
      }))}
    />,
  );
}

function DiscountsView() {
  return wrapTable(
    <DataTable
      columns={[
        { key: "time", label: "Time" },
        { key: "session", label: "Session" },
        { key: "type", label: "Type" },
        { key: "amount", label: "Amount" },
        { key: "reason", label: "Reason" },
        { key: "by", label: "By" },
        { key: "approval", label: "Approval" },
      ]}
      rows={SNOOKER_DISCOUNTS}
    />,
  );
}

function ExpensesView() {
  return wrapTable(
    <DataTable
      columns={[
        { key: "ref", label: "Ref" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount" },
        { key: "date", label: "Date" },
        { key: "status", label: "Approval" },
      ]}
      rows={SNOOKER_EXPENSES.map((row) => ({
        ...row,
        amount: money(row.amount),
      }))}
    />,
  );
}

function ShiftsView() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GlassPanel padded>
        <HudLabel>Daily opening</HudLabel>
        <h2 className="mt-1 text-xl font-semibold text-[#0f172a]">Business date 18 Aug 2026</h2>
        <dl className="mt-5 space-y-3 font-mono text-sm">
          <div className="flex justify-between text-[#64748b]"><dt>Cashier</dt><dd className="text-[#0f172a]">Ali Raza</dd></div>
          <div className="flex justify-between text-[#64748b]"><dt>Opening time</dt><dd className="text-[#0f172a]">09:01</dd></div>
          <div className="flex justify-between text-[#64748b]"><dt>Opening cash</dt><dd className="text-[#0f766e]">{money(12000)}</dd></div>
        </dl>
      </GlassPanel>
      <GlassPanel padded>
        <HudLabel>Daily closing</HudLabel>
        <h2 className="mt-1 text-xl font-semibold text-[#0f172a]">Cash reconciliation</h2>
        <dl className="mt-5 space-y-3 font-mono text-sm">
          <div className="flex justify-between text-[#64748b]"><dt>Expected cash</dt><dd className="text-[#0f172a]">{money(42880)}</dd></div>
          <div className="flex justify-between text-[#64748b]"><dt>Actual cash</dt><dd className="text-[#0f172a]">{money(42800)}</dd></div>
          <div className="flex justify-between font-semibold text-[#d97706]">
            <dt>Variance</dt>
            <dd>{money(80)} short · approval required</dd>
          </div>
        </dl>
        <div className="snooker-bar mt-5"><i style={{ width: "99%" }} /></div>
      </GlassPanel>
    </div>
  );
}

function ReportsView() {
  const cards = [
    { label: "Sales", value: 86400, max: 100000 },
    { label: "Profit", value: 31800, max: 50000 },
    { label: "Expenses", value: 8500, max: 30000 },
    { label: "Credit outstanding", value: 27000, max: 40000 },
    { label: "Discounts", value: 285, max: 2000 },
    { label: "Cash in drawer", value: 42800, max: 50000 },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className="snooker-glass p-4">
          <HudLabel>{card.label}</HudLabel>
          <p className="mt-2 font-mono text-2xl font-bold text-[#0f766e]">{money(card.value)}</p>
          <div className="snooker-bar mt-3"><i style={{ width: `${(card.value / card.max) * 100}%` }} /></div>
        </article>
      ))}
    </div>
  );
}

function StaffView() {
  const roles = ["Owner", "Manager", "Cashier", "Accountant", "Viewer", "Super Admin"];
  const perms = ["View", "Create", "Edit", "Delete", "Approve"];
  const matrix = useMemo(
    () => ({
      Owner: [true, true, true, true, true],
      Manager: [true, true, true, false, true],
      Cashier: [true, true, true, false, false],
      Accountant: [true, true, false, false, true],
      Viewer: [true, false, false, false, false],
      "Super Admin": [true, true, true, true, true],
    }),
    [],
  );

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SNOOKER_STAFF.map((row) => (
          <article key={row.name} className="snooker-glass p-4">
            <p className="text-lg font-semibold text-[#0f172a]">{row.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#64748b]">{row.role} · {row.branch}</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="snooker-led"><i /> {row.status}</span>
              <span className="font-mono text-[#64748b]">{row.joined}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="snooker-table-wrap">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3">Role</th>
              {perms.map((perm) => (
                <th key={perm} className="px-4 py-3">{perm}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role} className="border-t border-[#e2e8f0]">
                <td className="px-4 py-2.5 font-medium">{role}</td>
                {matrix[role as keyof typeof matrix].map((on, index) => (
                  <td key={perms[index]} className="px-4 py-2.5">
                    {on ? <span className="text-[#059669]">●</span> : <span className="text-[#cbd5e1]">○</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AuditView() {
  return wrapTable(
    <DataTable
      columns={[
        { key: "time", label: "When" },
        { key: "actor", label: "Who" },
        { key: "action", label: "Action" },
        { key: "detail", label: "Detail" },
      ]}
      rows={SNOOKER_AUDIT}
    />,
  );
}

function NotificationsView() {
  return (
    <ul className="space-y-2">
      {SNOOKER_NOTIFICATIONS.map((item) => (
        <li key={item.text} className="snooker-glass flex items-start gap-3 px-4 py-3">
          <Bell className={cn("mt-0.5 h-4 w-4", item.level === "alert" ? "text-[#dc2626]" : item.level === "warn" ? "text-[#d97706]" : "text-[#0f766e]")} />
          <div>
            <p className="snooker-kicker">{item.level}</p>
            <p className="mt-1 text-sm text-[#0f172a]">{item.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function BranchesView() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {SNOOKER_BRANCHES.map((row) => (
        <article key={row.name} className="snooker-glass p-5">
          <HudLabel>{row.hours}</HudLabel>
          <h2 className="mt-1 text-2xl font-semibold text-[#0f172a]">{row.name}</h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <HudStat label="Tables" value={String(row.tables)} />
            <HudStat label="Staff" value={String(row.staff)} />
            <HudStat label="Today" value={money(row.today)} accent="#0f766e" />
          </div>
        </article>
      ))}
    </div>
  );
}

function SettingsView() {
  const fields = [
    { label: "Single Game default", value: "Rs 300" },
    { label: "Double Game default", value: "Rs 500" },
    { label: "Century per minute", value: "Rs 20 · min 15 min · round up 5" },
    { label: "Credit limit default", value: "Rs 10,000" },
    { label: "Discount approval above", value: "Rs 200 or 15%" },
    { label: "Operating hours", value: "12:00–02:00" },
    { label: "Notifications", value: "Overdue credit, cash variance, large discount" },
    { label: "Backup", value: "Nightly 03:00 Asia/Karachi" },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="snooker-glass px-4 py-3">
          <p className="snooker-kicker">{field.label}</p>
          <p className="mt-2 text-sm font-semibold text-[#0f172a]">{field.value}</p>
        </div>
      ))}
    </div>
  );
}

function FutureModuleView({ moduleId }: { moduleId: string }) {
  const item = SNOOKER_PRODUCT_SCOPE.find((row) => row.sidebarModule === moduleId);
  return (
    <article className="snooker-glass border-dashed p-8">
      <HudLabel>Future module</HudLabel>
      <h2 className="mt-2 text-2xl font-semibold text-[#0f172a]">{item?.name ?? moduleId}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#64748b]">{item?.description}</p>
    </article>
  );
}
