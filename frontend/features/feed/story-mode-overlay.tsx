"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  SendHorizonal,
  X,
} from "lucide-react";

import { ShareSheet } from "@/components/ui/share-sheet";
import { MediaStateIcon, ShareIcon } from "@/components/ui/lela-icons";
import { useAuthStore } from "@/features/auth/store";
import type { EditorialCard } from "@/lib/api/types";
import { buildEditorialMapHref } from "@/lib/utils/editorial";
import { cn } from "@/lib/utils/cn";

interface StoryModeOverlayProps {
  open: boolean;
  items: EditorialCard[];
  startIndex: number;
  onClose: () => void;
  onLike?: (id: string) => void;
  basePath?: string;
}

function profileHref(basePath: string, contributorId: string, currentUserId?: string) {
  if (contributorId === currentUserId) {
    return `${basePath}/profile`;
  }
  return `${basePath}/profile/${contributorId}`;
}

export function StoryModeOverlay({
  open,
  items,
  startIndex,
  onClose,
  onLike,
  basePath = "",
}: StoryModeOverlayProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const pointerStartX = useRef<number | null>(null);
  const replyInputRef = useRef<HTMLInputElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [replyDraft, setReplyDraft] = useState("");
  const isPwa = basePath === "";

  useEffect(() => {
    if (!open) {
      return;
    }
    setActiveIndex(Math.min(Math.max(startIndex, 0), Math.max(items.length - 1, 0)));
    setReplyDraft("");
  }, [open, startIndex, items.length]);

  const activeItem = useMemo(
    () => (items.length ? items[Math.min(Math.max(activeIndex, 0), items.length - 1)] : null),
    [activeIndex, items]
  );

  useEffect(() => {
    if (!open || !activeItem) {
      return;
    }

    const durationMs = activeItem.media_kind === "video" ? 9000 : 6400;
    setProgress(0);
    const start = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const nextProgress = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(nextProgress);
      if (nextProgress >= 100) {
        window.clearInterval(timer);
        setActiveIndex((current) => {
          if (current >= items.length - 1) {
            return current;
          }
          return current + 1;
        });
      }
    }, 70);

    return () => window.clearInterval(timer);
  }, [open, activeItem, items.length]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => Math.min(current + 1, items.length - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, items.length]);

  if (!open || !activeItem) {
    return null;
  }

  const canOpenMap = Boolean(
    activeItem.metadata.address || activeItem.metadata.city || activeItem.type === "place"
  );
  const activeMapHref = buildEditorialMapHref(activeItem.id, basePath);
  const activeEditorialHref = `${basePath}/editorial/${activeItem.id}`;
  const activeContributorHref = profileHref(basePath, activeItem.contributor.id, currentUserId);
  const createdLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(activeItem.created_at));

  const goPrev = () => setActiveIndex((current) => Math.max(current - 1, 0));
  const goNext = () => setActiveIndex((current) => Math.min(current + 1, items.length - 1));

  const submitReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const contributorId = activeItem.contributor.id;
    const targetPath =
      contributorId === currentUserId
        ? `${basePath}/conversations`
        : `${basePath}/conversations/${contributorId}`;
    const replyHint = replyDraft.trim()
      ? `A propos de "${activeItem.title}" : ${replyDraft.trim()}`
      : `A propos de "${activeItem.title}"`;
    const draftQuery = `?draft=${encodeURIComponent(replyHint)}`;

    if (!token) {
      router.push(basePath ? `${basePath}/login` : "/login");
      return;
    }

    router.push(`${targetPath}${draftQuery}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/92 text-white backdrop-blur-md"
      onPointerDown={(event) => {
        pointerStartX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (pointerStartX.current == null) {
          return;
        }
        const delta = event.clientX - pointerStartX.current;
        pointerStartX.current = null;
        if (Math.abs(delta) < 56) {
          return;
        }
        if (delta > 0) {
          goPrev();
          return;
        }
        goNext();
      }}
    >
      {!isPwa ? (
        <div className="absolute inset-x-0 top-0 z-30 px-3 pt-[max(env(safe-area-inset-top),0.55rem)]">
          <div className="mx-auto max-w-[430px] space-y-2 rounded-[22px] bg-black/38 px-3 py-2.5 ring-1 ring-white/14 backdrop-blur">
            <div className="flex items-center gap-1.5">
              {items.map((item, index) => (
                <div key={item.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/24">
                  <span
                    className="block h-full rounded-full bg-white transition-[width] duration-200"
                    style={{
                      width:
                        index < activeIndex ? "100%" : index === activeIndex ? `${progress}%` : "0%",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <Link
                href={activeContributorHref}
                className="interactive-action inline-flex min-w-0 items-center gap-2 rounded-full bg-black/36 px-2.5 py-1.5 text-xs text-white/92 ring-1 ring-white/16 backdrop-blur-md"
              >
                <Image
                  src={activeItem.contributor.avatar_url}
                  alt={activeItem.contributor.display_name}
                  width={26}
                  height={26}
                  className="rounded-full border border-white/45"
                />
                <span className="truncate">
                  {activeItem.contributor.display_name} · {createdLabel}
                </span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="interactive-action inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/14 ring-1 ring-white/20"
                aria-label="Fermer le Story mode"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPwa ? (
        <>
          <article className="card-enter relative h-full w-full overflow-hidden bg-[#10141c]">
            {activeItem.media_kind === "audio" ? (
              <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
            ) : activeItem.media_kind === "video" ? (
              <video
                src={activeItem.media_url}
                poster={activeItem.poster_url ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={activeItem.media_url}
                alt={activeItem.title}
                fill
                sizes="100vw"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/26 to-black/24" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/44 via-transparent to-transparent" />

            <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+0.3rem)] z-30 px-3">
              <div className="flex items-center gap-1.5">
                {items.map((item, index) => (
                  <div key={item.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/28">
                    <span
                      className="block h-full rounded-full bg-white transition-[width] duration-200"
                      style={{
                        width:
                          index < activeIndex ? "100%" : index === activeIndex ? `${progress}%` : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+1rem)] z-30 px-3">
              <div className="flex items-center justify-between gap-2 rounded-full bg-black/42 px-2.5 py-1.5 ring-1 ring-white/14 backdrop-blur-md">
                <Link
                  href={activeContributorHref}
                  className="interactive-action inline-flex min-w-0 items-center gap-2 rounded-full px-1 py-1 text-sm text-white/94"
                >
                  <Image
                    src={activeItem.contributor.avatar_url}
                    alt={activeItem.contributor.display_name}
                    width={30}
                    height={30}
                    className="rounded-full border border-white/45"
                  />
                  <span className="truncate font-semibold">{activeItem.contributor.display_name}</span>
                  <span className="shrink-0 text-xs text-white/70">{createdLabel}</span>
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="interactive-action inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/24"
                  aria-label="Fermer le Story mode"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+5.3rem)] left-0 right-0 z-20 px-3">
              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1 rounded-[20px] bg-black/30 px-3 py-3 ring-1 ring-white/12 backdrop-blur-md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72">
                    Publie par {activeItem.contributor.display_name}
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-[1.25rem] font-semibold leading-[1.08] tracking-[-0.02em] text-white">
                    {activeItem.title}
                  </h2>
                  {activeItem.subtitle ? (
                    <p className="mt-1 line-clamp-2 text-sm text-white/86">{activeItem.subtitle}</p>
                  ) : null}
                  {(activeItem.metadata.address || activeItem.metadata.city) ? (
                    <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-black/34 px-2.5 py-1.5 text-xs text-white/92 ring-1 ring-white/14">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-blueSoft" />
                      <span className="truncate">{activeItem.metadata.address || activeItem.metadata.city}</span>
                    </p>
                  ) : null}
                </div>

                <div className="mb-1 flex shrink-0 flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onLike?.(activeItem.id)}
                    className="interactive-action inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/44 ring-1 ring-white/18 backdrop-blur-md"
                    aria-label="Aimer cette story"
                  >
                    <Heart className={cn("h-5 w-5", activeItem.is_liked ? "fill-white text-white" : "text-white")} />
                  </button>
                  <span className="text-[10px] font-semibold text-white/88">{activeItem.like_count}</span>
                  <button
                    type="button"
                    onClick={() => replyInputRef.current?.focus()}
                    className="interactive-action inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/44 ring-1 ring-white/18 backdrop-blur-md"
                    aria-label="Repondre a cette story"
                  >
                    <MessageCircle className="h-5 w-5 text-white" />
                  </button>
                  <ShareSheet editorialId={activeItem.id} editorialTitle={activeItem.title} basePath={basePath || undefined}>
                    {({ open: openShare }) => (
                      <button
                        type="button"
                        onClick={openShare}
                        className="interactive-action inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/44 ring-1 ring-white/18 backdrop-blur-md"
                        aria-label="Partager cette story"
                      >
                        <ShareIcon className="h-5 w-5 text-white" strokeWidth={2.2} />
                      </button>
                    )}
                  </ShareSheet>
                  {canOpenMap ? (
                    <Link
                      href={activeMapHref}
                      className="interactive-action inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/44 ring-1 ring-white/18 backdrop-blur-md"
                      aria-label="Voir sur la carte"
                    >
                      <MapPin className="h-5 w-5 text-white" />
                    </Link>
                  ) : null}
                  <Link
                    href={activeEditorialHref}
                    className="interactive-action inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue shadow-blue"
                    aria-label="Ouvrir la fiche"
                  >
                    <MediaStateIcon
                      kind={activeItem.media_kind === "audio" ? "audio" : activeItem.media_kind === "video" ? "video" : "read"}
                      className="h-5 w-5 text-white"
                      strokeWidth={2.2}
                    />
                  </Link>
                </div>
              </div>
            </div>
          </article>

          <form
            onSubmit={submitReply}
            className="absolute inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
          >
            <div className="flex items-center gap-2 rounded-full bg-black/46 px-2 py-2 ring-1 ring-white/18 backdrop-blur-md">
              <button
                type="button"
                onClick={() => replyInputRef.current?.focus()}
                className="interactive-action inline-flex h-10 items-center justify-center rounded-full bg-white/16 px-3 text-xs font-semibold text-white ring-1 ring-white/16"
              >
                Repondre
              </button>
              <input
                ref={replyInputRef}
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder={`Envoyer un message a ${activeItem.contributor.display_name}`}
                className="w-full bg-transparent pr-1 text-sm text-white placeholder:text-white/62 outline-none"
              />
              <button
                type="submit"
                className="interactive-action inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue shadow-blue"
                aria-label="Envoyer la reponse"
              >
                <SendHorizonal className="h-4 w-4 text-white" />
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={goPrev}
            className="absolute bottom-24 left-0 top-24 z-10 w-[34%]"
            aria-label="Story precedente"
          />
          <button
            type="button"
            onClick={goNext}
            className="absolute bottom-24 right-0 top-24 z-10 w-[34%]"
            aria-label="Story suivante"
          />
        </>
      ) : (
        <>
          <div className="absolute inset-0 z-10 flex items-center justify-center px-3 pb-32 pt-24">
            <article className="card-enter relative h-full max-h-[780px] w-full max-w-[430px] overflow-hidden rounded-[34px] bg-[#161A21] shadow-[0_32px_90px_rgba(0,0,0,0.5)] ring-1 ring-white/12">
              {activeItem.media_kind === "audio" ? (
                <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
              ) : (
                <Image
                  src={
                    activeItem.media_kind === "video"
                      ? activeItem.poster_url || activeItem.media_url
                      : activeItem.media_url
                  }
                  alt={activeItem.title}
                  fill
                  sizes="430px"
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/28 to-black/10" />

              <div className="absolute bottom-5 left-4 right-4 z-10 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  {activeItem.type}
                </p>
                <h2 className="max-w-[15ch] text-[2.05rem] font-semibold leading-[0.94] tracking-[-0.04em]">
                  {activeItem.title}
                </h2>
                {activeItem.subtitle ? (
                  <p className="text-sm text-white/88">{activeItem.subtitle}</p>
                ) : null}
                {(activeItem.metadata.address || activeItem.metadata.city) ? (
                  <p className="inline-flex max-w-[95%] items-center gap-2 rounded-full bg-black/36 px-3 py-2 text-sm text-white/92 ring-1 ring-white/14 backdrop-blur-md">
                    <MapPin className="h-4 w-4 shrink-0 text-blueSoft" />
                    <span className="truncate">{activeItem.metadata.address || activeItem.metadata.city}</span>
                  </p>
                ) : null}
              </div>
            </article>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+0.8rem)]">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[26px] bg-black/40 px-3 py-3 ring-1 ring-white/14 backdrop-blur-md">
              <button
                type="button"
                onClick={goPrev}
                className="interactive-action inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/14 ring-1 ring-white/16"
                aria-label="Story precedente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onLike?.(activeItem.id)}
                  className="interactive-action inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/14 ring-1 ring-white/16"
                  aria-label="Aimer cette story"
                >
                  <Heart className={cn("h-4 w-4", activeItem.is_liked ? "fill-white text-white" : "text-white")} />
                </button>

                <ShareSheet editorialId={activeItem.id} editorialTitle={activeItem.title} basePath={basePath || undefined}>
                  {({ open: openShare }) => (
                    <button
                      type="button"
                      onClick={openShare}
                      className="interactive-action inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/14 ring-1 ring-white/16"
                      aria-label="Partager cette story"
                    >
                      <ShareIcon className="h-4 w-4 text-white" strokeWidth={2.2} />
                    </button>
                  )}
                </ShareSheet>

                <Link
                  href={activeEditorialHref}
                  className="interactive-action inline-flex items-center gap-2 rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white shadow-blue"
                >
                  <MediaStateIcon
                    kind={activeItem.media_kind === "audio" ? "audio" : activeItem.media_kind === "video" ? "video" : "read"}
                    className="h-4 w-4 text-white"
                    strokeWidth={2.2}
                  />
                  Ouvrir
                </Link>

                {canOpenMap ? (
                  <Link
                    href={activeMapHref}
                    className="interactive-action inline-flex items-center rounded-full bg-white/14 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/16"
                  >
                    Carte
                  </Link>
                ) : null}
              </div>

              <button
                type="button"
                onClick={goNext}
                className="interactive-action inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/14 ring-1 ring-white/16"
                aria-label="Story suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
