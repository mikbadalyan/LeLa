"use client";

import { useMemo, useRef, useState } from "react";
import { Play, Shuffle, Wand2 } from "lucide-react";

import { WebsiteEditorialCard } from "@/components/cards/website-editorial-card";
import { useAuthStore } from "@/features/auth/store";
import { useToggleLike } from "@/features/feed/hooks";
import { StoryModeOverlay } from "@/features/feed/story-mode-overlay";
import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
import { useWebsiteFeed } from "@/features/website/hooks";
import { cn } from "@/lib/utils/cn";
import { readRecentViewedEditorialIds, shuffleEditorials } from "@/lib/utils/discovery";

function WebsiteFeedSkeletonCard({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={cn(
        "feed-skeleton relative overflow-hidden rounded-card bg-elevated shadow-card ring-1 ring-borderSoft/10",
        featured ? "aspect-[1.2] md:col-span-2 xl:col-span-2" : "aspect-[1.02]"
      )}
    >
      <div className="absolute inset-x-5 bottom-5 space-y-2">
        <div className="h-5 w-1/2 rounded-full bg-mist/85" />
        <div className="h-3 w-1/3 rounded-full bg-mist/70" />
      </div>
    </div>
  );
}

type WebsiteFilter = "all" | "place" | "person" | "event";

export function WebsiteFeedScreen() {
  const { t } = useI18n();
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const token = useAuthStore((state) => state.token);
  const [filter, setFilter] = useState<WebsiteFilter>("all");
  const [discoverMode, setDiscoverMode] = useState(false);
  const [discoverSeed, setDiscoverSeed] = useState(() => Math.floor(Date.now() % 100000));
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyStartIndex, setStoryStartIndex] = useState(0);
  const [recentViewedIds] = useState<string[]>(() => readRecentViewedEditorialIds());
  const feedQuery = useWebsiteFeed(filter, city, selectedDate, 9);
  const likeMutation = useToggleLike(token);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [feedQuery.data]
  );

  const displayItems = useMemo(
    () => (discoverMode ? shuffleEditorials(items, discoverSeed) : items),
    [discoverMode, discoverSeed, items]
  );

  const smartSuggestion = useMemo(() => {
    if (!items.length || !recentViewedIds.length) {
      return null;
    }
    const recentSet = new Set(recentViewedIds);
    return (
      items.find((entry) => entry.linked_entity?.id && recentSet.has(entry.linked_entity.id)) ??
      items.find((entry) => recentSet.has(entry.id)) ??
      null
    );
  }, [items, recentViewedIds]);

  const filters: Array<{ value: WebsiteFilter; label: string }> = [
    { value: "all", label: t("modes.feed") },
    { value: "place", label: t("modes.places") },
    { value: "person", label: t("modes.people") },
    { value: "event", label: t("modes.events") },
  ];

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-5 py-8 lg:px-8 lg:py-12">
      <StoryModeOverlay
        open={storyOpen}
        items={displayItems}
        startIndex={storyStartIndex}
        onClose={() => setStoryOpen(false)}
        onLike={(id) => likeMutation.mutate(id)}
        basePath="/website"
      />

      <section className="detail-reveal rounded-[36px] bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum">
              {t("website.liveFeed")}
            </p>
            <h1 className="mt-2 text-[2.3rem] font-semibold leading-tight tracking-[-0.05em] text-ink">
              {t("website.explore")}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((entry) => (
              <button
                key={entry.value}
                type="button"
                onClick={() => setFilter(entry.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === entry.value
                    ? "bg-blue text-white shadow-blue"
                    : "bg-surface text-ink ring-1 ring-borderSoft/8 hover:bg-mist"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-reveal detail-reveal-delay-1 grid gap-3 rounded-[32px] bg-elevated px-4 py-4 shadow-card ring-1 ring-borderSoft/10 md:grid-cols-[1fr_1fr_1fr_auto]">
        <button
          type="button"
          onClick={() => setDiscoverMode((current) => !current)}
          className={cn(
            "interactive-action inline-flex items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold",
            discoverMode ? "bg-blue text-white shadow-blue" : "bg-surface text-ink ring-1 ring-borderSoft/10"
          )}
        >
          <Wand2 className="h-4 w-4" />
          Discover Mode
        </button>
        <button
          type="button"
          onClick={() => {
            setDiscoverSeed((current) => current + 1);
            setDiscoverMode(true);
          }}
          className="interactive-action inline-flex items-center justify-center gap-2 rounded-[18px] bg-surface px-4 py-3 text-sm font-semibold text-ink ring-1 ring-borderSoft/10"
        >
          <Shuffle className="h-4 w-4" />
          Shuffle
        </button>
        <button
          type="button"
          onClick={() => {
            setStoryStartIndex(0);
            setStoryOpen(true);
          }}
          disabled={!displayItems.length}
          className="interactive-action inline-flex items-center justify-center gap-2 rounded-[18px] bg-plum px-4 py-3 text-sm font-semibold text-white shadow-float"
        >
          <Play className="h-4 w-4" />
          Story Mode
        </button>
        {smartSuggestion ? (
          <button
            type="button"
            onClick={() => {
              const index = displayItems.findIndex((item) => item.id === smartSuggestion.id);
              setStoryStartIndex(index >= 0 ? index : 0);
              setStoryOpen(true);
            }}
            className="interactive-action inline-flex items-center justify-center rounded-[18px] bg-blueSoft px-4 py-3 text-sm font-semibold text-blue ring-1 ring-blue/20"
          >
            Parce que vous avez vu {smartSuggestion.title}
          </button>
        ) : null}
      </section>

      {feedQuery.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <WebsiteFeedSkeletonCard key={`website-feed-skeleton-${index}`} featured={index === 0} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {displayItems.length ? (
            displayItems.map((item, index) => (
              <WebsiteEditorialCard
                key={item.id}
                item={item}
                onLike={(id) => likeMutation.mutate(id)}
                featured={discoverMode ? index % 4 === 0 : index === 0}
                entryDelayMs={Math.min(index * 36, 280)}
              />
            ))
          ) : (
            <div className="rounded-card bg-elevated px-6 py-7 text-sm text-graphite shadow-card ring-1 ring-borderSoft/10 md:col-span-2 xl:col-span-3">
              Aucun contenu ne correspond au contexte actuel. Essayez un autre filtre ou une autre date.
            </div>
          )}
        </div>
      )}

      <div ref={loadMoreRef} className="flex justify-center pb-6">
        {feedQuery.hasNextPage ? (
          <button
            type="button"
            onClick={() => feedQuery.fetchNextPage()}
            className="rounded-full bg-elevated px-6 py-3 text-sm font-semibold text-ink shadow-card ring-1 ring-borderSoft/10"
          >
            {feedQuery.isFetchingNextPage ? "Chargement..." : t("website.viewAll")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
