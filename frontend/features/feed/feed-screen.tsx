"use client";

import { useEffect, useMemo, useRef } from "react";
import { LoaderCircle, SlidersHorizontal } from "lucide-react";

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

const focusLabel: Record<Exclude<Focus, "chat">, string> = {
  feed: "Tout le feed",
  place: "Lieux",
  person: "Acteurs",
  event: "Evenements",
};

const focusDescription: Record<Exclude<Focus, "chat">, string> = {
  feed: "Toutes les cartes editoriales du moment.",
  place: "Musees, cafes, adresses et espaces a decouvrir.",
  person: "Artistes, acteurs et figures du territoire.",
  event: "Agenda, spectacles et rendez-vous dates.",
};

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

  if (focus === "chat") {
    return (
      <MobileShell activeMode="chat" activeTab="conversations" className="overflow-hidden p-0">
        <ChatScreen />
      </MobileShell>
    );
  }

  const currentLabel = focus === "feed" ? "feed" : focus;
  const displayLabel = focusLabel[currentLabel as Exclude<Focus, "chat">];
  const displayDesc = focusDescription[currentLabel as Exclude<Focus, "chat">];

  return (
    <MobileShell activeMode={activeMode} activeTab="relations" className="space-y-4 px-3 py-4">
      {/* Context card */}
      <div className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-borderSoft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-plum">Contexte</p>
            <p className="mt-2 text-lg font-semibold text-ink">{displayLabel}</p>
            <p className="mt-1 text-sm leading-6 text-graphite">{displayDesc}</p>
          </div>
          <div className="shrink-0 rounded-2xl bg-plum/10 p-2 text-plum">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-graphite/60">
          {city} · {formatFrenchDate(selectedDate)}
        </p>

        {/* Flip hint — shown once */}
        <div className="mt-3 flex items-center gap-2 rounded-[16px] bg-mist px-3 py-2 text-xs text-graphite/70">
          <span>💡</span>
          <span>Cliquez sur l'icone ↺ d'une carte pour voir son verso.</span>
        </div>
      </div>

      {/* Feed items */}
      {items.length > 0 ? (
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
