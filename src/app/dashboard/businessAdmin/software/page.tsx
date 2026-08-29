import { redirectWithBusinessId } from "@/lib/redirect-with-business";

type PageProps = {
  searchParams: Promise<{ businessId?: string }>;
};

/** Land admins on Control so optional sections (e.g. mobile header) are visible. */
export default async function BusinessAdminSoftwareIndexPage({ searchParams }: PageProps) {
  await redirectWithBusinessId("/dashboard/businessAdmin/software/control", searchParams);
}
