"use client";

import { useEffect, useState, type ReactNode } from "react";
import Loading from "@/components/common/Loading";
import { getStoredAuthToken } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    setAllowed(true);
  }, []);

  if (!allowed) {
    return <Loading fullScreen label="Opening workspace…" />;
  }

  return children;
}
