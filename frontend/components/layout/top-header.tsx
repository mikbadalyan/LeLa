"use client";

import {
  CalendarDays,
  Heart,
  Home,
  Map,
  Menu,
  PlusCircle,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { languageOptions, useI18n } from "@/features/shell/i18n";
import { Input } from "@/components/ui/input";
import { useShellStore } from "@/features/shell/store";

interface TopHeaderProps {
  rightContent?: ReactNode;
}

const citySuggestions = ["Strasbourg", "Erstein", "Ribeauville", "Colmar"];

type Panel = "city" | "date" | "menu" | null;

export function TopHeader({ rightContent }: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t, formatDate } = useI18n();
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const setCity = useShellStore((state) => state.setCity);
  const setSelectedDate = useShellStore((state) => state.setSelectedDate);
  const resetFilters = useShellStore((state) => state.resetFilters);

  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const [draftCity, setDraftCity] = useState(city);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on route change
  useEffect(() => {
    setOpenPanel(null);
  }, [pathname]);

  // Sync draft when city changes externally
  useEffect(() => {
    setDraftCity(city);
  }, [city]);

  // Close on outside click
  useEffect(() => {
    if (!openPanel) return;

    const handleClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    };

    // Small delay so the same click that opens the panel doesn't close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [openPanel]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPanel(null);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const toggle = (panel: Exclude<Panel, null>) =>
    setOpenPanel((current) => (current === panel ? null : panel));

  const menuLinks = [
    {
      label: t("menu.fullFeed"),
      description: t("menu.fullFeedDescription"),
      icon: Home,
      action: () => {
        resetFilters();
        router.push("/feed");
        setOpenPanel(null);
      },
    },
    {
      label: t("menu.map"),
      description: t("menu.mapDescription"),
      icon: Map,
      action: () => {
        router.push("/map");
        setOpenPanel(null);
      },
    },
    {
      label: t("menu.likes"),
      description: t("menu.likesDescription"),
      icon: Heart,
      action: () => {
        router.push("/likes");
        setOpenPanel(null);
      },
    },
    {
      label: t("menu.relations"),
      description: t("menu.relationsDescription"),
      icon: Users,
      action: () => {
        router.push("/relations");
        setOpenPanel(null);
      },
    },
    {
      label: t("menu.contribute"),
      description: t("menu.contributeDescription"),
      icon: PlusCircle,
      action: () => {
        router.push("/contribute");
        setOpenPanel(null);
      },
    },
    {
      label: t("menu.account"),
      description: t("menu.accountDescription"),
      icon: UserCircle2,
      action: () => {
        router.push("/profile");
        setOpenPanel(null);
      },
    },
  ];

  return (
    <>
      {/* Full-screen backdrop (below header, above content but below panels) */}
      {openPanel ? (
        <div
          className="fixed inset-0 z-10 bg-black/10 backdrop-blur-[1px]"
          onClick={() => setOpenPanel(null)}
        />
      ) : null}

      <header className="relative z-20 border-b border-borderSoft/90 bg-white/92 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 text-sm text-graphite">
          {/* City selector */}
          <button
            type="button"
            onClick={() => toggle("city")}
            className={`flex min-w-0 items-center gap-2 rounded-full border px-3 py-1.5 font-medium transition ${
              openPanel === "city"
                ? "border-plum/20 bg-[#F8F0FF] text-plum"
                : "border-transparent bg-mist/70 hover:bg-mist"
            }`}
          >
            <Map className="h-4 w-4 shrink-0" />
            <span className="truncate text-[13px]">{city}</span>
          </button>

          {/* Date selector */}
          <button
            type="button"
            onClick={() => toggle("date")}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-medium transition ${
              openPanel === "date"
                ? "border-plum/20 bg-[#F8F0FF] text-plum"
                : "border-transparent bg-mist/70 hover:bg-mist"
            }`}
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap text-[13px]">{formatDate(selectedDate)}</span>
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {rightContent}
            <button
              type="button"
              onClick={() => toggle("menu")}
              className={`rounded-full border p-2 transition ${
                openPanel === "menu"
                  ? "border-plum/20 bg-[#F8F0FF] text-plum"
                  : "border-transparent bg-mist/70 hover:bg-mist"
              }`}
              aria-label={t("header.menu")}
            >
              {openPanel === "menu" ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* ── Dropdown panels ── */}
        <div ref={panelRef}>
          {/* City panel */}
          {openPanel === "city" ? (
            <div className="absolute inset-x-4 top-full z-30 mt-2 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-borderSoft">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{t("header.changeCity")}</p>
                  <p className="text-xs leading-5 text-graphite/75">
                    Le feed, la carte et les pages likes utiliseront cette ville comme contexte.
                  </p>
                </div>
                <Input
                  value={draftCity}
                  onChange={(event) => setDraftCity(event.target.value)}
                  placeholder={t("header.cityPlaceholder")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setCity(draftCity);
                      setOpenPanel(null);
                    }
                  }}
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  {citySuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setCity(suggestion);
                        setOpenPanel(null);
                      }}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        city === suggestion
                          ? "bg-plum text-white"
                          : "bg-mist text-graphite hover:bg-plum hover:text-white"
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                  type="button"
                  onClick={() => {
                    setCity(draftCity);
                    setOpenPanel(null);
                  }}
                >
                    {t("header.apply")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOpenPanel(null)}
                  >
                    {t("header.close")}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Date panel */}
          {openPanel === "date" ? (
            <div className="absolute inset-x-4 top-full z-30 mt-2 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-borderSoft">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{t("header.chooseDate")}</p>
                  <p className="text-xs leading-5 text-graphite/75">
                    {t("header.dateHint")}
                  </p>
                </div>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setOpenPanel(null)}
                  >
                    {t("header.apply")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOpenPanel(null)}
                  >
                    {t("header.close")}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Menu panel */}
          {openPanel === "menu" ? (
            <div className="absolute right-4 top-full z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-[32px] bg-white p-4 shadow-card ring-1 ring-borderSoft">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-plum">
                      {t("header.navigation")}
                    </p>
                    <p className="mt-1 text-sm text-graphite">
                      {city} · {formatDate(selectedDate)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      resetFilters();
                      setOpenPanel(null);
                    }}
                  >
                    {t("header.reset")}
                  </Button>
                </div>

                <div className="space-y-1">
                  {menuLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.label}
                        type="button"
                        onClick={link.action}
                        className="flex w-full items-start gap-3 rounded-[24px] px-3 py-3 text-left transition hover:bg-mist active:bg-plum/10"
                      >
                        <div className="rounded-2xl bg-plum/10 p-2 text-plum">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink">{link.label}</p>
                          <p className="text-xs leading-5 text-graphite/75">
                            {link.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-[24px] bg-[#FCFAF8] px-4 py-4 ring-1 ring-borderSoft">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">
                    {t("menu.language")}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {languageOptions.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => setLanguage(option.code)}
                        className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                          language === option.code
                            ? "bg-plum text-white"
                            : "bg-white text-ink ring-1 ring-borderSoft hover:bg-mist"
                        }`}
                      >
                        <span className="text-base">{option.flag}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] bg-[#FCFAF8] px-4 py-4 ring-1 ring-borderSoft">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">
                    {t("menu.help")}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-graphite">{t("menu.helpText")}</p>
                </div>

                <div className="rounded-[24px] bg-[#FCFAF8] px-4 py-4 ring-1 ring-borderSoft">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">
                    {t("menu.howToUse")}
                  </p>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-graphite">
                    <p>1. {t("menu.howToUseStep1")}</p>
                    <p>2. {t("menu.howToUseStep2")}</p>
                    <p>3. {t("menu.howToUseStep3")}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </header>
    </>
  );
}
