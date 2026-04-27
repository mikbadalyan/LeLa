"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Menu,
  Play,
  Settings2,
  Shuffle,
  Smartphone,
  Wand2,
} from "lucide-react";

import { WebsiteEditorialCard } from "@/components/cards/website-editorial-card";
import { ModeIcon, TabIcon } from "@/components/ui/lela-icons";
import { useAuthStore } from "@/features/auth/store";
import { useToggleLike } from "@/features/feed/hooks";
import { StoryModeOverlay } from "@/features/feed/story-mode-overlay";
import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
import { useWebsiteFeed } from "@/features/website/hooks";
import { cn } from "@/lib/utils/cn";
import { readRecentViewedEditorialIds, shuffleEditorials } from "@/lib/utils/discovery";

const citySuggestions = ["Strasbourg", "Erstein", "Ribeauville", "Colmar"];

type WebsiteFilter = "all" | "place" | "person" | "event";

const CARD_LAYOUTS = [
  { className: "lg:col-span-6 lg:row-span-6", variant: "hero" as const },
  { className: "lg:col-span-3 lg:row-span-3", variant: "compact" as const },
  { className: "lg:col-span-3 lg:row-span-3", variant: "compact" as const },
  { className: "lg:col-span-3 lg:row-span-3", variant: "compact" as const },
  { className: "lg:col-span-3 lg:row-span-3", variant: "compact" as const },
  { className: "lg:col-span-3 lg:row-span-3", variant: "compact" as const },
  { className: "lg:col-span-6 lg:row-span-5", variant: "wide" as const },
  { className: "lg:col-span-3 lg:row-span-3", variant: "compact" as const },
  { className: "lg:col-span-3 lg:row-span-3", variant: "compact" as const },
] as const;

function PrototypeFeedSkeletonCard({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative min-h-[300px] overflow-hidden rounded-[18px] bg-[#d9d9d9] lg:min-h-0 lg:rounded-[3px]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.1))]" />
      <div className="absolute left-5 top-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-white/80" />
        <div className="h-3 w-32 rounded-full bg-white/80" />
      </div>
      <div className="absolute right-5 top-5 h-8 w-8 rounded-full bg-white/80" />
      <div className="absolute inset-x-5 bottom-6 space-y-3">
        <div className="h-8 w-3/4 rounded-full bg-white/80" />
        <div className="h-4 w-2/3 rounded-full bg-white/70" />
      </div>
      <div className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-[#7643A6]/80" />
    </div>
  );
}

function PrototypeLogo({ active }: { active: boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full border border-[#7643A6] bg-white shadow-[0_8px_24px_rgba(118,67,166,0.12)]">
        <Image src="/assets/logo.svg" alt="LE_LA" width={26} height={34} priority />
      </div>
      {active ? (
        <span className="absolute -bottom-[20px] h-0 w-0 border-x-[10px] border-t-[10px] border-x-transparent border-t-[#7643A6]" />
      ) : null}
    </div>
  );
}

function SidebarUserMenu({
  accountHref,
  accountLabel,
}: {
  accountHref: string;
  accountLabel: string;
}) {
  const { t } = useI18n();

  const items = [
    { href: "/website/likes", label: t("tabs.likes"), tab: "likes" as const },
    { href: "/website/contribute", label: t("tabs.contribute"), tab: "contribute" as const },
    {
      href: "/website/conversations",
      label: t("tabs.conversations"),
      tab: "conversations" as const,
    },
    { href: "/website/relations", label: t("tabs.relations"), tab: "relations" as const },
    { href: accountHref, label: accountLabel, tab: "profile" as const },
  ];

  return (
    <div className="rounded-[20px] bg-white/92 p-3 shadow-[0_12px_26px_rgba(35,38,45,0.08)] ring-1 ring-black/5">
      <p className="px-2 pb-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#7643A6]">
        Navigation
      </p>
      <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-medium text-[#232731] transition hover:bg-[#f6f6f6]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#7643A6] text-white shadow-[0_10px_20px_rgba(118,67,166,0.18)]">
              <TabIcon tab={item.tab} className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function selectedFilterLabel(filter: WebsiteFilter, t: ReturnType<typeof useI18n>["t"]) {
  if (filter === "place") return t("modes.places");
  if (filter === "person") return t("modes.people");
  if (filter === "event") return t("modes.events");
  return t("website.liveFeed");
}

export function WebsiteFeedScreen() {
  const { t, formatDate } = useI18n();
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const setCity = useShellStore((state) => state.setCity);
  const setSelectedDate = useShellStore((state) => state.setSelectedDate);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [filter, setFilter] = useState<WebsiteFilter>("all");
  const [discoverMode, setDiscoverMode] = useState(false);
  const [discoverSeed, setDiscoverSeed] = useState(() => Math.floor(Date.now() % 100000));
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyStartIndex, setStoryStartIndex] = useState(0);
  const [recentViewedIds] = useState<string[]>(() => readRecentViewedEditorialIds());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const feedQuery = useWebsiteFeed(filter, city, selectedDate, 9);
  const likeMutation = useToggleLike(token);
  const accountHref = token ? "/website/profile" : "/website/login";
  const accountLabel = token && user ? t("website.account") : t("website.login");

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

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

  const navItems = [
    { key: "place" as const, label: t("modes.places"), mode: "place" as const },
    { key: "person" as const, label: t("modes.people"), mode: "person" as const },
    { key: "event" as const, label: t("modes.events"), mode: "event" as const },
  ];

  return (
    <div className="min-h-dvh bg-[#E9E9E9] px-3 py-3 text-ink sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <StoryModeOverlay
        open={storyOpen}
        items={displayItems}
        startIndex={storyStartIndex}
        onClose={() => setStoryOpen(false)}
        onLike={(id) => likeMutation.mutate(id)}
        basePath="/website"
      />

      <div className="mx-auto w-full max-w-[1510px]">
        <section className="overflow-visible rounded-[28px] bg-white shadow-[0_26px_80px_rgba(36,39,47,0.08)] ring-1 ring-black/5">
          <header className="grid grid-cols-1 gap-5 border-b border-black/5 px-4 py-4 sm:px-6 lg:grid-cols-[220px_132px_1fr_72px] lg:items-center lg:px-8 lg:py-5">
            <div className="hidden lg:block" />

            <button
              type="button"
              onClick={() => setFilter("all")}
              className="relative justify-self-start lg:justify-self-center"
              aria-pressed={filter === "all"}
              aria-label={t("modes.feed")}
            >
              <PrototypeLogo active={filter === "all"} />
            </button>

            <nav className="flex flex-wrap items-center gap-2 lg:justify-center lg:gap-7">
              {navItems.map((item) => {
                const active = filter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={cn(
                      "relative inline-flex items-center gap-3 rounded-full px-2 py-2 text-[1.08rem] font-medium text-[#424753] transition hover:text-[#111827]",
                      active ? "text-[#1f2430]" : ""
                    )}
                    aria-pressed={active}
                  >
                    <ModeIcon mode={item.mode} className="h-6 w-6 text-current" strokeWidth={2.1} />
                    <span>{item.label}</span>
                    {active ? (
                      <span className="absolute -bottom-[1.32rem] left-1/2 h-0 w-0 -translate-x-1/2 border-x-[9px] border-t-[10px] border-x-transparent border-t-[#3365C8]" />
                    ) : null}
                  </button>
                );
              })}

              <Link
                href="/website/conversations"
                className="inline-flex items-center gap-3 rounded-full px-2 py-2 text-[1.08rem] font-medium text-[#424753] transition hover:text-[#111827]"
              >
                <ModeIcon mode="chat" className="h-6 w-6" />
                <span>{t("modes.chat")}</span>
              </Link>
            </nav>

            <div ref={menuRef} className="relative justify-self-end">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#424753] transition hover:bg-black/5"
                aria-expanded={menuOpen}
                aria-label="Ouvrir le menu website"
              >
                <Menu className="h-7 w-7" strokeWidth={2.2} />
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 w-[240px] rounded-[20px] bg-white p-2 text-left shadow-[0_22px_60px_rgba(30,34,40,0.14)] ring-1 ring-black/5">
                  <Link
                    href={accountHref}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-medium text-[#232731] transition hover:bg-[#f2f2f2]"
                  >
                    <TabIcon tab="profile" className="h-5 w-5" strokeWidth={2.1} />
                    <span>{accountLabel}</span>
                  </Link>
                  <Link
                    href="/website/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-medium text-[#232731] transition hover:bg-[#f2f2f2]"
                  >
                    <Settings2 className="h-5 w-5" strokeWidth={2.1} />
                    <span>{t("website.settings")}</span>
                  </Link>
                  <Link
                    href="/feed"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-medium text-[#232731] transition hover:bg-[#f2f2f2]"
                  >
                    <Smartphone className="h-5 w-5" strokeWidth={2.1} />
                    <span>{t("website.openApp")}</span>
                  </Link>
                </div>
              ) : null}
            </div>
          </header>

          <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="relative border-b border-black/5 bg-[#F1F1F1] px-5 py-5 lg:sticky lg:top-6 lg:h-fit lg:self-start lg:border-b-0 lg:border-r lg:border-black/5 lg:px-7 lg:py-6">
              <div className="absolute left-5 right-[-52px] top-[54px] hidden h-[4px] rounded-full bg-[#1FA463] lg:block" />

              <div className="relative z-10 space-y-5">
                <label className="relative flex items-center gap-3 text-[#343a46]">
                  <ModeIcon mode="place" className="h-5 w-5 shrink-0 text-[#343a46]" strokeWidth={2} />
                  <span className="border-b border-[#343a46]/30 text-[1.05rem] leading-none">
                    {city}
                  </span>
                  <select
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Choisir une ville"
                  >
                    {citySuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion}>
                        {suggestion}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="relative flex items-center gap-3 text-[#343a46]">
                  <CalendarDays className="h-5 w-5 shrink-0" strokeWidth={2} />
                  <span className="border-b border-[#343a46]/30 text-[1.05rem] leading-none">
                    {selectedDate ? formatDate(selectedDate) : "Choisir une date"}
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Choisir une date"
                  />
                </label>

                <div className="inline-flex rounded-[8px] bg-[#1FA463] px-4 py-2 text-[0.95rem] font-semibold text-white shadow-[0_8px_16px_rgba(31,164,99,0.22)]">
                  {selectedFilterLabel(filter, t)}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDiscoverMode((current) => !current)}
                    className={cn(
                      "inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white text-[#343a46] shadow-sm transition hover:-translate-y-0.5",
                      discoverMode ? "border-[#3365C8] bg-[#3365C8] text-white" : ""
                    )}
                    aria-label="Activer le mode decouverte"
                    title="Mode decouverte"
                  >
                    <Wand2 className="h-5 w-5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscoverSeed((current) => current + 1);
                      setDiscoverMode(true);
                    }}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white text-[#343a46] shadow-sm transition hover:-translate-y-0.5"
                    aria-label="Melanger la selection"
                    title="Melanger"
                  >
                    <Shuffle className="h-5 w-5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStoryStartIndex(0);
                      setStoryOpen(true);
                    }}
                    disabled={!displayItems.length}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white text-[#343a46] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label="Ouvrir le story mode"
                    title="Story mode"
                  >
                    <Play className="h-5 w-5 fill-current" strokeWidth={2} />
                  </button>
                </div>

                {smartSuggestion ? (
                  <div className="rounded-[18px] bg-white/92 p-4 shadow-[0_10px_26px_rgba(35,38,45,0.08)] ring-1 ring-black/5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#1FA463]">
                      Focus
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#232731]">{smartSuggestion.title}</p>
                    <button
                      type="button"
                      onClick={() => {
                        const index = displayItems.findIndex((item) => item.id === smartSuggestion.id);
                        setStoryStartIndex(index >= 0 ? index : 0);
                        setStoryOpen(true);
                      }}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#3365C8]"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Voir en story
                    </button>
                  </div>
                ) : null}

                <SidebarUserMenu accountHref={accountHref} accountLabel={accountLabel} />
              </div>
            </aside>

            <div className="relative overflow-visible bg-white px-4 py-4 lg:px-[4px] lg:py-[4px]">
              {feedQuery.isLoading ? (
                <div className="grid grid-cols-1 gap-[4px] sm:grid-cols-2 lg:auto-rows-[78px] lg:grid-cols-12">
                  {CARD_LAYOUTS.map((layout, index) => (
                    <PrototypeFeedSkeletonCard
                      key={`prototype-feed-skeleton-${index}`}
                      className={layout.className}
                    />
                  ))}
                </div>
              ) : displayItems.length ? (
                <div className="grid grid-cols-1 gap-[4px] sm:grid-cols-2 lg:auto-rows-[78px] lg:grid-cols-12">
                  {displayItems.map((item, index) => {
                    const layout = CARD_LAYOUTS[index % CARD_LAYOUTS.length];
                    return (
                      <WebsiteEditorialCard
                        key={item.id}
                        item={item}
                        onLike={(id) => likeMutation.mutate(id)}
                        variant={layout.variant}
                        className={layout.className}
                        entryDelayMs={Math.min(index * 32, 260)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[480px] items-center justify-center rounded-[18px] bg-[#F5F5F5] px-8 text-center text-[1rem] text-[#5b6270] lg:rounded-[3px]">
                  Aucun contenu ne correspond au contexte actuel. Essayez une autre combinaison de lieu ou de date.
                </div>
              )}

              <div className="flex justify-center px-2 pb-2 pt-5 lg:pb-6">
                {feedQuery.hasNextPage ? (
                  <button
                    type="button"
                    onClick={() => feedQuery.fetchNextPage()}
                    className="rounded-full bg-[#232731] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(35,39,49,0.16)] transition hover:bg-[#111827]"
                  >
                    {feedQuery.isFetchingNextPage ? "Chargement..." : t("website.viewAll")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
