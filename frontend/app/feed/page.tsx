import { FeedScreen } from "@/features/feed/feed-screen";

type Focus = "feed" | "place" | "person" | "event" | "chat";

function normalizeFocus(value: string | undefined): Focus {
  if (value === "place" || value === "person" || value === "event" || value === "chat") {
    return value;
  }

  return "feed";
}

export default async function FeedPage({
  searchParams
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const params = await searchParams;
  const focus = normalizeFocus(params.focus);

  return <FeedScreen focus={focus} />;
}

