"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal, flushSync } from "react-dom";
import { Bike, Car, LogOut, ParkingCircle, Printer, RefreshCw, Save, Search, Ticket, X } from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { PortalPage } from "@/components/admin/PortalPage";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { usePrinters } from "@/hooks/usePrinters";
import { ParkingSlip, SLIP_HEIGHT_MM, slipWidthFor } from "@/components/parking/ParkingSlip";
import { parseParkingSettings } from "@/lib/module-feature-settings";
import { parseReceiptSettings } from "@/lib/receipt-templates";
import { resolveMediaUrl } from "@/lib/media-url";
import { apiClient } from "@/lib/api-client";
import { canManageSoftwareAndWebsite } from "@/lib/role-access";
import { cn } from "@/lib/utils";

type VehicleType = "bike" | "car";
type Status = "all" | "parked" | "exited";
type Rates = { bikePrice: number | string | null; carPrice: number | string | null };
type ParkingTicket = {
  id: string; invoiceNumber: string; customerName: string; customerPhone: string;
  vehicleNumber: string; vehicleType: VehicleType; parkingFee: number | string;
  createdAt: string; status: "parked" | "exited"; exitedAt: string | null;
};
type TicketPage = { items: ParkingTicket[]; total: number; page: number; pages: number; limit: number };
type Summary = { active: number; bikes: number; cars: number; entries: number; exits: number; charges: number };
const emptyPage: TicketPage = { items: [], total: 0, page: 1, pages: 1, limit: 20 };
const emptySummary: Summary = { active: 0, bikes: 0, cars: 0, entries: 0, exits: 0, charges: 0 };
const inputClass = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

/** Most blank slips one print run accepts (matches the desktop app). */
const MAX_SLIPS = 500;

function money(value: unknown, currency: string) {
  if (value == null || value === "" || !Number.isFinite(Number(value))) return "Not set";
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value));
}
function date(value: string | null) { return value ? new Date(value).toLocaleString() : "—"; }

export default function ParkingPage() {
  const { token, role } = useAuth();
  const businessId = useActiveBusinessId();
  const { currency, businessName, logoUrl, templateConfig } = useBusinessTemplate();
  // Admin → Software Control → Parking decides which sections staff see.
  const sections = parseParkingSettings(templateConfig?.moduleSettings);
  // Same "Powered by DigiNizam" switch as invoices.
  const slipPoweredBy = parseReceiptSettings(templateConfig?.moduleSettings).showPoweredBy;
  const usesParkingData = sections.showSummary || sections.showPrices || sections.showNewEntry || sections.showVehicleList;
  const receiptLogoUrl = resolveMediaUrl(logoUrl, "receipt-logos") ?? resolveMediaUrl(logoUrl);
  const [rates, setRates] = useState<Rates>({ bikePrice: null, carPrice: null });
  const [bikePrice, setBikePrice] = useState("");
  const [carPrice, setCarPrice] = useState("");
  const [tickets, setTickets] = useState<TicketPage>(emptyPage);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [selectedTicket, setSelectedTicket] = useState<ParkingTicket | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>("bike");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingRates, setSavingRates] = useState(false);
  const [issuingTicket, setIssuingTicket] = useState(false);
  const [exiting, setExiting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ratesDirty = useRef(false);
  const requestVersion = useRef(0);
  const pendingEntry = useRef(false);
  const entryRequest = useRef<{ key: string; id: string } | null>(null);
  const selectedRate = rates[vehicleType === "bike" ? "bikePrice" : "carPrice"];
  const { data: printerData } = usePrinters(businessId);
  const receiptPrinter = printerData?.printers.find(p => p.isEnabled && p.role === "receipt" && p.isConnected)
    ?? printerData?.printers.find(p => p.isEnabled && p.role === "receipt");
  const slipWidthMm = slipWidthFor(receiptPrinter?.paperWidth);
  const [slipQuantity, setSlipQuantity] = useState("");
  const [slipPrintCount, setSlipPrintCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    ratesDirty.current = false;
    entryRequest.current = null;
    setSelectedTicket(null);
    setRates({ bikePrice: null, carPrice: null });
    setTickets(emptyPage);
    setSummary(emptySummary);
    return () => { requestVersion.current += 1; };
  }, [businessId]);

  const loadData = useCallback(async (silent = false) => {
    // Free slips alone need no parking data, so skip the requests (and their polling).
    if (!token || !businessId || !usesParkingData) { setLoading(false); return; }
    const version = ++requestVersion.current;
    if (!silent) setLoading(true);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const query = new URLSearchParams({ page: String(page), limit: "20", search, status, vehicleType: typeFilter });
    const period = new URLSearchParams({ from: start.toISOString(), to: end.toISOString() });
    try {
      const [nextRates, rawTickets, nextSummary] = await Promise.all([
        apiClient.get<Rates>("/parking/rates", token, businessId),
        apiClient.get<TicketPage | { data: TicketPage }>(`/parking/tickets/page?${query}`, token, businessId),
        apiClient.get<Summary>(`/parking/summary?${period}`, token, businessId),
      ]);
      if (version !== requestVersion.current) return;
      // The response envelope adds `pagination` (page/limit keys), so apiClient returns { data, pagination }.
      const ticketPage = "items" in rawTickets ? rawTickets : rawTickets.data;
      const nextTickets: TicketPage = { ...emptyPage, ...ticketPage, items: Array.isArray(ticketPage?.items) ? ticketPage.items : [] };
      setRates(nextRates); setTickets(nextTickets); setSummary(nextSummary); setError(null);
      if (!ratesDirty.current) {
        setBikePrice(nextRates.bikePrice == null ? "" : String(nextRates.bikePrice));
        setCarPrice(nextRates.carPrice == null ? "" : String(nextRates.carPrice));
      }
      if (page > nextTickets.pages) setPage(nextTickets.pages);
    } catch (cause) {
      if (version === requestVersion.current) setError(cause instanceof Error ? cause.message : "Could not load parking. Please retry.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [businessId, token, page, search, status, typeFilter, usesParkingData]);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void loadData(true); }, 30000);
    return () => window.clearInterval(timer);
  }, [loadData]);
  useEffect(() => {
    const clear = () => {
      document.body.classList.remove("parking-print-mode", "parking-slip-print-mode");
      setSlipPrintCount(0);
    };
    window.addEventListener("afterprint", clear);
    return () => { window.removeEventListener("afterprint", clear); clear(); };
  }, []);

  async function saveRates(event: FormEvent) {
    event.preventDefault();
    if (![bikePrice, carPrice].every(value => /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) <= 9999999999.99)) {
      toast.error("Enter both prices with at most two decimal places. Enter 0 for free parking."); return;
    }
    if (!token || !businessId || savingRates) return;
    setSavingRates(true);
    try {
      const saved = await apiClient.put<Rates>("/parking/rates", { bikePrice: Number(bikePrice), carPrice: Number(carPrice) }, token, businessId);
      ratesDirty.current = false; setRates(saved);
      setBikePrice(String(saved.bikePrice)); setCarPrice(String(saved.carPrice));
      toast.success("Prices saved. Existing receipts keep their original charge.");
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not save prices."); }
    finally { setSavingRates(false); }
  }

  async function issueTicket(event: FormEvent) {
    event.preventDefault();
    if (!token || !businessId || pendingEntry.current || selectedRate == null) return;
    if (!customerName.trim() || !customerPhone.trim() || !/[a-z0-9]/i.test(vehicleNumber)) {
      toast.error("Enter a customer name, phone number, and valid vehicle number."); return;
    }
    const details = { customerName: customerName.trim(), customerPhone: customerPhone.trim(), vehicleNumber: vehicleNumber.trim().toUpperCase(), vehicleType };
    const key = JSON.stringify(details);
    if (entryRequest.current?.key !== key) entryRequest.current = { key, id: crypto.randomUUID() };
    pendingEntry.current = true; setIssuingTicket(true);
    try {
      const ticket = await apiClient.post<ParkingTicket>("/parking/tickets", { ...details, clientRequestId: entryRequest.current.id }, token, businessId);
      setSelectedTicket(ticket); setCustomerName(""); setCustomerPhone(""); setVehicleNumber(""); entryRequest.current = null;
      await loadData(true);
      toast.success(`Entry recorded for ${ticket.vehicleNumber}. Receipt is ready.`);
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not record entry. You can retry safely."); }
    finally { pendingEntry.current = false; setIssuingTicket(false); }
  }

  async function markExit(ticket: ParkingTicket) {
    if (!token || !businessId || exiting || !window.confirm(`Confirm ${ticket.vehicleNumber} has left the parking area?`)) return;
    setExiting(ticket.id);
    try {
      const updated = await apiClient.patch<ParkingTicket>(`/parking/tickets/${ticket.id}/exit`, {}, token, businessId);
      setSelectedTicket(current => current?.id === ticket.id ? updated : current);
      await loadData(true); toast.success(`${ticket.vehicleNumber} marked as exited.`);
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not record exit."); }
    finally { setExiting(null); }
  }

  function printTicket(ticket: ParkingTicket) {
    flushSync(() => setSelectedTicket(ticket));
    document.body.classList.add("parking-print-mode");
    window.print();
  }

  // Blank slips are printed by the browser only: no ticket, fee, or sale is recorded.
  function printSlips(event: FormEvent) {
    event.preventDefault();
    if (slipPrintCount) return;
    const value = slipQuantity.trim();
    const count = /^\d+$/.test(value) ? Number(value) : 0;
    if (count < 1 || count > MAX_SLIPS) { toast.error(`Enter a whole number from 1 to ${MAX_SLIPS}.`); return; }
    flushSync(() => setSlipPrintCount(count));
    document.body.classList.add("parking-slip-print-mode");
    try {
      window.print();
      toast.success(`Print dialog opened for ${count} slips. Choose your receipt printer to print them.`);
    } catch {
      toast.error("Could not open the print dialog. Check your printer and try again.");
    } finally {
      // afterprint also clears this; the timeout covers browsers that skip it.
      window.setTimeout(() => {
        document.body.classList.remove("parking-slip-print-mode");
        setSlipPrintCount(0);
      }, 1000);
    }
  }

  return <AdminShell activeTab="parking" pageTitle="Parking" pageSubtitle="Vehicle entry, exit, and receipts">
    <PortalPage className="space-y-5">
      <style>{`@media print {
        body.parking-print-mode * { visibility: hidden !important; }
        body.parking-print-mode #parking-print-invoice, body.parking-print-mode #parking-print-invoice * { visibility: visible !important; }
        body.parking-print-mode #parking-print-invoice { position: absolute !important; top: 0; left: 0; width: 80mm; max-width: 100%; border: 0; padding: 5mm; margin: 0; }
      }
      #parking-slip-print { display: none; }
      @media print {
        body.parking-slip-print-mode > :not(#parking-slip-print) { display: none !important; }
        body.parking-slip-print-mode #parking-slip-print { display: block; }
        body.parking-slip-print-mode #parking-slip-print .parking-slip { break-after: page; border: 0; }
        body.parking-slip-print-mode #parking-slip-print .parking-slip:last-child { break-after: auto; }
      }`}</style>
      {slipPrintCount > 0 && <style>{`@page { size: ${slipWidthMm}mm ${SLIP_HEIGHT_MM}mm; margin: 0; }`}</style>}
      {slipPrintCount > 0 && createPortal(<div id="parking-slip-print">{Array.from({ length: slipPrintCount }, (_, i) => <ParkingSlip key={i} widthMm={slipWidthMm} businessName={businessName} logoUrl={receiptLogoUrl} showPoweredBy={slipPoweredBy} />)}</div>, document.body)}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Parking</h1><p className="mt-1 text-sm text-slate-500">{sections.showNewEntry || sections.showVehicleList ? "Choose a vehicle, record its entry, and mark its exit when it leaves." : "Print free parking slips for customers."}</p></div>
        {usesParkingData && <button className={buttonClass} disabled={loading} onClick={() => void loadData()}><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />Refresh</button>}
      </div>
      {usesParkingData && error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error} <button className="ml-2 font-bold underline" onClick={() => void loadData()}>Retry</button></div>}
      {!usesParkingData && !sections.showFreeSlips && <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No parking sections are turned on for this business. An administrator can enable them in Software Control → Parking.</p>}
      {sections.showSummary && <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Parked now" value={summary.active} detail={`${summary.bikes} bikes · ${summary.cars} cars`} />
        <Stat label="Entries today" value={summary.entries} detail="Recorded at vehicle entry" />
        <Stat label="Exits today" value={summary.exits} detail="Vehicles marked as left" />
        <Stat label="Entry charges today" value={money(summary.charges, currency)} detail="Flat fee per visit" />
      </div>}
      {sections.showFreeSlips && <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Free parking slips</h2>
        <p className="mt-1 text-sm text-slate-500">Prints blank slips to fill in by hand. Parking is free: no charge or sale is recorded.</p>
        <div className="mt-4 flex flex-wrap items-end gap-5">
          <ParkingSlip widthMm={slipWidthMm} businessName={businessName} logoUrl={receiptLogoUrl} showPoweredBy={slipPoweredBy} preview />
          <form onSubmit={printSlips} className="flex w-full max-w-xs flex-col gap-3">
            <label className="text-sm font-semibold">Quantity<input className={inputClass} inputMode="numeric" maxLength={3} placeholder="e.g. 50" value={slipQuantity} onChange={e => setSlipQuantity(e.target.value.replace(/\D/g, ""))} /></label>
            <button type="submit" disabled={slipPrintCount > 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Printer className="h-5 w-5" />{slipPrintCount > 0 ? "Opening print…" : "Print Tickets"}</button>
            <p className="text-xs text-slate-500">{slipWidthMm}mm slips{receiptPrinter ? ` · ${receiptPrinter.name}` : ""}. Each slip prints separately.</p>
          </form>
        </div>
      </section>}
      {sections.showPrices && <details className="rounded-xl border border-slate-200 bg-white p-4" open={rates.bikePrice == null || rates.carPrice == null}>
        <summary className="cursor-pointer text-sm font-bold text-slate-800">Parking prices · Bike {money(rates.bikePrice, currency)} · Car {money(rates.carPrice, currency)}</summary>
        <p className="my-3 text-sm text-slate-500">Set a flat charge for each visit. Entry receipts keep this price even if rates change later. Enter 0 for free parking.</p>
        {canManageSoftwareAndWebsite(role) ? <form onSubmit={saveRates} className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium">Bike price ({currency})<input className={inputClass} required inputMode="decimal" value={bikePrice} onChange={e => { ratesDirty.current = true; setBikePrice(e.target.value); }} /></label>
          <label className="text-sm font-medium">Car price ({currency})<input className={inputClass} required inputMode="decimal" value={carPrice} onChange={e => { ratesDirty.current = true; setCarPrice(e.target.value); }} /></label>
          <button className={buttonClass} disabled={savingRates}><Save className="h-4 w-4" />{savingRates ? "Saving…" : "Save prices"}</button>
        </form> : <p className="text-sm text-slate-500">Ask the business owner to change prices.</p>}
      </details>}
      {sections.showNewEntry && <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">New vehicle entry</h2>
        <form onSubmit={issueTicket} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <fieldset><legend className="mb-1.5 text-sm font-semibold">Vehicle type</legend><div className="flex gap-2">{(["bike", "car"] as const).map(type => {
              const Icon = type === "bike" ? Bike : Car;
              return <button key={type} type="button" aria-pressed={vehicleType === type} onClick={() => setVehicleType(type)} className={cn(buttonClass, "flex-1 capitalize", vehicleType === type && "border-blue-500 bg-blue-50 text-blue-700")}><Icon className="h-4 w-4" />{type}</button>;
            })}</div></fieldset>
            <label className="text-sm font-semibold">Vehicle number<input className={cn(inputClass, "uppercase")} required maxLength={40} placeholder="e.g. LEA-1234" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} /></label>
            <label className="text-sm font-semibold">Customer name<input className={inputClass} required maxLength={160} autoComplete="name" value={customerName} onChange={e => setCustomerName(e.target.value)} /></label>
            <label className="text-sm font-semibold">Phone number<input className={inputClass} required maxLength={32} inputMode="tel" autoComplete="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} /></label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 p-4">
            <div><p className="text-xs font-semibold uppercase text-blue-700">Charge for this visit</p><p className="text-2xl font-bold text-slate-900">{money(selectedRate, currency)}</p></div>
            <button type="submit" disabled={issuingTicket || loading || selectedRate == null} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Ticket className="h-5 w-5" />{issuingTicket ? "Recording…" : "Record entry & create receipt"}</button>
          </div>
          {selectedRate == null && <p className="text-sm text-amber-700">{sections.showPrices ? "Set this vehicle's price above before recording its entry." : "No price is set for this vehicle. An administrator must turn on Parking prices to set it."}</p>}
        </form>
      </section>}
      {(sections.showNewEntry || sections.showVehicleList) && selectedTicket && <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-bold">Parking receipt</h2><div className="flex gap-2"><button className={buttonClass} onClick={() => printTicket(selectedTicket)}><Printer className="h-4 w-4" />Print receipt</button><button className={buttonClass} aria-label="Close receipt" onClick={() => setSelectedTicket(null)}><X className="h-4 w-4" /></button></div></div>
        <div id="parking-print-invoice" className="mx-auto max-w-md rounded-xl border border-dashed border-slate-300 p-5 text-sm">
          <div className="mb-4 border-b pb-3 text-center">{receiptLogoUrl ? <img src={receiptLogoUrl} alt={`${businessName} logo`} className="mx-auto mb-2 max-h-10 max-w-28 object-contain" /> : <ParkingCircle className="mx-auto mb-2 h-7 w-7" />}<h3 className="text-lg font-bold">{businessName || "DigiNizam"}</h3><p>Parking receipt</p><p className="mt-2 font-mono text-xs">{selectedTicket.invoiceNumber}</p></div>
          <dl className="space-y-2">{[
            ["Vehicle", `${selectedTicket.vehicleNumber} (${selectedTicket.vehicleType})`], ["Customer", selectedTicket.customerName], ["Phone", selectedTicket.customerPhone],
            ["Entry", date(selectedTicket.createdAt)], ["Status", selectedTicket.status === "parked" ? "Parked" : "Exited"], ...(selectedTicket.exitedAt ? [["Exit", date(selectedTicket.exitedAt)]] : []),
          ].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="break-words text-right font-medium">{value}</dd></div>)}</dl>
          <div className="mt-4 flex justify-between border-t pt-3 text-lg font-bold"><span>Flat parking fee</span><span>{money(selectedTicket.parkingFee, currency)}</span></div>
          <p className="mt-4 text-center text-xs text-slate-500">Keep this receipt until your vehicle leaves.</p>
        </div>
      </section>}
      {sections.showVehicleList && <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Vehicles & receipts</h2>
        <div className="my-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-48 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input aria-label="Search parking tickets" className={cn(inputClass, "mt-0 pl-9")} maxLength={80} placeholder="Vehicle, customer, phone, or receipt number" value={searchInput} onChange={e => setSearchInput(e.target.value)} /></label>
          <select aria-label="Parking status" className={cn(inputClass, "mt-0 w-auto")} value={status} onChange={e => { setStatus(e.target.value as Status); setPage(1); }}><option value="all">All vehicles</option><option value="parked">Parked now</option><option value="exited">Exited</option></select>
          <select aria-label="Vehicle type filter" className={cn(inputClass, "mt-0 w-auto")} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}><option value="all">Bikes & cars</option><option value="bike">Bikes</option><option value="car">Cars</option></select>
        </div>
        <div className="overflow-x-auto" aria-busy={loading}><table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Vehicle / receipt", "Customer", "Entry / exit", "Status", "Charge", "Actions"].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead>
          <tbody>{tickets.items.map(ticket => <tr key={ticket.id} className="border-b border-slate-100">
            <td className="p-3"><p className="font-bold">{ticket.vehicleNumber} <span className="text-xs font-normal capitalize text-slate-500">{ticket.vehicleType}</span></p><p className="mt-1 font-mono text-xs text-slate-500">{ticket.invoiceNumber}</p></td>
            <td className="p-3"><p>{ticket.customerName}</p><p className="text-xs text-slate-500">{ticket.customerPhone}</p></td>
            <td className="p-3 text-xs"><p>In: {date(ticket.createdAt)}</p>{ticket.exitedAt && <p className="mt-1 text-slate-500">Out: {date(ticket.exitedAt)}</p>}</td>
            <td className="p-3"><span className={cn("rounded-full px-2 py-1 text-xs font-semibold", ticket.status === "parked" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>{ticket.status === "parked" ? "Parked" : "Exited"}</span></td>
            <td className="p-3 font-semibold">{money(ticket.parkingFee, currency)}</td>
            <td className="p-3"><div className="flex gap-2"><button className={buttonClass} onClick={() => setSelectedTicket(ticket)}>Receipt</button>{ticket.status === "parked" && <button className={cn(buttonClass, "text-blue-700")} disabled={!!exiting} onClick={() => void markExit(ticket)}><LogOut className="h-4 w-4" />{exiting === ticket.id ? "Saving…" : "Mark exit"}</button>}</div></td>
          </tr>)}</tbody>
        </table>{!tickets.items.length && <p className="py-10 text-center text-sm text-slate-500">{loading ? "Loading vehicles…" : search || status !== "all" || typeFilter !== "all" ? "No vehicles match these filters." : "No entries yet. Set prices, then record the first vehicle above."}</p>}</div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>{tickets.total ? `${(page - 1) * tickets.limit + 1}–${Math.min(page * tickets.limit, tickets.total)} of ${tickets.total}` : "0 records"}</span><div className="flex items-center gap-3"><button className={buttonClass} disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {tickets.pages}</span><button className={buttonClass} disabled={loading || page >= tickets.pages} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </section>}
    </PortalPage>
  </AdminShell>;
}

function Stat({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="my-1 break-words text-2xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{detail}</p></div>;
}
