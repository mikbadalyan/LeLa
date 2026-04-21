import { WebsiteMapScreen } from "@/features/website/map-screen";

export default async function WebsiteMapPage({
  searchParams,
}: {
  searchParams: Promise<{ editorial?: string }>;
}) {
  const params = await searchParams;

  return <WebsiteMapScreen editorialId={params.editorial} />;
}
