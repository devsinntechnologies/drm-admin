"use client";

import { useMemo } from "react";
import { useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { usePharmacyQuery } from "@/hooks/usePharmacyQuery";
import {
  formatPharmacyMoney,
  getPharmacyMarket,
  type PharmacyMarketProfile,
} from "@/lib/pharmacy-market";

export function usePharmacyMarket() {
  const { currency, templateConfig } = useBusinessTemplate();
  const { data } = usePharmacyQuery<PharmacyMarketProfile>("/pharmacy/market");
  const market = useMemo(() => {
    if (data?.code) return data;
    return getPharmacyMarket({
      market: templateConfig?.market,
      currency: templateConfig?.currency ?? currency,
      location: templateConfig?.location,
    });
  }, [currency, data, templateConfig]);

  const money = (amount: number) => formatPharmacyMoney(amount, market);

  return { market, money, currency: market.currency };
}
