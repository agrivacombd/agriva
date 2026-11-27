import ApplicationManagement from "@/components/admin/ApplicationManagement";

export const metadata = {
  title: "Seller Applications | AGRIVA Admin",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ status?: string; q?: string }>;

export default async function AdminSellerApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return <ApplicationManagement scope="seller" status={params.status} q={params.q} />;
}
