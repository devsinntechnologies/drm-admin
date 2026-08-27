import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SoftwareRolesRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/dashboard/superAdmin/businesses/${id}/software/control`);
}
