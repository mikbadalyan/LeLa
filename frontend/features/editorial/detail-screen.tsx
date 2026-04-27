"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPinned, Volume2 } from "lucide-react";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { CardFilterSheet } from "@/components/ui/card-filter-sheet";
import {
  CloudIcon,
  EditorialTypeIcon,
  FilterIcon,
  MediaStateIcon,
  ShareIcon,
} from "@/components/ui/lela-icons";
import { ShareSheet } from "@/components/ui/share-sheet";
import { useAuthStore } from "@/features/auth/store";
import { getEditorial, getEditorialFiches, toggleLike } from "@/lib/api/endpoints";
import type { EditorialCard, PublishedFiche } from "@/lib/api/types";
import { buildEditorialMapHref, shouldRenderEditorialAddress } from "@/lib/utils/editorial";
import { writeRecentViewedEditorialId } from "@/lib/utils/discovery";
import { formatFrenchDateTime, formatPrice } from "@/lib/utils/format";

interface DetailScreenProps {
  editorialId: string;
}

function typeIcon(type: "magazine" | "place" | "person" | "event") {
  return <EditorialTypeIcon type={type} className="h-5 w-5" />;
}

function cloudIds(item: EditorialCard) {
  return [item.id, item.linked_entity?.id].filter(Boolean) as string[];
}

function isInCloud(item: EditorialCard, activeCloudIds: string[]) {
  const itemIds = cloudIds(item);
  return itemIds.some((value) => activeCloudIds.includes(value));
}

function ficheText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function ficheSummary(fiche: PublishedFiche) {
  return (
    ficheText(fiche.sections.resume) ||
    ficheText(fiche.sections.description) ||
    ficheText(fiche.sections.contexte) ||
    ""
  );
}

export function DetailScreen({ editorialId }: DetailScreenProps) {
  const token = useAuthStore((state) => state.token);
  const viewerId = useAuthStore((state) => state.user?.id ?? "guest");
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cloudFilterIds, setCloudFilterIds] = useState<string[] | null>(null);
  const [likePulse, setLikePulse] = useState(false);
  const [sharePulse, setSharePulse] = useState(false);
  const likePulseTimer = useRef<number | null>(null);
  const sharePulseTimer = useRef<number | null>(null);

  const detailQuery = useQuery({
    queryKey: ["editorial", editorialId, viewerId],
    queryFn: () => getEditorial(editorialId, token)
  });

  const likeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!token) {
        throw new Error("Veuillez vous connecter pour aimer une carte.");
      }

      return toggleLike(id, token);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["editorial", editorialId] });
      queryClient.invalidateQueries({ queryKey: ["editorial", id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["liked-editorials"] });
    }
  });

  const item = detailQuery.data;
  const publicFichesQuery = useQuery({
    queryKey: ["editorial-fiches", editorialId],
    queryFn: () => getEditorialFiches(editorialId, token),
    enabled: Boolean(item?.id),
  });
  const publicFiches = publicFichesQuery.data ?? [];

  useEffect(
    () => () => {
      if (likePulseTimer.current) {
        window.clearTimeout(likePulseTimer.current);
      }
      if (sharePulseTimer.current) {
        window.clearTimeout(sharePulseTimer.current);
      }
    },
    []
  );

  const triggerLikePulse = () => {
    setLikePulse(true);
    if (likePulseTimer.current) {
      window.clearTimeout(likePulseTimer.current);
    }
    likePulseTimer.current = window.setTimeout(() => setLikePulse(false), 460);
  };

  const triggerSharePulse = () => {
    setSharePulse(true);
    if (sharePulseTimer.current) {
      window.clearTimeout(sharePulseTimer.current);
    }
    sharePulseTimer.current = window.setTimeout(() => setSharePulse(false), 560);
  };

  useEffect(() => {
    if (item?.id) {
      writeRecentViewedEditorialId(item.id);
    }
  }, [item?.id]);

  if (detailQuery.isPending) {
    return (
      <MobileShell activeMode="feed" activeTab="relations" className="px-5 py-8">
        <div className="rounded-[28px] bg-elevated px-5 py-6 shadow-card ring-1 ring-borderSoft/10">
          Chargement de la fiche editoriale...
        </div>
      </MobileShell>
    );
  }

  if (detailQuery.isError) {
    return (
      <MobileShell activeMode="feed" activeTab="relations" className="px-5 py-8">
        <div className="space-y-4 rounded-[28px] bg-elevated px-5 py-6 shadow-card ring-1 ring-borderSoft/10">
          <div>
            <p className="text-lg font-semibold text-ink">Cette fiche n&apos;a pas pu se charger.</p>
            <p className="mt-2 text-sm leading-6 text-graphite">
              {detailQuery.error.message || "Le contenu editorial est indisponible pour le moment."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => detailQuery.refetch()}>Reessayer</Button>
            <Link
              href="/feed"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[18px] bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink shadow-sm ring-1 ring-borderSoft/10"
            >
              Retour au fil
            </Link>
          </div>
        </div>
      </MobileShell>
    );
  }

  if (!item) {
    return (
      <MobileShell activeMode="feed" activeTab="relations" className="px-5 py-8">
        <div className="space-y-4 rounded-[28px] bg-elevated px-5 py-6 shadow-card ring-1 ring-borderSoft/10">
          <div>
            <p className="text-lg font-semibold text-ink">Cette fiche est introuvable.</p>
            <p className="mt-2 text-sm leading-6 text-graphite">
              La carte a peut-etre ete retiree ou son identifiant n&apos;est plus valide.
            </p>
          </div>
          <Link
            href="/feed"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[18px] bg-plum px-4 py-2.5 text-[13px] font-semibold text-white shadow-float"
          >
            Revenir au fil
          </Link>
        </div>
      </MobileShell>
    );
  }

  const activeMode =
    item.type === "place" ? "place" : item.type === "person" ? "person" : item.type === "event" ? "event" : "feed";
  const isVideo = item.media_kind === "video";
  const isAudio = item.media_kind === "audio";
  const mapHref = buildEditorialMapHref(item.id);
  const showAddressLine = shouldRenderEditorialAddress(item.metadata.address, item.subtitle);
  const visibleRelated = cloudFilterIds?.length
    ? item.related.filter((relatedItem) => isInCloud(relatedItem, cloudFilterIds))
    : item.related;
  const contributionParams = new URLSearchParams({
    source: "editorial",
    sourceId: item.id,
    title: item.title,
    description: item.description,
    city: item.metadata.city ?? "",
    image: item.media_url,
    category: item.type,
  });
  const improveHref = `/contribute?action=fiche&${contributionParams.toString()}`;
  const correctionHref = `/contribute?action=correction&${contributionParams.toString()}`;

  const ficheCorrectionHref = (fiche: PublishedFiche) => {
    const params = new URLSearchParams(contributionParams);
    params.set("targetFicheId", fiche.id);
    params.set("currentText", ficheSummary(fiche));
    return `/contribute?action=correction&${params.toString()}`;
  };

  const togglePrimaryPlayback = () => {
    if (isVideo && videoRef.current) {
      if (videoRef.current.paused) {
        void videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (isAudio && audioRef.current) {
      if (audioRef.current.paused) {
        void audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <MobileShell activeMode={activeMode} activeTab="relations" className="screen-detail bg-background">
      <article className="bg-background">
        <div className="detail-reveal relative aspect-[1.18] overflow-hidden rounded-b-[30px] shadow-soft">
          {isVideo ? (
            <video
              ref={videoRef}
              src={item.media_url}
              poster={item.poster_url ?? undefined}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />
          ) : isAudio ? (
            <>
              <audio
                ref={audioRef}
                src={item.media_url}
                preload="metadata"
                controls
                className="absolute bottom-5 left-5 right-5 z-10"
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />
              <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
              <div className="absolute inset-x-0 top-[22%] flex justify-center opacity-25">
                <div className="flex items-end gap-2">
                  {[34, 50, 28, 42, 56, 36, 44].map((height, index) => (
                    <span
                      key={`${item.id}-audio-wave-${index}`}
                      className="w-2 rounded-full bg-white"
                      style={{ height }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <Image
              src={item.media_url}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 430px"
              className="interactive-media object-cover"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {(isVideo || isAudio) ? (
            <button
              type="button"
              onClick={togglePrimaryPlayback}
              className="interactive-action absolute bottom-5 right-5 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-blue shadow-blue"
              aria-label={isPlaying ? "Mettre en pause" : isAudio ? "Lire l'audio" : "Lire la video"}
            >
              <MediaStateIcon
                kind={isAudio ? "audio" : "video"}
                isPlaying={isPlaying}
                className="h-8 w-8 text-white"
                strokeWidth={2.4}
              />
            </button>
          ) : null}
          {isAudio ? (
            <div className="absolute left-5 top-5 rounded-full bg-white/18 px-3 py-2 text-sm font-semibold text-white backdrop-blur-md">
              <span className="inline-flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Capsule audio
              </span>
            </div>
          ) : null}
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="detail-reveal detail-reveal-delay-1 flex items-start gap-4">
            <div className="flex flex-1 items-start gap-3">
              <div className="mt-1 rounded-2xl bg-blueSoft p-3 text-blue shadow-sm ring-1 ring-blue/10">
                {typeIcon(item.type)}
              </div>
              <div>
                <h1 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.03em] text-ink">{item.title}</h1>
                {item.subtitle ? (
                  <p className="mt-1 text-lg text-graphite">{item.subtitle}</p>
                ) : null}
                {showAddressLine ? (
                  <p className="mt-1 text-sm italic text-graphite/75">{item.metadata.address}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerLikePulse();
                likeMutation.mutate(editorialId);
              }}
              className={`interactive-action rounded-full bg-elevated p-2.5 text-graphite shadow-soft ring-1 ring-borderSoft/10 ${
                likePulse ? "like-pop" : ""
              }`}
              aria-label="Aimer cette fiche"
            >
              <Heart
                className={`h-7 w-7 ${item.is_liked ? "fill-plum text-plum" : "text-graphite"} ${likePulse ? "like-pop" : ""}`}
              />
            </button>
          </div>

          <div className="detail-reveal detail-reveal-delay-2 space-y-4 rounded-card bg-elevated px-5 py-5 text-base leading-8 text-[#4A505B] shadow-card ring-1 ring-borderSoft/10">
            <p>{item.description}</p>
            <p>{item.narrative_text}</p>
          </div>

          <div className="detail-reveal detail-reveal-delay-2 space-y-3 rounded-card bg-elevated px-5 py-5 shadow-card ring-1 ring-borderSoft/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Fiches collaboratives</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">Versions publiées par la communauté</h2>
              </div>
              <Link href={improveHref} className="rounded-full bg-blueSoft px-3 py-2 text-xs font-semibold text-blue">
                Ajouter
              </Link>
            </div>
            {publicFichesQuery.isLoading ? (
              <p className="text-sm text-graphite">Chargement des fiches...</p>
            ) : publicFiches.length ? (
              <div className="space-y-3">
                {publicFiches.map((fiche) => (
                  <article key={fiche.id} className="rounded-[24px] bg-surface p-4 ring-1 ring-borderSoft/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-ink">{fiche.title}</h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-graphite">{ficheSummary(fiche)}</p>
                      </div>
                      <Link href={ficheCorrectionHref(fiche)} className="shrink-0 rounded-full bg-elevated px-3 py-2 text-xs font-semibold text-plum shadow-sm">
                        Corriger
                      </Link>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {fiche.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-blueSoft px-2.5 py-1 text-[11px] font-semibold text-blue">{tag}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-[22px] bg-surface p-4 text-sm leading-6 text-graphite ring-1 ring-borderSoft/10">
                Aucune fiche collaborative publiée pour cette carte. Vous pouvez proposer la première.
              </p>
            )}
          </div>

          <div className="detail-reveal detail-reveal-delay-2 rounded-card bg-elevated px-4 py-4 text-sm text-graphite shadow-card ring-1 ring-borderSoft/10">
            <p className="font-semibold">Repere editorial</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {item.metadata.date ? <span>{formatFrenchDateTime(item.metadata.date)}</span> : null}
              {item.metadata.price !== undefined ? <span>{formatPrice(item.metadata.price)}</span> : null}
              {item.metadata.city ? <span>{item.metadata.city}</span> : null}
            </div>
          </div>

          <div className="detail-reveal detail-reveal-delay-2 grid gap-2 rounded-[26px] bg-blueSoft p-3 ring-1 ring-blue/15">
            <Link href={improveHref} className="interactive-action rounded-full bg-elevated px-4 py-3 text-center text-sm font-semibold text-blue shadow-sm">
              Améliorer cette fiche
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link href={correctionHref} className="interactive-action rounded-full bg-elevated px-3 py-3 text-center text-xs font-semibold text-ink shadow-sm">
                Proposer une correction
              </Link>
              <Link href={improveHref} className="interactive-action rounded-full bg-elevated px-3 py-3 text-center text-xs font-semibold text-ink shadow-sm">
                Ajouter des informations
              </Link>
            </div>
          </div>

          <div className="detail-reveal detail-reveal-delay-3 sticky top-[8.4rem] z-20 rounded-[24px] bg-background/86 p-2 backdrop-blur-md">
            <div className="grid grid-cols-3 gap-3">
            <Button
              variant="secondary"
              className="rounded-3xl shadow-none"
              onClick={() => {
                triggerLikePulse();
                likeMutation.mutate(editorialId);
              }}
            >
              <Heart className={`mr-2 h-4 w-4 ${item.is_liked ? "fill-plum text-plum" : ""} ${likePulse ? "like-pop" : ""}`} />
              {item.like_count}
            </Button>
            <ShareSheet editorialId={item.id} editorialTitle={item.title}>
              {({ open }) => (
                <Button
                  variant="secondary"
                  className={`rounded-3xl shadow-none ${sharePulse ? "share-pulse" : ""}`}
                  onClick={() => {
                    triggerSharePulse();
                    open();
                  }}
                >
                  <ShareIcon className="mr-2 h-4 w-4" strokeWidth={2.2} />
                  Share
                </Button>
              )}
            </ShareSheet>
            <Link
              href={mapHref}
              className="interactive-action relative z-10 inline-flex items-center justify-center rounded-full bg-elevated px-5 py-3 text-sm font-semibold text-ink shadow-sm ring-1 ring-borderSoft/10 transition hover:bg-mist"
              aria-label={`Ouvrir ${item.title} sur la carte`}
            >
              <MapPinned className="mr-2 h-4 w-4" />
              Map
            </Link>
          </div>
          </div>

          <div className="detail-reveal detail-reveal-delay-3 flex items-center justify-between rounded-[26px] border border-borderSoft/10 bg-elevated px-4 py-4 text-sm text-graphite shadow-card">
            <button
              type="button"
              onClick={() =>
                setCloudFilterIds((current) => {
                  const nextIds = cloudIds(item);
                  const currentKey = current?.slice().sort().join("|");
                  const nextKey = nextIds.slice().sort().join("|");
                  return currentKey === nextKey ? null : nextIds;
                })
              }
              className="flex items-center gap-2 font-medium"
            >
              <CloudIcon className="h-4 w-4" strokeWidth={2.15} />
              {cloudFilterIds?.length ? "Tout afficher" : "Nuage de cartes liees"}
            </button>
            <CardFilterSheet>
              {({ open }) => (
                <button type="button" onClick={open} className="flex items-center gap-2 font-medium">
                  <FilterIcon className="h-4 w-4" strokeWidth={2.15} />
                  Filtrer les cartes
                </button>
              )}
            </CardFilterSheet>
          </div>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleRelated.length ? visibleRelated.map((relatedItem) => (
              <Link
                key={relatedItem.id}
                href={`/editorial/${relatedItem.id}`}
                className="card-enter group block min-w-[88%] snap-start overflow-hidden rounded-card bg-editorial text-white shadow-card ring-1 ring-borderSoft/10"
              >
                <div className="relative aspect-[1.05]">
                  {relatedItem.media_kind === "audio" ? (
                    <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
                  ) : (
                    <Image
                      src={relatedItem.media_kind === "video" ? relatedItem.poster_url || "/assets/icon-play.svg" : relatedItem.media_url}
                      alt={relatedItem.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 430px"
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <div className="absolute right-4 top-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        triggerLikePulse();
                        likeMutation.mutate(relatedItem.id);
                      }}
                      className={`interactive-action rounded-full bg-white/18 p-2 backdrop-blur ${likePulse ? "like-pop" : ""}`}
                      aria-label="Aimer cette carte"
                    >
                      <Heart
                        className={`h-5 w-5 ${relatedItem.is_liked ? "fill-white text-white" : "text-white"}`}
                      />
                    </button>
                    <ShareSheet editorialId={relatedItem.id} editorialTitle={relatedItem.title}>
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            triggerSharePulse();
                            open();
                          }}
                          className={`interactive-action rounded-full bg-white/18 p-2 backdrop-blur ${sharePulse ? "share-pulse" : ""}`}
                          aria-label="Partager cette carte"
                        >
                          <ShareIcon className="h-5 w-5 text-white" strokeWidth={2.2} />
                        </button>
                      )}
                    </ShareSheet>
                  </div>
                  <div className="absolute inset-x-4 bottom-4">
                    <h2 className="max-w-[14ch] text-[1.9rem] font-semibold leading-[0.95] tracking-[-0.03em]">
                      {relatedItem.title}
                    </h2>
                    {relatedItem.subtitle ? (
                      <p className="mt-3 text-base text-white/90">{relatedItem.subtitle}</p>
                    ) : null}
                    {(relatedItem.metadata.address || relatedItem.metadata.city) ? (
                      <p className="mt-3 inline-flex max-w-[90%] items-center gap-2 rounded-full bg-black/25 px-3 py-2 text-sm text-white/90 backdrop-blur-md">
                        <MapPinned className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {relatedItem.metadata.address || relatedItem.metadata.city}
                        </span>
                      </p>
                    ) : null}
                    {relatedItem.media_kind === "audio" ? (
                      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-2 text-sm text-white/92 backdrop-blur-md">
                        <Volume2 className="h-4 w-4 shrink-0" />
                        Capsule audio
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            )) : (
              <div className="rounded-[24px] bg-surface px-4 py-5 text-sm leading-6 text-graphite ring-1 ring-borderSoft/10">
                Aucune autre carte reliee ne correspond au filtre actif pour le moment.
              </div>
            )}
          </div>
        </div>
      </article>
    </MobileShell>
  );
}
