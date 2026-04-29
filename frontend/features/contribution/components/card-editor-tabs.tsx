"use client";

import { ImagePlus, Link2, MapPin, Sparkles, Tags } from "lucide-react";

import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { CardCategoryMetadata, CardPayload } from "@/lib/api/types";

import { cardEditorTabs, categories, splitTags } from "../studio";
import type { CardEditorTab } from "../studio";

interface CardEditorTabsProps {
  card: CardPayload;
  activeTab: CardEditorTab;
  onTabChange: (tab: CardEditorTab) => void;
  onChange: <K extends keyof CardPayload>(key: K, value: CardPayload[K]) => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
}

function EditorTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: CardEditorTab;
  onTabChange: (tab: CardEditorTab) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {cardEditorTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-semibold transition",
            activeTab === tab.id ? "bg-[#3365C8] text-white" : "bg-[#F3F3F3] text-[#5B6271]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function CardEditorTabs({
  card,
  activeTab,
  onTabChange,
  onChange,
  tagInput,
  onTagInputChange,
}: CardEditorTabsProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-[28px] bg-white p-4 shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">Éditeur carte</p>
          <h3 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.05em] text-[#1F2430] sm:text-2xl">Structure publique</h3>
        </div>
        <div className="hidden rounded-[18px] bg-[#F7F7F7] px-3 py-2 text-xs text-[#6B7280] ring-1 ring-black/6 lg:block">
          1 carte · 5 sections
        </div>
      </div>

      <div className="mt-4">
        <EditorTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {activeTab === "infos" ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-4 rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <Input
                value={card.title}
                onChange={(event) => onChange("title", event.target.value)}
                placeholder="Titre de la carte"
              />
              <select
                className="h-12 w-full rounded-[16px] border border-black/8 bg-white px-4 text-sm text-[#1F2430] outline-none transition focus:border-[#3365C8] focus:ring-4 focus:ring-[#3365C8]/12"
                value={card.category_metadata}
                onChange={(event) => onChange("category_metadata", event.target.value as CardCategoryMetadata)}
              >
                {categories.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={card.city ?? ""}
                  onChange={(event) => onChange("city", event.target.value)}
                  placeholder="Ville"
                />
                <Input
                  value={card.location ?? ""}
                  onChange={(event) => onChange("location", event.target.value)}
                  placeholder="Lieu / repère"
                />
              </div>
            </div>
            <div className="rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2430]">
                <MapPin className="h-4 w-4 text-[#3365C8]" />
                Signalétique
              </div>
              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                Utilisez un intitulé simple, une catégorie claire, puis ancrez la carte avec une ville et un point de repère.
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "description" ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4 rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <Textarea
                value={card.short_description}
                onChange={(event) => onChange("short_description", event.target.value)}
                placeholder="Description courte visible dans le feed"
                className="min-h-[180px]"
              />
              <Textarea
                value={card.why_exists ?? ""}
                onChange={(event) => onChange("why_exists", event.target.value)}
                placeholder="Pourquoi cette carte doit exister ?"
                className="min-h-[200px]"
              />
            </div>
            <div className="rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2430]">
                <Sparkles className="h-4 w-4 text-[#7643A6]" />
                Angle éditorial
              </div>
              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                Résumez en une phrase ce qu’un lecteur doit comprendre immédiatement, puis ajoutez la justification éditoriale.
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "medias" ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <Input
                value={card.main_image ?? ""}
                onChange={(event) => onChange("main_image", event.target.value)}
                placeholder="URL de l’image principale"
              />
              <div className="mt-4 rounded-[18px] border border-dashed border-[#7643A6]/25 bg-white px-4 py-5 text-sm leading-6 text-[#6B7280]">
                L’image principale donne le ton de la carte. Utilisez une image claire, recadrable, et lisible dans le feed.
              </div>
            </div>
            <div className="rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2430]">
                <ImagePlus className="h-4 w-4 text-[#7643A6]" />
                Conseil média
              </div>
              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                Une bonne carte reste lisible même en petit format. Privilégiez une image forte plutôt qu’une galerie.
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "relations" ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4 rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <Input
                value={tagInput}
                onChange={(event) => {
                  onTagInputChange(event.target.value);
                  onChange("tags", splitTags(event.target.value));
                }}
                placeholder="Tags : patrimoine, culture, Europe"
              />
              <Textarea
                value={
                  typeof card.relations[0]?.label === "string" ? String(card.relations[0].label) : ""
                }
                onChange={(event) =>
                  onChange("relations", event.target.value.trim() ? [{ label: event.target.value.trim() }] : [])
                }
                placeholder="Relations suggérées ou proximités"
                className="min-h-[160px]"
              />
            </div>
            <div className="rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2430]">
                <Tags className="h-4 w-4 text-[#3365C8]" />
                Réseau
              </div>
              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                Ajoutez peu de tags mais des tags utiles. Les relations doivent aider la navigation, pas la brouiller.
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "sources" ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4 rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <Textarea
                value={card.source_reference ?? ""}
                onChange={(event) => onChange("source_reference", event.target.value)}
                placeholder="Source, référence, lien, archive ou provenance"
                className="min-h-[220px]"
              />
            </div>
            <div className="rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2430]">
                <Link2 className="h-4 w-4 text-[#1F9D66]" />
                Traçabilité
              </div>
              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                Même une source simple améliore la confiance. Mentionnez au moins un lien ou une origine vérifiable.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
