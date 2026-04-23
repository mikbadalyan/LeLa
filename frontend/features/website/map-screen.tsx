"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LoaderCircle, MapPinned, Shuffle } from "lucide-react";

import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
import { useWebsiteMapMarkers } from "@/features/website/hooks";

function buildMapSrc(latitude: number, longitude: number) {
  const padding = 0.06;
  const bbox = [
    longitude - padding,
    latitude - padding,
    longitude + padding,
    latitude + padding,
  ].join(",");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

export function WebsiteMapScreen({
  editorialId,
}: {
  editorialId?: string | null;
}) {
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const { t, formatDate } = useI18n();
  const markersQuery = useWebsiteMapMarkers(city, selectedDate);
  const [mapFocusSeed, setMapFocusSeed] = useState(0);

  const activeMarker = useMemo(() => {
    if (!markersQuery.data?.length) {
      return null;
    }

    const explicit = markersQuery.data.find((marker) => marker.editorial_id === editorialId);
    if (explicit) {
      return explicit;
    }
    if (mapFocusSeed > 0) {
      return markersQuery.data[mapFocusSeed % markersQuery.data.length];
    }
    return markersQuery.data[0];
  }, [editorialId, markersQuery.data, mapFocusSeed]);

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-5 py-8 lg:px-8 lg:py-12">
      <section className="rounded-card bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue">
          {t("website.map")}
        </p>
        <h1 className="mt-2 text-[2.2rem] font-semibold tracking-[-0.05em] text-ink">{city}</h1>
        <p className="mt-2 text-sm leading-7 text-graphite">
          {formatDate(selectedDate)}
        </p>
        <button
          type="button"
          onClick={() => setMapFocusSeed((current) => current + 1)}
          className="interactive-action mt-3 inline-flex items-center gap-2 rounded-full bg-blueSoft px-3 py-2 text-xs font-semibold text-blue ring-1 ring-blue/18"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Decouverte aleatoire
        </button>
      </section>

      {markersQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue" />
        </div>
      ) : activeMarker ? (
        <section className="detail-reveal grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-card bg-elevated shadow-card ring-1 ring-borderSoft/10">
            <iframe
              title="Carte OpenStreetMap"
              src={buildMapSrc(activeMarker.latitude, activeMarker.longitude)}
              className="h-[68vh] min-h-[520px] w-full border-0"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-x-5 bottom-5">
              <div className="marker-pop rounded-[20px] bg-black/58 px-4 py-3 text-white ring-1 ring-white/14 backdrop-blur-md">
                <p className="line-clamp-1 text-sm font-semibold">{activeMarker.title}</p>
                <p className="line-clamp-1 text-xs text-white/70">{activeMarker.city ?? "Sans ville"}</p>
              </div>
            </div>
          </div>
          <div className="detail-reveal detail-reveal-delay-1 rounded-card bg-elevated px-5 py-5 shadow-card ring-1 ring-borderSoft/10">
            <div className="space-y-2 border-b border-borderSoft/10 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue">
                Point actif
              </p>
              <h2 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-ink">
                {activeMarker.title}
              </h2>
              {activeMarker.subtitle ? (
                <p className="text-sm text-graphite">{activeMarker.subtitle}</p>
              ) : null}
            </div>

            <div className="mt-5 space-y-3">
              {markersQuery.data?.map((marker, index) => (
                <Link
                  key={marker.editorial_id}
                  href={`/website/map?editorial=${marker.editorial_id}`}
                  className={`interactive-surface marker-pop flex items-center justify-between rounded-[24px] px-4 py-4 ring-1 transition ${
                    marker.editorial_id === activeMarker.editorial_id
                      ? "bg-blueSoft ring-blue/26 shadow-blue"
                      : "bg-surface ring-borderSoft/10 hover:bg-mist"
                  }`}
                  style={{ animationDelay: `${Math.min(index * 34, 200)}ms` }}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{marker.title}</p>
                    <p className="text-xs text-graphite/65">{marker.city}</p>
                  </div>
                  <MapPinned className="h-4 w-4 text-blue" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <div className="rounded-card bg-elevated px-6 py-8 text-sm text-graphite/70 shadow-card ring-1 ring-borderSoft/10">
          Aucune capsule geo-localisee ne correspond a ce contexte pour le moment.
        </div>
      )}
    </div>
  );
}
