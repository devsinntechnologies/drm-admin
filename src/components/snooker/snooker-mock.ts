export type SnookerTableStatus = "available" | "occupied" | "reserved" | "maintenance";
export type SnookerTableType = "snooker" | "pool" | "century";
export type SnookerGameType = "single" | "double" | "century";

export type SnookerTable = {
  id: string;
  name: string;
  type: SnookerTableType;
  status: SnookerTableStatus;
  singleRate: number;
  doubleRate: number;
  centuryPerMinute: number;
  session?: {
    gameType: SnookerGameType;
    player: string;
    startedAt: string;
    elapsedMin: number;
    paused: boolean;
  };
};

export const SNOOKER_TABLES: SnookerTable[] = [
  {
    id: "t1",
    name: "Table 1",
    type: "snooker",
    status: "occupied",
    singleRate: 300,
    doubleRate: 500,
    centuryPerMinute: 20,
    session: { gameType: "single", player: "Ahmed Raza", startedAt: "14:10", elapsedMin: 28, paused: false },
  },
  {
    id: "t2",
    name: "Table 2",
    type: "snooker",
    status: "occupied",
    singleRate: 300,
    doubleRate: 500,
    centuryPerMinute: 20,
    session: { gameType: "double", player: "Hassan & Bilal", startedAt: "14:22", elapsedMin: 16, paused: false },
  },
  {
    id: "t3",
    name: "Table 3",
    type: "pool",
    status: "available",
    singleRate: 250,
    doubleRate: 400,
    centuryPerMinute: 18,
  },
  {
    id: "t4",
    name: "Table 4",
    type: "century",
    status: "occupied",
    singleRate: 350,
    doubleRate: 600,
    centuryPerMinute: 25,
    session: { gameType: "century", player: "Usman Khan", startedAt: "13:48", elapsedMin: 54, paused: false },
  },
  {
    id: "t5",
    name: "Table 5",
    type: "snooker",
    status: "reserved",
    singleRate: 300,
    doubleRate: 500,
    centuryPerMinute: 20,
  },
  {
    id: "t6",
    name: "Table 6",
    type: "pool",
    status: "available",
    singleRate: 250,
    doubleRate: 400,
    centuryPerMinute: 18,
  },
  {
    id: "t7",
    name: "Table 7",
    type: "century",
    status: "occupied",
    singleRate: 350,
    doubleRate: 600,
    centuryPerMinute: 25,
    session: { gameType: "century", player: "Sana Malik", startedAt: "14:05", elapsedMin: 32, paused: true },
  },
  {
    id: "t8",
    name: "Table 8",
    type: "snooker",
    status: "maintenance",
    singleRate: 300,
    doubleRate: 500,
    centuryPerMinute: 20,
  },
  {
    id: "t9",
    name: "Table 9",
    type: "pool",
    status: "available",
    singleRate: 250,
    doubleRate: 400,
    centuryPerMinute: 18,
  },
  {
    id: "t10",
    name: "Table 10",
    type: "snooker",
    status: "occupied",
    singleRate: 300,
    doubleRate: 500,
    centuryPerMinute: 20,
    session: { gameType: "single", player: "Walk-in", startedAt: "14:31", elapsedMin: 8, paused: false },
  },
  {
    id: "t11",
    name: "Table 11",
    type: "century",
    status: "available",
    singleRate: 350,
    doubleRate: 600,
    centuryPerMinute: 25,
  },
  {
    id: "t12",
    name: "Table 12",
    type: "snooker",
    status: "occupied",
    singleRate: 300,
    doubleRate: 500,
    centuryPerMinute: 20,
    session: { gameType: "double", player: "Club Members", startedAt: "13:55", elapsedMin: 42, paused: false },
  },
];

export const SNOOKER_CUSTOMERS = [
  { name: "Ahmed Raza", phone: "0300-1112233", visits: 48, spend: 28600, credit: 4500, notes: "Prefers Table 1" },
  { name: "Usman Khan", phone: "0321-8899001", visits: 31, spend: 41200, credit: 12000, notes: "Century regular" },
  { name: "Sana Malik", phone: "0333-4455667", visits: 22, spend: 19800, credit: 0, notes: "Member" },
  { name: "Hassan Ali", phone: "0345-7788990", visits: 16, spend: 9400, credit: 2500, notes: "Pays weekly" },
  { name: "Bilal Ahmed", phone: "0312-2233445", visits: 9, spend: 6100, credit: 8000, notes: "Limit PKR 10,000" },
];

export const SNOOKER_CREDIT_LEDGER = [
  { date: "Today 13:20", player: "Usman Khan", type: "Udhar sale", amount: 1250, balance: 12000, status: "Open" },
  { date: "Today 11:05", player: "Ahmed Raza", type: "Partial recovery", amount: -1500, balance: 4500, status: "Partial" },
  { date: "Yesterday", player: "Bilal Ahmed", type: "Udhar sale", amount: 800, balance: 8000, status: "Overdue" },
  { date: "Yesterday", player: "Hassan Ali", type: "Recovery", amount: -2500, balance: 2500, status: "Open" },
  { date: "Mon", player: "Walk-in #88", type: "Write-off", amount: -400, balance: 0, status: "Written off" },
];

export const SNOOKER_DISCOUNTS = [
  { time: "14:18", session: "T2 Double", type: "Fixed", amount: "Rs 50", reason: "Regular player", by: "Cashier", approval: "Auto" },
  { time: "13:40", session: "T4 Century", type: "10%", amount: "Rs 135", reason: "Member night", by: "Manager", approval: "Approved" },
  { time: "12:05", session: "T1 Single", type: "Fixed", amount: "Rs 100", reason: "Complaint — cloth", by: "Cashier", approval: "Pending" },
];

export const SNOOKER_EXPENSES = [
  { ref: "EXP-104", category: "Electricity", amount: 42000, date: "01 Aug", status: "Approved" },
  { ref: "EXP-103", category: "Salaries", amount: 185000, date: "01 Aug", status: "Approved" },
  { ref: "EXP-102", category: "Table repair", amount: 8500, date: "Today", status: "Pending" },
  { ref: "EXP-101", category: "Cleaning", amount: 6000, date: "Yesterday", status: "Approved" },
  { ref: "EXP-100", category: "Rent", amount: 220000, date: "01 Aug", status: "Approved" },
];

export const SNOOKER_STAFF = [
  { name: "Imran Sheikh", role: "Owner", branch: "Gulberg", status: "Active", joined: "Jan 2022" },
  { name: "Nadia Pervez", role: "Manager", branch: "Gulberg", status: "Active", joined: "Mar 2023" },
  { name: "Ali Raza", role: "Cashier", branch: "Gulberg", status: "On shift", joined: "Aug 2024" },
  { name: "Farah Noor", role: "Accountant", branch: "All", status: "Active", joined: "Nov 2023" },
  { name: "Hamza Qureshi", role: "Cashier", branch: "DHA", status: "Off", joined: "Feb 2025" },
];

export const SNOOKER_AUDIT = [
  { time: "14:18", actor: "Ali Raza", action: "Discount applied", detail: "T2 Double · Rs 50 · Regular player" },
  { time: "13:52", actor: "Nadia Pervez", action: "Century rate changed", detail: "Table 4 · Rs 22 → Rs 25 / min" },
  { time: "13:20", actor: "Ali Raza", action: "Udhar sale", detail: "Usman Khan · Rs 1,250" },
  { time: "09:01", actor: "Ali Raza", action: "Daily opening", detail: "Opening cash Rs 12,000" },
  { time: "Yesterday 23:12", actor: "Nadia Pervez", action: "Daily closing approved", detail: "Variance Rs 80 · accepted" },
];

export const SNOOKER_NOTIFICATIONS = [
  { level: "alert", text: "Bilal Ahmed Udhar overdue · Rs 8,000 past 14 days" },
  { level: "warn", text: "Table 8 in maintenance since yesterday — cloth replacement" },
  { level: "warn", text: "Discount Rs 100 on T1 pending manager approval" },
  { level: "info", text: "DHA branch daily closing not submitted" },
  { level: "info", text: "Table 5 reserved for 16:00 — deposit received" },
];

export const SNOOKER_BRANCHES = [
  { name: "Gulberg Club", tables: 12, staff: 8, hours: "12:00–02:00", today: 86400 },
  { name: "DHA Cue Hall", tables: 8, staff: 5, hours: "14:00–01:00", today: 41200 },
];

export const SNOOKER_PRICING = [
  { table: "Standard snooker (1–3, 5, 10, 12)", single: 300, double: 500, century: 20, minMinutes: 15, rounding: "Up to 5 min" },
  { table: "Pool (3, 6, 9)", single: 250, double: 400, century: 18, minMinutes: 15, rounding: "Up to 5 min" },
  { table: "Century premium (4, 7, 11)", single: 350, double: 600, century: 25, minMinutes: 20, rounding: "Up to 5 min" },
];

export function money(amount: number, currency = "PKR") {
  const prefix = currency === "PKR" ? "Rs" : currency;
  return `${prefix} ${amount.toLocaleString("en-PK")}`;
}

export function tableStatusLabel(status: SnookerTableStatus) {
  if (status === "available") return "Available";
  if (status === "occupied") return "Occupied";
  if (status === "reserved") return "Reserved";
  return "Maintenance";
}

export function gameTypeLabel(type: SnookerGameType) {
  if (type === "single") return "Single Game";
  if (type === "double") return "Double Game";
  return "Century";
}
