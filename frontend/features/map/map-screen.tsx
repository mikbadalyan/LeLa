"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ExternalLink, LoaderCircle, MapPinned } from "lucide-react";

import { MobileShell } from "@/components/layout/mobile-shell";
import { useAuthStore } from "@/features/auth/store";
import { useShellStore } from "@/features/shell/store";
import { getMapMarkers } from "@/lib/api/endpoints";
import { formatFrenchDate, formatFrenchDateTime } from "@/lib/utils/format";

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

interface MapScreenProps {
  editorialId?: string | null;
}

export function MapScreen({ editorialId }: MapScreenProps) {
  const token = useAuthStore((state) => state.token);
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);

  const markersQuery = useQuery({
    queryKey: ["map-markers", city, selectedDate, Boolean(token)],
    queryFn: () => getMapMarkers({ city, date: selectedDate }, token),
  });

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
    <MobileShell activeMode="place" activeTab="relations" className="space-y-4 px-4 py-5">
      <div className="rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[#F8F0FF] p-3 text-plum">
            <MapPinned className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Carte LE_LA</h1>
            <p className="mt-2 text-sm leading-6 text-graphite">
              Carte ouverte via OpenStreetMap. Le contexte utilise {city} et la date du {formatFrenchDate(selectedDate)}.
            </p>
          </div>
        </div>
      </div>

      {markersQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-7 w-7 animate-spin text-plum" />
        </div>
      ) : activeMarker ? (
        <>
          <div className="overflow-hidden rounded-[32px] bg-white shadow-card ring-1 ring-borderSoft">
            <iframe
              title="Carte OpenStreetMap"
              src={buildMapSrc(activeMarker.latitude, activeMarker.longitude)}
              className="h-[22rem] w-full border-0"
              loading="lazy"
            />
          </div>

          <div className="rounded-[32px] bg-white px-5 py-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.18em] text-plum">Point actif</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">{activeMarker.title}</h2>
            {activeMarker.subtitle ? (
              <p className="mt-1 text-sm text-graphite">{activeMarker.subtitle}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-graphite">
              {activeMarker.city ? <span>{activeMarker.city}</span> : null}
              {activeMarker.date ? <span>{formatFrenchDateTime(activeMarker.date)}</span> : null}
            </div>
            <div className="mt-4 flex gap-3">
              <Link
                href={activeMarker.href}
                className="inline-flex items-center rounded-full bg-plum px-5 py-3 text-sm font-semibold text-white shadow-float"
              >
                Ouvrir la fiche
              </Link>
              <a
                href={`https://www.openstreetmap.org/?mlat=${activeMarker.latitude}&mlon=${activeMarker.longitude}#map=15/${activeMarker.latitude}/${activeMarker.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink ring-1 ring-borderSoft"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir dans OSM
              </a>
            </div>
          </div>

          <div className="rounded-[32px] bg-white px-5 py-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.18em] text-plum">Capsules localisees</p>
            <div className="mt-4 space-y-3">
              {markersQuery.data?.map((marker) => (
                <Link
                  key={marker.editorial_id}
                  href={`/map?editorial=${marker.editorial_id}`}
                  className={`flex items-center justify-between gap-3 rounded-[24px] px-4 py-4 ring-1 transition ${
                    activeMarker.editorial_id === marker.editorial_id
                      ? "bg-[#F8F0FF] ring-plum/20"
                      : "bg-[#FCFAF8] ring-borderSoft"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{marker.title}</p>
                    <p className="text-xs text-graphite/70">
                      {marker.city ?? "Sans ville"} {marker.date ? `· ${formatFrenchDateTime(marker.date)}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-white p-2 text-plum shadow-sm">
                    <MapPinned className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-[32px] bg-white px-5 py-6 text-sm leading-6 text-graphite shadow-card">
          Aucune capsule geo-localisee ne correspond a cette ville/date.
        </div>
      )}
    </MobileShell>
  );
}
