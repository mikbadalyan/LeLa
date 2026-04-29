"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Crosshair,
  Menu,
  Settings2,
  Smartphone,
} from "lucide-react";

import { WebsiteEditorialCard } from "@/components/cards/website-editorial-card";
import { ModeIcon, TabIcon } from "@/components/ui/lela-icons";
import { useAuthStore } from "@/features/auth/store";
import { useToggleLike } from "@/features/feed/hooks";
import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
import { useWebsiteFeed } from "@/features/website/hooks";
import type { Contributor, EditorialCard, EditorialType } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

const citySuggestions = ["Strasbourg", "Erstein", "Ribeauville", "Colmar"];

type WebsiteFilter = "all" | "place" | "person" | "event";
type CardVariant = "hero" | "compact" | "wide" | "portrait";

const CARD_LAYOUTS: Array<{ className: string; variant: CardVariant }> = [
  { className: "lg:col-span-8 lg:row-span-6", variant: "hero" },
  { className: "lg:col-span-4 lg:row-span-3", variant: "compact" },
  { className: "lg:col-span-4 lg:row-span-3", variant: "compact" },
  { className: "lg:col-span-4 lg:row-span-3", variant: "compact" },
  { className: "lg:col-span-8 lg:row-span-6", variant: "wide" },
  { className: "lg:col-span-4 lg:row-span-4", variant: "portrait" },
];

function contributorHref(contributorId: string, currentUserId?: string) {
  return contributorId === currentUserId ? "/website/profile" : `/website/profile/${contributorId}`;
}

function PrototypeFeedSkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative min-h-[290px] overflow-hidden rounded-[22px] bg-[#d9d9d9] lg:min-h-0 lg:rounded-[2px]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.14))]" />
      <div className="absolute left-5 top-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-white/90" />
        <div className="h-3 w-32 rounded-full bg-white/90" />
      </div>
      <div className="absolute right-5 top-5 h-8 w-8 rounded-full bg-white/90" />
      <div className="absolute inset-x-5 bottom-6 space-y-3">
        <div className="h-8 w-3/4 rounded-full bg-white/90" />
        <div className="h-4 w-2/3 rounded-full bg-white/75" />
      </div>
      <div className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-[#7643A6]/85" />
    </div>
  );
}

function PrototypeLogo({ active }: { active: boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full border border-[#8B3DFF] bg-white shadow-[0_10px_24px_rgba(139,61,255,0.1)]">
        <Image src="/assets/logo.svg" alt="LE_LA" width={28} height={36} priority />
      </div>
      {active ? (
        <span className="absolute -bottom-[18px] h-0 w-0 border-x-[10px] border-t-[10px] border-x-transparent border-t-[#4D4D56]" />
      ) : null}
    </div>
  );
}

function ShowcaseContributor({
  contributor,
  currentUserId,
}: {
  contributor: Contributor | null;
  currentUserId?: string;
}) {
  if (!contributor) {
    return null;
  }

  return (
    <Link
      href={contributorHref(contributor.id, currentUserId)}
      className="flex items-center gap-4 rounded-[14px] px-2 py-2 text-[#232731] transition hover:bg-white/60"
    >
      <Image
        src={contributor.avatar_url}
        alt={contributor.display_name}
        width={32}
        height={32}
        className="rounded-full object-cover"
      />
      <span className="text-[1.02rem] font-medium leading-tight">{contributor.display_name}</span>
    </Link>
  );
}

function SidebarActionLinks() {
  const { t } = useI18n();

  const items = [
    { href: "/website/likes", label: "Contenus aimes", tab: "likes" as const },
    { href: "/website/contribute", label: t("tabs.contribute"), tab: "contribute" as const },
    {
      href: "/website/conversations",
      label: t("tabs.conversations"),
      tab: "conversations" as const,
    },
    { href: "/website/relations", label: t("tabs.relations"), tab: "relations" as const },
  ];

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-4 rounded-[14px] px-2 py-2 text-[#232731] transition hover:bg-white/60"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center text-[#8A32E5]">
            <TabIcon tab={item.tab} className="h-8 w-8" strokeWidth={1.9} />
          </span>
          <span className="text-[1.02rem] font-medium">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

function pickItem(
  items: EditorialCard[],
  used: Set<string>,
  preferredTypes: EditorialType[]
) {
  const preferred = items.find((item) => !used.has(item.id) && preferredTypes.includes(item.type));
  if (preferred) {
    used.add(preferred.id);
    return preferred;
  }

  const fallback = items.find((item) => !used.has(item.id));
  if (fallback) {
    used.add(fallback.id);
    return fallback;
  }

  return null;
}

function selectPrototypeItems(items: EditorialCard[]) {
  const used = new Set<string>();
  const slots = [
    pickItem(items, used, ["place", "magazine"]),
    pickItem(items, used, ["event"]),
    pickItem(items, used, ["place", "magazine", "event"]),
    pickItem(items, used, ["place", "magazine", "event"]),
    pickItem(items, used, ["place", "magazine"]),
    pickItem(items, used, ["person"]),
  ];

  return slots.filter((item): item is EditorialCard => Boolean(item));
}

export function WebsiteFeedScreen() {
  const { t, formatDate, locale } = useI18n();
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const setCity = useShellStore((state) => state.setCity);
  const setSelectedDate = useShellStore((state) => state.setSelectedDate);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [filter, setFilter] = useState<WebsiteFilter>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const feedQuery = useWebsiteFeed(filter, city, selectedDate, 12);
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

  const showcaseItems = useMemo(() => selectPrototypeItems(items), [items]);

  const sidebarContributor = showcaseItems[0]?.contributor ?? user ?? null;
  const dateLabel = selectedDate
    ? formatDate(selectedDate, { day: "numeric", month: "long", year: "numeric" })
    : "Choisir une date";
  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const navItems = [
    { key: "place" as const, label: t("modes.places"), mode: "place" as const },
    { key: "person" as const, label: t("modes.people"), mode: "person" as const },
    { key: "event" as const, label: t("modes.events"), mode: "event" as const },
  ];

  return (
    <div className="min-h-dvh bg-[#E9E9E9] px-3 py-3 text-ink sm:px-4 sm:py-4 lg:px-4 lg:py-5">
      <div className="mx-auto w-full max-w-[1800px]">
        <section className="min-h-[calc(100dvh-2rem)] rounded-[4px] bg-white shadow-[0_20px_70px_rgba(36,39,47,0.06)] ring-1 ring-black/5">
          <header className="grid grid-cols-1 gap-4 border-b border-black/5 px-6 py-5 lg:grid-cols-[110px_180px_minmax(0,1fr)] lg:items-center lg:px-8 lg:py-6">
            <div ref={menuRef} className="relative flex items-center">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#4B5260] transition hover:bg-black/5"
                aria-expanded={menuOpen}
                aria-label="Ouvrir le menu website"
              >
                <Menu className="h-8 w-8" strokeWidth={2.2} />
              </button>

              {menuOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.85rem)] z-40 w-[270px] rounded-[20px] bg-white p-2 text-left shadow-[0_22px_60px_rgba(30,34,40,0.14)] ring-1 ring-black/5">
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

            <button
              type="button"
              onClick={() => setFilter("all")}
              className="relative justify-self-start lg:justify-self-center"
              aria-pressed={filter === "all"}
              aria-label={t("modes.feed")}
            >
              <PrototypeLogo active={filter === "all"} />
            </button>

            <nav className="flex flex-wrap items-center gap-5 text-[#4B5260] lg:justify-start lg:gap-12">
              {navItems.map((item) => {
                const active = filter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={cn(
                      "inline-flex items-center gap-3 rounded-full px-1 py-2 text-[1.08rem] font-medium transition hover:text-[#232731]",
                      active ? "text-[#232731]" : ""
                    )}
                    aria-pressed={active}
                  >
                    <ModeIcon mode={item.mode} className="h-6 w-6 text-current" strokeWidth={2.1} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <Link
                href="/website/conversations"
                className="inline-flex items-center gap-3 rounded-full px-1 py-2 text-[1.08rem] font-medium text-[#4B5260] transition hover:text-[#232731]"
              >
                <ModeIcon mode="chat" className="h-6 w-6" />
                <span>{t("modes.chat")}</span>
              </Link>
            </nav>
          </header>

          <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="border-b border-black/5 bg-[#E9E9E9] px-6 py-7 lg:min-h-[calc(100vh-170px)] lg:border-b-0 lg:border-r lg:border-black/5 lg:px-8">
              <div className="space-y-5">
                <label className="relative flex items-start gap-5 text-[#232731]">
                  <Crosshair className="mt-1 h-6 w-6 shrink-0 text-[#4B5260]" strokeWidth={1.9} />
                  <span className="text-[1.08rem] font-medium leading-tight">{city}</span>
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

                <label className="relative flex items-start gap-5 text-[#232731]">
                  <CalendarDays className="mt-1 h-6 w-6 shrink-0 text-[#4B5260]" strokeWidth={1.9} />
                  <span className="text-[1.08rem] font-medium leading-tight">
                    {dateLabel}
                    <br />
                    {timeLabel}
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Choisir une date"
                  />
                </label>

                <div className="pt-3">
                  <ShowcaseContributor contributor={sidebarContributor} currentUserId={user?.id} />
                </div>

                <div className="pt-1">
                  <SidebarActionLinks />
                </div>
              </div>
            </aside>

            <div className="bg-white px-[4px] py-[4px]">
              {feedQuery.isLoading ? (
                <div className="grid grid-cols-1 gap-[4px] sm:grid-cols-2 lg:auto-rows-[132px] lg:grid-cols-12">
                  {CARD_LAYOUTS.map((layout, index) => (
                    <PrototypeFeedSkeletonCard
                      key={`prototype-feed-skeleton-${index}`}
                      className={layout.className}
                    />
                  ))}
                </div>
              ) : showcaseItems.length ? (
                <div className="grid grid-cols-1 gap-[4px] sm:grid-cols-2 lg:auto-rows-[132px] lg:grid-cols-12">
                  {showcaseItems.slice(0, CARD_LAYOUTS.length).map((item, index) => {
                    const layout = CARD_LAYOUTS[index];
                    return (
                      <WebsiteEditorialCard
                        key={item.id}
                        item={item}
                        onLike={(id) => likeMutation.mutate(id)}
                        variant={layout.variant}
                        className={layout.className}
                        entryDelayMs={Math.min(index * 26, 180)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[540px] items-center justify-center rounded-[18px] bg-[#F5F5F5] px-8 text-center text-[1rem] text-[#5b6270] lg:rounded-[3px]">
                  Aucun contenu ne correspond au contexte actuel. Essayez une autre combinaison de lieu ou de date.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
