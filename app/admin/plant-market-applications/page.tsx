import ApplicationManagement from "@/components/admin/ApplicationManagement";

export const metadata = {
  title: "Plant Market Seller Verification | AGRIVA Admin",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ status?: string; q?: string; category?: string }>;

export default async function PlantMarketApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return (
    <ApplicationManagement
      scope="plant"
      status={params.status}
      q={params.q}
      category={params.category}
    />
  );
}
