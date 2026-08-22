import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function PortalIndexPage({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/superAdmin/businesses/${id}/portal/preview`);
}
