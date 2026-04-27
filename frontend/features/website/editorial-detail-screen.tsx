"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Heart, LoaderCircle, MapPinned } from "lucide-react";

import { WebsiteEditorialCard } from "@/components/cards/website-editorial-card";
import { Button } from "@/components/ui/button";
import { MediaStateIcon, ShareIcon } from "@/components/ui/lela-icons";
import { ShareSheet } from "@/components/ui/share-sheet";
import { useAuthStore } from "@/features/auth/store";
import { useToggleLike } from "@/features/feed/hooks";
import { useI18n } from "@/features/shell/i18n";
import { getEditorial, getEditorialFiches, toggleLike } from "@/lib/api/endpoints";
import type { PublishedFiche } from "@/lib/api/types";
import { buildEditorialMapHref, shouldRenderEditorialAddress } from "@/lib/utils/editorial";
import { writeRecentViewedEditorialId } from "@/lib/utils/discovery";
import { formatPrice } from "@/lib/utils/format";

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

export function WebsiteEditorialDetailScreen({
  editorialId,
}: {
  editorialId: string;
}) {
  const token = useAuthStore((state) => state.token);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const viewerId = currentUserId ?? "guest";
  const queryClient = useQueryClient();
  const { t, formatDateTime } = useI18n();
  const [likePulse, setLikePulse] = useState(false);
  const [sharePulse, setSharePulse] = useState(false);
  const likePulseTimer = useRef<number | null>(null);
  const sharePulseTimer = useRef<number | null>(null);

  const detailQuery = useQuery({
    queryKey: ["website-editorial", editorialId, viewerId],
    queryFn: () => getEditorial(editorialId, token),
  });

  const likeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!token) {
        throw new Error("Veuillez vous connecter pour aimer une carte.");
      }
      return toggleLike(id, token);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["website-editorial", editorialId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["liked-editorials"] });
      queryClient.invalidateQueries({ queryKey: ["editorial", id] });
    },
  });

  const cardLikeMutation = useToggleLike(token);
  const item = detailQuery.data;
  const publicFichesQuery = useQuery({
    queryKey: ["website-editorial-fiches", editorialId],
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
      <div className="mx-auto flex min-h-[60vh] max-w-[1380px] items-center justify-center px-5 py-20 lg:px-8">
        <LoaderCircle className="h-8 w-8 animate-spin text-blue" />
      </div>
    );
  }

  if (detailQuery.isError) {
    return (
      <div className="mx-auto max-w-[980px] px-5 py-16 lg:px-8">
        <div className="rounded-card bg-elevated px-6 py-8 shadow-card ring-1 ring-borderSoft/10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue">
            Fiche indisponible
          </p>
          <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-ink">
            Le contenu n&apos;a pas pu se charger.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-graphite">
            {detailQuery.error.message || "La requete editoriale a echoue. Reessayez ou revenez vers le flux d'exploration."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => detailQuery.refetch()}>Reessayer</Button>
            <Link
              href="/website/feed"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[18px] bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink shadow-sm ring-1 ring-borderSoft/10"
            >
              Retour a l&apos;exploration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-[980px] px-5 py-16 lg:px-8">
        <div className="rounded-card bg-elevated px-6 py-8 shadow-card ring-1 ring-borderSoft/10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue">
            Carte introuvable
          </p>
          <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-ink">
            Cette capsule n&apos;existe plus dans LE_LA.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-graphite">
            L&apos;identifiant editorial semble invalide ou la carte a ete retiree du flux.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/website/feed"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[18px] bg-plum px-4 py-2.5 text-[13px] font-semibold text-white shadow-float"
            >
              Retour a l&apos;exploration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mediaSrc = item.media_kind === "video" ? item.poster_url || item.media_url : item.media_url;
  const contributorHref =
    item.contributor.id === currentUserId
      ? "/website/profile"
      : `/website/profile/${item.contributor.id}`;
  const mapHref = buildEditorialMapHref(item.id, "/website");
  const showAddressLine = shouldRenderEditorialAddress(item.metadata.address, item.subtitle);
  const contributionParams = new URLSearchParams({
    source: "editorial",
    sourceId: item.id,
    title: item.title,
    description: item.description,
    city: item.metadata.city ?? "",
    image: item.media_url,
    category: item.type,
  });
  const improveHref = `/website/contribute?action=fiche&${contributionParams.toString()}`;
  const correctionHref = `/website/contribute?action=correction&${contributionParams.toString()}`;
  const ficheCorrectionHref = (fiche: PublishedFiche) => {
    const params = new URLSearchParams(contributionParams);
    params.set("targetFicheId", fiche.id);
    params.set("currentText", ficheSummary(fiche));
    return `/website/contribute?action=correction&${params.toString()}`;
  };

  return (
    <div className="screen-detail mx-auto w-full max-w-[1380px] space-y-10 px-5 py-8 lg:px-8 lg:py-12">
      <section className="detail-reveal grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="interactive-surface overflow-hidden rounded-card bg-elevated shadow-card ring-1 ring-borderSoft/10">
          <div className="relative aspect-[1.08]">
            {item.media_kind === "audio" ? (
              <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
            ) : (
              <Image
                src={mediaSrc}
                alt={item.title}
                fill
                sizes="(max-width: 1280px) 100vw, 780px"
                className="interactive-media object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-transparent" />
            <div className="absolute inset-x-8 bottom-8 text-white">
              <p className="text-sm text-white/74">{item.subtitle || item.type}</p>
              <h1 className="mt-2 max-w-[12ch] text-[3.3rem] font-semibold leading-[0.9] tracking-[-0.06em]">
                {item.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="detail-reveal detail-reveal-delay-1 space-y-6 rounded-card bg-elevated px-7 py-7 shadow-card ring-1 ring-borderSoft/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue">
                {t("website.featured")}
              </p>
              <p className="mt-2 text-base leading-8 text-graphite">{item.description}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerLikePulse();
                likeMutation.mutate(item.id);
              }}
              className={`interactive-action inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blueSoft text-blue ring-1 ring-blue/15 transition hover:bg-blue hover:text-white ${
                likePulse ? "like-pop" : ""
              }`}
            >
              <Heart className={`h-5 w-5 ${item.is_liked ? "fill-current" : ""} ${likePulse ? "like-pop" : ""}`} />
            </button>
          </div>

          <div className="rounded-[28px] bg-surface px-5 py-5 text-sm leading-7 text-graphite ring-1 ring-borderSoft/10">
            {item.narrative_text}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {item.metadata.city ? (
              <div className="rounded-[24px] bg-mist px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-blue">Ville</p>
                <p className="mt-1 font-semibold text-ink">{item.metadata.city}</p>
              </div>
            ) : null}
            {item.metadata.date ? (
              <div className="rounded-[24px] bg-mist px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-blue">Date</p>
                <p className="mt-1 font-semibold text-ink">{formatDateTime(item.metadata.date)}</p>
              </div>
            ) : null}
            {item.metadata.price !== undefined ? (
              <div className="rounded-[24px] bg-mist px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-blue">Prix</p>
                <p className="mt-1 font-semibold text-ink">{formatPrice(item.metadata.price)}</p>
              </div>
            ) : null}
            {showAddressLine ? (
              <div className="rounded-[24px] bg-mist px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-blue">Adresse</p>
                <p className="mt-1 font-semibold text-ink">{item.metadata.address}</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={contributorHref}
              className="interactive-action rounded-full bg-mist px-5 py-3 text-sm font-semibold text-ink"
            >
              {item.contributor.display_name}
            </Link>
            <ShareSheet editorialId={item.id} editorialTitle={item.title} basePath="/website">
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => {
                    triggerSharePulse();
                    open();
                  }}
                  className={`interactive-action inline-flex items-center rounded-full bg-mist px-5 py-3 text-sm font-semibold text-ink ${
                    sharePulse ? "share-pulse" : ""
                  }`}
                >
                  <ShareIcon className="mr-2 h-4 w-4" strokeWidth={2.2} />
                  Share
                </button>
              )}
            </ShareSheet>
            <Link
              href={mapHref}
              className="interactive-action inline-flex items-center rounded-full bg-plum px-5 py-3 text-sm font-semibold text-white"
              aria-label={`Ouvrir ${item.title} sur la carte`}
            >
              <MapPinned className="mr-2 h-4 w-4" />
              {t("website.map")}
            </Link>
            <Link
              href={`/website/editorial/${item.id}`}
              className="interactive-action inline-flex items-center rounded-full bg-mist px-5 py-3 text-sm font-semibold text-ink"
            >
              <MediaStateIcon kind={item.media_kind === "audio" ? "audio" : item.media_kind === "video" ? "video" : "read"} className="mr-2 h-4 w-4" strokeWidth={2.2} />
              Lire
            </Link>
          </div>

          <div className="rounded-[28px] bg-blueSoft p-4 ring-1 ring-blue/15">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Contribution collaborative</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={improveHref} className="interactive-action rounded-full bg-elevated px-4 py-2.5 text-sm font-semibold text-blue shadow-sm">
                Améliorer cette fiche
              </Link>
              <Link href={correctionHref} className="interactive-action rounded-full bg-elevated px-4 py-2.5 text-sm font-semibold text-ink shadow-sm">
                Proposer une correction
              </Link>
              <Link href={improveHref} className="interactive-action rounded-full bg-elevated px-4 py-2.5 text-sm font-semibold text-ink shadow-sm">
                Ajouter des informations
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-reveal detail-reveal-delay-2 rounded-card bg-elevated px-7 py-7 shadow-card ring-1 ring-borderSoft/10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue">Fiches collaboratives</p>
            <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-ink">
              Contenu publié par la communauté
            </h2>
          </div>
          <Link href={improveHref} className="interactive-action rounded-full bg-blueSoft px-5 py-3 text-sm font-semibold text-blue">
            Ajouter des informations
          </Link>
        </div>
        {publicFichesQuery.isLoading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-blue">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Chargement des fiches...
          </div>
        ) : publicFiches.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {publicFiches.map((fiche) => (
              <article key={fiche.id} className="rounded-[30px] bg-surface p-5 ring-1 ring-borderSoft/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">{fiche.title}</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-graphite">{ficheSummary(fiche)}</p>
                  </div>
                  <Link href={ficheCorrectionHref(fiche)} className="interactive-action shrink-0 rounded-full bg-elevated px-4 py-2 text-xs font-semibold text-plum shadow-sm">
                    Corriger
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {fiche.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-blueSoft px-3 py-1 text-xs font-semibold text-blue">{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[28px] bg-surface px-5 py-5 text-sm leading-7 text-graphite ring-1 ring-borderSoft/10">
            Aucune fiche collaborative publiée pour cette carte. Proposez la première version détaillée.
          </div>
        )}
      </section>

      <section className="detail-reveal detail-reveal-delay-2 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum">
              {t("website.related")}
            </p>
            <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-ink">
              {item.linked_entity?.title || item.title}
            </h2>
          </div>
          <Link href="/website/feed" className="text-sm font-semibold text-blue">
            {t("website.viewAll")}
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {item.related.length ? (
            item.related.map((relatedItem) => (
              <WebsiteEditorialCard
                key={relatedItem.id}
                item={relatedItem}
                onLike={(id) => cardLikeMutation.mutate(id)}
                entryDelayMs={110}
              />
            ))
          ) : (
            <div className="rounded-[28px] bg-elevated px-5 py-6 text-sm leading-7 text-graphite shadow-card ring-1 ring-borderSoft/10 md:col-span-2 xl:col-span-3">
              Cette carte n&apos;a pas encore de prolongement visible dans le graphe editorial.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
