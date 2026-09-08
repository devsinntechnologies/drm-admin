export const PRINTER_ROLES = ["receipt", "kitchen"] as const;
export type PrinterRole = (typeof PRINTER_ROLES)[number];

export const PRINTER_CONNECTION_TYPES = ["ethernet", "wifi", "usb"] as const;
export type PrinterConnectionType = (typeof PRINTER_CONNECTION_TYPES)[number];

export const PRINTER_IP_MODES = ["static", "assign"] as const;
export type PrinterIpMode = (typeof PRINTER_IP_MODES)[number];

export type PrinterStatus = "unknown" | "reachable" | "unreachable";

export type BusinessPrinter = {
  id: string;
  businessId: string;
  role: PrinterRole;
  name: string;
  connectionType: PrinterConnectionType;
  ipMode: PrinterIpMode;
  ip: string | null;
  port: number;
  isEnabled: boolean;
  paperWidth: number;
  origin: "super_admin" | "business_override";
  lastStatus: PrinterStatus;
  lastSeenAt: string | null;
  lastSeenDeviceId: string | null;
  lastSeenDeviceName: string | null;
  isConnected?: boolean;
};

export type PrintersPayload = {
  allowPrinter: boolean;
  printers: BusinessPrinter[];
};

export type PrinterDraft = {
  id?: string;
  role: PrinterRole;
  name: string;
  connectionType: PrinterConnectionType;
  ipMode: PrinterIpMode;
  ip: string;
  port: number;
  isEnabled: boolean;
  paperWidth: number;
};

export function printerRoleLabel(role: PrinterRole): string {
  return role === "kitchen" ? "Kitchen" : "Receipt";
}

export function printerStatusLabel(printer: Pick<BusinessPrinter, "lastStatus" | "ip" | "ipMode" | "isConnected">): string {
  if (printer.isConnected && printer.lastStatus !== "unreachable") return "Connected";
  if (printer.lastStatus === "reachable") return "Reachable";
  if (printer.lastStatus === "unreachable") return "Unreachable";
  if (printer.ipMode === "assign" && !printer.ip) return "Waiting for POS assign";
  if (printer.ip) return "Configured";
  return "Never seen";
}

export function toPrinterDraft(printer: BusinessPrinter): PrinterDraft {
  return {
    id: printer.id,
    role: printer.role,
    name: printer.name,
    connectionType: printer.connectionType,
    ipMode: printer.ipMode,
    ip: printer.ip ?? "",
    port: printer.port || 9100,
    isEnabled: printer.isEnabled,
    paperWidth: printer.paperWidth || 80,
  };
}

export function emptyPrinterDraft(role: PrinterRole): PrinterDraft {
  return {
    role,
    name: role === "kitchen" ? "Kitchen printer" : "Receipt printer",
    connectionType: "ethernet",
    ipMode: "static",
    ip: "",
    port: 9100,
    isEnabled: true,
    paperWidth: 80,
  };
}
