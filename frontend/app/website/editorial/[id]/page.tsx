import { WebsiteEditorialDetailScreen } from "@/features/website/editorial-detail-screen";

export default async function WebsiteEditorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <WebsiteEditorialDetailScreen editorialId={id} />;
}

