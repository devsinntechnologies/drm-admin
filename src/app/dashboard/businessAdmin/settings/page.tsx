import { redirect } from "next/navigation";

// This page had no link pointing to it anywhere in the app nav (confirmed by
// a full-repo search) -- reachable only by a stale bookmark or a typed URL.
// Its functionality (theme, logo, modules) is now a strict subset of
// Software & Mobile -> Control, so it redirects there rather than dead-ending
// on an old form. Mirrors the existing /software/features and
// /software/settings redirects.
export default function BusinessAdminSettingsRedirect() {
  redirect("/dashboard/businessAdmin/software/control");
}
