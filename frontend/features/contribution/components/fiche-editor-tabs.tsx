"use client";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { FicheMediaBlock } from "@/lib/api/types";

import { ficheTabs, splitTags } from "../studio";
import type { FicheDraft, FicheTab } from "../studio";

interface FicheEditorTabsProps {
  fiche: FicheDraft;
  activeTab: FicheTab;
  onTabChange: (tab: FicheTab) => void;
  onChange: (value: FicheDraft) => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
}

function mediaKinds() {
  return ["image", "video", "audio", "text"] as const;
}

export function FicheEditorTabs({
  fiche,
  activeTab,
  onTabChange,
  onChange,
  tagInput,
  onTagInputChange,
}: FicheEditorTabsProps) {
  const updateSection = (key: keyof FicheDraft["sections"], value: string) => {
    onChange({ ...fiche, sections: { ...fiche.sections, [key]: value } });
  };

  const addMedia = (kind: FicheMediaBlock["kind"]) => {
    onChange({
      ...fiche,
      media_blocks: [...fiche.media_blocks, { kind, url: "", name: "", text: "", caption: "" }],
    });
  };

  const updateMedia = (index: number, patch: Partial<FicheMediaBlock>) => {
    onChange({
      ...fiche,
      media_blocks: fiche.media_blocks.map((block, blockIndex) =>
        blockIndex === index ? { ...block, ...patch } : block
      ),
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[28px] bg-white p-4 shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">Éditeur fiche</p>
          <h3 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.05em] text-[#1F2430] sm:text-2xl">Section par section</h3>
        </div>
        <div className="hidden rounded-[18px] bg-[#F7F7F7] px-3 py-2 text-xs text-[#6B7280] ring-1 ring-black/6 lg:block">
          Rédaction guidée
        </div>
      </div>

      <Input
        value={fiche.title}
        onChange={(event) => onChange({ ...fiche, title: event.target.value })}
        placeholder="Titre de la fiche"
        className="mt-4"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {ficheTabs.map((tab) => (
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

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {activeTab === "resume" ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
            <Textarea
              value={fiche.sections.resume}
              onChange={(event) => updateSection("resume", event.target.value)}
              placeholder="Résumé, accroche, angle d’entrée"
              className="min-h-[240px]"
            />
          </div>
        ) : null}

        {activeTab === "description" ? (
          <div className="rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
            <Textarea
              value={fiche.sections.description}
              onChange={(event) => updateSection("description", event.target.value)}
              placeholder="Description détaillée"
              className="min-h-[320px]"
            />
          </div>
        ) : null}

        {activeTab === "contexte" ? (
          <div className="space-y-4 rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
            <Textarea
              value={fiche.sections.contexte}
              onChange={(event) => updateSection("contexte", event.target.value)}
              placeholder="Contexte historique, culturel, éditorial"
              className="min-h-[180px]"
            />
            <Textarea
              value={fiche.sections.pratique}
              onChange={(event) => updateSection("pratique", event.target.value)}
              placeholder="Infos pratiques si nécessaire"
              className="min-h-[150px]"
            />
          </div>
        ) : null}

        {activeTab === "medias" ? (
          <div className="space-y-4 rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
            <div className="flex flex-wrap gap-2">
              {mediaKinds().map((kind) => (
                <Button
                  key={kind}
                  variant="secondary"
                  className="min-h-10 rounded-full px-4 text-xs"
                  onClick={() => addMedia(kind)}
                >
                  + {kind}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {fiche.media_blocks.map((block, index) => (
                <div key={`${block.kind}-${index}`} className="rounded-[18px] bg-white p-3 ring-1 ring-black/6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3365C8]">
                    {block.kind}
                  </p>
                  {block.kind === "text" ? (
                    <Textarea
                      value={block.text ?? ""}
                      onChange={(event) => updateMedia(index, { text: event.target.value })}
                      placeholder="Texte lié"
                      className="mt-3 min-h-[120px]"
                    />
                  ) : (
                    <Input
                      value={block.url ?? ""}
                      onChange={(event) => updateMedia(index, { url: event.target.value })}
                      placeholder="URL média"
                      className="mt-3"
                    />
                  )}
                  <Input
                    value={block.caption ?? ""}
                    onChange={(event) => updateMedia(index, { caption: event.target.value })}
                    placeholder="Légende"
                    className="mt-3"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "sources" ? (
          <div className="space-y-4 rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
            <Textarea
              value={fiche.contributor_note}
              onChange={(event) => onChange({ ...fiche, contributor_note: event.target.value })}
              placeholder="Note de contribution : ce qui a été ajouté ou amélioré"
              className="min-h-[130px]"
            />
            <Input
              value={fiche.sources[0]?.label ?? ""}
              onChange={(event) =>
                onChange({
                  ...fiche,
                  sources: [{ label: event.target.value, url: fiche.sources[0]?.url ?? "" }],
                })
              }
              placeholder="Nom de la source"
            />
            <Input
              value={fiche.sources[0]?.url ?? ""}
              onChange={(event) =>
                onChange({
                  ...fiche,
                  sources: [{ label: fiche.sources[0]?.label ?? "Source", url: event.target.value }],
                })
              }
              placeholder="URL source"
            />
          </div>
        ) : null}

        {activeTab === "relations" ? (
          <div className="space-y-4 rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
            <Input
              value={tagInput}
              onChange={(event) => {
                onTagInputChange(event.target.value);
                onChange({ ...fiche, tags: splitTags(event.target.value) });
              }}
              placeholder="Tags de fiche"
            />
            <Input
              value={fiche.relations[0]?.title ?? ""}
              onChange={(event) =>
                onChange({
                  ...fiche,
                  relations: [{ title: event.target.value, reason: fiche.relations[0]?.reason ?? "" }],
                })
              }
              placeholder="Carte liée suggérée"
            />
            <Textarea
              value={fiche.relations[0]?.reason ?? ""}
              onChange={(event) =>
                onChange({
                  ...fiche,
                  relations: [{ title: fiche.relations[0]?.title ?? "", reason: event.target.value }],
                })
              }
              placeholder="Pourquoi cette relation ?"
              className="min-h-[160px]"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
