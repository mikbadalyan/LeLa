"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFeedUiStore } from "@/features/feed/store";
import { useShellStore } from "@/features/shell/store";

interface CardFilterSheetProps {
  children: (controls: { open: () => void }) => ReactNode;
}

const TYPE_OPTIONS = [
  { key: "all", label: "Tout" },
  { key: "place", label: "Lieux" },
  { key: "person", label: "Acteurs" },
  { key: "event", label: "Evenements" },
  { key: "magazine", label: "Magazine" },
] as const;

export function CardFilterSheet({ children }: CardFilterSheetProps) {
  const router = useRouter();
  const filter = useFeedUiStore((state) => state.filter);
  const mediaFilter = useFeedUiStore((state) => state.mediaFilter);
  const setFilter = useFeedUiStore((state) => state.setFilter);
  const setMediaFilter = useFeedUiStore((state) => state.setMediaFilter);
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const setCity = useShellStore((state) => state.setCity);
  const setSelectedDate = useShellStore((state) => state.setSelectedDate);
  const resetShellFilters = useShellStore((state) => state.resetFilters);
  const [open, setOpen] = useState(false);
  const [draftFilter, setDraftFilter] = useState(filter);
  const [draftMediaFilter, setDraftMediaFilter] = useState(mediaFilter);
  const [draftCity, setDraftCity] = useState(city);
  const [draftDate, setDraftDate] = useState(selectedDate);

  const openSheet = () => {
    setDraftFilter(filter);
    setDraftMediaFilter(mediaFilter);
    setDraftCity(city);
    setDraftDate(selectedDate);
    setOpen(true);
  };

  const applyFilters = () => {
    setFilter(draftFilter);
    setMediaFilter(draftMediaFilter);
    setCity(draftCity);
    setSelectedDate(draftDate);

    if (draftFilter === "place" || draftFilter === "person" || draftFilter === "event") {
      router.push(`/feed?focus=${draftFilter}`);
    } else {
      router.push("/feed");
    }

    setOpen(false);
  };

  return (
    <>
      {children({ open: openSheet })}

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 px-3 py-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-card bg-elevated p-5 shadow-card ring-1 ring-borderSoft/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-blue">Filtre</p>
                <h3 className="mt-2 text-xl font-semibold text-ink">Filtrer les cartes</h3>
                <p className="mt-1 text-sm leading-6 text-graphite">
                  Affinez le feed par type, ville, date ou media.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-surface p-2 text-graphite ring-1 ring-borderSoft/10 transition hover:bg-blueSoft hover:text-blue"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Type de cartes</p>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setDraftFilter(option.key)}
                      className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                        draftFilter === option.key
                          ? "bg-blue text-white shadow-blue"
                          : "bg-surface text-graphite ring-1 ring-borderSoft/10 hover:bg-blueSoft hover:text-blue"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Ville</p>
                <Input
                  value={draftCity}
                  onChange={(event) => setDraftCity(event.target.value)}
                  placeholder="Ville"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Date</p>
                <Input
                  type="date"
                  value={draftDate}
                  onChange={(event) => setDraftDate(event.target.value)}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Media</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "all", label: "Tout" },
                    { key: "video", label: "Videos uniquement" },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setDraftMediaFilter(option.key as "all" | "video")}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        draftMediaFilter === option.key
                          ? "bg-blue text-white shadow-blue"
                          : "bg-surface text-graphite ring-1 ring-borderSoft/10 hover:bg-blueSoft hover:text-blue"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetShellFilters();
                  setFilter("all");
                  setMediaFilter("all");
                  setDraftFilter("all");
                  setDraftMediaFilter("all");
                  setDraftCity("Strasbourg");
                  setDraftDate("2026-04-05");
                }}
              >
                Reinit.
              </Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Fermer
              </Button>
              <Button type="button" onClick={applyFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
