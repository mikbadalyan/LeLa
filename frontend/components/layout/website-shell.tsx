"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Smartphone } from "lucide-react";

import { LogoMark } from "@/components/ui/logo-mark";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
import { cn } from "@/lib/utils/cn";

const citySuggestions = ["Strasbourg", "Erstein", "Ribeauville", "Colmar"];

export function WebsiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const setCity = useShellStore((state) => state.setCity);
  const setSelectedDate = useShellStore((state) => state.setSelectedDate);
  const { language, setLanguage, t, languageOptions } = useI18n();

  const navItems = [
    { href: "/website", label: t("website.home") },
    { href: "/website/feed", label: t("website.explore") },
    { href: "/website/map", label: t("website.map") },
  ];

  const quickLinks = [
    { href: "/website/likes", label: t("tabs.likes"), active: pathname.startsWith("/website/likes") },
    {
      href: "/website/conversations",
      label: t("tabs.conversations"),
      active: pathname.startsWith("/website/conversations"),
    },
    {
      href: "/website/contribute",
      label: t("tabs.contribute"),
      active: pathname.startsWith("/website/contribute"),
    },
    {
      href: "/website/settings",
      label: t("website.settings"),
      active: pathname.startsWith("/website/settings"),
    },
  ];

  const accountHref = token ? "/website/profile" : "/website/login";
  const accountActive = pathname.startsWith("/website/profile") || pathname.startsWith("/website/login");

  return (
    <div
      className="min-h-dvh bg-background text-ink"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% -10%, rgba(255,255,255,0.62), rgba(255,255,255,0) 34%), linear-gradient(180deg, rgb(var(--background-rgb)) 0%, rgb(var(--background-rgb)) 100%)",
      }}
    >
      <header className="sticky top-0 z-50 border-b border-borderSoft/10 bg-elevated/84 shadow-soft backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1380px] items-center gap-6 px-5 py-4 lg:px-8">
          <Link href="/website" className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-plum">LE_LA</p>
              <p className="text-xs text-graphite/70">{t("website.heroKicker")}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  (pathname === item.href ||
                    (item.href === "/website/feed" && pathname.startsWith("/website/editorial")))
                    ? "bg-blue text-white shadow-blue"
                    : "text-graphite hover:bg-mist"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-3 xl:flex">
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="rounded-full border border-borderSoft/12 bg-elevated px-4 py-2 text-sm text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/12"
            >
              {citySuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion}>
                  {suggestion}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-full border border-borderSoft/12 bg-elevated px-4 py-2 text-sm text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/12"
            />

            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as typeof language)}
              className="rounded-full border border-borderSoft/12 bg-elevated px-4 py-2 text-sm text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/12"
            >
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.flag} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "hidden rounded-full px-4 py-2 text-sm font-medium transition lg:inline-flex",
                  item.active ? "bg-plum text-white shadow-float" : "bg-elevated text-ink ring-1 ring-borderSoft/8 hover:bg-mist"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/feed"
              className="hidden h-11 w-11 items-center justify-center rounded-full border border-blue/20 bg-blueSoft text-blue transition hover:bg-blue hover:text-white lg:inline-flex"
              title={t("website.openApp")}
              aria-label={t("website.openAppAria")}
            >
              <Smartphone className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href={accountHref}
              className={cn(
                "rounded-full border border-borderSoft/12 px-4 py-2 text-sm font-medium transition",
                accountActive ? "bg-plum text-white shadow-float" : "bg-elevated text-ink hover:bg-mist"
              )}
            >
              {token && user ? t("website.account") : t("website.login")}
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-borderSoft/10 bg-elevated/72 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-4 px-5 py-8 text-sm text-graphite/80 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="max-w-2xl">{t("website.footerLine")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/website/feed" className="font-medium text-ink hover:text-plum">
              {t("website.explore")}
            </Link>
            <Link href="/website/map" className="font-medium text-ink hover:text-plum">
              {t("website.map")}
            </Link>
            <Link href="/website/likes" className="font-medium text-ink hover:text-plum">
              {t("tabs.likes")}
            </Link>
            <Link href="/website/conversations" className="font-medium text-ink hover:text-plum">
              {t("tabs.conversations")}
            </Link>
            <Link href="/website/contribute" className="font-medium text-ink hover:text-plum">
              {t("tabs.contribute")}
            </Link>
            <Link href="/website/settings" className="font-medium text-ink hover:text-plum">
              {t("website.settings")}
            </Link>
            <Link href="/website/profile" className="font-medium text-ink hover:text-plum">
              {t("website.account")}
            </Link>
            <Link href="/feed" className="font-medium text-plum hover:text-plum/80">
              {t("website.openApp")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
