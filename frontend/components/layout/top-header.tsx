"use client";

import { CalendarDays, Heart, Home, Map, Menu, PlusCircle, UserCircle2, Users, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShellStore } from "@/features/shell/store";
import { formatFrenchDate } from "@/lib/utils/format";

interface TopHeaderProps {
  rightContent?: ReactNode;
}

const citySuggestions = ["Strasbourg", "Erstein", "Ribeauville", "Colmar"];

export function TopHeader({ rightContent }: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const setCity = useShellStore((state) => state.setCity);
  const setSelectedDate = useShellStore((state) => state.setSelectedDate);
  const resetFilters = useShellStore((state) => state.resetFilters);

  const [openPanel, setOpenPanel] = useState<"city" | "date" | "menu" | null>(null);
  const [draftCity, setDraftCity] = useState(city);

  useEffect(() => {
    setOpenPanel(null);
  }, [pathname]);

  useEffect(() => {
    setDraftCity(city);
  }, [city]);

  const menuLinks = [
    {
      label: "Fil complet",
      description: "Retourner au feed complet et reinitialiser les filtres.",
      icon: Home,
      action: () => {
        resetFilters();
        router.push("/feed");
      },
    },
    {
      label: "Carte",
      description: "Ouvrir la page carte OpenStreetMap.",
      icon: Map,
      action: () => router.push("/map"),
    },
    {
      label: "Aimes",
      description: "Voir toutes les cartes que vous avez aimees.",
      icon: Heart,
      action: () => router.push("/likes"),
    },
    {
      label: "Relations",
      description: "Rechercher des profils et gerer vos amis.",
      icon: Users,
      action: () => router.push("/relations"),
    },
    {
      label: "Contribuer",
      description: "Publier une nouvelle proposition.",
      icon: PlusCircle,
      action: () => router.push("/contribute"),
    },
    {
      label: "Compte",
      description: "Ouvrir votre profil et la moderation.",
      icon: UserCircle2,
      action: () => router.push("/profile"),
    },
  ];

  return (
    <header className="relative border-b border-borderSoft bg-white/85 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3 text-sm text-graphite">
        <button
          type="button"
          onClick={() => setOpenPanel((current) => (current === "city" ? null : "city"))}
          className="flex items-center gap-2 rounded-full px-2 py-1 font-medium underline decoration-1 underline-offset-2 transition hover:bg-mist"
        >
          <Map className="h-4 w-4" />
          <span className="truncate">{city}</span>
        </button>

        <button
          type="button"
          onClick={() => setOpenPanel((current) => (current === "date" ? null : "date"))}
          className="flex items-center gap-2 rounded-full px-2 py-1 font-medium transition hover:bg-mist"
        >
          <CalendarDays className="h-4 w-4" />
          <span>{formatFrenchDate(selectedDate)}</span>
        </button>

        <div className="flex items-center gap-2">
          {rightContent}
          <button
            type="button"
            onClick={() => setOpenPanel((current) => (current === "menu" ? null : "menu"))}
            className="rounded-full p-2 transition hover:bg-mist"
            aria-label="Ouvrir le menu"
          >
            {openPanel === "menu" ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {openPanel === "city" ? (
        <div className="absolute inset-x-4 top-full z-20 mt-2 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-borderSoft">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-ink">Changer de ville</p>
              <p className="text-xs leading-5 text-graphite/75">
                Le feed, la carte et les pages likes utiliseront cette ville comme contexte.
              </p>
            </div>
            <Input
              value={draftCity}
              onChange={(event) => setDraftCity(event.target.value)}
              placeholder="Entrez une ville"
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
                  className="rounded-full bg-mist px-3 py-2 text-xs font-semibold text-graphite transition hover:bg-plum hover:text-white"
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
                Appliquer
              </Button>
              <Button type="button" variant="secondary" onClick={() => setOpenPanel(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {openPanel === "date" ? (
        <div className="absolute inset-x-4 top-full z-20 mt-2 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-borderSoft">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-ink">Choisir une date</p>
              <p className="text-xs leading-5 text-graphite/75">
                Les evenements et la carte se recalculent a partir de cette date.
              </p>
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpenPanel(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {openPanel === "menu" ? (
        <div className="absolute right-4 top-full z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-[32px] bg-white p-4 shadow-card ring-1 ring-borderSoft">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-plum">Navigation</p>
                <p className="mt-1 text-sm text-graphite">
                  {city} · {formatFrenchDate(selectedDate)}
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => resetFilters()}>
                Reinitialiser
              </Button>
            </div>

            <div className="space-y-2">
              {menuLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.label}
                    type="button"
                    onClick={link.action}
                    className="flex w-full items-start gap-3 rounded-[24px] px-3 py-3 text-left transition hover:bg-mist"
                  >
                    <div className="rounded-2xl bg-plum/10 p-2 text-plum">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{link.label}</p>
                      <p className="text-xs leading-5 text-graphite/75">{link.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
