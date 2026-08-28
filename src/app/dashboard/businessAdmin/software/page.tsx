import { redirect } from "next/navigation";

/** Land business admins on Control so optional sections (e.g. mobile header) are visible. */
export default function BusinessAdminSoftwareIndexPage() {
  redirect("/dashboard/businessAdmin/software/control");
}
