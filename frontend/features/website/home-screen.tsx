"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { LoaderCircle, MapPinned } from "lucide-react";

import { WebsiteEditorialCard } from "@/components/cards/website-editorial-card";
import { useToggleLike } from "@/features/feed/hooks";
import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
import { useWebsiteHighlights, useWebsiteMapMarkers } from "@/features/website/hooks";
import { useAuthStore } from "@/features/auth/store";

export function WebsiteHomeScreen() {
  const { t, formatDate } = useI18n();
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const token = useAuthStore((state) => state.token);
  const highlightsQuery = useWebsiteHighlights(city, selectedDate, 12);
  const markersQuery = useWebsiteMapMarkers(city, selectedDate);
  const likeMutation = useToggleLike(token);

  const items = highlightsQuery.data?.items ?? [];
  const featured = items[0];
  const placeItems = useMemo(() => items.filter((item) => item.type === "place").slice(0, 3), [items]);
  const personItems = useMemo(() => items.filter((item) => item.type === "person").slice(0, 3), [items]);
  const eventItems = useMemo(() => items.filter((item) => item.type === "event").slice(0, 3), [items]);
  const latestItems = items.slice(0, 6);

  if (highlightsQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1380px] items-center justify-center px-5 py-20 lg:px-8">
        <LoaderCircle className="h-8 w-8 animate-spin text-plum" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-12 px-5 py-8 lg:px-8 lg:py-12">
      <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="relative overflow-hidden rounded-[40px] bg-[#201B27] text-white shadow-[0_28px_80px_rgba(30,22,18,0.16)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_26%),linear-gradient(140deg,#221D2C_0%,#6A2BE8_100%)]" />
          <div className="relative grid min-h-[500px] items-end gap-8 px-7 py-8 sm:px-10 sm:py-10">
            <div className="max-w-xl space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                {t("website.heroKicker")}
              </p>
              <h1 className="max-w-[14ch] text-[2.7rem] font-semibold leading-[0.92] tracking-[-0.05em] sm:text-[3.7rem]">
                {t("website.heroTitle")}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/80">
                {t("website.heroDescription")}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/78">
                <span className="rounded-full border border-white/20 px-4 py-2">
                  {city}
                </span>
                <span className="rounded-full border border-white/20 px-4 py-2">
                  {formatDate(selectedDate)}
                </span>
              </div>
            </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/website/feed"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
                >
                  {t("website.explore")}
                </Link>
                <Link
                  href="/website/map"
                  className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {t("website.map")}
                </Link>
              </div>
            </div>
        </div>

        {featured ? (
          <div className="overflow-hidden rounded-[40px] bg-white shadow-[0_28px_80px_rgba(30,22,18,0.1)] ring-1 ring-black/5">
            <div className="relative aspect-[1.2]">
              {featured.media_kind === "audio" ? (
                <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#6A2BE8_100%)]" />
              ) : (
                <Image
                  src={featured.media_kind === "video" ? featured.poster_url || featured.media_url : featured.media_url}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 620px"
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/20 to-transparent" />
              <div className="absolute left-6 top-6 rounded-full bg-white/16 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                {t("website.featured")}
              </div>
              <div className="absolute inset-x-6 bottom-6 text-white">
                <p className="text-sm text-white/74">{featured.subtitle || featured.type}</p>
                <h2 className="mt-2 max-w-[12ch] text-[2.5rem] font-semibold leading-[0.92] tracking-[-0.05em]">
                  {featured.title}
                </h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/website/editorial/${featured.id}`}
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink"
                  >
                    {t("website.viewAll")}
                  </Link>
                  <Link
                    href={`/website/map?editorial=${featured.id}`}
                    className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                  >
                    {t("website.map")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          { title: t("modes.places"), items: placeItems },
          { title: t("modes.people"), items: personItems },
          { title: t("modes.events"), items: eventItems },
        ].map((section) => (
          <div key={section.title} className="rounded-[34px] bg-white px-5 py-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-ink">{section.title}</h3>
              <Link href="/website/feed" className="text-sm font-semibold text-plum">
                {t("website.viewAll")}
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              {section.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/website/editorial/${item.id}`}
                  className="flex items-center gap-3 rounded-[24px] bg-[#FAF5EF] p-3 ring-1 ring-black/5 transition hover:bg-mist"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[22px]">
                    {item.media_kind === "audio" ? (
                      <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#6A2BE8_100%)]" />
                    ) : (
                      <Image
                        src={item.media_kind === "video" ? item.poster_url || item.media_url : item.media_url}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-graphite/70">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum">
                {t("website.liveFeed")}
              </p>
              <h2 className="mt-2 text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-ink">
                {t("website.related")}
              </h2>
            </div>
            <Link href="/website/feed" className="text-sm font-semibold text-plum">
              {t("website.viewAll")}
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {latestItems.map((item) => (
              <WebsiteEditorialCard
                key={item.id}
                item={item}
                onLike={(id) => likeMutation.mutate(id)}
              />
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[38px] bg-white shadow-card ring-1 ring-black/5">
          <div className="border-b border-black/5 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum">
              {t("website.map")}
            </p>
            <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-ink">
              {city}
            </h2>
          </div>
          {markersQuery.data?.[0] ? (
            <>
              <div className="aspect-[1.15] overflow-hidden">
                <iframe
                  title="Carte OpenStreetMap"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
                    [
                      markersQuery.data[0].longitude - 0.06,
                      markersQuery.data[0].latitude - 0.06,
                      markersQuery.data[0].longitude + 0.06,
                      markersQuery.data[0].latitude + 0.06,
                    ].join(",")
                  )}&layer=mapnik&marker=${encodeURIComponent(
                    `${markersQuery.data[0].latitude},${markersQuery.data[0].longitude}`
                  )}`}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
              <div className="space-y-3 px-6 py-5">
                {markersQuery.data.slice(0, 4).map((marker) => (
                  <Link
                    key={marker.editorial_id}
                    href={`/website/editorial/${marker.editorial_id}`}
                    className="flex items-center justify-between rounded-[22px] bg-[#FAF5EF] px-4 py-4 ring-1 ring-black/5 transition hover:bg-mist"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{marker.title}</p>
                      <p className="text-xs text-graphite/65">{marker.city}</p>
                    </div>
                    <MapPinned className="h-4 w-4 text-plum" />
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="px-6 py-8 text-sm text-graphite/70">Aucun point disponible.</div>
          )}
        </div>
      </section>
    </div>
  );
}
