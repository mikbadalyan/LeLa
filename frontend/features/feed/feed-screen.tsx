"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

import { EditorialFeedCard } from "@/components/cards/editorial-feed-card";
import { MobileShell } from "@/components/layout/mobile-shell";
import { useAuthStore } from "@/features/auth/store";
import { ChatScreen } from "@/features/chat/chat-screen";
import { useFeed, useToggleLike } from "@/features/feed/hooks";
import { useFeedUiStore } from "@/features/feed/store";
import { useShellStore } from "@/features/shell/store";
import { useFeedScrollRestoration } from "@/lib/hooks/use-feed-scroll";
import type { EditorialCard } from "@/lib/api/types";
import { resolveFeedFilterFromFocus } from "@/lib/utils/editorial";

type Focus = "feed" | "place" | "person" | "event" | "chat";

interface FeedScreenProps {
  focus: Focus;
}

function cloudIds(item: EditorialCard) {
  return [item.id, item.linked_entity?.id].filter(Boolean) as string[];
}

function isInCloud(item: EditorialCard, activeCloudIds: string[]) {
  const itemIds = cloudIds(item);
  return itemIds.some((value) => activeCloudIds.includes(value));
}

export function FeedScreen({ focus }: FeedScreenProps) {
  const filter = useFeedUiStore((state) => state.filter);
  const setFilter = useFeedUiStore((state) => state.setFilter);
  const token = useAuthStore((state) => state.token);
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [cloudFilterIds, setCloudFilterIds] = useState<string[] | null>(null);
  const likeMutation = useToggleLike(token);
  const effectiveFilter = useMemo(
    () => resolveFeedFilterFromFocus(focus, filter),
    [focus, filter]
  );

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
  const feedQuery = useFeed(effectiveFilter, city, selectedDate);

  useEffect(() => {
    setCloudFilterIds(null);
  }, [effectiveFilter, city, selectedDate]);

  // Infinite scroll sentinel
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
  const visibleItems = useMemo(() => {
    if (!cloudFilterIds?.length) {
      return items;
    }

    return items.filter((item) => isInCloud(item, cloudFilterIds));
  }, [cloudFilterIds, items]);

  if (focus === "chat") {
    return (
      <MobileShell activeMode="chat" activeTab="conversations" className="overflow-hidden p-0">
        <ChatScreen />
      </MobileShell>
    );
  }

  return (
    <MobileShell activeMode={activeMode} activeTab="relations" className="space-y-4 px-3 py-4">
      {cloudFilterIds?.length ? (
        <div className="flex items-center justify-between rounded-full bg-white px-4 py-3 text-sm text-ink shadow-sm ring-1 ring-borderSoft">
          <span>Nuage de cartes liees actif</span>
          <button
            type="button"
            onClick={() => setCloudFilterIds(null)}
            className="inline-flex items-center gap-2 rounded-full bg-mist px-3 py-2 text-xs font-semibold text-graphite"
          >
            <X className="h-4 w-4" />
            Tout afficher
          </button>
        </div>
      ) : null}

      {/* Feed items */}
      {visibleItems.length > 0 ? (
        visibleItems.map((item) => (
          <EditorialFeedCard
            key={item.id}
            item={item}
            onLike={(id) => likeMutation.mutate(id)}
            onToggleCloud={(selectedItem) =>
              setCloudFilterIds((current) => {
                const nextIds = cloudIds(selectedItem);
                const currentKey = current?.slice().sort().join("|");
                const nextKey = nextIds.slice().sort().join("|");
                return currentKey === nextKey ? null : nextIds;
              })
            }
            cloudActive={Boolean(cloudFilterIds?.length && isInCloud(item, cloudFilterIds))}
          />
        ))
      ) : feedQuery.isLoading ? null : (
        <div className="rounded-[28px] bg-white px-4 py-6 text-sm leading-6 text-graphite shadow-sm ring-1 ring-borderSoft">
          {cloudFilterIds?.length
            ? "Aucune autre carte liee n'est encore chargee dans le fil."
            : "Aucune carte ne correspond a cette combinaison ville/date pour le moment."}
        </div>
      )}

      {/* Initial loading spinner */}
      {feedQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-7 w-7 animate-spin text-plum" />
        </div>
      ) : null}

      {/* Infinite scroll sentinel + pagination state */}
      <div ref={sentinelRef} className="flex items-center justify-center py-5">
        {feedQuery.isFetchingNextPage ? (
          <LoaderCircle className="h-6 w-6 animate-spin text-plum" />
        ) : feedQuery.hasNextPage ? (
          <span className="text-sm text-graphite/70">
            Chargement des cartes suivantes...
          </span>
        ) : items.length > 0 ? (
          <span className="text-sm text-graphite/70">
            Vous avez atteint le bout du fil.
          </span>
        ) : null}
      </div>
    </MobileShell>
  );
}
