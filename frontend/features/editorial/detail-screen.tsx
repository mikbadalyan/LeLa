"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { PwaFeedCard } from "@/components/pwa/pwa-feed-card";
import { Button } from "@/components/ui/button";
import { CardFilterSheet } from "@/components/ui/card-filter-sheet";
import {
  CloudIcon,
  EditorialTypeIcon,
  FilterIcon,
  IconAsset,
  ShareIcon,
} from "@/components/ui/lela-icons";
import { ShareSheet } from "@/components/ui/share-sheet";
import { useAuthStore } from "@/features/auth/store";
import { getEditorial, getEditorialFiches, toggleLike } from "@/lib/api/endpoints";
import type { EditorialCard, PublishedFiche } from "@/lib/api/types";
import { buildEditorialMapHref } from "@/lib/utils/editorial";
import { writeRecentViewedEditorialId } from "@/lib/utils/discovery";
import { formatFrenchDateTime } from "@/lib/utils/format";

interface DetailScreenProps {
  editorialId: string;
}

function typeIcon(type: "magazine" | "place" | "person" | "event") {
  return <EditorialTypeIcon type={type} className="h-[32px] w-[32px]" />;
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
  const searchParams = useSearchParams();
  const token = useAuthStore((state) => state.token);
  const viewerId = useAuthStore((state) => state.user?.id ?? "guest");
  const queryClient = useQueryClient();
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
  const ficheCorrectionHref = (fiche: PublishedFiche) => {
    const params = new URLSearchParams(contributionParams);
    params.set("targetFicheId", fiche.id);
    params.set("currentText", ficheSummary(fiche));
    return `/contribute?action=correction&${params.toString()}`;
  };

  const primaryFiche = publicFiches[0] ?? null;
  const ficheBody = primaryFiche ? ficheSummary(primaryFiche) : "";
  const bodyText = ficheBody || item.description || item.narrative_text;
  const detailView = searchParams.get("view");
  const isNarrativeCapsule =
    detailView === "capsule" ||
    (detailView !== "fiche" &&
      (item.type === "magazine" || item.title.toLowerCase().includes("lapin")));
  const detailTitle =
    item.type === "place"
      ? item.linked_entity?.title || item.subtitle || item.title
      : item.type === "person"
        ? item.linked_entity?.title || item.subtitle || item.title
        : item.title;
  const detailSubtitle =
    item.type === "person"
      ? item.metadata.role || item.subtitle
      : item.type === "place"
        ? item.metadata.address || item.subtitle
        : item.type === "event"
          ? item.subtitle || "Insolite"
          : item.subtitle;

  if (isNarrativeCapsule) {
    return (
      <MobileShell activeMode="feed" activeTab="relations" className="screen-detail bg-[#3B424D] p-0">
        <article>
          <div className="relative mx-[10px] mt-[12px] h-[365px] overflow-hidden bg-[#303744]">
            <Image
              src={isVideo ? item.poster_url || item.media_url : item.media_url}
              alt={item.title}
              fill
              sizes="390px"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 pb-3">
              {[0, 1, 2, 3].map((dot) => (
                <span key={dot} className={`h-3 w-3 border border-white ${dot === 0 ? "bg-white" : "bg-white/35"}`} />
              ))}
            </div>
            <Link
              href={`/editorial/${item.id}`}
              className="absolute right-5 top-[278px] flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white/82 text-[#8A36C2]"
              aria-label="Lire la capsule"
            >
              <IconAsset src="/icon/chevrons-right.svg" className="h-8 w-8" />
            </Link>
          </div>

          <section className="px-[26px] py-6 text-white">
            <h1 className="line-clamp-2 text-[25px] leading-[1.12] tracking-[-0.02em]">{item.title}</h1>
            <div className="mt-6 grid grid-cols-[30px_minmax(0,1fr)] gap-3">
              <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-[3px] bg-[var(--pwa-purple)]">
                <IconAsset src="/icon/event.svg" className="h-5 w-5 shrink-0 text-white" />
              </span>
              <div className="min-w-0 text-[15px] leading-[1.25]">
                <p className="line-clamp-1">Pour les enfants</p>
                <p className="line-clamp-1">{item.subtitle || item.title}</p>
                {item.metadata.date ? <p className="line-clamp-1">{formatFrenchDateTime(item.metadata.date)}</p> : null}
                <p className="line-clamp-1">{item.metadata.address || item.metadata.city || "Musée Würth | Erstein"}</p>
              </div>
            </div>
            <div className="mt-7 space-y-4 text-[14px] leading-[1.4] text-white/95">
              <p>{bodyText}</p>
              {item.narrative_text ? <p>{item.narrative_text}</p> : null}
            </div>
          </section>
        </article>
      </MobileShell>
    );
  }

  return (
    <MobileShell activeMode={activeMode} activeTab="relations" className="screen-detail bg-[#303744] p-0">
      <article>
        <div className="relative h-[220px] overflow-hidden border-b border-[var(--pwa-blue)] bg-[var(--pwa-dark)]">
          {isVideo ? (
            <video
              src={item.media_url}
              poster={item.poster_url ?? undefined}
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : isAudio ? (
            <div className="h-full w-full bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
          ) : (
            <Image src={item.media_url} alt={item.title} fill sizes="390px" className="object-cover" />
          )}
        </div>

        <section className="bg-[#F4F4F4] px-5 pb-5 pt-6 text-[#454A55]">
          <div className="grid grid-cols-[34px_minmax(0,1fr)_36px] gap-3">
            <div className="pt-0.5 text-[#454A55]">{typeIcon(item.type)}</div>
            <div className="min-w-0 pr-1">
              {item.type === "event" && detailSubtitle ? (
                <p className="line-clamp-1 text-[15px] leading-tight">{detailSubtitle}</p>
              ) : null}
              <h1 className="line-clamp-2 text-[19px] leading-[1.15] tracking-[-0.01em]">{detailTitle}</h1>
              {item.type !== "event" && detailSubtitle ? (
                <p className="mt-1 line-clamp-2 text-[13px] italic leading-[1.25]">{detailSubtitle}</p>
              ) : null}
            </div>
            <div className="flex w-9 flex-col items-center gap-5 text-[#454A55]">
              <Link href={mapHref} className="flex h-8 w-8 items-center justify-center" aria-label={`Ouvrir ${item.title} sur la carte`}>
                <IconAsset src="/icon/lieu.svg" className="h-7 w-7" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  triggerLikePulse();
                  likeMutation.mutate(editorialId);
                }}
                className={`flex h-8 w-8 items-center justify-center ${likePulse ? "like-pop" : ""}`}
                aria-label="Aimer cette fiche"
              >
                <IconAsset src="/icon/likes.svg" className="h-7 w-7" />
              </button>
              <ShareSheet editorialId={item.id} editorialTitle={item.title}>
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => {
                      triggerSharePulse();
                      open();
                    }}
                    className={`flex h-8 w-8 items-center justify-center ${sharePulse ? "share-pulse" : ""}`}
                    aria-label="Partager cette fiche"
                  >
                    <ShareIcon className="h-7 w-7" />
                  </button>
                )}
              </ShareSheet>
            </div>
          </div>

          {item.type === "event" ? (
            <div className="mt-4 ml-[46px] space-y-1 text-[13px] leading-[1.25]">
              {item.metadata.date ? (
                <p className="flex items-center gap-2">
                  <IconAsset src="/icon/date.svg" className="h-4 w-4" />
                  <span className="line-clamp-1">{formatFrenchDateTime(item.metadata.date)}</span>
                </p>
              ) : null}
              <p className="flex items-center gap-2">
                <IconAsset src="/icon/lieu.svg" className="h-4 w-4" />
                <span className="line-clamp-1">{item.metadata.address || item.metadata.city || "Strasbourg"}</span>
              </p>
            </div>
          ) : null}

          <div className="mt-5 space-y-4 text-[14px] leading-[1.42]">
            <p>{bodyText}</p>
            {item.narrative_text ? <p>{item.narrative_text}</p> : null}
          </div>

          {publicFiches.length > 1 ? (
            <div className="mt-4 space-y-2">
              {publicFiches.slice(1, 3).map((fiche) => (
                <Link
                  key={fiche.id}
                  href={ficheCorrectionHref(fiche)}
                  className="block rounded-[10px] bg-white px-3 py-2 text-[12px] text-[#454A55]"
                >
                  {fiche.title}
                </Link>
              ))}
            </div>
          ) : null}

          <Link href={item.contributor.id ? `/profile/${item.contributor.id}` : "/profile"} className="mt-6 flex items-center gap-2 text-[12px]">
            <span>Référent(e)&nbsp;:</span>
            <Image
              src={item.contributor.avatar_url}
              alt={item.contributor.display_name}
              width={27}
              height={27}
              className="h-[27px] w-[27px] rounded-full object-cover"
            />
            <span className="min-w-0 truncate">{item.contributor.display_name}</span>
          </Link>

          <div className="mt-7 grid grid-cols-2 gap-3 text-[13px]">
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
              className="flex min-w-0 items-center gap-2"
            >
              <CloudIcon className="h-5 w-5 shrink-0" />
              <span className="truncate">{cloudFilterIds?.length ? "Tout afficher" : "Nuage de cartes liées"}</span>
            </button>
            <CardFilterSheet>
              {({ open }) => (
                <button type="button" onClick={open} className="flex min-w-0 items-center justify-end gap-2">
                  <FilterIcon className="h-5 w-5 shrink-0" />
                  <span className="truncate">Filtrer les cartes</span>
                </button>
              )}
            </CardFilterSheet>
          </div>
        </section>

        <div className="space-y-2 py-[10px]">
          {visibleRelated.slice(0, 3).map((relatedItem, index) => (
            <PwaFeedCard
              key={relatedItem.id}
              item={relatedItem}
              onLike={(id) => likeMutation.mutate(id)}
              featured={index === 0}
            />
          ))}
        </div>
      </article>
    </MobileShell>
  );
}
