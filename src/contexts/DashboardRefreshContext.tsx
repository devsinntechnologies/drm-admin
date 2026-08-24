"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type DashboardRefreshContextValue = {
  refreshKey: number;
  bumpDashboardRefresh: () => void;
};

const DashboardRefreshContext = createContext<DashboardRefreshContextValue>({
  refreshKey: 0,
  bumpDashboardRefresh: () => {},
});

export function DashboardRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpDashboardRefresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return (
    <DashboardRefreshContext.Provider value={{ refreshKey, bumpDashboardRefresh }}>
      {children}
    </DashboardRefreshContext.Provider>
  );
}

export function useDashboardRefresh() {
  return useContext(DashboardRefreshContext);
}
