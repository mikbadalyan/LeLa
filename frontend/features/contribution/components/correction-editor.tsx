"use client";

import { FileText, Layers3 } from "lucide-react";

import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { CardSearchResult, PublishedFiche } from "@/lib/api/types";

import type { CorrectionDraft } from "../studio";
import { fichePrimaryText, sectionText } from "../studio";

interface CorrectionEditorProps {
  correction: CorrectionDraft;
  onChange: (value: CorrectionDraft) => void;
  selectedCard: CardSearchResult | null;
  publishedFiches: PublishedFiche[];
  targetFicheId: string | null;
  onTargetFicheId: (value: string | null) => void;
}

function targetSections(target: PublishedFiche | null) {
  if (!target) {
    return [
      { key: "resume", label: "Résumé", text: "" },
      { key: "description", label: "Description", text: "" },
    ];
  }

  const sections = target.sections ?? {};
  return [
    { key: "resume", label: "Résumé", text: sectionText(sections.resume) },
    { key: "description", label: "Description", text: sectionText(sections.description) },
    { key: "contexte", label: "Contexte", text: sectionText(sections.contexte) },
    { key: "pratique", label: "Pratique", text: sectionText(sections.pratique) },
  ].filter((entry) => entry.text);
}

export function CorrectionEditor({
  correction,
  onChange,
  selectedCard,
  publishedFiches,
  targetFicheId,
  onTargetFicheId,
}: CorrectionEditorProps) {
  const selectedFiche = publishedFiches.find((fiche) => fiche.id === targetFicheId) ?? null;
  const sections = targetSections(selectedFiche);

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col rounded-[28px] bg-white p-4 shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">Correction</p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#1F2430]">
          Sélectionner la cible
        </h3>
        <div className="mt-4 rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
          <p className="text-sm font-semibold text-[#1F2430]">{selectedCard?.title ?? "Carte non choisie"}</p>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            {selectedCard?.short_description ?? "Commencez par sélectionner la carte à corriger."}
          </p>
        </div>

        <div className="mt-4 space-y-2 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => {
              onTargetFicheId(null);
              onChange({
                ...correction,
                section: "Carte",
                current_text: selectedCard?.short_description ?? "",
              });
            }}
            className={cn(
              "w-full rounded-[18px] px-4 py-3 text-left transition",
              !targetFicheId ? "bg-[#3365C8] text-white" : "bg-[#F7F7F7] text-[#1F2430]"
            )}
          >
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4" />
              <span className="text-sm font-semibold">Carte principale</span>
            </div>
          </button>
          {publishedFiches.map((fiche) => (
            <button
              key={fiche.id}
              type="button"
              onClick={() => {
                onTargetFicheId(fiche.id);
                onChange({
                  ...correction,
                  section: "Résumé",
                  current_text: fichePrimaryText(fiche),
                });
              }}
              className={cn(
                "w-full rounded-[18px] px-4 py-3 text-left transition",
                targetFicheId === fiche.id ? "bg-[#3365C8] text-white" : "bg-[#F7F7F7] text-[#1F2430]"
              )}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-semibold">{fiche.title}</span>
              </div>
              <p className={cn("mt-2 line-clamp-2 text-xs", targetFicheId === fiche.id ? "text-white/78" : "text-[#6B7280]")}>
                {fichePrimaryText(fiche)}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col rounded-[28px] bg-white p-4 shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">Section ciblée</p>
            <h3 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.05em] text-[#1F2430] sm:text-2xl">
              Correction guidée
            </h3>
          </div>
        </div>

        {selectedFiche ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() =>
                  onChange({
                    ...correction,
                    section: section.label,
                    current_text: section.text,
                  })
                }
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  correction.section === section.label ? "bg-[#7643A6] text-white" : "bg-[#F3F3F3] text-[#5B6271]"
                )}
              >
                {section.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-2">
          <div className="rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
            <Input
              value={correction.section}
              onChange={(event) => onChange({ ...correction, section: event.target.value })}
              placeholder="Section concernée"
            />
            <Textarea
              value={correction.current_text}
              onChange={(event) => onChange({ ...correction, current_text: event.target.value })}
              placeholder="Texte actuel"
              className="mt-4 min-h-[260px]"
            />
          </div>

          <div className="rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
            <Textarea
              value={correction.proposed_text}
              onChange={(event) => onChange({ ...correction, proposed_text: event.target.value })}
              placeholder="Correction proposée"
              className="min-h-[180px]"
            />
            <Textarea
              value={correction.explanation}
              onChange={(event) => onChange({ ...correction, explanation: event.target.value })}
              placeholder="Pourquoi proposez-vous cette modification ?"
              className="mt-4 min-h-[140px]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
