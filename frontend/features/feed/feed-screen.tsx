"use client";

import { useEffect, useMemo, useRef } from "react";
import { LoaderCircle } from "lucide-react";

import { EditorialFeedCard } from "@/components/cards/editorial-feed-card";
import { MobileShell } from "@/components/layout/mobile-shell";
import { useAuthStore } from "@/features/auth/store";
import { ChatScreen } from "@/features/chat/chat-screen";
import { useFeed, useToggleLike } from "@/features/feed/hooks";
import { useFeedUiStore } from "@/features/feed/store";
import { useShellStore } from "@/features/shell/store";
import { useFeedScrollRestoration } from "@/lib/hooks/use-feed-scroll";
import { formatFrenchDate } from "@/lib/utils/format";

type Focus = "feed" | "place" | "person" | "event" | "chat";

interface FeedScreenProps {
  focus: Focus;
}

export function FeedScreen({ focus }: FeedScreenProps) {
  const filter = useFeedUiStore((state) => state.filter);
  const setFilter = useFeedUiStore((state) => state.setFilter);
  const token = useAuthStore((state) => state.token);
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const likeMutation = useToggleLike(token);

  useFeedScrollRestoration();

  useEffect(() => {
    if (focus === "place" || focus === "person" || focus === "event") {
      setFilter(focus);
      return;
    }

    if (focus === "feed") {
      setFilter("all");
    }
  }, [focus, setFilter]);

  const activeMode = focus === "feed" ? "feed" : focus;
  const feedQuery = useFeed(filter, city, selectedDate);

  useEffect(() => {
    const element = sentinelRef.current;
    const root = document.getElementById("lela-scroll-container");

    if (!element || !root || !feedQuery.hasNextPage || feedQuery.isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          feedQuery.fetchNextPage();
        }
      },
      { root, rootMargin: "240px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [feedQuery.fetchNextPage, feedQuery.hasNextPage, feedQuery.isFetchingNextPage]);

  const items = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [feedQuery.data]
  );

  if (focus === "chat") {
    return (
      <MobileShell activeMode="chat" activeTab="conversations" className="overflow-hidden p-0">
        <ChatScreen />
      </MobileShell>
    );
  }

  return (
    <MobileShell activeMode={activeMode} activeTab="relations" className="space-y-4 px-3 py-4">
      <div className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-borderSoft">
        <p className="text-xs uppercase tracking-[0.18em] text-plum">Contexte</p>
        <p className="mt-2 text-lg font-semibold text-ink">
          {filter === "all"
            ? "Tout le feed"
            : filter === "place"
              ? "Lieux"
              : filter === "person"
                ? "Acteurs"
                : filter === "event"
                  ? "Evenements"
                  : "Magazine"}
        </p>
        <p className="mt-1 text-sm leading-6 text-graphite">
          {city} · {formatFrenchDate(selectedDate)}
        </p>
      </div>

      {items.length ? (
        items.map((item) => (
          <EditorialFeedCard
            key={item.id}
            item={item}
            onLike={(id) => likeMutation.mutate(id)}
          />
        ))
      ) : feedQuery.isLoading ? null : (
        <div className="rounded-[28px] bg-white px-4 py-6 text-sm leading-6 text-graphite shadow-sm ring-1 ring-borderSoft">
          Aucune carte ne correspond a cette combinaison ville/date pour le moment.
        </div>
      )}

      {feedQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-7 w-7 animate-spin text-plum" />
        </div>
      ) : null}

      <div ref={sentinelRef} className="flex items-center justify-center py-5">
        {feedQuery.isFetchingNextPage ? (
          <LoaderCircle className="h-6 w-6 animate-spin text-plum" />
        ) : feedQuery.hasNextPage ? (
          <span className="text-sm text-graphite/70">Chargement des cartes suivantes...</span>
        ) : (
          <span className="text-sm text-graphite/70">Vous avez atteint le bout du fil.</span>
        )}
      </div>
    </MobileShell>
  );
}
