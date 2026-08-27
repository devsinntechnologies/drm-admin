import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

// Portal "Appearance" (BusinessWorkspaceSettings) edited the same
// template-config record as Software & Mobile -> Control, just through a
// smaller, separate form -- two UIs mutating one record, which is the exact
// duplication this was merged out of. Redirects into Control, which covers
// everything this page did plus more, on the same underlying data.
export default async function PortalSettingsRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/dashboard/superAdmin/businesses/${id}/software/control`);
}
