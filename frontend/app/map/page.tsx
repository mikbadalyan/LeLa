import { MapScreen } from "@/features/map/map-screen";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ editorial?: string }>;
}) {
  const params = await searchParams;

  return <MapScreen editorialId={params.editorial} />;
}
