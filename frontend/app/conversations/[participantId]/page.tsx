import { ConversationThreadScreen } from "@/features/conversations/conversation-thread-screen";

export default async function ConversationThreadPage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = await params;

  return <ConversationThreadScreen participantId={participantId} />;
}
