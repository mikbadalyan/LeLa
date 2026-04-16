"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPinned, Newspaper } from "lucide-react";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { CardFilterSheet } from "@/components/ui/card-filter-sheet";
import { ShareSheet } from "@/components/ui/share-sheet";
import { useAuthStore } from "@/features/auth/store";
import { getEditorial, toggleLike } from "@/lib/api/endpoints";
import { formatFrenchDateTime, formatPrice } from "@/lib/utils/format";

interface DetailScreenProps {
  editorialId: string;
}

function typeIcon(type: "magazine" | "place" | "person" | "event") {
  switch (type) {
    case "magazine":
      return <Newspaper className="h-5 w-5" />;
    case "place":
      return <Image src="/assets/icon-location.svg" alt="Lieu" width={18} height={25} className="h-5 w-auto" />;
    case "person":
      return <Image src="/assets/icon-actors.svg" alt="Acteur" width={25} height={25} className="h-5 w-auto" />;
    case "event":
      return <Image src="/assets/icon-event.svg" alt="Evenement" width={26} height={25} className="h-5 w-auto" />;
  }
}

export function DetailScreen({ editorialId }: DetailScreenProps) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["editorial", editorialId, Boolean(token)],
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

  if (!item) {
    return (
      <MobileShell activeMode="feed" activeTab="relations" className="px-5 py-8">
        <div className="rounded-[28px] bg-white px-5 py-6 shadow-sm">
          Chargement de la fiche editoriale...
        </div>
      </MobileShell>
    );
  }

  const activeMode =
    item.type === "place" ? "place" : item.type === "person" ? "person" : item.type === "event" ? "event" : "feed";
  const isVideo = item.media_kind === "video";

  return (
    <MobileShell activeMode={activeMode} activeTab="relations" className="bg-white">
      <article className="bg-white">
        <div className="relative aspect-[1.18] overflow-hidden">
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
          ) : (
            <Image
              src={item.media_url}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 430px"
              className="object-cover"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {isVideo && !isPlaying ? (
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  void videoRef.current.play();
                  setIsPlaying(true);
                }
              }}
              className="absolute inset-0 z-10 flex items-center justify-center"
              aria-label="Lire la video"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-plum/90 shadow-float">
                <Image src="/assets/icon-play.svg" alt="Lire" width={56} height={56} className="h-14 w-14" />
              </span>
            </button>
          ) : null}
        </div>

        <div className="space-y-6 px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="flex flex-1 items-start gap-3">
              <div className="mt-1 rounded-2xl bg-plum/12 p-3 text-plum">
                {typeIcon(item.type)}
              </div>
              <div>
                <h1 className="text-[1.8rem] font-semibold leading-tight text-ink">{item.title}</h1>
                {item.subtitle ? (
                  <p className="mt-1 text-lg text-graphite">{item.subtitle}</p>
                ) : null}
                {item.metadata.address ? (
                  <p className="mt-1 text-sm italic text-graphite/75">{item.metadata.address}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => likeMutation.mutate(editorialId)}
              className="rounded-full p-2 text-graphite"
              aria-label="Aimer cette fiche"
            >
              <Heart
                className={`h-7 w-7 ${item.is_liked ? "fill-plum text-plum" : "text-graphite"}`}
              />
            </button>
          </div>

          <div className="space-y-4 text-base leading-8 text-[#4A505B]">
            <p>{item.description}</p>
            <p>{item.narrative_text}</p>
          </div>

          <div className="rounded-[28px] bg-mist px-4 py-4 text-sm text-graphite">
            <p className="font-semibold">Repere editorial</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {item.metadata.date ? <span>{formatFrenchDateTime(item.metadata.date)}</span> : null}
              {item.metadata.price !== undefined ? <span>{formatPrice(item.metadata.price)}</span> : null}
              {item.metadata.city ? <span>{item.metadata.city}</span> : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="secondary"
              className="rounded-3xl"
              onClick={() => likeMutation.mutate(editorialId)}
            >
              <Heart className={`mr-2 h-4 w-4 ${item.is_liked ? "fill-plum text-plum" : ""}`} />
              {item.like_count}
            </Button>
            <ShareSheet editorialId={item.id} editorialTitle={item.title}>
              {({ open }) => (
                <Button variant="secondary" className="rounded-3xl" onClick={open}>
                  <Image src="/assets/icon-send.svg" alt="Share" width={25} height={25} className="mr-2 h-4 w-auto" />
                  Share
                </Button>
              )}
            </ShareSheet>
            <Link
              href={`/map?editorial=${item.id}`}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm ring-1 ring-borderSoft"
            >
              <MapPinned className="mr-2 h-4 w-4" />
              Map
            </Link>
          </div>

          <div className="flex items-center justify-between border-b border-t border-borderSoft py-4 text-sm text-graphite">
            <button type="button" className="flex items-center gap-2 font-medium">
              <Image src="/assets/icon-cloud-linked.svg" alt="Liens" width={24} height={16} className="h-4 w-auto" />
              Nuage de cartes liees
            </button>
            <CardFilterSheet>
              {({ open }) => (
                <button type="button" onClick={open} className="flex items-center gap-2 font-medium">
                  <Image src="/assets/icon-filter.svg" alt="Filtre" width={19} height={20} className="h-4 w-auto" />
                  Filtrer les cartes
                </button>
              )}
            </CardFilterSheet>
          </div>

          <div className="space-y-4">
            {item.related.map((relatedItem) => (
              <Link
                key={relatedItem.id}
                href={`/editorial/${relatedItem.id}`}
                className="group block overflow-hidden rounded-[28px] bg-editorial text-white shadow-card"
              >
                <div className="relative aspect-[1.05]">
                  <Image
                    src={relatedItem.media_kind === "video" ? relatedItem.poster_url || "/assets/icon-play.svg" : relatedItem.media_url}
                    alt={relatedItem.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 430px"
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <div className="absolute right-4 top-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        likeMutation.mutate(relatedItem.id);
                      }}
                      className="rounded-full bg-white/18 p-2 backdrop-blur"
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
                            open();
                          }}
                          className="rounded-full bg-white/18 p-2 backdrop-blur"
                          aria-label="Partager cette carte"
                        >
                          <Image src="/assets/icon-send-white.svg" alt="Share" width={25} height={25} className="h-5 w-auto" />
                        </button>
                      )}
                    </ShareSheet>
                  </div>
                  <div className="absolute inset-x-4 bottom-4">
                    <h2 className="max-w-[14ch] text-[2rem] font-semibold leading-none">
                      {relatedItem.title}
                    </h2>
                    {relatedItem.subtitle ? (
                      <p className="mt-3 text-base text-white/90">{relatedItem.subtitle}</p>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </article>
    </MobileShell>
  );
}
