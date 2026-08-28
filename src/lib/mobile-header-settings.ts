export type MobileHeaderSettings = {
  /** Master switch — when false, Flutter hides the branded app header. */
  enabled: boolean;
  showLogout: boolean;
  showOnlineStatus: boolean;
  logoBackgroundColor: string;
};

export const DEFAULT_MOBILE_HEADER_SETTINGS: MobileHeaderSettings = {
  enabled: true,
  showLogout: true,
  showOnlineStatus: true,
  logoBackgroundColor: "#FFFFFF",
};

export function parseMobileHeaderSettings(
  moduleSettings?: Record<string, Record<string, unknown>> | null,
): MobileHeaderSettings {
  const raw = moduleSettings?.mobileHeader;
  if (!raw || typeof raw !== "object") {
    return DEFAULT_MOBILE_HEADER_SETTINGS;
  }

  return {
    // Missing `enabled` → treat as allowed (backward compatible with older configs).
    enabled: raw.enabled !== false,
    showLogout: raw.showLogout !== false,
    showOnlineStatus: raw.showOnlineStatus !== false,
    logoBackgroundColor:
      typeof raw.logoBackgroundColor === "string" && raw.logoBackgroundColor.trim()
        ? raw.logoBackgroundColor
        : DEFAULT_MOBILE_HEADER_SETTINGS.logoBackgroundColor,
  };
}

export function serializeMobileHeaderSettings(
  settings: MobileHeaderSettings,
): Record<string, unknown> {
  return {
    enabled: settings.enabled,
    showLogout: settings.showLogout,
    showOnlineStatus: settings.showOnlineStatus,
    logoBackgroundColor: settings.logoBackgroundColor,
  };
}
