"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { IconAsset, ShareIcon } from "@/components/ui/lela-icons";
import { ShareSheet } from "@/components/ui/share-sheet";
import type { EditorialCard } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { formatFrenchDateTime } from "@/lib/utils/format";

interface PwaFeedCardProps {
  item: EditorialCard;
  onLike?: (id: string) => void;
  featured?: boolean;
  className?: string;
}

function metadataTitle(item: EditorialCard) {
  if (item.type === "person") {
    return item.linked_entity?.title || item.subtitle || item.metadata.role || "Acteur";
  }

  if (item.type === "event") {
    return item.subtitle || item.title;
  }

  return item.linked_entity?.title || item.subtitle || item.title;
}

function metadataSubtitle(item: EditorialCard) {
  if (item.type === "person") {
    return item.metadata.role || item.description;
  }

  if (item.type === "event") {
    return item.metadata.date
      ? formatFrenchDateTime(item.metadata.date)
      : item.metadata.address || item.metadata.city || "";
  }

  return item.metadata.address || item.metadata.city || "";
}

function ActionGlyph({ item, isPlaying }: { item: EditorialCard; isPlaying: boolean }) {
  if (isPlaying) {
    return <IconAsset src="/icon/pause.svg" className="h-5 w-5" />;
  }

  if (item.media_kind === "audio" || item.type === "person") {
    return <IconAsset src="/icon/headphones.svg" className="h-[23px] w-[23px]" />;
  }

  if (item.type === "event" || item.title.toLowerCase().includes("lapin")) {
    return <IconAsset src="/icon/chevrons-right.svg" className="h-[24px] w-[24px]" />;
  }

  return <IconAsset src="/icon/play.svg" className="ml-0.5 h-[23px] w-[23px]" />;
}

export function PwaFeedCard({ item, onLike, featured = false, className }: PwaFeedCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPerson = item.type === "person";
  const isVideo = item.media_kind === "video";
  const isAudio = item.media_kind === "audio";
  const locationLine = metadataSubtitle(item);
  const mediaSource = item.media_kind === "video" ? item.poster_url || item.media_url : item.media_url;
  const ficheHref = item.type === "event" ? `/editorial/${item.id}?view=fiche` : `/editorial/${item.id}`;
  const capsuleHref = item.type === "event" ? `/editorial/${item.id}?view=capsule` : ficheHref;
  const categoryLine =
    item.type === "event"
      ? item.subtitle || "Evenement"
      : item.type === "person"
        ? item.metadata.role || "Acteur"
        : item.type === "place"
          ? "Lieu"
          : "Capsule";

  const toggleMediaPlayback = async () => {
    if (isVideo && videoRef.current) {
      if (videoRef.current.paused) {
        await videoRef.current.play().catch(() => undefined);
        setIsPlaying(!videoRef.current.paused);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (isAudio && audioRef.current) {
      if (audioRef.current.paused) {
        await audioRef.current.play().catch(() => undefined);
        setIsPlaying(!audioRef.current.paused);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <article
      className={cn(
        "card-enter relative mx-[var(--pwa-safe-x)] mb-[var(--pwa-card-gap)] h-[324px] overflow-hidden rounded-[var(--pwa-card-radius)] bg-[var(--pwa-dark)] text-white shadow-none",
        className
      )}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={item.media_url}
          poster={item.poster_url ?? undefined}
          playsInline
          preload="metadata"
          className={cn("pointer-events-none absolute inset-0 h-full w-full object-cover", isPerson ? "grayscale" : "")}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      ) : isAudio && !item.poster_url ? (
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#2F3540_0%,#7650A8_55%,#3365C8_100%)]" />
      ) : (
        <Image
          src={mediaSource}
          alt={item.title}
          fill
          sizes="390px"
          className={cn("pointer-events-none object-cover", isPerson ? "grayscale" : "")}
          priority={false}
        />
      )}
      {isAudio ? (
        <audio
          ref={audioRef}
          src={item.media_url}
          preload="metadata"
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      ) : null}
      <Link
        href={ficheHref}
        className="absolute inset-0 z-[5]"
        aria-label={`Ouvrir la fiche ${item.title}`}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/44 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[68%] bg-gradient-to-t from-black/82 via-black/42 to-transparent" />

      <Link
        href={item.contributor.id ? `/profile/${item.contributor.id}` : "/profile"}
        className="absolute left-5 right-[72px] top-[18px] z-20 flex h-[30px] min-w-0 items-center gap-2 text-[12px] leading-none text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={item.contributor.avatar_url}
          alt={item.contributor.display_name}
          width={28}
          height={28}
          className="h-[28px] w-[28px] shrink-0 rounded-full border border-white/80 object-cover"
        />
        <span className="min-w-0 truncate drop-shadow">{item.contributor.display_name}</span>
      </Link>

      <div className="absolute right-5 top-[22px] z-20 flex w-[30px] flex-col items-center gap-3.5">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onLike?.(item.id);
          }}
          className="flex h-[30px] w-[30px] items-center justify-center text-white drop-shadow transition active:scale-90"
          aria-label={item.is_liked ? "Retirer des aimés" : "Aimer cette carte"}
        >
          <IconAsset src="/icon/likes.svg" className="h-[26px] w-[26px]" />
        </button>
        <ShareSheet editorialId={item.id} editorialTitle={item.title}>
          {({ open }) => (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                open();
              }}
              className="flex h-[30px] w-[30px] items-center justify-center text-white drop-shadow transition active:scale-90"
              aria-label="Partager cette carte"
            >
              <ShareIcon className="h-[26px] w-[26px]" />
            </button>
          )}
        </ShareSheet>
      </div>

      {isVideo || isAudio ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void toggleMediaPlayback();
          }}
          className="absolute bottom-[58px] right-[18px] z-20 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[var(--pwa-purple)] text-white shadow-[0_8px_18px_rgba(44,20,70,0.24)] transition active:scale-95"
          aria-label={isPlaying ? "Mettre en pause" : isAudio ? "Lire l'audio" : "Lire la vidéo"}
        >
          <ActionGlyph item={item} isPlaying={isPlaying} />
        </button>
      ) : (
        <Link
          href={capsuleHref}
          className="absolute bottom-[58px] right-[18px] z-20 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[var(--pwa-purple)] text-white shadow-[0_8px_18px_rgba(44,20,70,0.24)] transition active:scale-95"
          aria-label="Ouvrir cette carte"
        >
          <ActionGlyph item={item} isPlaying={false} />
        </Link>
      )}

      <Link href={capsuleHref} className="absolute bottom-[84px] left-[22px] right-[84px] z-20 block" aria-label={item.type === "event" ? `Ouvrir la capsule ${item.title}` : `Ouvrir la fiche ${item.title}`}>
        {item.type === "event" ? (
          <div className="mb-2 flex min-w-0 items-center gap-2 text-[13px] leading-none text-white/92">
            <IconAsset src="/icon/event.svg" className="h-[18px] w-[18px] text-white" />
            <span className="line-clamp-1">{categoryLine}</span>
          </div>
        ) : null}
        <h2 className={cn("pwa-card-title line-clamp-2 text-[clamp(24px,6.6vw,27px)] leading-[1.08] tracking-[-0.025em] text-white drop-shadow", isPerson ? "line-clamp-3 text-[24px]" : "")}>
          {item.title}
        </h2>
      </Link>

      <Link href={capsuleHref} className="absolute bottom-[18px] left-[22px] right-[80px] z-20 grid min-h-[46px] grid-cols-[23px_minmax(0,1fr)] gap-2 text-white" aria-label={item.type === "event" ? `Ouvrir la capsule ${item.title}` : `Ouvrir la fiche ${item.title}`}>
        <span className="flex h-[24px] w-[24px] items-center justify-center text-white">
          {item.type === "event" ? (
            <IconAsset src="/icon/date.svg" className="h-[20px] w-[20px] text-white" />
          ) : item.type === "person" ? (
            <IconAsset src="/icon/acteurs.svg" className="h-[22px] w-[22px] text-white" />
          ) : (
            <IconAsset src="/icon/lieu.svg" className="h-[22px] w-[22px] text-white" />
          )}
        </span>
        <div className="min-w-0 text-[14px] leading-[1.12] text-white">
          <p className="line-clamp-1">{metadataTitle(item)}</p>
          {locationLine ? <p className="mt-0.5 line-clamp-1 text-white/92">{locationLine}</p> : null}
          {item.type === "event" && item.metadata.address ? (
            <p className="mt-0.5 line-clamp-1 text-white/92">{item.metadata.address}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
