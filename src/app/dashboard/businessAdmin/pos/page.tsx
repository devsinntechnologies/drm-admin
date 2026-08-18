"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";
import { ControlledSaleGate, GstBreakdown, InteractionAlertList } from "@/components/pharmacy/ClinicalAlerts";
import { Button } from "@/components/ui/button";
import { portalInputClass } from "@/components/admin/PortalPage";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { usePharmacyAction, usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import { usePharmacyMarket } from "@/hooks/usePharmacyMarket";
import { isControlledSchedule, prescriptionChargeAmount } from "@/lib/pharmacy-market";

type CartLine = {
  productId: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  gstRate: number;
  rxRequired?: boolean;
  controlledSchedule?: string | null;
};

type MedicineProfile = {
  productId: string;
  genericName?: string | null;
  saltName?: string | null;
  barcode?: string | null;
  manufacturer?: string | null;
  gstRate?: number;
  rxRequired?: boolean;
  controlledSchedule?: string | null;
  baseUnit?: string;
  product?: { id?: string; name?: string; price?: number };
};

function medicineSearchText(item: MedicineProfile) {
  return [
    item.product?.name,
    item.genericName,
    item.saltName,
    item.barcode,
    item.manufacturer,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function PosContent() {
  const { token, businessId, pending, run } = usePharmacyAction();
  const { market, money } = usePharmacyMarket();
  const { data: shift, reload: reloadShift } = usePharmacyQuery<any>("/pos/shifts/current");
  const { data: customers } = usePharmacyQuery<any>("/pharmacy/customers?limit=50");
  const { data: prescriptions } = usePharmacyQuery<any>("/pharmacy/prescriptions?status=received");
  const { data: catalog } = usePharmacyQuery<MedicineProfile[]>("/pharmacy-catalog");
  const { data: inventory } = usePharmacyQuery<any[]>("/pharmacy/inventory");
  const catalogRows = useMemo(() => asList<MedicineProfile>(catalog), [catalog]);
  const stockByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of asList<any>(inventory)) {
      if (row.productId) map.set(row.productId, Number(row.qtyBase || 0));
    }
    return map;
  }, [inventory]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MedicineProfile[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const [wallet, setWallet] = useState(0);
  const [prescriptionId, setPrescriptionId] = useState("");
  const [prescriptionChannel, setPrescriptionChannel] = useState("");
  const [nhsExemptionCode, setNhsExemptionCode] = useState(market.code === "UK" ? "PAID" : "");
  const [tenderTouched, setTenderTouched] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [doctorLicense, setDoctorLicense] = useState("");
  const [patientIdNumber, setPatientIdNumber] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [closingCash, setClosingCash] = useState("");
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const tax = cart.reduce((sum, line) => sum + (line.unitPrice * line.qty * line.gstRate) / 100, 0);
    const hasRx = cart.some((line) => line.rxRequired || isControlledSchedule(line.controlledSchedule));
    const channel = prescriptionChannel || (market.code === "UK" ? "nhs" : "paper");
    const nhsCharge = prescriptionChargeAmount(market, {
      hasRxItem: hasRx,
      prescriptionChannel: channel,
      nhsExemptionCode,
    });
    const total = Math.max(0, subtotal + tax + nhsCharge - Number(discount || 0));
    return {
      subtotal: roundMoney(subtotal),
      tax: roundMoney(tax),
      discount: roundMoney(Number(discount || 0)),
      prescriptionCharge: roundMoney(nhsCharge),
      total: roundMoney(total),
    };
  }, [cart, discount, market, nhsExemptionCode, prescriptionChannel]);

  const cartQtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of cart) map.set(line.productId, Number(line.qty || 0));
    return map;
  }, [cart]);

  const availableStock = (productId?: string | null) => {
    if (!productId) return 0;
    return Math.max(0, (stockByProductId.get(productId) || 0) - (cartQtyByProduct.get(productId) || 0));
  };

  const medicineId = (item: MedicineProfile) => item.productId || item.product?.id || "";
  const isInStock = (item: MedicineProfile) => availableStock(medicineId(item)) > 0;

  const nextSelectableIndex = (from: number, direction: 1 | -1) => {
    if (!suggestions.length) return -1;
    let index = from;
    for (let step = 0; step < suggestions.length; step += 1) {
      index = (index + direction + suggestions.length) % suggestions.length;
      if (isInStock(suggestions[index])) return index;
    }
    return -1;
  };

  const paid = roundMoney(Number(cash || 0) + Number(card || 0) + Number(wallet || 0));
  const due = roundMoney(totals.total - paid);
  const needsControlled = cart.some((line) => isControlledSchedule(line.controlledSchedule));
  const needsRx = cart.some((line) => line.rxRequired || isControlledSchedule(line.controlledSchedule));
  const walletMethod = market.paymentMethods.find((item) => !["cash", "card", "nhs_exempt"].includes(item.id));

  useEffect(() => {
    if (!tenderTouched) {
      setCash(totals.total);
      setCard(0);
    }
  }, [totals.total, tenderTouched]);

  useEffect(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const localMatches = catalogRows.filter((item) => medicineSearchText(item).includes(term));
    if (localMatches.length || catalogRows.length) {
      setSuggestions(localMatches.slice(0, 20));
      setSearching(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const results = await apiClient.get<MedicineProfile[]>(
          `/pharmacy-catalog?q=${encodeURIComponent(term)}`,
          token,
          businessId,
        );
        if (!cancelled) setSuggestions(asList<MedicineProfile>(results).slice(0, 20));
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, catalogRows, token, businessId]);

  useEffect(() => {
    const firstInStock = suggestions.findIndex((item) => isInStock(item));
    setHighlightedIndex(firstInStock);
  }, [suggestions, inventory, cart]);

  useEffect(() => {
    const el = document.getElementById(`pos-suggest-${highlightedIndex}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!searchBoxRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const addProfile = (profile: MedicineProfile) => {
    const productId = profile.productId || profile.product?.id;
    const name = profile.product?.name;
    if (!productId || !name) {
      toast.error("Medicine record is incomplete");
      return;
    }
    const remaining = availableStock(productId);
    if (remaining <= 0) {
      toast.error(`${name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === productId);
      if (existing) {
        return prev.map((line) =>
          line.productId === productId ? { ...line, qty: line.qty + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          productId,
          name,
          qty: 1,
          unit: profile.baseUnit || "tablet",
          unitPrice: Number(profile.product?.price || 0),
          gstRate: Number(profile.gstRate || 0),
          rxRequired: profile.rxRequired,
          controlledSchedule: profile.controlledSchedule,
        },
      ];
    });
    setQuery("");
    setSuggestions([]);
    setHighlightedIndex(-1);
    setShowSuggestions(false);
  };

  const addFromQuery = async () => {
    const term = query.trim();
    if (!term) return;
    const highlighted = highlightedIndex >= 0 ? suggestions[highlightedIndex] : undefined;
    if (highlighted && isInStock(highlighted)) {
      addProfile(highlighted);
      return;
    }
    const exactBarcode = suggestions.find(
      (item) => item.barcode && item.barcode.toLowerCase() === term.toLowerCase(),
    );
    if (exactBarcode) {
      addProfile(exactBarcode);
      return;
    }
    const firstInStock = suggestions.find((item) => isInStock(item));
    if (firstInStock) {
      addProfile(firstInStock);
      return;
    }
    if (suggestions[0]) {
      toast.error(`${suggestions[0].product?.name || "This medicine"} is out of stock`);
      return;
    }
    try {
      const profile = await apiClient.get<MedicineProfile>(
        `/pharmacy-catalog/barcode/${encodeURIComponent(term)}`,
        token,
        businessId,
      );
      if (!profile?.product) {
        toast.error("No medicine matched that name or barcode");
        return;
      }
      addProfile(profile);
    } catch {
      toast.error("No medicine matched that name or barcode");
    }
  };

  const checkCdss = async () => {
    if (!cart.length) return;
    try {
      const result = await apiClient.post<any>(
        "/cdss/check",
        { productIds: cart.map((line) => line.productId), customerId: customerId || undefined },
        token,
        businessId,
      );
      setAlerts(result.alerts || []);
      if (result.block) toast.error("Sale blocked by clinical checks");
      return result;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "CDSS check failed");
      return null;
    }
  };

  const checkout = async () => {
    const result = await checkCdss();
    if (result?.block) return;
    const cashAmount = roundMoney(Number(cash || 0));
    const cardAmount = roundMoney(Number(card || 0));
    const walletAmount = roundMoney(Number(wallet || 0));
    const payments =
      cashAmount + cardAmount + walletAmount > 0
        ? [
            ...(cashAmount > 0 ? [{ method: "cash", amount: cashAmount }] : []),
            ...(cardAmount > 0 ? [{ method: "card", amount: cardAmount }] : []),
            ...(walletAmount > 0 && walletMethod ? [{ method: walletMethod.id, amount: walletAmount }] : []),
          ]
        : [{ method: "cash", amount: totals.total }];
    const tendered = payments.reduce((sum, item) => sum + item.amount, 0);
    if (Math.abs(tendered - totals.total) > 0.05) {
      toast.error(`Tenders (${tendered.toFixed(2)}) must equal sale total (${totals.total.toFixed(2)})`);
      return;
    }
    await run(async () => {
      try {
        const sale = await apiClient.post(
          "/pos/checkout",
          {
            items: cart.map((line) => ({
              productId: line.productId,
              qty: line.qty,
              unit: line.unit,
              unitPrice: line.unitPrice,
            })),
            payments,
            customerId: customerId || undefined,
            shiftId: shift?.id,
            discount: Number(discount || 0),
            doctorLicense: doctorLicense || undefined,
            patientIdNumber: patientIdNumber || undefined,
            prescriptionId: prescriptionId || undefined,
            prescriptionChannel: prescriptionChannel || (market.code === "UK" ? "nhs" : "paper"),
            nhsExemptionCode: market.code === "UK" ? nhsExemptionCode || undefined : undefined,
          },
          token,
          businessId,
        );
        setReceipt(sale);
        setCart([]);
        setCash(0);
        setCard(0);
        setWallet(0);
        setDiscount(0);
        setPrescriptionId("");
        setTenderTouched(false);
        toast.success("Sale completed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Checkout failed");
      }
    });
  };

  const closeShift = () => {
    if (!shift) return;
    run(async () => {
      const counted = Number(closingCash || shift.openingCash || 0);
      await apiClient.post("/pos/shifts/close", { closingCash: counted }, token, businessId);
      toast.success("Shift closed");
      setClosingCash("");
      reloadShift();
    });
  };

  return (
    <PharmacyPage
      moduleId="pos"
      icon={ShoppingCart}
      title="Point of Sale"
      subtitle={market.posSubtitle}
      actions={
        shift ? (
          <Button variant="outline" onClick={closeShift} disabled={pending}>
            Close shift
          </Button>
        ) : (
          <Button
            onClick={() =>
              run(async () => {
                await apiClient.post("/pos/shifts/open", { openingCash: 0 }, token, businessId);
                toast.success("Shift opened");
                reloadShift();
              })
            }
            disabled={pending}
          >
            Open shift
          </Button>
        )
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 sm:p-5">
          <div ref={searchBoxRef} className="relative">
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setShowSuggestions(true);
                  setHighlightedIndex((prev) => nextSelectableIndex(prev, 1));
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setShowSuggestions(true);
                  setHighlightedIndex((prev) => nextSelectableIndex(prev, -1));
                  return;
                }
                if (event.key === "Escape") {
                  setShowSuggestions(false);
                  setHighlightedIndex(-1);
                  return;
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  void addFromQuery();
                }
              }}
              placeholder="Search medicine name, generic, salt, or scan barcode"
              className="h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 text-base font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/20"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-activedescendant={highlightedIndex >= 0 ? `pos-suggest-${highlightedIndex}` : undefined}
            />
            {showSuggestions && query.trim() ? (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-[#e2e8f0] bg-white shadow-lg" role="listbox">
                {searching ? (
                  <p className="px-4 py-3 text-sm text-[#64748b]">Searching…</p>
                ) : suggestions.length ? (
                  suggestions.map((item, index) => {
                    const stock = availableStock(medicineId(item));
                    const inStock = stock > 0;
                    const active = index === highlightedIndex;
                    return (
                      <button
                        id={`pos-suggest-${index}`}
                        key={item.productId || index}
                        type="button"
                        role="option"
                        aria-selected={active}
                        disabled={!inStock}
                        className={`flex w-full items-start justify-between gap-3 px-4 py-2.5 text-left ${
                          !inStock
                            ? "cursor-not-allowed bg-[#f8fafc] opacity-60"
                            : active
                              ? "bg-[#eff6ff]"
                              : "hover:bg-[#f8fafc]"
                        }`}
                        onMouseEnter={() => {
                          if (inStock) setHighlightedIndex(index);
                        }}
                        onClick={() => {
                          if (inStock) addProfile(item);
                        }}
                      >
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm font-semibold text-[#0f172a]">{item.product?.name}</span>
                          <span className="text-xs text-[#64748b]">
                            {[item.genericName, item.saltName, item.barcode].filter(Boolean).join(" · ")}
                            {item.product?.price != null ? ` · ${money(Number(item.product.price))}` : ""}
                          </span>
                        </span>
                        <span className={`shrink-0 text-xs font-semibold ${inStock ? "text-[#166534]" : "text-[#b91c1c]"}`}>
                          {inStock ? `Stock ${stock}` : "Out of stock"}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-4 py-3 text-sm text-[#64748b]">No medicines match “{query.trim()}”</p>
                )}
              </div>
            ) : null}
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
            <table className="w-full min-w-[28rem] text-sm">
              <thead className="bg-[#f8fafc] text-left text-[#64748b]">
                <tr>
                  <th className="px-3 py-2">Medicine</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {cart.length ? (
                  cart.map((line) => (
                    <tr key={line.productId} className="border-t">
                      <td className="px-3 py-2">
                        {line.name}
                        {line.rxRequired ? <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[#1d4ed8]">Rx</span> : null}
                        {isControlledSchedule(line.controlledSchedule) ? <span className="ml-2 text-xs text-[#b91c1c]">Controlled</span> : null}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          max={availableStock(line.productId) + line.qty}
                          value={line.qty}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            const max = availableStock(line.productId) + line.qty;
                            if (next > max) {
                              toast.error(`Only ${max} in stock`);
                            }
                            setCart((prev) =>
                              prev.map((item) =>
                                item.productId === line.productId
                                  ? { ...item, qty: Math.max(1, Math.min(next, max)) }
                                  : item,
                              ),
                            );
                          }}
                          className="w-20 rounded-lg border px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">{money(line.unitPrice * line.qty)}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => setCart((prev) => prev.filter((item) => item.productId !== line.productId))}>
                          <Trash2 className="h-4 w-4 text-[#94a3b8]" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-[#94a3b8]">
                      Search a medicine to add it to the bill
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <InteractionAlertList alerts={alerts} />
        </section>

        <aside className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{market.regulator} · {market.taxAuthority}</span>
            <span className="rounded-full bg-[var(--brand-secondary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--brand-secondary)]">{market.name}</span>
          </div>
          {shift ? (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Open shift</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">Opening cash {money(Number(shift.openingCash || 0))}</p>
              <label className="mt-2 block text-xs font-semibold text-[var(--text-muted)]">
                Closing cash counted
                <input
                  className={`${portalInputClass} mt-1`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={String(shift.openingCash || 0)}
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                />
              </label>
            </div>
          ) : (
            <p className="rounded-xl border border-[#fef3c7] bg-[#fffbeb] p-3 text-sm text-[#92400e]">
              Open a shift before charging customers.
            </p>
          )}
          <select className={portalInputClass} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">Walk-in customer</option>
            {asList<any>(customers).map((customer: any) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.phone ? `(${customer.phone})` : ""}
              </option>
            ))}
          </select>
          <select className={portalInputClass} value={prescriptionId} onChange={(event) => setPrescriptionId(event.target.value)}>
            <option value="">No linked prescription</option>
            {asList<any>(prescriptions).map((rx: any) => (
              <option key={rx.id} value={rx.id}>
                {(rx.customer?.name || "Patient")} · {rx.doctorName || "Rx"} · {rx.channel || rx.status}
              </option>
            ))}
          </select>
          {needsRx ? (
            <select className={portalInputClass} value={prescriptionChannel} onChange={(event) => setPrescriptionChannel(event.target.value)}>
              {market.prescriptionChannels.map((channel) => (
                <option key={channel.id} value={channel.id}>{channel.label}</option>
              ))}
            </select>
          ) : null}
          {market.code === "UK" && needsRx ? (
            <select className={portalInputClass} value={nhsExemptionCode} onChange={(event) => setNhsExemptionCode(event.target.value)}>
              {market.exemptionOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          ) : null}
          {needsControlled || needsRx ? (
            <ControlledSaleGate
              doctorLicense={doctorLicense}
              patientIdNumber={patientIdNumber}
              onDoctor={setDoctorLicense}
              onPatient={setPatientIdNumber}
              doctorLabel={market.doctorLicenseLabel}
              patientLabel={market.patientIdLabel}
            />
          ) : null}
          <input
            className={portalInputClass}
            type="number"
            placeholder="Discount"
            value={discount || ""}
            onChange={(e) => setDiscount(Number(e.target.value))}
          />
          <div className={`grid gap-2 ${walletMethod ? "grid-cols-3" : "grid-cols-2"}`}>
            <label className="text-xs font-semibold text-[#64748b]">
              Cash
              <input
                className={`${portalInputClass} mt-1`}
                type="number"
                min={0}
                step="0.01"
                placeholder="Cash"
                value={cash || ""}
                onChange={(e) => {
                  setTenderTouched(true);
                  setCash(Number(e.target.value));
                }}
              />
            </label>
            <label className="text-xs font-semibold text-[#64748b]">
              Card / QR
              <input
                className={`${portalInputClass} mt-1`}
                type="number"
                min={0}
                step="0.01"
                placeholder="Card / QR"
                value={card || ""}
                onChange={(e) => {
                  setTenderTouched(true);
                  setCard(Number(e.target.value));
                }}
              />
            </label>
            {walletMethod ? (
              <label className="text-xs font-semibold text-[#64748b]">
                {walletMethod.label}
                <input
                  className={`${portalInputClass} mt-1`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={walletMethod.label}
                  value={wallet || ""}
                  onChange={(e) => {
                    setTenderTouched(true);
                    setWallet(Number(e.target.value));
                  }}
                />
              </label>
            ) : null}
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-[var(--brand-secondary)]"
            onClick={() => {
              setTenderTouched(true);
              setCash(totals.total);
              setCard(0);
              setWallet(0);
            }}
          >
            Fill exact cash {money(totals.total)}
          </button>
          <GstBreakdown
            subtotal={totals.subtotal}
            tax={totals.tax}
            discount={totals.discount}
            total={totals.total}
            taxLabel={market.taxName}
            money={money}
            extra={totals.prescriptionCharge > 0 ? [{ label: "NHS charge", value: totals.prescriptionCharge }] : []}
          />
          <p className={`text-sm ${due === 0 ? "text-[#166534]" : "text-[#b45309]"}`}>
            {due === 0 ? "Tenders match the total" : `Due ${money(due)}`}
          </p>
          <Button className="w-full" disabled={!cart.length || pending || !shift} onClick={checkout}>
            {shift ? `Charge ${money(totals.total)}` : "Open a shift to charge"}
          </Button>
          {receipt ? (
            <div className="rounded-xl border border-[#dcfce7] bg-[#f0fdf4] p-3 text-sm">
              Invoice {receipt.invoice?.invoiceNumber || receipt.id} paid. Print from Sales if needed.
            </div>
          ) : null}
        </aside>
      </div>
    </PharmacyPage>
  );
}

export default function PosPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <PosContent />
    </Suspense>
  );
}
