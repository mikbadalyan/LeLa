"use client";

import { Image as ImageIcon, MapPin, Sparkles } from "lucide-react";

import type { CardPayload, CardSearchResult, FicheAiEvaluation, PublishedFiche } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

import type { ActionChoice, CorrectionDraft, FicheDraft } from "../studio";

interface LivePreviewPanelProps {
  action: ActionChoice;
  selectedCard: CardSearchResult | null;
  card: CardPayload;
  fiche: FicheDraft;
  correction: CorrectionDraft;
  selectedFiche: PublishedFiche | null;
  evaluation?: FicheAiEvaluation | null;
  variant?: "panel" | "full";
}

function previewTitle(
  action: ActionChoice,
  selectedCard: CardSearchResult | null,
  card: CardPayload,
  fiche: FicheDraft,
  selectedFiche: PublishedFiche | null
) {
  if (action === "create_card") return card.title || "Nouvelle carte";
  if (action === "create_fiche") return fiche.title || selectedCard?.title || "Nouvelle fiche";
  return selectedFiche?.title || selectedCard?.title || "Correction";
}

function previewDescription(action: ActionChoice, selectedCard: CardSearchResult | null, card: CardPayload, fiche: FicheDraft, correction: CorrectionDraft) {
  if (action === "create_card") return card.short_description || "Description publique";
  if (action === "create_fiche") return fiche.sections.resume || selectedCard?.short_description || "Résumé de fiche";
  return correction.proposed_text || correction.current_text || selectedCard?.short_description || "Correction en préparation";
}

function previewImage(action: ActionChoice, selectedCard: CardSearchResult | null, card: CardPayload, selectedFiche: PublishedFiche | null) {
  if (action === "create_card") return card.main_image || "";
  const ficheImage = selectedFiche?.media_blocks.find((entry) => entry.kind === "image")?.url ?? "";
  return ficheImage || selectedCard?.image || "";
}

function statusTone(score?: number) {
  if (score === undefined) return "bg-[#F3F3F3] text-[#6B7280]";
  if (score >= 75) return "bg-[#1F9D66]/12 text-[#1F9D66]";
  if (score >= 50) return "bg-[#E5A93B]/14 text-[#A36A15]";
  return "bg-[#E85C5C]/12 text-[#B64141]";
}

export function LivePreviewPanel({
  action,
  selectedCard,
  card,
  fiche,
  correction,
  selectedFiche,
  evaluation,
  variant = "panel",
}: LivePreviewPanelProps) {
  const title = previewTitle(action, selectedCard, card, fiche, selectedFiche);
  const description = previewDescription(action, selectedCard, card, fiche, correction);
  const image = previewImage(action, selectedCard, card, selectedFiche);
  const tags = action === "create_fiche" ? fiche.tags : card.tags;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col rounded-[28px] bg-white p-4 shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6",
        variant === "full" ? "h-full" : ""
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">Aperçu live</p>
          <h3 className="mt-2 text-base font-semibold tracking-[-0.03em] text-[#1F2430] sm:text-lg">
            Rendu public
          </h3>
        </div>
        {evaluation ? (
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusTone(evaluation.global_score))}>
            Score {evaluation.global_score}
          </span>
        ) : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-[28px] bg-[#1F2430]">
        <div className="relative h-[260px]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,#202431,#7643A6)]">
              <ImageIcon className="h-10 w-10 text-white/55" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <span className="inline-flex rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
              {action === "create_card" ? card.category_metadata : selectedCard?.category_metadata ?? "fiche"}
            </span>
            <h4 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-[-0.05em]">{title}</h4>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/80">{description}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/82">
              <MapPin className="h-4 w-4" />
              <span>{card.city || selectedCard?.city || "Strasbourg"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("mt-4 min-h-0 space-y-4", variant === "panel" ? "overflow-y-auto pr-1" : "overflow-y-auto pr-1")}>
        {action === "correction" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[22px] bg-[#F8EAEA] p-4 ring-1 ring-[#E85C5C]/14">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B64141]">Avant</p>
              <p className="mt-3 text-sm leading-6 text-[#5F6674]">
                {correction.current_text || "Le texte actuel apparaîtra ici."}
              </p>
            </div>
            <div className="rounded-[22px] bg-[#EAF6EF] p-4 ring-1 ring-[#1F9D66]/12">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1F9D66]">Après</p>
              <p className="mt-3 text-sm leading-6 text-[#5F6674]">
                {correction.proposed_text || "Votre correction proposée."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {action === "create_fiche" ? (
              <div className="rounded-[22px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7280]">Fiche</p>
                <p className="mt-2 text-sm leading-6 text-[#5F6674]">
                  {fiche.sections.resume || "Le résumé apparaîtra ici."}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#5F6674]">
                  {fiche.sections.description || "La description détaillée restera visible dans la fiche complète."}
                </p>
              </div>
            ) : (
              <div className="rounded-[22px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7280]">Pourquoi cette carte</p>
                <p className="mt-2 text-sm leading-6 text-[#5F6674]">
                  {card.why_exists || "La justification éditoriale apparaîtra ici."}
                </p>
              </div>
            )}

            <div className="rounded-[22px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#7643A6]" />
                <p className="text-sm font-semibold text-[#1F2430]">Signal éditorial</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.length ? (
                  tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#3365C8] ring-1 ring-black/6">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#6B7280] ring-1 ring-black/6">
                    Aucun tag pour l’instant
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
