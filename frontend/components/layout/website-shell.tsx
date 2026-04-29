"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Crosshair,
  Languages,
  Menu,
  Settings2,
  Smartphone,
} from "lucide-react";

import { ModeIcon, TabIcon } from "@/components/ui/lela-icons";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
import { cn } from "@/lib/utils/cn";

const citySuggestions = ["Strasbourg", "Erstein", "Ribeauville", "Colmar"];

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

function SidebarActionLinks({
  accountHref,
  accountLabel,
}: {
  accountHref: string;
  accountLabel: string;
}) {
  const { t } = useI18n();

  const items = [
    { href: "/website/likes", label: "Contenus aimes", tab: "likes" as const },
    { href: "/website/contribute", label: t("tabs.contribute"), tab: "contribute" as const },
    { href: "/website/conversations", label: t("tabs.conversations"), tab: "conversations" as const },
    { href: "/website/relations", label: t("tabs.relations"), tab: "relations" as const },
    { href: accountHref, label: accountLabel, tab: "profile" as const },
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

export function WebsiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const setCity = useShellStore((state) => state.setCity);
  const setSelectedDate = useShellStore((state) => state.setSelectedDate);
  const { language, setLanguage, t, languageOptions, formatDate, locale } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const accountHref = token ? "/website/profile" : "/website/login";
  const accountLabel = token && user ? t("website.account") : t("website.login");
  const isFeed = pathname === "/website/feed";

  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  if (isFeed) {
    return (
      <div className="min-h-dvh bg-[#E9E9E9] text-ink">
        <main>{children}</main>
      </div>
    );
  }

  const dateLabel = selectedDate
    ? formatDate(selectedDate, { day: "numeric", month: "long", year: "numeric" })
    : "Choisir une date";
  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const topNavItems = [
    { href: "/website/feed", label: t("modes.places"), mode: "place" as const },
    { href: "/website/feed", label: t("modes.people"), mode: "person" as const },
    { href: "/website/feed", label: t("modes.events"), mode: "event" as const },
    { href: "/website/conversations", label: t("modes.chat"), mode: "chat" as const },
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
                <div className="absolute left-0 top-[calc(100%+0.85rem)] z-40 w-[292px] rounded-[20px] bg-white p-2 text-left shadow-[0_22px_60px_rgba(30,34,40,0.14)] ring-1 ring-black/5">
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
                  <label className="mt-1 flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-medium text-[#232731] transition hover:bg-[#f2f2f2]">
                    <Languages className="h-5 w-5" strokeWidth={2.1} />
                    <select
                      value={language}
                      onChange={(event) => setLanguage(event.target.value as typeof language)}
                      className="min-w-0 flex-1 bg-transparent outline-none"
                      aria-label="Choisir la langue"
                    >
                      {languageOptions.map((option) => (
                        <option key={option.code} value={option.code}>
                          {option.flag} {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>

            <Link
              href="/website/feed"
              className="relative justify-self-start lg:justify-self-center"
              aria-label={t("modes.feed")}
            >
              <PrototypeLogo active={pathname === "/website" || pathname.startsWith("/website/editorial")} />
            </Link>

            <nav className="flex flex-wrap items-center gap-5 text-[#4B5260] lg:justify-start lg:gap-12">
              {topNavItems.map((item) => {
                const active =
                  item.mode === "chat"
                    ? pathname.startsWith("/website/conversations")
                    : pathname === "/website/feed";
                return (
                  <Link
                    key={`${item.href}-${item.mode}`}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-3 rounded-full px-1 py-2 text-[1.08rem] font-medium transition hover:text-[#232731]",
                      active ? "text-[#232731]" : ""
                    )}
                  >
                    <ModeIcon mode={item.mode} className="h-6 w-6 text-current" strokeWidth={2.1} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </header>

          <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="border-b border-black/5 bg-[#E9E9E9] px-6 py-7 lg:min-h-[calc(100dvh-156px)] lg:border-b-0 lg:border-r lg:border-black/5 lg:px-8">
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

                {user ? (
                  <Link
                    href="/website/profile"
                    className="flex items-center gap-4 rounded-[14px] px-2 py-2 text-[#232731] transition hover:bg-white/60"
                  >
                    <Image
                      src={user.avatar_url}
                      alt={user.display_name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                    <span className="text-[1.02rem] font-medium leading-tight">{user.display_name}</span>
                  </Link>
                ) : null}

                <SidebarActionLinks accountHref={accountHref} accountLabel={accountLabel} />
              </div>
            </aside>

            <main className="min-w-0 bg-white">{children}</main>
          </div>
        </section>
      </div>
    </div>
  );
}
