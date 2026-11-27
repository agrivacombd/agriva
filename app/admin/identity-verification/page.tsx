import ApplicationManagement from "@/components/admin/ApplicationManagement";

type SearchParams = Promise<{ status?: string; q?: string }>;

export default async function IdentityVerificationAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return <ApplicationManagement scope="identity" status={params.status} q={params.q} />;
}
