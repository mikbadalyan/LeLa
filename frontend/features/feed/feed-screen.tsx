"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, LoaderCircle, X } from "lucide-react";

import { MobileShell } from "@/components/layout/mobile-shell";
import { PwaFeedCard } from "@/components/pwa/pwa-feed-card";
import { useAuthStore } from "@/features/auth/store";
import { ChatScreen } from "@/features/chat/chat-screen";
import { useFeed, useToggleLike } from "@/features/feed/hooks";
import { useFeedUiStore } from "@/features/feed/store";
import { useShellStore } from "@/features/shell/store";
import { useFeedScrollRestoration } from "@/lib/hooks/use-feed-scroll";
import type { EditorialCard } from "@/lib/api/types";
import { resolveFeedFilterFromFocus } from "@/lib/utils/editorial";
import { cn } from "@/lib/utils/cn";

type Focus = "feed" | "place" | "person" | "event" | "chat";

interface FeedScreenProps {
  focus: Focus;
}

function FeedSkeletonCard({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={cn(
        "feed-skeleton relative overflow-hidden rounded-card bg-elevated shadow-soft ring-1 ring-borderSoft/10",
        featured ? "aspect-[0.9]" : "aspect-[0.82]"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/6 via-transparent to-transparent" />
      <div className="absolute inset-x-4 bottom-4 space-y-2">
        <div className="h-4 w-1/2 rounded-full bg-mist/80" />
        <div className="h-3 w-2/3 rounded-full bg-mist/70" />
      </div>
    </div>
  );
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
  const scrollY = useFeedUiStore((state) => state.scrollY);
  const setScrollProgress = useFeedUiStore((state) => state.setScrollProgress);
  const token = useAuthStore((state) => state.token);
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const previousItemCountRef = useRef(0);
  const [cloudFilterIds, setCloudFilterIds] = useState<string[] | null>(null);
  const [newItemsCount, setNewItemsCount] = useState(0);
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

  useEffect(() => {
    if (previousItemCountRef.current > 0 && items.length > previousItemCountRef.current) {
      setNewItemsCount(items.length - previousItemCountRef.current);
    }
    previousItemCountRef.current = items.length;
  }, [items.length]);

  useEffect(() => {
    if (scrollY < 60 && newItemsCount) {
      setNewItemsCount(0);
    }
  }, [newItemsCount, scrollY]);

  useEffect(() => {
    const container = document.getElementById("lela-scroll-container");
    if (!container) {
      return;
    }
    const maxScrollable = Math.max(container.scrollHeight - container.clientHeight, 1);
    const nextProgress = Math.min(100, Math.max(0, (container.scrollTop / maxScrollable) * 100));
    setScrollProgress(nextProgress);
  }, [visibleItems.length, scrollY, setScrollProgress]);

  const jumpToTop = () => {
    const container = document.getElementById("lela-scroll-container");
    container?.scrollTo({ top: 0, behavior: "smooth" });
    setNewItemsCount(0);
  };

  const showLoadingSkeletons = feedQuery.isLoading && items.length === 0;

  if (focus === "chat") {
    return (
      <MobileShell
        activeMode="chat"
        activeTab="conversations"
        className="overflow-hidden p-0"
        padForBottomBar={false}
      >
        <ChatScreen />
      </MobileShell>
    );
  }

  return (
    <MobileShell activeMode={activeMode} activeTab="relations" className="screen-feed bg-[#303744] py-[10px]">
      {newItemsCount > 0 ? (
        <button
          type="button"
          onClick={jumpToTop}
          className="card-enter inline-flex items-center gap-2 rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white shadow-blue"
        >
          {newItemsCount} nouvelle{newItemsCount > 1 ? "s" : ""} carte{newItemsCount > 1 ? "s" : ""}
          <ArrowUp className="h-4 w-4" />
        </button>
      ) : null}

      {cloudFilterIds?.length ? (
        <div className="flex items-center justify-between rounded-full bg-elevated px-4 py-3 text-sm text-ink shadow-soft ring-1 ring-blue/15">
          <span>Nuage de cartes liees actif</span>
          <button
            type="button"
            onClick={() => setCloudFilterIds(null)}
            className="inline-flex items-center gap-2 rounded-full bg-blueSoft px-3 py-2 text-xs font-semibold text-blue"
          >
            <X className="h-4 w-4" />
            Tout afficher
          </button>
        </div>
      ) : null}

      {/* Feed items */}
      {showLoadingSkeletons ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <FeedSkeletonCard key={`feed-skeleton-${index}`} featured={index === 1} />
          ))}
        </div>
      ) : visibleItems.length > 0 ? (
        visibleItems.map((item, index) => (
          <PwaFeedCard
            key={item.id}
            item={item}
            onLike={(id) => likeMutation.mutate(id)}
            featured={index === 0 || (index + 1) % 5 === 0}
          />
        ))
      ) : feedQuery.isLoading ? null : (
        <div className="rounded-[28px] bg-elevated px-4 py-6 text-sm leading-6 text-graphite shadow-soft ring-1 ring-borderSoft/10">
          {cloudFilterIds?.length
            ? "Aucune autre carte liee n'est encore chargee dans le fil."
            : "Aucune carte ne correspond a cette combinaison ville/date pour le moment."}
        </div>
      )}

      {/* Initial loading spinner */}
      {feedQuery.isLoading && !showLoadingSkeletons ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-7 w-7 animate-spin text-blue" />
        </div>
      ) : null}

      {/* Infinite scroll sentinel + pagination state */}
      <div ref={sentinelRef} className="flex items-center justify-center py-5">
        {feedQuery.isFetchingNextPage ? (
          <LoaderCircle className="h-6 w-6 animate-spin text-blue" />
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
