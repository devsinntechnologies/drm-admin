/** DigiNizam global design tokens — single source of truth for the admin portal. */

export const colors = {
  primary: "#001840",
  primaryHover: "#00122e",
  secondary: "#0050f8",
  secondaryHover: "#0046e0",
  accent: "#00d4ff",
  background: "#f1f5f9",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  textMuted: "#64748b",
  textSubtle: "#94a3b8",
  success: "#059669",
  successSoft: "#ecfdf5",
  warning: "#d97706",
  warningSoft: "#fffbeb",
  error: "#dc2626",
  errorSoft: "#fef2f2",
  info: "#0284c7",
  infoSoft: "#f0f9ff",
} as const;

export const typography = {
  fontFamily: 'var(--font-poppins), "Segoe UI", sans-serif',
  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const radius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
} as const;

export const shadows = {
  card: "0 1px 2px rgba(15, 23, 42, 0.04)",
  dropdown: "0 8px 24px rgba(15, 23, 42, 0.1)",
  modal: "0 24px 48px rgba(15, 23, 42, 0.16)",
  fab: "0 10px 24px rgba(0, 24, 64, 0.22)",
} as const;

export const layout = {
  sidebarWidth: "18rem",
  sidebarCollapsedWidth: "4.5rem",
  headerHeight: "4rem",
  contentMaxWidth: "1440px",
  buttonHeight: "44px",
} as const;
