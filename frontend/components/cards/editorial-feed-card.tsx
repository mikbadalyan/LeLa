"use client";

import { type MouseEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Heart, MapPin, RotateCcw, Volume2 } from "lucide-react";

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
import { useShellStore } from "@/features/shell/store";
import type { EditorialCard } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { buildEditorialMapHref } from "@/lib/utils/editorial";
import { formatFrenchDateTime, formatPrice } from "@/lib/utils/format";

interface EditorialFeedCardProps {
  item: EditorialCard;
  onLike?: (id: string) => void;
  onToggleCloud?: (item: EditorialCard) => void;
  cloudActive?: boolean;
}

function typeIcon(type: EditorialCard["type"]) {
  return <EditorialTypeIcon type={type} className="h-[25px] w-[25px]" />;
}

function typeLabel(type: EditorialCard["type"]) {
  const map: Record<EditorialCard["type"], string> = {
    magazine: "Magazine",
    place: "Lieu",
    person: "Acteur",
    event: "Evenement",
  };
  return map[type];
}

function contributorHref(contributorId: string, currentUserId?: string) {
  return contributorId === currentUserId ? "/profile" : `/profile/${contributorId}`;
}

function stopCardAction(event: MouseEvent<HTMLElement> | PointerEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export function EditorialFeedCard({
  item,
  onLike,
  onToggleCloud,
  cloudActive = false,
}: EditorialFeedCardProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const autoplayPreviews = useShellStore((state) => state.autoplayPreviews);
  const reduceMotion = useShellStore((state) => state.reduceMotion);
  const dataSaver = useShellStore((state) => state.dataSaver);
  const [flipped, setFlipped] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canOpenMap = Boolean(
    item.metadata.address || item.metadata.city || item.type === "place" || item.type === "event"
  );
  const isVideo = item.media_kind === "video";
  const isAudio = item.media_kind === "audio";
  const locationText =
    item.metadata.address || item.metadata.city || item.linked_entity?.title || item.subtitle;
  const profileHref = contributorHref(item.contributor.id, currentUserId);
  const mapHref = buildEditorialMapHref(item.id);

  useEffect(() => {
    if (!isVideo || !videoRef.current) {
      return;
    }

    if (autoplayPreviews && !dataSaver) {
      void videoRef.current.play().catch(() => undefined);
      setIsPlayingPreview(true);
      return;
    }

    videoRef.current.pause();
    setIsPlayingPreview(false);
  }, [autoplayPreviews, dataSaver, isVideo]);

  const toggleMediaPlayback = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (isVideo && videoRef.current) {
      if (videoRef.current.paused) {
        void videoRef.current.play();
        setIsPlayingPreview(true);
      } else {
        videoRef.current.pause();
        setIsPlayingPreview(false);
      }
      return;
    }

    if (isAudio && audioRef.current) {
      if (audioRef.current.paused) {
        void audioRef.current.play();
        setIsPlayingPreview(true);
      } else {
        audioRef.current.pause();
        setIsPlayingPreview(false);
      }
    }
  };

  const frontFace = (
    <div className="relative aspect-[0.82] overflow-hidden rounded-card bg-editorial text-white shadow-card ring-1 ring-borderSoft/10">
      {isVideo ? (
        <video
          ref={videoRef}
          src={item.media_url}
          poster={item.poster_url ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            reduceMotion ? "" : "transition duration-500"
          )}
          onPause={() => setIsPlayingPreview(false)}
          onPlay={() => setIsPlayingPreview(true)}
        />
      ) : isAudio ? (
        <>
          <audio
            ref={audioRef}
            src={item.media_url}
            preload="metadata"
            onPause={() => setIsPlayingPreview(false)}
            onPlay={() => setIsPlayingPreview(true)}
          />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
          <div className="absolute inset-x-0 top-[18%] flex justify-center opacity-25">
            <div className="flex items-end gap-2">
              {[28, 44, 34, 52, 24, 46, 38].map((height, index) => (
                <span
                  key={`${item.id}-wave-${index}`}
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
          sizes="(max-width: 768px) 100vw, 390px"
          className={cn("object-cover", reduceMotion ? "" : "transition duration-500")}
          quality={dataSaver ? 62 : 82}
          priority={false}
        />
      )}

      <Link
        href={`/editorial/${item.id}`}
        className="absolute inset-0 z-0"
        aria-label={item.title}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/78 via-black/22 to-black/0" />

      <div className="absolute left-4 top-4 z-10 max-w-[70%]">
        <Link
          href={profileHref}
          onPointerDown={stopCardAction}
          className="flex items-center gap-2 rounded-full bg-black/30 px-2.5 py-1.5 text-xs font-medium text-white/92 shadow-sm ring-1 ring-white/12 backdrop-blur-md"
        >
          <Image
            src={item.contributor.avatar_url}
            alt={item.contributor.display_name}
            width={28}
            height={28}
            className="rounded-full border border-white/50"
          />
          <span className="truncate">{item.contributor.display_name}</span>
        </Link>
      </div>

      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2.5">
        <button
          type="button"
          onPointerDown={stopCardAction}
          onClick={(event) => {
            stopCardAction(event);
            onLike?.(item.id);
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/24 text-white shadow-sm ring-1 ring-white/12 backdrop-blur-md transition hover:bg-black/34"
          aria-label={item.is_liked ? "Retirer des aimes" : "Aimer cette carte"}
        >
          <Heart className={`h-[17px] w-[17px] ${item.is_liked ? "fill-white text-white" : "text-white"}`} />
        </button>

        <ShareSheet editorialId={item.id} editorialTitle={item.title}>
          {({ open }) => (
            <button
              type="button"
              onPointerDown={stopCardAction}
              onClick={(event) => {
                stopCardAction(event);
                open();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/24 text-white shadow-sm ring-1 ring-white/12 backdrop-blur-md transition hover:bg-black/34"
              aria-label="Partager cette carte"
            >
              <ShareIcon className="h-[17px] w-[17px] text-white" strokeWidth={2.25} />
            </button>
          )}
        </ShareSheet>

        <button
          type="button"
          onClick={(event) => {
            stopCardAction(event);
            setFlipped((current) => !current);
          }}
          onPointerDown={stopCardAction}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/24 text-white shadow-sm ring-1 ring-white/12 backdrop-blur-md transition hover:bg-black/34"
          aria-label="Voir le dos de la carte"
          aria-pressed={flipped}
        >
          <RotateCcw className="h-[17px] w-[17px] text-white" />
        </button>
      </div>

      <div className="absolute inset-x-4 bottom-4 z-10">
        <Link href={`/editorial/${item.id}`} className="block">
          <h2 className="max-w-[14ch] text-[1.72rem] font-semibold leading-[0.96] tracking-[-0.035em]">
            {item.title}
          </h2>
          {locationText ? (
            <span className="mt-3 inline-flex max-w-[92%] items-center gap-2 rounded-full bg-black/28 px-3 py-2 text-sm text-white/92 backdrop-blur-md">
              <MapPin className="h-4 w-4 shrink-0 text-blueSoft" />
              <span className="truncate">{locationText}</span>
            </span>
          ) : null}
        </Link>
      </div>

      {(isVideo || isAudio) ? (
        <div className="absolute bottom-5 right-4 z-10">
            <button
              type="button"
              onClick={toggleMediaPlayback}
              onPointerDown={stopCardAction}
              className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-blue shadow-blue"
              aria-label={isPlayingPreview ? "Mettre en pause" : isAudio ? "Lire l'audio" : "Lire la video"}
            >
            <MediaStateIcon
              kind={isAudio ? "audio" : "video"}
              isPlaying={isPlayingPreview}
              className="h-6 w-6 text-white"
              strokeWidth={2.4}
            />
          </button>
        </div>
      ) : (
        <div className="absolute bottom-5 right-4 z-10">
          <Link
            href={`/editorial/${item.id}`}
            className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-blue shadow-blue"
            aria-label="Lire la fiche"
          >
            <MediaStateIcon kind="read" className="h-6 w-6 text-white" strokeWidth={2.3} />
          </Link>
        </div>
      )}

      {isAudio ? (
        <div className="absolute left-4 bottom-24 z-10 rounded-full bg-black/24 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/12 backdrop-blur-md">
          <span className="inline-flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Capsule audio
          </span>
        </div>
      ) : null}
    </div>
  );

  const backFace = (
    <div className="rounded-card bg-elevated text-ink shadow-card ring-1 ring-borderSoft/10">
      <div className="relative bg-plum px-5 pb-8 pt-6 text-white">
        <button
          type="button"
          onClick={() => setFlipped(false)}
          onPointerDown={stopCardAction}
          className="absolute right-4 top-4 rounded-full bg-white/15 p-2 backdrop-blur transition hover:bg-white/25"
          aria-label="Retourner la carte"
          aria-pressed={!flipped}
        >
          <RotateCcw className="h-[18px] w-[18px] text-white" />
        </button>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/15 p-3 shadow-sm ring-1 ring-white/12">{typeIcon(item.type)}</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              {typeLabel(item.type)}
            </p>
            <h3 className="text-[1.65rem] font-semibold leading-tight tracking-[-0.03em]">{item.title}</h3>
            {item.subtitle ? <p className="mt-1 text-sm text-white/80">{item.subtitle}</p> : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] bg-surface px-4 py-3 ring-1 ring-borderSoft/8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Aimes</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{item.like_count}</p>
          </div>

          {item.metadata.price !== undefined && item.metadata.price !== null ? (
            <div className="rounded-[20px] bg-surface px-4 py-3 ring-1 ring-borderSoft/8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Tarif</p>
              <p className="mt-1 text-lg font-semibold text-ink">{formatPrice(item.metadata.price)}</p>
            </div>
          ) : null}

          {item.metadata.city ? (
            <div className="rounded-[20px] bg-surface px-4 py-3 ring-1 ring-borderSoft/8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Ville</p>
              <p className="mt-1 text-sm font-semibold text-ink">{item.metadata.city}</p>
            </div>
          ) : null}

          {item.metadata.opening_hours ? (
            <div className="rounded-[20px] bg-surface px-4 py-3 ring-1 ring-borderSoft/8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Horaires</p>
              <p className="mt-1 text-sm font-semibold text-ink">{item.metadata.opening_hours}</p>
            </div>
          ) : null}

          {item.metadata.role ? (
            <div className="col-span-2 rounded-[20px] bg-surface px-4 py-3 ring-1 ring-borderSoft/8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Role</p>
              <p className="mt-1 text-sm font-semibold text-ink">{item.metadata.role}</p>
            </div>
          ) : null}
        </div>

        {(item.metadata.address || item.metadata.date) ? (
          <div className="rounded-[20px] bg-blueSoft px-4 py-4">
            {item.metadata.date ? (
              <div className="flex items-center gap-2 text-sm text-blue">
                <CalendarClock className="h-4 w-4 shrink-0" />
                <span>{formatFrenchDateTime(item.metadata.date)}</span>
              </div>
            ) : null}
            {item.metadata.address ? (
              <div className="mt-2 flex items-start gap-2 text-sm text-blue">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item.metadata.address}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-[20px] bg-surface px-4 py-4 ring-1 ring-borderSoft/8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">A propos</p>
          <p className="mt-2 text-sm leading-7 text-graphite">{item.description}</p>
        </div>

        {item.linked_entity ? (
          <Link
            href={`/editorial/${item.linked_entity.id}`}
            className="flex items-center gap-3 rounded-[20px] bg-surface px-4 py-4 ring-1 ring-borderSoft/8 transition hover:bg-blueSoft/60"
          >
            <div className="rounded-xl bg-blueSoft p-2 text-blue">{typeIcon(item.linked_entity.type)}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">Carte liee</p>
              <p className="truncate text-sm font-semibold text-ink">{item.linked_entity.title}</p>
              {item.linked_entity.subtitle ? (
                <p className="truncate text-xs text-graphite/70">{item.linked_entity.subtitle}</p>
              ) : null}
            </div>
          </Link>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={cloudActive ? "primary" : "secondary"}
            type="button"
            className={cloudActive ? "bg-blue text-white shadow-none" : "shadow-none"}
            onClick={() => onToggleCloud?.(item)}
          >
            <CloudIcon className="mr-2 h-4 w-4" strokeWidth={2.15} />
            {cloudActive ? "Voir tout" : "Nuage lie"}
          </Button>

          <CardFilterSheet>
            {({ open }) => (
              <Button variant="secondary" type="button" onClick={open}>
                <FilterIcon className="mr-2 h-4 w-4" strokeWidth={2.15} />
                Filtrer
              </Button>
            )}
          </CardFilterSheet>

          <button
            type="button"
            onClick={() => onLike?.(item.id)}
            className={`flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
              item.is_liked
                ? "bg-blue text-white shadow-blue"
                : "bg-surface text-ink ring-1 ring-borderSoft/10"
            }`}
          >
            <Heart className={`h-4 w-4 ${item.is_liked ? "fill-current" : ""}`} />
            {item.is_liked ? "Aime" : "Aimer"}
          </button>

          <Link
            href={`/editorial/${item.id}`}
            className="flex items-center justify-center gap-2 rounded-full bg-plum px-4 py-3 text-sm font-semibold text-white shadow-float"
          >
            <MediaStateIcon kind="read" className="h-4 w-4 text-white" strokeWidth={2.3} />
            Ouvrir la fiche
          </Link>

          {canOpenMap ? (
            <Link
              href={mapHref}
              className="flex items-center justify-center gap-2 rounded-full bg-elevated px-4 py-3 text-sm font-semibold text-ink ring-1 ring-borderSoft/10 transition hover:bg-mist"
              aria-label={`Ouvrir ${item.title} sur la carte`}
            >
              <MapPin className="h-4 w-4" />
              Sur la carte
            </Link>
          ) : null}
        </div>

        <Link href={profileHref} className="flex items-center gap-3 border-t border-borderSoft/10 pt-4">
          <Image
            src={item.contributor.avatar_url}
            alt={item.contributor.display_name}
            width={32}
            height={32}
            className="rounded-full border border-borderSoft"
          />
          <p className="text-sm text-graphite/70">
            Contribue par <span className="font-semibold text-ink">{item.contributor.display_name}</span>
            {item.contributor.city ? ` · ${item.contributor.city}` : ""}
          </p>
        </Link>
      </div>
    </div>
  );

  return <article>{flipped ? backFace : frontFace}</article>;
}
