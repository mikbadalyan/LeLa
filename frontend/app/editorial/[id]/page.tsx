import { DetailScreen } from "@/features/editorial/detail-screen";

export default async function EditorialPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetailScreen editorialId={id} />;
}

