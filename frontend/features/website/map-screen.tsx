"use client";

import { useMemo } from "react";
import Link from "next/link";
import { LoaderCircle, MapPinned } from "lucide-react";

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

  const activeMarker = useMemo(() => {
    if (!markersQuery.data?.length) {
      return null;
    }

    return (
      markersQuery.data.find((marker) => marker.editorial_id === editorialId) ??
      markersQuery.data[0]
    );
  }, [editorialId, markersQuery.data]);

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
      </section>

      {markersQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue" />
        </div>
      ) : activeMarker ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-card bg-elevated shadow-card ring-1 ring-borderSoft/10">
            <iframe
              title="Carte OpenStreetMap"
              src={buildMapSrc(activeMarker.latitude, activeMarker.longitude)}
              className="h-[68vh] min-h-[520px] w-full border-0"
              loading="lazy"
            />
          </div>
          <div className="rounded-card bg-elevated px-5 py-5 shadow-card ring-1 ring-borderSoft/10">
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
              {markersQuery.data?.map((marker) => (
                <Link
                  key={marker.editorial_id}
                  href={`/website/map?editorial=${marker.editorial_id}`}
                  className={`flex items-center justify-between rounded-[24px] px-4 py-4 ring-1 transition ${
                    marker.editorial_id === activeMarker.editorial_id
                      ? "bg-blueSoft ring-blue/20"
                      : "bg-surface ring-borderSoft/10 hover:bg-mist"
                  }`}
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
