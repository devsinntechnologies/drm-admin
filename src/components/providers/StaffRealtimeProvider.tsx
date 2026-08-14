"use client";

import { useEffect, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BASE_URL } from "@/lib/constant";
import { emitStaffRealtime, STAFF_REALTIME_EVENTS } from "@/lib/staff-realtime";

type NotificationPayload = {
  title?: string;
  message?: string;
  type?: string;
  metadata?: {
    tableNumber?: string | null;
  };
};

function namespaceForRole(role: string | null) {
  if (role === "waiter") return "/waiter";
  if (role === "business_admin" || role === "super_admin") return "/business_admin";
  return null;
}

export default function StaffRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { token, role } = useAuth();

  useEffect(() => {
    const namespace = namespaceForRole(role);
    const authToken =
      token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("auth_token") || localStorage.getItem("token")
        : null);
    if (!namespace || !authToken) return;

    const socket: Socket = io(`${BASE_URL}${namespace}`, {
      auth: { token: authToken },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    const onRequested = (payload: NotificationPayload) => {
      toast.info(payload.message || payload.title || "New table order request");
      emitStaffRealtime(STAFF_REALTIME_EVENTS.SELF_ORDERS_CHANGED, payload);
    };
    const onApproved = (payload: NotificationPayload) => {
      toast.success(payload.message || "Table order approved");
      emitStaffRealtime(STAFF_REALTIME_EVENTS.SELF_ORDERS_CHANGED, payload);
      emitStaffRealtime(STAFF_REALTIME_EVENTS.ORDERS_CHANGED, payload);
    };
    const onRejected = (payload: NotificationPayload) => {
      toast.warning(payload.message || "Table order rejected");
      emitStaffRealtime(STAFF_REALTIME_EVENTS.SELF_ORDERS_CHANGED, payload);
    };

    socket.on("self_order:requested", onRequested);
    socket.on("self_order:approved", onApproved);
    socket.on("self_order:rejected", onRejected);

    return () => {
      socket.off("self_order:requested", onRequested);
      socket.off("self_order:approved", onApproved);
      socket.off("self_order:rejected", onRejected);
      socket.disconnect();
    };
  }, [role, token]);

  return <>{children}</>;
}
