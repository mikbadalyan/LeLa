import { WebsiteConversationThreadScreen } from "@/features/website/conversation-thread-screen";

export default async function WebsiteConversationThreadPage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const resolvedParams = await params;

  return <WebsiteConversationThreadScreen participantId={resolvedParams.participantId} />;
}
