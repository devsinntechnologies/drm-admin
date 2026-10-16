type SocketTarget = {
  url: string;
  options: {
    path?: string;
    addTrailingSlash?: boolean;
    upgrade?: boolean;
    transports: ("polling" | "websocket")[];
  };
};

/** Keep local browser traffic on the portal origin; browsers block port 6000. */
export function resolveStaffSocketTarget(
  apiUrl: string,
  socketUrl: string,
  portalOrigin: string,
  namespace: string,
): SocketTarget {
  const api = new URL(apiUrl, portalOrigin);
  if (api.origin === portalOrigin && api.pathname.replace(/\/+$/, "") === "/backend") {
    return {
      url: `${portalOrigin}${namespace}`,
      options: {
        path: "/backend/socket.io",
        addTrailingSlash: false,
        // Engine.IO long polling receives events immediately and works through
        // Next's HTTP rewrite without depending on its WebSocket upgrade path.
        transports: ["polling"],
        upgrade: false,
      },
    };
  }
  return {
    url: `${socketUrl.replace(/\/+$/, "")}${namespace}`,
    options: { transports: ["websocket", "polling"] },
  };
}
