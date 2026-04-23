"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";

import { MediaStateIcon, ShareIcon } from "@/components/ui/lela-icons";
import { ShareSheet } from "@/components/ui/share-sheet";
import { useAuthStore } from "@/features/auth/store";
import { cn } from "@/lib/utils/cn";
import type { EditorialCard } from "@/lib/api/types";

function contributorHref(contributorId: string, currentUserId?: string) {
  return contributorId === currentUserId ? "/website/profile" : `/website/profile/${contributorId}`;
}

export function WebsiteEditorialCard({
  item,
  onLike,
  featured = false,
  entryDelayMs = 0,
}: {
  item: EditorialCard;
  onLike?: (id: string) => void;
  featured?: boolean;
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
        "card-enter interactive-surface group overflow-hidden rounded-card bg-elevated shadow-card ring-1 ring-borderSoft/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_64px_rgba(35,37,43,0.14)]",
        featured ? "md:col-span-2 xl:col-span-2" : ""
      )}
      style={{ animationDelay: `${entryDelayMs}ms` }}
    >
      <div className="relative aspect-[1.02] overflow-hidden">
        {item.media_kind === "audio" ? (
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_56%,#3365C8_100%)]" />
        ) : (
          <Image
            src={mediaSrc}
            alt={item.title}
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="interactive-media object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-3">
          <Link
            href={profileHref}
            className="inline-flex items-center gap-2 rounded-full bg-black/28 px-3 py-2 text-xs font-medium text-white/92 shadow-sm ring-1 ring-white/12 backdrop-blur-md"
          >
            <Image
              src={item.contributor.avatar_url}
              alt={item.contributor.display_name}
              width={30}
              height={30}
              className="rounded-full border border-white/50"
            />
            <span>{item.contributor.display_name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerLikePulse();
                onLike?.(item.id);
              }}
              className={cn(
                "interactive-action inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/24 text-white shadow-sm ring-1 ring-white/12 backdrop-blur-md transition hover:bg-black/34",
                likePulse ? "like-pop bg-black/36" : ""
              )}
              aria-label={item.is_liked ? "Retirer des aimes" : "Aimer"}
            >
              <Heart
                className={cn(
                  "h-[18px] w-[18px]",
                  item.is_liked ? "fill-white text-white" : "",
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
                    "interactive-action inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/24 backdrop-blur-md shadow-sm ring-1 ring-white/12 transition hover:bg-black/34",
                    sharePulse ? "share-pulse bg-black/34" : ""
                  )}
                  aria-label="Partager"
                >
                  <ShareIcon className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
                </button>
              )}
            </ShareSheet>
          </div>
        </div>

        <Link href={`/website/editorial/${item.id}`} className="absolute inset-x-4 bottom-4">
          <div className="space-y-3">
            <h3 className="max-w-[16ch] text-[2rem] font-semibold leading-[0.95] tracking-[-0.04em] text-white">
              {item.title}
            </h3>
            {(item.metadata.address || item.metadata.city || item.linked_entity?.title) ? (
              <span className="inline-flex max-w-[92%] items-center gap-2 rounded-full bg-black/28 px-3 py-2 text-sm text-white/92 backdrop-blur-md">
                <MapPin className="h-4 w-4 shrink-0 text-blueSoft" />
                <span className="truncate">
                  {item.metadata.address || item.metadata.city || item.linked_entity?.title}
                </span>
              </span>
            ) : null}
          </div>
        </Link>

        <div className="absolute bottom-4 right-4">
          <Link
            href={`/website/editorial/${item.id}`}
            className="interactive-action flex h-14 w-14 items-center justify-center rounded-full bg-blue shadow-blue"
            aria-label={item.media_kind === "audio" ? "Ecouter" : item.media_kind === "video" ? "Lire la video" : "Lire"}
          >
            <MediaStateIcon
              kind={item.media_kind === "audio" ? "audio" : item.media_kind === "video" ? "video" : "read"}
              className="h-7 w-7 text-white"
              strokeWidth={2.3}
            />
          </Link>
        </div>
      </div>

      <div className="space-y-3 px-5 py-5">
        {item.subtitle ? <p className="text-sm text-graphite/80">{item.subtitle}</p> : null}
        <p className="line-clamp-3 text-sm leading-7 text-graphite">{item.description}</p>
      </div>
    </article>
  );
}
