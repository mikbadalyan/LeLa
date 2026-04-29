"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  FilePenLine,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Send,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import {
  createContributionProposal,
  getCardFiches,
  getEditorialFiches,
  reviewContributionProposalWithAi,
  searchCards,
  submitContributionProposal,
  updateContributionProposal,
} from "@/lib/api/endpoints";
import type {
  CardCategoryMetadata,
  CardPayload,
  CardSearchResult,
  ContributionProposal,
  FicheAiEvaluation,
  PublishedFiche,
} from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

import {
  buildProposalPayload,
  categories,
  draftStorageKey,
  fichePrimaryText,
  initialCard,
  initialCorrection,
  initialFiche,
  sanitizeCard,
  sanitizeFiche,
  splitTags,
} from "./studio";
import type { ActionChoice, ContributionFormProps, CorrectionDraft, FicheDraft } from "./studio";

type PwaStep = "start" | "search" | "compose" | "review";
type ComposeTab = "principal" | "details" | "media" | "source";

const pwaSteps: Array<{ id: PwaStep; label: string }> = [
  { id: "start", label: "Type" },
  { id: "search", label: "Carte" },
  { id: "compose", label: "Contenu" },
  { id: "review", label: "Envoi" },
];

const actionCards: Array<{
  id: ActionChoice;
  title: string;
  subtitle: string;
  icon: "card" | "fiche" | "correction";
}> = [
  {
    id: "create_card",
    title: "Carte",
    subtitle: "Créer un nouveau sujet",
    icon: "card",
  },
  {
    id: "create_fiche",
    title: "Fiche",
    subtitle: "Compléter une carte",
    icon: "fiche",
  },
  {
    id: "correction",
    title: "Correction",
    subtitle: "Corriger l'existant",
    icon: "correction",
  },
];

function actionIcon(icon: "card" | "fiche" | "correction") {
  if (icon === "card") return <Plus className="h-5 w-5" />;
  if (icon === "fiche") return <FileText className="h-5 w-5" />;
  return <FilePenLine className="h-5 w-5" />;
}

function selectedCardFromInitialReference(
  initialReference: ContributionFormProps["initialReference"]
): CardSearchResult | null {
  if (!initialReference) return null;
  return {
    id: initialReference.id,
    title: initialReference.title,
    short_description: initialReference.short_description,
    city: initialReference.city,
    image: initialReference.image,
    status: "published",
    category_metadata: initialReference.category_metadata,
    tags: [],
    source: initialReference.source,
  };
}

function scoreTone(score?: number) {
  if (score === undefined) return "bg-white text-[#6B7280]";
  if (score >= 75) return "bg-[#EAF6EF] text-[#1F9D66]";
  if (score >= 50) return "bg-[#FFF3DE] text-[#9B6414]";
  return "bg-[#FCE8E8] text-[#B64141]";
}

function actionLabel(action: ActionChoice) {
  if (action === "create_card") return "Carte";
  if (action === "create_fiche") return "Fiche";
  return "Correction";
}

function validateCurrentStep(params: {
  step: PwaStep;
  action: ActionChoice;
  searched: boolean;
  selectedCard: CardSearchResult | null;
  card: CardPayload;
  fiche: FicheDraft;
  correction: CorrectionDraft;
}) {
  const card = sanitizeCard(params.card);
  const fiche = sanitizeFiche(params.fiche);

  if (params.step === "search") {
    if (!params.searched) return "Lancez d'abord une recherche.";
    if (params.action !== "create_card" && !params.selectedCard) return "Choisissez une carte.";
  }

  if (params.step === "compose" && params.action === "create_card") {
    if (card.title.length < 2) return "Ajoutez un titre.";
    if (card.short_description.length < 10) return "Ajoutez une description courte.";
    if (!card.why_exists || card.why_exists.length < 8) return "Ajoutez une raison.";
  }

  if (params.step === "compose" && params.action === "create_fiche") {
    if (!params.selectedCard) return "Choisissez la carte liée.";
    if (fiche.title.length < 2) return "Ajoutez un titre de fiche.";
    if (fiche.sections.resume.length < 10) return "Ajoutez un résumé.";
    if (fiche.sections.description.length < 18) return "Ajoutez une description.";
  }

  if (params.step === "compose" && params.action === "correction") {
    if (!params.selectedCard) return "Choisissez le contenu à corriger.";
    if (params.correction.proposed_text.trim().length < 5) return "Ajoutez la correction.";
    if (params.correction.explanation.trim().length < 8) return "Ajoutez la raison.";
  }

  return null;
}

function MiniPreview({
  action,
  card,
  fiche,
  selectedCard,
  correction,
  evaluation,
}: {
  action: ActionChoice;
  card: CardPayload;
  fiche: FicheDraft;
  selectedCard: CardSearchResult | null;
  correction: CorrectionDraft;
  evaluation?: FicheAiEvaluation | null;
}) {
  const title =
    action === "create_card"
      ? card.title || "Nouvelle carte"
      : action === "create_fiche"
        ? fiche.title || selectedCard?.title || "Nouvelle fiche"
        : correction.section || selectedCard?.title || "Correction";
  const description =
    action === "create_card"
      ? card.short_description || "Aperçu de votre carte"
      : action === "create_fiche"
        ? fiche.sections.resume || selectedCard?.short_description || "Résumé de la fiche"
        : correction.proposed_text || selectedCard?.short_description || "Correction proposée";
  const image = action === "create_card" ? card.main_image : selectedCard?.image;

  return (
    <section className="overflow-hidden rounded-[28px] bg-[#1F2430] shadow-[0_20px_48px_rgba(31,36,48,0.2)]">
      <div className="relative h-[220px]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,#202431,#7643A6)]">
            <ImageIcon className="h-10 w-10 text-white/55" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full bg-white/18 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
            {actionLabel(action)}
          </span>
          {evaluation ? (
            <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", scoreTone(evaluation.global_score))}>
              {evaluation.global_score}
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-4 bottom-4 text-white">
          <h2 className="line-clamp-2 text-[1.85rem] font-semibold leading-[0.98]">{title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/78">{description}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/78">
            <MapPin className="h-3.5 w-3.5" />
            <span>{card.city || selectedCard?.city || "Strasbourg"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepDots({ step }: { step: PwaStep }) {
  const activeIndex = pwaSteps.findIndex((entry) => entry.id === step);

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-1">
      {pwaSteps.map((entry, index) => (
        <div
          key={entry.id}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition",
            index === activeIndex
              ? "bg-[#7643A6] text-white"
              : index < activeIndex
                ? "bg-[#EAF6EF] text-[#1F9D66]"
                : "bg-white text-[#6B7280]"
          )}
        >
          <span>{index + 1}</span>
          <span>{entry.label}</span>
        </div>
      ))}
    </div>
  );
}

function ActionStep({
  value,
  onSelect,
}: {
  value: ActionChoice;
  onSelect: (value: ActionChoice) => void;
}) {
  return (
    <div className="space-y-3">
      {actionCards.map((entry) => {
        const active = value === entry.id;
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry.id)}
            className={cn(
              "flex w-full items-center gap-4 rounded-[28px] px-4 py-4 text-left shadow-[0_14px_34px_rgba(31,36,48,0.08)] ring-1 transition",
              active ? "bg-[#1F2430] text-white ring-[#1F2430]" : "bg-white text-[#1F2430] ring-black/6"
            )}
          >
            <span
              className={cn(
                "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px]",
                active ? "bg-white/12 text-white" : "bg-[#F3EEFA] text-[#7643A6]"
              )}
            >
              {actionIcon(entry.icon)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xl font-semibold leading-tight">{entry.title}</span>
              <span className={cn("mt-1 block text-sm", active ? "text-white/72" : "text-[#6B7280]")}>
                {entry.subtitle}
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

function SearchStep({
  action,
  query,
  city,
  results,
  selectedCard,
  loading,
  searched,
  onQuery,
  onCity,
  onUseCard,
  onCreateNew,
}: {
  action: ActionChoice;
  query: string;
  city: string;
  results: CardSearchResult[];
  selectedCard: CardSearchResult | null;
  loading: boolean;
  searched: boolean;
  onQuery: (value: string) => void;
  onCity: (value: string) => void;
  onUseCard: (card: CardSearchResult, nextAction?: ActionChoice) => void;
  onCreateNew: () => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-white p-4 shadow-[0_14px_34px_rgba(31,36,48,0.08)] ring-1 ring-black/6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <Input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Chercher une carte"
            className="pl-11"
          />
        </div>
        <Input
          value={city}
          onChange={(event) => onCity(event.target.value)}
          placeholder="Ville"
          className="mt-3"
        />
        {action === "create_card" ? (
          <Button className="mt-3 w-full" onClick={onCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Créer une nouvelle carte
          </Button>
        ) : null}
      </section>

      <section className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center rounded-[24px] bg-white p-8 text-[#3365C8] ring-1 ring-black/6">
            <LoaderCircle className="h-6 w-6 animate-spin" />
          </div>
        ) : null}
        {results.map((card) => (
          <article
            key={`${card.source}-${card.id}`}
            className={cn(
              "overflow-hidden rounded-[26px] bg-white shadow-[0_14px_34px_rgba(31,36,48,0.08)] ring-1",
              selectedCard?.id === card.id ? "ring-[#3365C8]" : "ring-black/6"
            )}
          >
            <button type="button" onClick={() => onUseCard(card)} className="block w-full text-left">
              <div className="relative h-32 bg-[linear-gradient(145deg,#202431,#7643A6)]">
                {card.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="p-4">
                <p className="line-clamp-1 text-lg font-semibold text-[#1F2430]">{card.title}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#6B7280]">{card.short_description}</p>
                <p className="mt-3 text-xs font-semibold text-[#7643A6]">{card.city || "LE_LA"}</p>
              </div>
            </button>
            {action === "create_card" ? (
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                <Button className="min-h-10 rounded-[16px] text-xs" onClick={() => onUseCard(card, "create_fiche")}>
                  Fiche
                </Button>
                <Button
                  variant="secondary"
                  className="min-h-10 rounded-[16px] text-xs"
                  onClick={() => onUseCard(card, "correction")}
                >
                  Correction
                </Button>
              </div>
            ) : null}
          </article>
        ))}
        {!loading && searched && !results.length ? (
          <div className="rounded-[24px] bg-white p-5 text-sm text-[#6B7280] ring-1 ring-black/6">
            Aucun résultat.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ComposeTabs({
  active,
  onActive,
}: {
  active: ComposeTab;
  onActive: (tab: ComposeTab) => void;
}) {
  const tabs: Array<{ id: ComposeTab; label: string }> = [
    { id: "principal", label: "Principal" },
    { id: "details", label: "Détails" },
    { id: "media", label: "Média" },
    { id: "source", label: "Source" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onActive(tab.id)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-xs font-semibold",
            active === tab.id ? "bg-[#3365C8] text-white" : "bg-white text-[#6B7280]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ComposeStep({
  action,
  card,
  fiche,
  correction,
  selectedCard,
  fiches,
  targetFicheId,
  tab,
  tagInput,
  onCard,
  onFiche,
  onCorrection,
  onTargetFiche,
  onTab,
  onTags,
}: {
  action: ActionChoice;
  card: CardPayload;
  fiche: FicheDraft;
  correction: CorrectionDraft;
  selectedCard: CardSearchResult | null;
  fiches: PublishedFiche[];
  targetFicheId: string | null;
  tab: ComposeTab;
  tagInput: string;
  onCard: <K extends keyof CardPayload>(key: K, value: CardPayload[K]) => void;
  onFiche: (value: FicheDraft) => void;
  onCorrection: (value: CorrectionDraft) => void;
  onTargetFiche: (value: string | null) => void;
  onTab: (tab: ComposeTab) => void;
  onTags: (value: string) => void;
}) {
  const selectedFiche = fiches.find((entry) => entry.id === targetFicheId) ?? null;

  return (
    <div className="space-y-4">
      <ComposeTabs active={tab} onActive={onTab} />

      {action !== "create_card" && selectedCard ? (
        <section className="rounded-[24px] bg-white p-4 shadow-[0_14px_34px_rgba(31,36,48,0.08)] ring-1 ring-black/6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3365C8]">Carte liée</p>
          <p className="mt-2 text-lg font-semibold text-[#1F2430]">{selectedCard.title}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#6B7280]">{selectedCard.short_description}</p>
        </section>
      ) : null}

      {action === "create_card" ? (
        <section className="rounded-[28px] bg-white p-4 shadow-[0_14px_34px_rgba(31,36,48,0.08)] ring-1 ring-black/6">
          {tab === "principal" ? (
            <div className="space-y-3">
              <Input value={card.title} onChange={(event) => onCard("title", event.target.value)} placeholder="Titre" />
              <select
                className="h-12 w-full rounded-[18px] border border-black/10 bg-[#F7F7F7] px-4 text-sm outline-none"
                value={card.category_metadata}
                onChange={(event) => onCard("category_metadata", event.target.value as CardCategoryMetadata)}
              >
                {categories.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <Input value={card.city ?? ""} onChange={(event) => onCard("city", event.target.value)} placeholder="Ville" />
              <Input value={card.location ?? ""} onChange={(event) => onCard("location", event.target.value)} placeholder="Lieu" />
            </div>
          ) : null}
          {tab === "details" ? (
            <div className="space-y-3">
              <Textarea
                value={card.short_description}
                onChange={(event) => onCard("short_description", event.target.value)}
                placeholder="Description courte"
                className="min-h-[120px]"
              />
              <Textarea
                value={card.why_exists ?? ""}
                onChange={(event) => onCard("why_exists", event.target.value)}
                placeholder="Pourquoi cette carte doit exister ?"
                className="min-h-[140px]"
              />
            </div>
          ) : null}
          {tab === "media" ? (
            <Input
              value={card.main_image ?? ""}
              onChange={(event) => onCard("main_image", event.target.value)}
              placeholder="URL image"
            />
          ) : null}
          {tab === "source" ? (
            <div className="space-y-3">
              <Input
                value={tagInput}
                onChange={(event) => {
                  onTags(event.target.value);
                  onCard("tags", splitTags(event.target.value));
                }}
                placeholder="Tags séparés par virgules"
              />
              <Textarea
                value={card.source_reference ?? ""}
                onChange={(event) => onCard("source_reference", event.target.value)}
                placeholder="Source ou référence"
                className="min-h-[120px]"
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {action === "create_fiche" ? (
        <section className="rounded-[28px] bg-white p-4 shadow-[0_14px_34px_rgba(31,36,48,0.08)] ring-1 ring-black/6">
          {tab === "principal" ? (
            <div className="space-y-3">
              <Input value={fiche.title} onChange={(event) => onFiche({ ...fiche, title: event.target.value })} placeholder="Titre fiche" />
              <Textarea
                value={fiche.sections.resume}
                onChange={(event) => onFiche({ ...fiche, sections: { ...fiche.sections, resume: event.target.value } })}
                placeholder="Résumé"
                className="min-h-[130px]"
              />
            </div>
          ) : null}
          {tab === "details" ? (
            <div className="space-y-3">
              <Textarea
                value={fiche.sections.description}
                onChange={(event) => onFiche({ ...fiche, sections: { ...fiche.sections, description: event.target.value } })}
                placeholder="Description"
                className="min-h-[160px]"
              />
              <Textarea
                value={fiche.sections.contexte}
                onChange={(event) => onFiche({ ...fiche, sections: { ...fiche.sections, contexte: event.target.value } })}
                placeholder="Contexte"
                className="min-h-[120px]"
              />
            </div>
          ) : null}
          {tab === "media" ? (
            <Input
              value={fiche.media_blocks[0]?.url ?? ""}
              onChange={(event) => onFiche({ ...fiche, media_blocks: [{ kind: "image", url: event.target.value, name: "", caption: "" }] })}
              placeholder="URL image / média"
            />
          ) : null}
          {tab === "source" ? (
            <div className="space-y-3">
              <Input
                value={tagInput}
                onChange={(event) => {
                  onTags(event.target.value);
                  onFiche({ ...fiche, tags: splitTags(event.target.value) });
                }}
                placeholder="Tags"
              />
              <Textarea
                value={fiche.contributor_note}
                onChange={(event) => onFiche({ ...fiche, contributor_note: event.target.value })}
                placeholder="Note contributeur"
                className="min-h-[100px]"
              />
              <Input
                value={fiche.sources[0]?.url ?? ""}
                onChange={(event) => onFiche({ ...fiche, sources: [{ label: "Source", url: event.target.value }] })}
                placeholder="Source"
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {action === "correction" ? (
        <section className="rounded-[28px] bg-white p-4 shadow-[0_14px_34px_rgba(31,36,48,0.08)] ring-1 ring-black/6">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                onTargetFiche(null);
                onCorrection({ ...correction, section: "Carte", current_text: selectedCard?.short_description ?? "" });
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-xs font-semibold",
                !targetFicheId ? "bg-[#3365C8] text-white" : "bg-[#F7F7F7] text-[#6B7280]"
              )}
            >
              Carte
            </button>
            {fiches.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  onTargetFiche(entry.id);
                  onCorrection({ ...correction, section: "Fiche", current_text: fichePrimaryText(entry) });
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-2 text-xs font-semibold",
                  targetFicheId === entry.id ? "bg-[#3365C8] text-white" : "bg-[#F7F7F7] text-[#6B7280]"
                )}
              >
                {entry.title}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <Input
              value={correction.section}
              onChange={(event) => onCorrection({ ...correction, section: event.target.value })}
              placeholder="Section"
            />
            <Textarea
              value={correction.current_text}
              onChange={(event) => onCorrection({ ...correction, current_text: event.target.value })}
              placeholder="Texte actuel"
              className="min-h-[100px]"
            />
            <Textarea
              value={correction.proposed_text}
              onChange={(event) => onCorrection({ ...correction, proposed_text: event.target.value })}
              placeholder="Correction proposée"
              className="min-h-[120px]"
            />
            <Textarea
              value={correction.explanation}
              onChange={(event) => onCorrection({ ...correction, explanation: event.target.value })}
              placeholder="Pourquoi ?"
              className="min-h-[100px]"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ReviewStep({
  action,
  selectedCard,
  card,
  fiche,
  correction,
  evaluation,
  aiLoading,
  submitLoading,
  status,
  onAi,
  onSubmit,
}: {
  action: ActionChoice;
  selectedCard: CardSearchResult | null;
  card: CardPayload;
  fiche: FicheDraft;
  correction: CorrectionDraft;
  evaluation?: FicheAiEvaluation | null;
  aiLoading: boolean;
  submitLoading: boolean;
  status?: string | null;
  onAi: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <MiniPreview
        action={action}
        card={card}
        fiche={fiche}
        selectedCard={selectedCard}
        correction={correction}
        evaluation={evaluation}
      />

      <section className="rounded-[28px] bg-white p-4 shadow-[0_14px_34px_rgba(31,36,48,0.08)] ring-1 ring-black/6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3365C8]">Analyse IA</p>
            <p className="mt-1 text-lg font-semibold text-[#1F2430]">
              {evaluation ? `${evaluation.global_score}/100` : "Non lancée"}
            </p>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", scoreTone(evaluation?.global_score))}>
            {evaluation?.moderator_recommendation ?? "à vérifier"}
          </span>
        </div>
        {evaluation ? (
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">{evaluation.summary}</p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Lancez l'analyse avant la soumission.
          </p>
        )}
        <Button className="mt-4 w-full" onClick={onAi} disabled={aiLoading}>
          {aiLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
          Analyse IA
        </Button>
      </section>

      <section className="rounded-[28px] bg-white p-4 shadow-[0_14px_34px_rgba(31,36,48,0.08)] ring-1 ring-black/6">
        {status === "pending_moderation" ? (
          <div className="flex items-center gap-2 rounded-[20px] bg-[#EAF6EF] px-4 py-3 text-sm font-semibold text-[#1F9D66]">
            <Check className="h-4 w-4" />
            Envoyé à la modération
          </div>
        ) : (
          <Button className="w-full" onClick={onSubmit} disabled={submitLoading || !evaluation}>
            {submitLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Soumettre
          </Button>
        )}
      </section>
    </div>
  );
}

export function PwaContributionPage({
  initialAction,
  initialReference,
  initialTargetFicheId,
  initialCorrectionText,
}: ContributionFormProps = {}) {
  const token = useAuthStore((state) => state.token);
  const [step, setStep] = useState<PwaStep>(initialReference ? "compose" : "start");
  const [action, setAction] = useState<ActionChoice>(initialAction ?? "create_card");
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(() =>
    selectedCardFromInitialReference(initialReference)
  );
  const [searched, setSearched] = useState(Boolean(initialReference));
  const [query, setQuery] = useState(initialReference?.title ?? "");
  const [city, setCity] = useState(initialReference?.city ?? "Strasbourg");
  const [card, setCard] = useState<CardPayload>(initialCard);
  const [fiche, setFiche] = useState<FicheDraft>(initialFiche);
  const [correction, setCorrection] = useState<CorrectionDraft>({
    ...initialCorrection,
    current_text: initialCorrectionText ?? "",
  });
  const [targetFicheId, setTargetFicheId] = useState<string | null>(initialTargetFicheId ?? null);
  const [composeTab, setComposeTab] = useState<ComposeTab>("principal");
  const [tagInput, setTagInput] = useState("");
  const [proposal, setProposal] = useState<ContributionProposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(draftStorageKey);
    if (raw || initialReference) return;
    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({ action, card, fiche, correction, step: "start" })
    );
  }, [action, card, correction, fiche, initialReference]);

  useEffect(() => {
    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({ action, card, fiche, correction, selectedCard, targetFicheId, step })
    );
  }, [action, card, correction, fiche, selectedCard, step, targetFicheId]);

  const deferredQuery = useDeferredValue(query);
  const deferredCity = useDeferredValue(city);
  const searchQuery = useQuery({
    queryKey: ["pwa-contribution-search", deferredQuery, deferredCity],
    queryFn: () => searchCards({ q: deferredQuery, city: deferredCity, limit: 10 }),
    enabled: step === "search" && Boolean(deferredQuery.trim() || deferredCity.trim()),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (searchQuery.isFetched) setSearched(true);
  }, [searchQuery.isFetched, searchQuery.dataUpdatedAt]);

  const fichesQuery = useQuery({
    queryKey: ["pwa-contribution-fiches", selectedCard?.source, selectedCard?.id, token],
    queryFn: () => {
      if (!selectedCard) return Promise.resolve([]);
      return selectedCard.source === "card"
        ? getCardFiches(selectedCard.id, token)
        : getEditorialFiches(selectedCard.id, token);
    },
    enabled: Boolean(token && selectedCard && action !== "create_card"),
  });

  const cleanCard = useMemo(() => sanitizeCard(card), [card]);
  const cleanFiche = useMemo(() => sanitizeFiche(fiche), [fiche]);
  const selectedTargetFiche = (fichesQuery.data ?? []).find((entry) => entry.id === targetFicheId) ?? null;
  const currentIndex = pwaSteps.findIndex((entry) => entry.id === step);
  const evaluation = proposal?.ai_review ?? null;

  const ensureProposal = async () => {
    if (!token) throw new Error("Connectez-vous pour contribuer.");
    const payload = buildProposalPayload({
      action,
      selectedCard,
      targetFicheId,
      cleanCard,
      cleanFiche,
      correction,
      selectedTargetFiche,
    });
    const saved = proposal
      ? await updateContributionProposal(proposal.id, payload, token)
      : await createContributionProposal(payload, token);
    setProposal(saved);
    return saved;
  };

  const aiMutation = useMutation({
    mutationFn: async () => {
      const saved = await ensureProposal();
      if (!token) throw new Error("Connectez-vous pour lancer l'analyse IA.");
      return reviewContributionProposalWithAi(saved.id, token);
    },
    onSuccess: (reviewed) => {
      setProposal(reviewed);
      setError(null);
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Connectez-vous pour soumettre.");
      const saved = await ensureProposal();
      if (!saved.ai_review) throw new Error("Lancez l'analyse IA avant la soumission.");
      return submitContributionProposal(saved.id, token);
    },
    onSuccess: (submitted) => {
      setProposal(submitted);
      window.localStorage.removeItem(draftStorageKey);
      setError(null);
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const chooseAction = (value: ActionChoice) => {
    setAction(value);
    setSelectedCard(null);
    setTargetFicheId(null);
    setProposal(null);
    setSearched(false);
    setStep("search");
    setError(null);
  };

  const useCard = (cardResult: CardSearchResult, nextAction?: ActionChoice) => {
    setSelectedCard(cardResult);
    if (nextAction) setAction(nextAction);
    setTargetFicheId(null);
    setProposal(null);
    setSearched(true);
    setStep("compose");
    setError(null);
  };

  const createNew = () => {
    setSelectedCard(null);
    setTargetFicheId(null);
    setAction("create_card");
    setProposal(null);
    setSearched(true);
    setStep("compose");
    setError(null);
  };

  const next = () => {
    const validation = validateCurrentStep({
      step,
      action,
      searched,
      selectedCard,
      card,
      fiche,
      correction,
    });
    if (validation) {
      setError(validation);
      return;
    }
    const nextStep = pwaSteps[currentIndex + 1]?.id;
    if (nextStep) setStep(nextStep);
    setError(null);
  };

  const back = () => {
    const previous = pwaSteps[Math.max(0, currentIndex - 1)]?.id;
    setStep(previous);
    setError(null);
  };

  if (!token) {
    return (
      <main className="min-h-full bg-[#E9E9E9] px-3 py-4">
        <div className="rounded-[28px] bg-white p-5 text-sm leading-6 text-[#6B7280] shadow-[0_14px_34px_rgba(31,36,48,0.08)] ring-1 ring-black/6">
          Connectez-vous pour contribuer.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[#E9E9E9] px-3 pb-4 pt-3">
      <div className="space-y-4">
        <header className="rounded-[30px] bg-white p-4 shadow-[0_14px_34px_rgba(31,36,48,0.08)] ring-1 ring-black/6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3365C8]">
                Contribution
              </p>
              <h1 className="mt-1 text-[1.8rem] font-semibold leading-none text-[#1F2430]">
                Studio mobile
              </h1>
            </div>
            <span className="rounded-full bg-[#F3EEFA] px-3 py-1 text-xs font-semibold text-[#7643A6]">
              {actionLabel(action)}
            </span>
          </div>
          <div className="mt-4">
            <StepDots step={step} />
          </div>
        </header>

        {step !== "start" ? (
          <MiniPreview
            action={action}
            card={cleanCard}
            fiche={cleanFiche}
            selectedCard={selectedCard}
            correction={correction}
            evaluation={evaluation}
          />
        ) : null}

        {error ? (
          <div className="flex items-center gap-2 rounded-[22px] bg-[#FCE8E8] px-4 py-3 text-sm text-[#B64141] ring-1 ring-[#E85C5C]/16">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}

        {step === "start" ? (
          <ActionStep value={action} onSelect={chooseAction} />
        ) : null}

        {step === "search" ? (
          <SearchStep
            action={action}
            query={query}
            city={city}
            results={searchQuery.data ?? []}
            selectedCard={selectedCard}
            loading={searchQuery.isFetching}
            searched={searched}
            onQuery={setQuery}
            onCity={setCity}
            onUseCard={useCard}
            onCreateNew={createNew}
          />
        ) : null}

        {step === "compose" ? (
          <ComposeStep
            action={action}
            card={card}
            fiche={fiche}
            correction={correction}
            selectedCard={selectedCard}
            fiches={fichesQuery.data ?? []}
            targetFicheId={targetFicheId}
            tab={composeTab}
            tagInput={tagInput}
            onCard={(key, value) => setCard((current) => ({ ...current, [key]: value }))}
            onFiche={setFiche}
            onCorrection={setCorrection}
            onTargetFiche={setTargetFicheId}
            onTab={setComposeTab}
            onTags={setTagInput}
          />
        ) : null}

        {step === "review" ? (
          <ReviewStep
            action={action}
            selectedCard={selectedCard}
            card={cleanCard}
            fiche={cleanFiche}
            correction={correction}
            evaluation={evaluation}
            aiLoading={aiMutation.isPending}
            submitLoading={submitMutation.isPending}
            status={proposal?.status}
            onAi={() => aiMutation.mutate()}
            onSubmit={() => submitMutation.mutate()}
          />
        ) : null}
      </div>

      <footer className="sticky bottom-4 z-30 mt-5 rounded-[26px] bg-white/96 p-3 shadow-[0_18px_40px_rgba(31,36,48,0.16)] ring-1 ring-black/6 backdrop-blur">
        <div className="grid grid-cols-[1fr_1.2fr] gap-2">
          <Button variant="secondary" onClick={back} disabled={currentIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          {step === "review" ? (
            <Button onClick={() => aiMutation.mutate()} disabled={aiMutation.isPending}>
              {aiMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              IA
            </Button>
          ) : (
            <Button onClick={next}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    </main>
  );
}
