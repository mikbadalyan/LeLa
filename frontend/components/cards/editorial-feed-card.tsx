"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarClock, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EditorialCard } from "@/lib/api/types";
import { formatFrenchDateTime } from "@/lib/utils/format";

interface EditorialFeedCardProps {
  item: EditorialCard;
  onLike?: (id: string) => void;
}

function typeIcon(type: EditorialCard["type"]) {
  switch (type) {
    case "place":
      return <Image src="/assets/icon-location.svg" alt="Lieu" width={18} height={25} />;
    case "person":
      return <Image src="/assets/icon-actors.svg" alt="Acteur" width={25} height={25} />;
    case "event":
      return <Image src="/assets/icon-event.svg" alt="Evenement" width={26} height={25} />;
  }
}

function primaryActionIcon(type: EditorialCard["type"]) {
  if (type === "place") {
    return { src: "/assets/icon-play.svg", alt: "Play", size: 45 };
  }

  if (type === "person") {
    return { src: "/assets/icon-listen.svg", alt: "Listen", size: 45 };
  }

  return { src: "/assets/button-arrow.svg", alt: "Open", size: 45 };
}

export function EditorialFeedCard({ item, onLike }: EditorialFeedCardProps) {
  const actionIcon = primaryActionIcon(item.type);

  return (
    <article className="overflow-hidden rounded-[28px] bg-editorial text-white shadow-card">
      <Link href={`/editorial/${item.id}`} className="relative block aspect-[0.83] overflow-hidden">
        <Image
          src={item.media_url}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, 430px"
          className="object-cover transition duration-500 hover:scale-[1.02]"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/10" />
        <div className="absolute left-4 top-4 flex items-center gap-2 text-xs text-white/90">
          <Link href="/profile" className="flex items-center gap-2">
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
        <div className="absolute right-4 top-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onLike?.(item.id);
            }}
            className="rounded-full bg-white/18 p-2 backdrop-blur"
            aria-label="Aimer cette carte"
          >
            <Image
              src="/assets/icon-heart-white.svg"
              alt="Like"
              width={25}
              height={25}
              className="h-5 w-auto"
            />
          </button>
          <button
            type="button"
            className="rounded-full bg-white/18 p-2 backdrop-blur"
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
        </div>
        <div className="absolute inset-x-4 bottom-4">
          <h2 className="max-w-[14ch] text-[2rem] font-semibold leading-none">{item.title}</h2>
          {item.subtitle ? (
            <p className="mt-2 max-w-[24ch] text-base leading-snug text-white/90">
              {item.subtitle}
            </p>
          ) : null}
        </div>
        <div className="absolute bottom-6 right-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-plum shadow-float">
            <Image
              src={actionIcon.src}
              alt={actionIcon.alt}
              width={actionIcon.size}
              height={actionIcon.size}
              className="h-11 w-11"
            />
          </div>
        </div>
      </Link>
      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-xl bg-plum p-2 text-white">{typeIcon(item.type)}</div>
          <div className="flex-1">
            <p className="text-sm text-white/70">{item.linked_entity?.subtitle ?? item.subtitle}</p>
            <h3 className="text-2xl font-semibold leading-tight">
              {item.linked_entity ? (
                <Link href={`/editorial/${item.linked_entity.id}`} className="underline-offset-4 hover:underline">
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
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/65">Reference: {item.contributor.display_name}</p>
          <div className="flex items-center gap-4 text-sm text-white/90">
            <Button variant="ghost" className="flex items-center gap-2 p-0 text-white" type="button">
              <Image src="/assets/icon-cloud-linked.svg" alt="Liens" width={24} height={16} className="h-4 w-auto" />
              Nuage de cartes liees
            </Button>
            <Button variant="ghost" className="flex items-center gap-2 p-0 text-white" type="button">
              <Image src="/assets/icon-filter.svg" alt="Filtre" width={19} height={20} className="h-4 w-auto" />
              Filtrer les cartes
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
