import { redirectWithBusinessId } from "@/lib/redirect-with-business";

type PageProps = {
  searchParams: Promise<{ businessId?: string }>;
};

export default async function BusinessAdminSoftwareFeaturesRedirect({ searchParams }: PageProps) {
  await redirectWithBusinessId("/dashboard/businessAdmin/software/control", searchParams);
}
