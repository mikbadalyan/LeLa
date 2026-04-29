"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Heart, MapPin, Play } from "lucide-react";

import { MediaStateIcon, ShareIcon } from "@/components/ui/lela-icons";
import { ShareSheet } from "@/components/ui/share-sheet";
import { useAuthStore } from "@/features/auth/store";
import { cn } from "@/lib/utils/cn";
import type { EditorialCard } from "@/lib/api/types";

function contributorHref(contributorId: string, currentUserId?: string) {
  return contributorId === currentUserId ? "/website/profile" : `/website/profile/${contributorId}`;
}

type WebsiteEditorialCardVariant = "hero" | "compact" | "wide" | "portrait";

function cardLocation(item: EditorialCard) {
  const venue = item.linked_entity?.title ?? item.metadata.city ?? item.subtitle ?? "";
  const address = [item.metadata.address, item.metadata.city].filter(Boolean).join(", ");
  return {
    venue,
    address,
  };
}

export function WebsiteEditorialCard({
  item,
  onLike,
  variant = "compact",
  className,
  entryDelayMs = 0,
}: {
  item: EditorialCard;
  onLike?: (id: string) => void;
  variant?: WebsiteEditorialCardVariant;
  className?: string;
  entryDelayMs?: number;
}) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [likePulse, setLikePulse] = useState(false);
  const [sharePulse, setSharePulse] = useState(false);
  const likePulseTimer = useRef<number | null>(null);
  const sharePulseTimer = useRef<number | null>(null);
  const profileHref = contributorHref(item.contributor.id, currentUserId);
  const mediaSrc =
    item.media_kind === "video" ? item.poster_url || item.media_url : item.media_url;
  const location = cardLocation(item);
  const displayTitle =
    variant === "portrait" && item.type === "person"
      ? item.description || item.title
      : item.title;
  const titleClassName =
    variant === "hero"
      ? "max-w-[12ch] text-[clamp(2.35rem,3.6vw,4.2rem)] leading-[0.92]"
      : variant === "wide"
        ? "max-w-[13ch] text-[clamp(2rem,3vw,3.25rem)] leading-[0.95]"
        : variant === "portrait"
          ? "max-w-[10ch] text-[clamp(1.2rem,1.6vw,1.95rem)] leading-[1.02]"
          : "max-w-[12ch] text-[clamp(1.55rem,2vw,2.45rem)] leading-[0.96]";
  const mediaButtonClassName =
    variant === "hero"
      ? "h-20 w-20"
      : variant === "wide"
        ? "h-16 w-16"
        : variant === "portrait"
          ? "h-12 w-12"
          : "h-14 w-14";
  const mediaIconClassName =
    variant === "hero" ? "h-10 w-10" : variant === "wide" ? "h-8 w-8" : "h-6 w-6";
  const contentInsetClassName =
    variant === "portrait" ? "p-4 lg:p-5" : "p-5 lg:p-6";
  const locationInsetClassName =
    variant === "portrait" ? "max-w-[calc(100%-5rem)]" : "max-w-[calc(100%-6.5rem)]";
  const shareButtonPositionClassName =
    variant === "hero"
      ? "top-24"
      : variant === "wide"
        ? "top-20"
        : variant === "portrait"
          ? "top-[5.2rem]"
          : "top-[5.5rem]";
  const showPersonFooter = variant === "portrait" && item.type === "person";

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

  return (
    <article
      className={cn(
        "card-enter group relative h-full min-h-[250px] overflow-hidden rounded-[18px] bg-[#1f2430] text-white shadow-[0_24px_64px_rgba(29,31,40,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_74px_rgba(29,31,40,0.22)] lg:min-h-0 lg:rounded-[3px]",
        variant === "hero"
          ? "min-h-[520px]"
          : variant === "wide"
            ? "min-h-[420px]"
            : variant === "portrait"
              ? "min-h-[360px]"
              : "min-h-[320px]",
        className
      )}
      style={{ animationDelay: `${entryDelayMs}ms` }}
    >
      <Link href={`/website/editorial/${item.id}`} className="absolute inset-0 z-0" aria-label={item.title} />
      <div className="relative h-full overflow-hidden">
        {item.media_kind === "audio" ? (
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_56%,#3365C8_100%)]" />
        ) : (
          <Image
            src={mediaSrc}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="interactive-media object-cover transition duration-700 group-hover:scale-[1.035]"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,22,0.12)_0%,rgba(10,14,22,0.12)_24%,rgba(8,12,19,0.2)_44%,rgba(6,9,14,0.76)_100%)]" />
        <div className="absolute left-4 top-4 right-4 z-20 flex items-start justify-between gap-3 lg:left-5 lg:top-5 lg:right-5">
          <Link
            href={profileHref}
            className="inline-flex max-w-[70%] items-center gap-2 text-[12px] font-medium text-white/92 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
          >
            <Image
              src={item.contributor.avatar_url}
              alt={item.contributor.display_name}
              width={32}
              height={32}
              className="rounded-full border border-white/65 object-cover"
            />
            <span className="truncate">{item.contributor.display_name}</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerLikePulse();
            onLike?.(item.id);
          }}
          className={cn(
            "interactive-action absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.38)] transition hover:scale-[1.06] lg:right-5 lg:top-5",
            likePulse ? "like-pop" : ""
          )}
          aria-label={item.is_liked ? "Retirer des aimes" : "Aimer"}
        >
          <Heart
            className={cn(
              "h-8 w-8",
              item.is_liked ? "fill-white text-white" : "text-white",
              likePulse ? "like-pop" : ""
            )}
          />
        </button>

        <ShareSheet editorialId={item.id} editorialTitle={item.title} basePath="/website">
          {({ open }) => (
            <button
              type="button"
              onClick={() => {
                triggerSharePulse();
                open();
              }}
              className={cn(
                "interactive-action absolute right-4 z-20 inline-flex h-11 w-11 items-center justify-center text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.38)] transition hover:scale-[1.06] lg:right-5",
                shareButtonPositionClassName,
                sharePulse ? "share-pulse" : ""
              )}
              aria-label="Partager"
            >
              <ShareIcon className="h-7 w-7 text-white" strokeWidth={2.2} />
            </button>
          )}
        </ShareSheet>

        <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 z-10", contentInsetClassName)}>
          <div className={cn(locationInsetClassName, "space-y-4")}>
            <h3 className={cn("font-semibold tracking-[-0.055em] text-white", titleClassName)}>
              {displayTitle}
            </h3>
            {showPersonFooter ? (
              <div className="flex items-start gap-3 text-white/95">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#7643A6] text-white shadow-[0_10px_18px_rgba(118,67,166,0.24)]">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[1rem] font-semibold leading-tight text-white">{item.title}</p>
                  {item.subtitle ? (
                    <p className="line-clamp-2 text-[0.92rem] leading-tight text-white/86">
                      {item.subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (location.venue || location.address) ? (
              <div className="flex items-start gap-3 text-white/95">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white">
                  <MapPin className="h-4 w-4 text-[#7643A6]" />
                </span>
                <div className="min-w-0">
                  {location.venue ? (
                    <p className="truncate text-[1.02rem] font-semibold leading-tight text-white">
                      {location.venue}
                    </p>
                  ) : null}
                  {location.address ? (
                    <p className="line-clamp-2 text-[0.95rem] leading-tight text-white/86">
                      {location.address}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="absolute bottom-5 right-5 z-20">
          <Link
            href={`/website/editorial/${item.id}`}
            className={cn(
              "interactive-action flex items-center justify-center rounded-full bg-[#7643A6] text-white shadow-[0_18px_34px_rgba(118,67,166,0.34)]",
              mediaButtonClassName
            )}
            aria-label={item.media_kind === "audio" ? "Ecouter" : item.media_kind === "video" ? "Lire la video" : "Lire"}
          >
            {item.media_kind === "audio" ? (
              <MediaStateIcon kind="audio" className={cn(mediaIconClassName, "text-white")} strokeWidth={2.3} />
            ) : item.media_kind === "video" ? (
              <MediaStateIcon kind="video" className={cn(mediaIconClassName, "text-white")} strokeWidth={2.3} />
            ) : variant === "hero" || variant === "wide" ? (
              <Play className={cn(mediaIconClassName, "ml-1 fill-current text-white")} strokeWidth={2.2} />
            ) : (
              <ChevronRight className={cn(mediaIconClassName, "text-white")} strokeWidth={2.6} />
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}
