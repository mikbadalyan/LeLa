"use client";

import { Check, FileText, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CardPayload, CardSearchResult, FicheAiEvaluation, PublishedFiche } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

import type { ActionChoice, CorrectionDraft, FicheDraft } from "../studio";

interface ContributionSummaryProps {
  action: ActionChoice;
  selectedCard: CardSearchResult | null;
  selectedFiche: PublishedFiche | null;
  card: CardPayload;
  fiche: FicheDraft;
  correction: CorrectionDraft;
  evaluation?: FicheAiEvaluation | null;
  proposalStatus?: string | null;
  submitting?: boolean;
  onSubmit: () => void;
}

function summaryRows(
  action: ActionChoice,
  selectedCard: CardSearchResult | null,
  selectedFiche: PublishedFiche | null,
  card: CardPayload,
  fiche: FicheDraft,
  correction: CorrectionDraft
) {
  if (action === "create_card") {
    return [
      ["Type", "Créer une carte"],
      ["Titre", card.title || "Non renseigné"],
      ["Ville", card.city || "Strasbourg"],
      ["Tags", card.tags.length ? card.tags.join(", ") : "Aucun"],
    ];
  }

  if (action === "create_fiche") {
    return [
      ["Type", "Ajouter / compléter une fiche"],
      ["Carte liée", selectedCard?.title || "Non choisie"],
      ["Titre fiche", fiche.title || "Non renseigné"],
      ["Résumé", fiche.sections.resume || "Aucun résumé"],
    ];
  }

  return [
    ["Type", "Proposer une correction"],
    ["Carte liée", selectedCard?.title || "Non choisie"],
    ["Fiche ciblée", selectedFiche?.title || "Carte principale"],
    ["Section", correction.section || "Non renseignée"],
  ];
}

export function ContributionSummary({
  action,
  selectedCard,
  selectedFiche,
  card,
  fiche,
  correction,
  evaluation,
  proposalStatus,
  submitting,
  onSubmit,
}: ContributionSummaryProps) {
  const rows = summaryRows(action, selectedCard, selectedFiche, card, fiche, correction);

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-h-0 flex-col rounded-[28px] bg-white p-5 shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF4FF] text-[#3365C8]">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">Soumission</p>
            <h3 className="mt-1 text-[1.45rem] font-semibold tracking-[-0.05em] text-[#1F2430] sm:text-2xl">
              Vérification finale
            </h3>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-[22px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">{label}</p>
              <p className="mt-2 text-sm leading-6 text-[#1F2430]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[24px] bg-[#F7F7F7] p-5 ring-1 ring-black/6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#1F2430]">Prêt pour modération</p>
            {proposalStatus ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7643A6] ring-1 ring-black/6">
                {proposalStatus}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-[#5F6674]">
            La contribution restera invisible publiquement tant qu’elle n’aura pas été relue et approuvée.
          </p>
          {proposalStatus === "pending_moderation" ? (
            <div className="mt-4 rounded-[18px] bg-[#EAF6EF] px-4 py-3 text-sm font-semibold text-[#1F9D66]">
              Proposition déjà envoyée à la modération.
            </div>
          ) : (
            <Button className="mt-5 w-full" onClick={onSubmit} disabled={submitting || !evaluation}>
              {submitting ? <Check className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
              Soumettre pour modération
            </Button>
          )}
        </div>
      </section>

      <aside className="rounded-[28px] bg-white p-5 shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">Synthèse IA</p>
        <div
          className={cn(
            "mt-4 rounded-[24px] p-5",
            evaluation?.global_score && evaluation.global_score >= 75
              ? "bg-[#EAF6EF] text-[#1F9D66]"
              : evaluation?.global_score && evaluation.global_score >= 50
                ? "bg-[#FFF3DE] text-[#A36A15]"
                : "bg-[#F7F7F7] text-[#6B7280]"
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">Score global</p>
          <p className="mt-2 text-4xl font-semibold">{evaluation?.global_score ?? "--"}</p>
          <p className="mt-3 text-sm leading-6">{evaluation?.summary ?? "L’analyse IA apparaîtra ici."}</p>
        </div>
      </aside>
    </div>
  );
}
