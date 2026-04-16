"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Heart, MapPin, Newspaper, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ShareSheet } from "@/components/ui/share-sheet";
import type { EditorialCard } from "@/lib/api/types";
import { formatFrenchDateTime, formatPrice } from "@/lib/utils/format";

interface EditorialFeedCardProps {
  item: EditorialCard;
  onLike?: (id: string) => void;
}

function typeIcon(type: EditorialCard["type"]) {
  switch (type) {
    case "magazine":
      return <Newspaper className="h-[25px] w-[25px]" />;
    case "place":
      return <Image src="/assets/icon-location.svg" alt="Lieu" width={18} height={25} />;
    case "person":
      return <Image src="/assets/icon-actors.svg" alt="Acteur" width={25} height={25} />;
    case "event":
      return <Image src="/assets/icon-event.svg" alt="Evenement" width={26} height={25} />;
  }
}

function primaryActionIcon(type: EditorialCard["type"]) {
  if (type === "place") return { src: "/assets/icon-play.svg", alt: "Play", size: 45 };
  if (type === "person") return { src: "/assets/icon-listen.svg", alt: "Listen", size: 45 };
  return { src: "/assets/button-arrow.svg", alt: "Open", size: 45 };
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

export function EditorialFeedCard({ item, onLike }: EditorialFeedCardProps) {
  const [flipped, setFlipped] = useState(false);
  const actionIcon = primaryActionIcon(item.type);
  const canOpenMap = Boolean(
    item.metadata.address || item.metadata.city || item.type === "place" || item.type === "event"
  );

  return (
    <article
      className="overflow-hidden rounded-[28px] shadow-card"
      style={{ perspective: "1200px" }}
    >
      {/* ── Flip container ── */}
      <div
        className="relative transition-transform duration-500 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          willChange: "transform",
        }}
      >
        {/* ══════════════════════════════════════
            FRONT FACE
        ══════════════════════════════════════ */}
        <div
          className="bg-editorial text-white"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Hero image */}
          <div className="relative aspect-[0.83] overflow-hidden">
            <Image
              src={item.media_url}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 430px"
              className="object-cover transition duration-500 hover:scale-[1.02]"
              priority={false}
            />
            <Link
              href={`/editorial/${item.id}`}
              className="absolute inset-0 z-0"
              aria-label={item.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/10" />

            {/* Contributor badge */}
            <div className="absolute left-4 top-4 z-10">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full bg-black/20 px-2 py-1 text-xs text-white/90 backdrop-blur"
              >
                <Image
                  src={item.contributor.avatar_url}
                  alt={item.contributor.display_name}
                  width={28}
                  height={28}
                  className="rounded-full border border-white/50"
                />
                <span>{item.contributor.display_name}</span>
              </Link>
            </div>

            {/* Action buttons (right column) */}
            <div className="absolute right-4 top-4 z-10 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => onLike?.(item.id)}
                className="rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/28"
                aria-label={item.is_liked ? "Retirer des aimes" : "Aimer cette carte"}
              >
                <Heart
                  className={`h-5 w-5 ${item.is_liked ? "fill-white text-white" : "text-white"}`}
                />
              </button>

              <ShareSheet editorialId={item.id} editorialTitle={item.title}>
                {({ open }) => (
                  <button
                    type="button"
                    onClick={open}
                    className="rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/28"
                    aria-label="Partager cette carte"
                  >
                    <Image
                      src="/assets/icon-send-white.svg"
                      alt="Share"
                      width={25}
                      height={25}
                      className="h-5 w-auto"
                    />
                  </button>
                )}
              </ShareSheet>

              {/* Flip button */}
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/28"
                aria-label="Voir le dos de la carte"
              >
                <RotateCcw className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Title overlay */}
            <div className="absolute inset-x-4 bottom-4 z-10">
              <Link href={`/editorial/${item.id}`} className="block">
                <h2 className="max-w-[14ch] text-[2rem] font-semibold leading-none">
                  {item.title}
                </h2>
                {item.subtitle ? (
                  <p className="mt-2 max-w-[24ch] text-base leading-snug text-white/90">
                    {item.subtitle}
                  </p>
                ) : null}
              </Link>
            </div>

            {/* CTA button */}
            <div className="absolute bottom-6 right-4 z-10">
              <Link
                href={`/editorial/${item.id}`}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-plum shadow-float"
              >
                <Image
                  src={actionIcon.src}
                  alt={actionIcon.alt}
                  width={actionIcon.size}
                  height={actionIcon.size}
                  className="h-11 w-11"
                />
              </Link>
            </div>
          </div>

          {/* Card body */}
          <div className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-xl bg-plum p-2 text-white">
                {typeIcon(item.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/70">
                  {item.linked_entity?.subtitle ?? item.subtitle}
                </p>
                <h3 className="text-2xl font-semibold leading-tight">
                  {item.linked_entity ? (
                    <Link
                      href={`/editorial/${item.linked_entity.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {item.linked_entity.title}
                    </Link>
                  ) : (
                    item.title
                  )}
                </h3>
                {item.metadata.date ? (
                  <div className="mt-2 flex flex-col gap-1 text-sm text-white/90">
                    <span className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      {formatFrenchDateTime(item.metadata.date)}
                    </span>
                    {item.metadata.address ? (
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {item.metadata.address}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <p className="text-base leading-7 text-white/82">{item.description}</p>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onLike?.(item.id)}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/18"
              >
                <Heart className={`h-4 w-4 ${item.is_liked ? "fill-current" : ""}`} />
                {item.like_count} aime{item.like_count !== 1 ? "s" : ""}
              </button>

              {canOpenMap ? (
                <Link
                  href={`/map?editorial=${item.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/18"
                >
                  <MapPin className="h-4 w-4" />
                  Voir sur la carte
                </Link>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-white/65">
                Reference: {item.contributor.display_name}
              </p>
              <div className="flex items-center gap-4 text-sm text-white/90">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 p-0 text-white"
                  type="button"
                >
                  <Image
                    src="/assets/icon-cloud-linked.svg"
                    alt="Liens"
                    width={24}
                    height={16}
                    className="h-4 w-auto"
                  />
                  Nuage de cartes liees
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 p-0 text-white"
                  type="button"
                >
                  <Image
                    src="/assets/icon-filter.svg"
                    alt="Filtre"
                    width={19}
                    height={20}
                    className="h-4 w-auto"
                  />
                  Filtrer les cartes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            BACK FACE
        ══════════════════════════════════════ */}
        <div
          className="absolute inset-0 min-h-full overflow-y-auto rounded-[28px] bg-white text-ink"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Back header */}
          <div className="relative bg-plum px-5 pt-6 pb-8 text-white">
            {/* Flip back button */}
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="absolute right-4 top-4 rounded-full bg-white/15 p-2 backdrop-blur transition hover:bg-white/25"
              aria-label="Retourner la carte"
            >
              <RotateCcw className="h-5 w-5 text-white" />
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-3">{typeIcon(item.type)}</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  {typeLabel(item.type)}
                </p>
                <h3 className="text-2xl font-semibold leading-tight">{item.title}</h3>
                {item.subtitle ? (
                  <p className="mt-1 text-sm text-white/80">{item.subtitle}</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Back body */}
          <div className="space-y-4 px-5 py-5">
            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[20px] bg-mist px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">
                  Aimes
                </p>
                <p className="mt-1 text-2xl font-semibold text-ink">{item.like_count}</p>
              </div>

              {item.metadata.price !== undefined && item.metadata.price !== null ? (
                <div className="rounded-[20px] bg-mist px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">
                    Tarif
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {formatPrice(item.metadata.price)}
                  </p>
                </div>
              ) : null}

              {item.metadata.city ? (
                <div className="rounded-[20px] bg-mist px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">
                    Ville
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{item.metadata.city}</p>
                </div>
              ) : null}

              {item.metadata.opening_hours ? (
                <div className="rounded-[20px] bg-mist px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">
                    Horaires
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {item.metadata.opening_hours}
                  </p>
                </div>
              ) : null}

              {item.metadata.role ? (
                <div className="col-span-2 rounded-[20px] bg-mist px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">
                    Role
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{item.metadata.role}</p>
                </div>
              ) : null}
            </div>

            {/* Address / date */}
            {(item.metadata.address || item.metadata.date) ? (
              <div className="rounded-[20px] bg-[#F8F0FF] px-4 py-4">
                {item.metadata.date ? (
                  <div className="flex items-center gap-2 text-sm text-plum">
                    <CalendarClock className="h-4 w-4 shrink-0" />
                    <span>{formatFrenchDateTime(item.metadata.date)}</span>
                  </div>
                ) : null}
                {item.metadata.address ? (
                  <div className="mt-2 flex items-start gap-2 text-sm text-plum">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{item.metadata.address}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Description */}
            <div className="rounded-[20px] bg-mist px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">
                A propos
              </p>
              <p className="mt-2 text-sm leading-7 text-graphite">{item.description}</p>
            </div>

            {/* Linked entity */}
            {item.linked_entity ? (
              <Link
                href={`/editorial/${item.linked_entity.id}`}
                className="flex items-center gap-3 rounded-[20px] bg-mist px-4 py-4 transition hover:bg-plum/5"
              >
                <div className="rounded-xl bg-plum/10 p-2 text-plum">
                  {typeIcon(item.linked_entity.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/60">
                    Carte liee
                  </p>
                  <p className="truncate text-sm font-semibold text-ink">
                    {item.linked_entity.title}
                  </p>
                  {item.linked_entity.subtitle ? (
                    <p className="truncate text-xs text-graphite/70">
                      {item.linked_entity.subtitle}
                    </p>
                  ) : null}
                </div>
              </Link>
            ) : null}

            {/* CTA buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onLike?.(item.id);
                }}
                className={`flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                  item.is_liked
                    ? "bg-plum text-white shadow-float"
                    : "bg-mist text-ink ring-1 ring-borderSoft"
                }`}
              >
                <Heart className={`h-4 w-4 ${item.is_liked ? "fill-current" : ""}`} />
                {item.is_liked ? "Aime" : "Aimer"}
              </button>

              <Link
                href={`/editorial/${item.id}`}
                className="flex items-center justify-center gap-2 rounded-full bg-plum px-4 py-3 text-sm font-semibold text-white shadow-float"
              >
                Ouvrir la fiche
              </Link>

              <ShareSheet editorialId={item.id} editorialTitle={item.title}>
                {({ open }) => (
                  <button
                    type="button"
                    onClick={open}
                    className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-ink ring-1 ring-borderSoft transition hover:bg-mist"
                  >
                    <Image
                      src="/assets/icon-send.svg"
                      alt="Share"
                      width={20}
                      height={20}
                      className="h-4 w-auto"
                    />
                    Partager
                  </button>
                )}
              </ShareSheet>

              {canOpenMap ? (
                <Link
                  href={`/map?editorial=${item.id}`}
                  className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-ink ring-1 ring-borderSoft transition hover:bg-mist"
                >
                  <MapPin className="h-4 w-4" />
                  Sur la carte
                </Link>
              ) : null}
            </div>

            {/* Contributor */}
            <div className="flex items-center gap-3 border-t border-borderSoft pt-4">
              <Image
                src={item.contributor.avatar_url}
                alt={item.contributor.display_name}
                width={32}
                height={32}
                className="rounded-full border border-borderSoft"
              />
              <p className="text-sm text-graphite/70">
                Contribue par{" "}
                <span className="font-semibold text-ink">
                  {item.contributor.display_name}
                </span>
                {item.contributor.city ? ` · ${item.contributor.city}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
