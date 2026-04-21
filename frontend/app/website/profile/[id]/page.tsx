import { WebsiteVisitorProfileScreen } from "@/features/website/visitor-profile-screen";

export default async function WebsiteVisitorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <WebsiteVisitorProfileScreen profileId={id} />;
}

