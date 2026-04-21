"use client";

import { useMemo, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { WebsiteEditorialCard } from "@/components/cards/website-editorial-card";
import { useAuthStore } from "@/features/auth/store";
import { useToggleLike } from "@/features/feed/hooks";
import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
import { useWebsiteFeed } from "@/features/website/hooks";

type WebsiteFilter = "all" | "place" | "person" | "event";

export function WebsiteFeedScreen() {
  const { t } = useI18n();
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const token = useAuthStore((state) => state.token);
  const [filter, setFilter] = useState<WebsiteFilter>("all");
  const feedQuery = useWebsiteFeed(filter, city, selectedDate, 9);
  const likeMutation = useToggleLike(token);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [feedQuery.data]
  );

  const filters: Array<{ value: WebsiteFilter; label: string }> = [
    { value: "all", label: t("modes.feed") },
    { value: "place", label: t("modes.places") },
    { value: "person", label: t("modes.people") },
    { value: "event", label: t("modes.events") },
  ];

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-5 py-8 lg:px-8 lg:py-12">
      <section className="rounded-[36px] bg-white px-6 py-6 shadow-card">
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
                    ? "bg-plum text-white shadow-float"
                    : "bg-mist text-ink"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {feedQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-plum" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <WebsiteEditorialCard
              key={item.id}
              item={item}
              onLike={(id) => likeMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="flex justify-center pb-6">
        {feedQuery.hasNextPage ? (
          <button
            type="button"
            onClick={() => feedQuery.fetchNextPage()}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-card ring-1 ring-black/5"
          >
            {feedQuery.isFetchingNextPage ? "Chargement..." : t("website.viewAll")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
