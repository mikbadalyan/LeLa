"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  FilePenLine,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import {
  createContributionProposal,
  getCardFiches,
  getEditorialFiches,
  getMyContributionProposals,
  getMyRevisionHistory,
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
  ContributionProposalPayload,
  ContributionProposalType,
  FicheAiEvaluation,
  FicheMediaBlock,
  PublishedFiche,
  RevisionHistoryRecord,
} from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

type ActionChoice = "create_card" | "create_fiche" | "correction";
type WizardStep = "action" | "search" | "edit" | "preview" | "ai" | "submit";
type FicheTab = "resume" | "description" | "contexte" | "medias" | "sources" | "relations";

interface FicheDraft {
  title: string;
  sections: {
    resume: string;
    description: string;
    contexte: string;
    pratique: string;
  };
  media_blocks: FicheMediaBlock[];
  sources: Array<{ label: string; url: string }>;
  relations: Array<{ title: string; reason: string }>;
  tags: string[];
  contributor_note: string;
}

interface CorrectionDraft {
  section: string;
  current_text: string;
  proposed_text: string;
  explanation: string;
}

interface ContributionInitialReference {
  id: string;
  source: "card" | "editorial";
  title: string;
  short_description: string;
  city?: string | null;
  image?: string | null;
  category_metadata?: string | null;
}

interface ContributionFormProps {
  initialAction?: ActionChoice;
  initialReference?: ContributionInitialReference | null;
  initialTargetFicheId?: string | null;
  initialCorrectionText?: string | null;
}

const draftStorageKey = "lela.contribution.proposalDraft.v1";

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: "action", label: "Action" },
  { id: "search", label: "Recherche" },
  { id: "edit", label: "Edition" },
  { id: "preview", label: "Apercu" },
  { id: "ai", label: "IA" },
  { id: "submit", label: "Envoi" },
];

const actionChoices: Array<{
  id: ActionChoice;
  title: string;
  description: string;
  proposalType: ContributionProposalType;
}> = [
  {
    id: "create_card",
    title: "Créer une nouvelle carte",
    description: "Pour un sujet qui n'existe pas encore dans LE_LA.",
    proposalType: "create_card",
  },
  {
    id: "create_fiche",
    title: "Compléter / créer une fiche liée",
    description: "Pour ajouter du contenu détaillé à une carte existante.",
    proposalType: "create_fiche",
  },
  {
    id: "correction",
    title: "Proposer une correction",
    description: "Pour corriger une carte ou une fiche publiée, sans modifier directement.",
    proposalType: "correction",
  },
];

const categories: Array<{ value: CardCategoryMetadata; label: string }> = [
  { value: "lieu", label: "Lieu" },
  { value: "personne", label: "Personne" },
  { value: "evenement", label: "Evénement" },
  { value: "objet", label: "Objet" },
  { value: "theme", label: "Thème" },
  { value: "autre", label: "Autre" },
];

const initialCard: CardPayload = {
  title: "",
  short_description: "",
  category_metadata: "lieu",
  city: "Strasbourg",
  location: "",
  main_image: "",
  tags: [],
  relations: [],
  why_exists: "",
  source_reference: "",
};

const initialFiche: FicheDraft = {
  title: "",
  sections: {
    resume: "",
    description: "",
    contexte: "",
    pratique: "",
  },
  media_blocks: [],
  sources: [],
  relations: [],
  tags: [],
  contributor_note: "",
};

const initialCorrection: CorrectionDraft = {
  section: "Résumé",
  current_text: "",
  proposed_text: "",
  explanation: "",
};

function stepIndex(step: WizardStep) {
  return steps.findIndex((entry) => entry.id === step);
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function scoreTone(score?: number) {
  if (score === undefined) return "bg-mist text-graphite ring-borderSoft/10";
  if (score >= 75) return "bg-success/10 text-success ring-success/20";
  if (score >= 50) return "bg-warning/12 text-warning ring-warning/25";
  return "bg-danger/10 text-danger ring-danger/20";
}

function cardReference(card: CardSearchResult | null): Record<string, unknown> | null {
  if (!card) return null;
  return {
    id: card.id,
    title: card.title,
    short_description: card.short_description,
    city: card.city,
    image: card.image,
    status: card.status,
    category_metadata: card.category_metadata,
    tags: card.tags,
    source: card.source,
  };
}

function sanitizeCard(card: CardPayload): CardPayload {
  return {
    ...card,
    title: card.title.trim(),
    short_description: card.short_description.trim(),
    city: card.city?.trim() || null,
    location: card.location?.trim() || null,
    main_image: card.main_image?.trim() || null,
    tags: card.tags.map((tag) => tag.trim()).filter(Boolean),
    why_exists: card.why_exists?.trim() || null,
    source_reference: card.source_reference?.trim() || null,
  };
}

function sanitizeFiche(fiche: FicheDraft): FicheDraft {
  return {
    ...fiche,
    title: fiche.title.trim(),
    sections: {
      resume: fiche.sections.resume.trim(),
      description: fiche.sections.description.trim(),
      contexte: fiche.sections.contexte.trim(),
      pratique: fiche.sections.pratique.trim(),
    },
    media_blocks: fiche.media_blocks.filter((block) => {
      if (block.kind === "text") return Boolean(block.text?.trim());
      return Boolean(block.url?.trim() || block.name?.trim());
    }),
    sources: fiche.sources.filter((source) => source.label.trim() || source.url.trim()),
    relations: fiche.relations.filter((relation) => relation.title.trim()),
    tags: fiche.tags.map((tag) => tag.trim()).filter(Boolean),
    contributor_note: fiche.contributor_note.trim(),
  };
}

function sectionText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function fichePrimaryText(fiche: PublishedFiche) {
  const sections = fiche.sections ?? {};
  return (
    sectionText(sections.resume) ||
    sectionText(sections.description) ||
    sectionText(sections.contexte) ||
    sectionText(sections.pratique) ||
    ""
  );
}

function ficheSnapshot(fiche: PublishedFiche | null | undefined): Record<string, unknown> | null {
  if (!fiche) return null;
  return {
    id: fiche.id,
    card_id: fiche.card_id,
    title: fiche.title,
    sections: fiche.sections,
    media_blocks: fiche.media_blocks,
    sources: fiche.sources,
    relations: fiche.relations,
    tags: fiche.tags,
    status: fiche.status,
  };
}

function validateStep(
  step: WizardStep,
  action: ActionChoice,
  hasSearched: boolean,
  selectedCard: CardSearchResult | null,
  card: CardPayload,
  fiche: FicheDraft,
  correction: CorrectionDraft,
) {
  const cleanCard = sanitizeCard(card);
  const cleanFiche = sanitizeFiche(fiche);
  if (step === "action") return null;
  if (step === "search") {
    if (!hasSearched) return "Recherchez d'abord les cartes existantes pour éviter les doublons.";
    if (action !== "create_card" && !selectedCard) return "Sélectionnez une carte existante.";
  }
  if (step === "edit" && action === "create_card") {
    if (cleanCard.title.length < 2) return "Ajoutez un titre de carte.";
    if (cleanCard.short_description.length < 10) return "Ajoutez une description courte.";
    if (!cleanCard.why_exists || cleanCard.why_exists.length < 10) return "Expliquez pourquoi cette carte doit exister.";
  }
  if (step === "edit" && action === "create_fiche") {
    if (!selectedCard) return "Choisissez la carte liée.";
    if (cleanFiche.title.length < 2) return "Ajoutez un titre de fiche.";
    if (cleanFiche.sections.resume.length < 10) return "Complétez le résumé de la fiche.";
    if (cleanFiche.sections.description.length < 20) return "Ajoutez une description détaillée.";
  }
  if (step === "edit" && action === "correction") {
    if (!selectedCard) return "Choisissez le contenu à corriger.";
    if (correction.proposed_text.trim().length < 5) return "Ajoutez la correction proposée.";
    if (correction.explanation.trim().length < 8) return "Expliquez pourquoi cette modification est utile.";
  }
  return null;
}

function HorizontalContributionStepper({
  step,
  onStep,
}: {
  step: WizardStep;
  onStep: (step: WizardStep) => void;
}) {
  const current = stepIndex(step);
  return (
    <div className="grid grid-cols-6 gap-1.5 rounded-[20px] bg-surface p-1.5 ring-1 ring-borderSoft/10">
      {steps.map((entry, index) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => index <= current && onStep(entry.id)}
          className={cn(
            "h-11 rounded-[16px] px-2 text-[11px] font-semibold transition",
            index === current
              ? "bg-blue text-white shadow-blue"
              : index < current
                ? "bg-blueSoft text-blue"
                : "text-graphite/55"
          )}
          aria-current={index === current ? "step" : undefined}
        >
          <span className="block text-[10px] opacity-80">{index + 1}</span>
          <span className="block truncate">{entry.label}</span>
        </button>
      ))}
    </div>
  );
}

function ContributionActionSelector({
  value,
  onChange,
}: {
  value: ActionChoice;
  onChange: (value: ActionChoice) => void;
}) {
  return (
    <div className="grid h-full gap-3 md:grid-cols-3">
      {actionChoices.map((choice) => {
        const active = value === choice.id;
        return (
          <button
            key={choice.id}
            type="button"
            onClick={() => onChange(choice.id)}
            className={cn(
              "group rounded-[26px] p-4 text-left shadow-soft ring-1 transition",
              active ? "bg-plum text-white ring-plum" : "bg-elevated text-ink ring-borderSoft/10 hover:bg-white"
            )}
          >
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-full", active ? "bg-white/16" : "bg-blueSoft text-blue")}>
              {choice.id === "create_card" ? <Plus className="h-5 w-5" /> : choice.id === "create_fiche" ? <FileText className="h-5 w-5" /> : <FilePenLine className="h-5 w-5" />}
            </div>
            <h3 className="mt-5 text-lg font-semibold leading-tight">{choice.title}</h3>
            <p className={cn("mt-2 text-sm leading-6", active ? "text-white/82" : "text-graphite")}>{choice.description}</p>
          </button>
        );
      })}
    </div>
  );
}

function ExistingCardSearch({
  action,
  selectedCard,
  onSelect,
  onSearched,
}: {
  action: ActionChoice;
  selectedCard: CardSearchResult | null;
  onSelect: (card: CardSearchResult | null) => void;
  onSearched: () => void;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Strasbourg");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const searchMutation = useMutation({
    mutationFn: () => searchCards({ q: query, city, tags, category, limit: 12 }),
    onSuccess: onSearched,
  });

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[280px_1fr]">
      <div className="rounded-[24px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Détection doublons</p>
        <h3 className="mt-2 text-xl font-semibold text-ink">Chercher avant de créer</h3>
        <div className="mt-4 space-y-2.5">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre, nom, mot-clé" />
          <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ville / lieu" />
          <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags séparés par virgules" />
          <select className="h-12 w-full rounded-control border border-borderSoft/12 bg-surface px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Toutes catégories</option>
            {categories.map((entry) => (
              <option key={entry.value} value={entry.value}>{entry.label}</option>
            ))}
          </select>
          <Button fullWidth onClick={() => searchMutation.mutate()} disabled={searchMutation.isPending}>
            {searchMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Rechercher
          </Button>
          {action === "create_card" ? (
            <Button variant="secondary" fullWidth onClick={() => onSelect(null)}>
              Créer une nouvelle carte quand même
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid min-h-0 grid-cols-1 gap-2 overflow-hidden sm:grid-cols-2 xl:grid-cols-3">
        {(searchMutation.data ?? []).map((card) => (
          <button
            key={`${card.source}-${card.id}`}
            type="button"
            onClick={() => onSelect(card)}
            className={cn(
              "overflow-hidden rounded-[22px] bg-elevated text-left shadow-soft ring-1 transition hover:-translate-y-0.5",
              selectedCard?.id === card.id ? "ring-blue" : "ring-borderSoft/10"
            )}
          >
            <div className="h-24 bg-[linear-gradient(135deg,#202431,#7643A6)]">
              {card.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-blueSoft px-2 py-1 text-[10px] font-semibold uppercase text-blue">{card.source === "card" ? "Carte" : "Legacy"}</span>
                <span className="text-[10px] font-semibold text-graphite/65">{card.status}</span>
              </div>
              <p className="mt-2 line-clamp-1 text-sm font-semibold text-ink">{card.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-graphite">{card.short_description}</p>
              <p className="mt-2 text-xs font-semibold text-plum">{card.city || "LE_LA"}</p>
            </div>
          </button>
        ))}
        {searchMutation.isSuccess && !(searchMutation.data ?? []).length ? (
          <div className="col-span-full flex h-full min-h-[260px] items-center justify-center rounded-[24px] bg-elevated p-6 text-center text-sm leading-6 text-graphite ring-1 ring-borderSoft/10">
            Aucune carte trouvée. Vous pouvez créer une nouvelle carte, mais l'IA revérifiera le risque de doublon.
          </div>
        ) : null}
        {!searchMutation.isSuccess ? (
          <div className="col-span-full flex h-full min-h-[260px] items-center justify-center rounded-[24px] bg-elevated p-6 text-center text-sm leading-6 text-graphite ring-1 ring-borderSoft/10">
            Lancez une recherche par titre, ville ou tags pour trouver les cartes proches.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CardEditor({
  card,
  onChange,
  tagInput,
  setTagInput,
}: {
  card: CardPayload;
  onChange: <K extends keyof CardPayload>(key: K, value: CardPayload[K]) => void;
  tagInput: string;
  setTagInput: (value: string) => void;
}) {
  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-2">
      <div className="space-y-3 rounded-[24px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10">
        <Input value={card.title} onChange={(event) => onChange("title", event.target.value)} placeholder="Titre de la carte" />
        <Textarea value={card.short_description} onChange={(event) => onChange("short_description", event.target.value)} placeholder="Description courte visible publiquement" className="min-h-24" />
        <select className="h-12 w-full rounded-control border border-borderSoft/12 bg-surface px-3 text-sm" value={card.category_metadata} onChange={(event) => onChange("category_metadata", event.target.value as CardCategoryMetadata)}>
          {categories.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <Input value={card.city ?? ""} onChange={(event) => onChange("city", event.target.value)} placeholder="Ville" />
          <Input value={card.location ?? ""} onChange={(event) => onChange("location", event.target.value)} placeholder="Lieu / repère" />
        </div>
      </div>
      <div className="space-y-3 rounded-[24px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10">
        <Input value={card.main_image ?? ""} onChange={(event) => onChange("main_image", event.target.value)} placeholder="Image principale (URL)" />
        <Input value={tagInput} onChange={(event) => { setTagInput(event.target.value); onChange("tags", splitTags(event.target.value)); }} placeholder="Tags: patrimoine, Europe, tech" />
        <Textarea value={card.why_exists ?? ""} onChange={(event) => onChange("why_exists", event.target.value)} placeholder="Pourquoi cette carte doit exister ?" className="min-h-24" />
        <Textarea value={card.source_reference ?? ""} onChange={(event) => onChange("source_reference", event.target.value)} placeholder="Source ou référence optionnelle" className="min-h-20" />
      </div>
    </div>
  );
}

function FicheEditor({
  fiche,
  onChange,
  activeTab,
  setActiveTab,
  tagInput,
  setTagInput,
}: {
  fiche: FicheDraft;
  onChange: (value: FicheDraft) => void;
  activeTab: FicheTab;
  setActiveTab: (tab: FicheTab) => void;
  tagInput: string;
  setTagInput: (value: string) => void;
}) {
  const updateSection = (key: keyof FicheDraft["sections"], value: string) => {
    onChange({ ...fiche, sections: { ...fiche.sections, [key]: value } });
  };
  const addMedia = (kind: FicheMediaBlock["kind"]) => {
    onChange({ ...fiche, media_blocks: [...fiche.media_blocks, { kind, url: "", name: "", text: "", caption: "" }] });
  };
  const updateMedia = (index: number, patch: Partial<FicheMediaBlock>) => {
    onChange({
      ...fiche,
      media_blocks: fiche.media_blocks.map((block, blockIndex) => blockIndex === index ? { ...block, ...patch } : block),
    });
  };
  const tabs: Array<{ id: FicheTab; label: string }> = [
    { id: "resume", label: "Résumé" },
    { id: "description", label: "Description" },
    { id: "contexte", label: "Contexte" },
    { id: "medias", label: "Médias" },
    { id: "sources", label: "Sources" },
    { id: "relations", label: "Relations" },
  ];

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[180px_1fr]">
      <div className="rounded-[24px] bg-elevated p-3 shadow-soft ring-1 ring-borderSoft/10">
        <Input value={fiche.title} onChange={(event) => onChange({ ...fiche, title: event.target.value })} placeholder="Titre fiche" />
        <div className="mt-3 grid gap-1.5">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={cn("rounded-[14px] px-3 py-2 text-left text-xs font-semibold transition", activeTab === tab.id ? "bg-blue text-white" : "bg-surface text-graphite")}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 rounded-[24px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10">
        {activeTab === "resume" ? <Textarea value={fiche.sections.resume} onChange={(event) => updateSection("resume", event.target.value)} placeholder="Intro / résumé" className="h-56" /> : null}
        {activeTab === "description" ? <Textarea value={fiche.sections.description} onChange={(event) => updateSection("description", event.target.value)} placeholder="Description détaillée" className="h-56" /> : null}
        {activeTab === "contexte" ? (
          <div className="space-y-3">
            <Textarea value={fiche.sections.contexte} onChange={(event) => updateSection("contexte", event.target.value)} placeholder="Information historique, culturelle, contextuelle" className="h-32" />
            <Textarea value={fiche.sections.pratique} onChange={(event) => updateSection("pratique", event.target.value)} placeholder="Informations pratiques si utile" className="h-24" />
          </div>
        ) : null}
        {activeTab === "medias" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {(["image", "video", "audio", "text"] as const).map((kind) => <Button key={kind} variant="secondary" className="min-h-10 px-2 text-xs" onClick={() => addMedia(kind)}>{kind}</Button>)}
            </div>
            <div className="grid max-h-52 gap-2 overflow-hidden sm:grid-cols-2">
              {fiche.media_blocks.map((block, index) => (
                <div key={`${block.kind}-${index}`} className="rounded-[16px] bg-surface p-2 ring-1 ring-borderSoft/10">
                  <p className="mb-1 text-[10px] font-semibold uppercase text-blue">{block.kind}</p>
                  {block.kind === "text" ? (
                    <Textarea value={block.text ?? ""} onChange={(event) => updateMedia(index, { text: event.target.value })} placeholder="Texte" className="h-20" />
                  ) : (
                    <Input value={block.url ?? ""} onChange={(event) => updateMedia(index, { url: event.target.value })} placeholder="URL média" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {activeTab === "sources" ? (
          <div className="space-y-3">
            <Textarea value={fiche.contributor_note} onChange={(event) => onChange({ ...fiche, contributor_note: event.target.value })} placeholder="Note contributeur: ce qui est ajouté ou changé" className="h-24" />
            <Input value={tagInput} onChange={(event) => { setTagInput(event.target.value); onChange({ ...fiche, tags: splitTags(event.target.value) }); }} placeholder="Tags de la fiche" />
            <Input value={fiche.sources[0]?.url ?? ""} onChange={(event) => onChange({ ...fiche, sources: [{ label: "Source principale", url: event.target.value }] })} placeholder="Source principale / URL" />
          </div>
        ) : null}
        {activeTab === "relations" ? (
          <div className="space-y-3">
            <Input value={fiche.relations[0]?.title ?? ""} onChange={(event) => onChange({ ...fiche, relations: [{ title: event.target.value, reason: fiche.relations[0]?.reason ?? "" }] })} placeholder="Carte liée suggérée" />
            <Textarea value={fiche.relations[0]?.reason ?? ""} onChange={(event) => onChange({ ...fiche, relations: [{ title: fiche.relations[0]?.title ?? "", reason: event.target.value }] })} placeholder="Pourquoi cette relation ?" className="h-28" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CorrectionEditor({
  correction,
  onChange,
  selectedCard,
  publishedFiches,
  targetFicheId,
  onTargetFicheId,
}: {
  correction: CorrectionDraft;
  onChange: (value: CorrectionDraft) => void;
  selectedCard: CardSearchResult | null;
  publishedFiches: PublishedFiche[];
  targetFicheId: string | null;
  onTargetFicheId: (value: string | null) => void;
}) {
  const selectedFiche = publishedFiches.find((fiche) => fiche.id === targetFicheId) ?? null;
  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-2">
      <div className="rounded-[24px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Contenu publié</p>
        <h3 className="mt-2 text-xl font-semibold text-ink">{selectedCard?.title ?? "Carte sélectionnée"}</h3>
        <p className="mt-2 text-sm leading-6 text-graphite">{selectedCard?.short_description ?? "Sélectionnez d'abord une carte."}</p>
        <div className="mt-4 rounded-[18px] bg-surface p-3 ring-1 ring-borderSoft/10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-plum">Cible de correction</p>
          <div className="mt-2 grid gap-2">
            <button
              type="button"
              onClick={() => onTargetFicheId(null)}
              className={cn(
                "rounded-[14px] px-3 py-2 text-left text-xs font-semibold transition",
                !targetFicheId ? "bg-blue text-white" : "bg-elevated text-ink"
              )}
            >
              Carte principale
            </button>
            {publishedFiches.map((fiche) => (
              <button
                key={fiche.id}
                type="button"
                onClick={() => {
                  onTargetFicheId(fiche.id);
                  onChange({
                    ...correction,
                    section: correction.section || "Résumé",
                    current_text: correction.current_text || fichePrimaryText(fiche),
                  });
                }}
                className={cn(
                  "rounded-[14px] px-3 py-2 text-left text-xs font-semibold transition",
                  targetFicheId === fiche.id ? "bg-blue text-white" : "bg-elevated text-ink"
                )}
              >
                {fiche.title}
              </button>
            ))}
          </div>
          {selectedFiche ? (
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-graphite">{fichePrimaryText(selectedFiche)}</p>
          ) : null}
        </div>
        <Input value={correction.section} onChange={(event) => onChange({ ...correction, section: event.target.value })} placeholder="Section concernée" className="mt-4" />
        <Textarea value={correction.current_text} onChange={(event) => onChange({ ...correction, current_text: event.target.value })} placeholder="Texte actuel si vous voulez le copier ici" className="mt-3 h-28" />
      </div>
      <div className="rounded-[24px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">Correction proposée</p>
        <Textarea value={correction.proposed_text} onChange={(event) => onChange({ ...correction, proposed_text: event.target.value })} placeholder="Votre correction, section par section" className="mt-3 h-36" />
        <Textarea value={correction.explanation} onChange={(event) => onChange({ ...correction, explanation: event.target.value })} placeholder="Pourquoi proposez-vous cette modification ?" className="mt-3 h-28" />
      </div>
    </div>
  );
}

function BeforeAfterDiff({ correction }: { correction: CorrectionDraft }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <div className="rounded-[18px] bg-danger/8 p-3 text-sm ring-1 ring-danger/15">
        <p className="font-semibold text-danger">Avant</p>
        <p className="mt-2 line-clamp-5 text-graphite">{correction.current_text || "Texte actuel non renseigné."}</p>
      </div>
      <div className="rounded-[18px] bg-success/8 p-3 text-sm ring-1 ring-success/15">
        <p className="font-semibold text-success">Après</p>
        <p className="mt-2 line-clamp-5 text-graphite">{correction.proposed_text || "Correction proposée."}</p>
      </div>
    </div>
  );
}

function ContributionPreview({
  action,
  selectedCard,
  card,
  fiche,
  correction,
}: {
  action: ActionChoice;
  selectedCard: CardSearchResult | null;
  card: CardPayload;
  fiche: FicheDraft;
  correction: CorrectionDraft;
}) {
  const previewCard = action === "create_card" ? card : null;
  const title = previewCard?.title || selectedCard?.title || "Carte LE_LA";
  const description = previewCard?.short_description || selectedCard?.short_description || fiche.sections.resume || "Aperçu public";
  const image = previewCard?.main_image || selectedCard?.image || "";
  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[300px_1fr]">
      <article className="overflow-hidden rounded-[26px] bg-elevated shadow-card ring-1 ring-borderSoft/10">
        <div className="relative h-72 bg-[linear-gradient(145deg,#202431,#7643A6)]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={title} className="h-full w-full object-cover" />
          ) : <ImageIcon className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/55" />}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 to-transparent p-4 text-white">
            <span className="rounded-full bg-blue px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">{previewCard?.category_metadata || selectedCard?.category_metadata || "fiche"}</span>
            <h3 className="mt-3 text-2xl font-semibold leading-tight">{title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-white/82">{description}</p>
          </div>
        </div>
      </article>
      <div className="rounded-[26px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Rendu public</p>
        {action === "correction" ? (
          <div className="mt-4">
            <BeforeAfterDiff correction={correction} />
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-sm leading-6 text-graphite">
            <h3 className="text-xl font-semibold text-ink">{fiche.title || card.title || "Titre"}</h3>
            <p>{fiche.sections.resume || card.why_exists || "Résumé de la proposition."}</p>
            <p>{fiche.sections.description || card.source_reference || "Description détaillée ou source à vérifier."}</p>
            <div className="flex flex-wrap gap-2">
              {(fiche.tags.length ? fiche.tags : card.tags).map((tag) => (
                <span key={tag} className="rounded-full bg-blueSoft px-3 py-1 text-xs font-semibold text-blue">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AIReviewPanel({ evaluation, loading }: { evaluation?: FicheAiEvaluation | null; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center rounded-[26px] bg-blueSoft p-6 text-center text-blue ring-1 ring-blue/15">
        <div>
          <LoaderCircle className="mx-auto h-7 w-7 animate-spin" />
          <p className="mt-3 text-sm font-semibold">Analyse du contenu en cours...</p>
        </div>
      </div>
    );
  }
  if (!evaluation) {
    return (
      <div className="rounded-[26px] bg-blueSoft p-5 text-sm leading-6 text-blue ring-1 ring-blue/15">
        L'IA locale Mistral/Ollama va vérifier les doublons, la clarté, les sources, la qualité éditoriale et les risques. Elle ne publie jamais automatiquement.
      </div>
    );
  }
  const metrics = [
    ["Global", evaluation.global_score],
    ["Doublon", evaluation.duplicate_risk_score],
    ["Sources", evaluation.source_quality_score],
    ["Risque", evaluation.risk_score],
  ] as const;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(([label, score]) => (
          <div key={label} className={cn("rounded-[18px] p-3 ring-1", scoreTone(score))}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{score}</p>
          </div>
        ))}
      </div>
      <div className="rounded-[22px] bg-elevated p-4 ring-1 ring-borderSoft/10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">Recommandation: {evaluation.moderator_recommendation}</p>
        <p className="mt-2 text-sm leading-6 text-graphite">{evaluation.summary}</p>
      </div>
      {[
        ["A verifier", evaluation.weaknesses],
        ["Doublons possibles", evaluation.duplicate_warnings],
        ["Informations manquantes", evaluation.missing_information],
      ].map(([label, values]) => (
        <div key={label as string} className="rounded-[22px] bg-surface p-4 text-sm ring-1 ring-borderSoft/10">
          <p className="font-semibold text-ink">{label as string}</p>
          {(values as string[]).length ? (
            <ul className="mt-2 space-y-1 text-graphite">
              {(values as string[]).map((value) => <li key={value}>- {value}</li>)}
            </ul>
          ) : <p className="mt-2 text-graphite/65">Aucun signalement.</p>}
        </div>
      ))}
    </div>
  );
}

function proposalTitle(proposal: ContributionProposal) {
  const card = proposal.proposed_data.card as { title?: string } | undefined;
  const fiche = proposal.proposed_data.fiche as { title?: string } | undefined;
  const reference = proposal.proposed_data.card_reference as { title?: string } | undefined;
  const correction = proposal.proposed_data.correction as { section?: string } | undefined;
  return card?.title ?? fiche?.title ?? reference?.title ?? correction?.section ?? "Proposition";
}

function ContributorDashboard({
  token,
  onResume,
}: {
  token: string | null;
  onResume: (proposal: ContributionProposal) => void;
}) {
  const query = useQuery({
    queryKey: ["my-contribution-proposals", Boolean(token)],
    queryFn: () => getMyContributionProposals(token!),
    enabled: Boolean(token),
  });
  const revisionQuery = useQuery({
    queryKey: ["my-revision-history", Boolean(token)],
    queryFn: () => getMyRevisionHistory(token!),
    enabled: Boolean(token),
  });
  const proposals = query.data ?? [];
  const revisions: RevisionHistoryRecord[] = revisionQuery.data ?? [];
  const counts = {
    draft: proposals.filter((proposal) => proposal.status === "draft").length,
    pending: proposals.filter((proposal) => proposal.status === "pending_moderation").length,
    approved: proposals.filter((proposal) => proposal.status === "approved").length,
    rejected: proposals.filter((proposal) => proposal.status === "rejected").length,
    needs: proposals.filter((proposal) => proposal.status === "needs_changes").length,
  };
  return (
    <div className="rounded-[24px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">Mes contributions</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {[
          ["Brouillons", counts.draft],
          ["Soumises", counts.pending],
          ["Publiées", counts.approved],
          ["A corriger", counts.needs],
          ["Rejetées", counts.rejected],
          ["Révisions", revisions.length],
        ].map(([label, count]) => (
          <div key={label as string} className="rounded-[16px] bg-surface p-2 ring-1 ring-borderSoft/10">
            <p className="font-semibold text-ink">{count}</p>
            <p className="text-graphite">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
        {proposals.map((proposal) => (
          <button
            key={proposal.id}
            type="button"
            onClick={() => onResume(proposal)}
            className="block w-full rounded-[16px] bg-surface p-2 text-left text-xs ring-1 ring-borderSoft/10 transition hover:bg-mist"
          >
            <p className="line-clamp-1 font-semibold text-ink">{proposalTitle(proposal)}</p>
            <p className="text-graphite">{proposal.contribution_type} · {proposal.status}</p>
            {proposal.moderator_notes ? (
              <p className="mt-1 line-clamp-2 text-danger">{proposal.moderator_notes}</p>
            ) : null}
          </button>
        ))}
        {!proposals.length ? <p className="text-xs leading-5 text-graphite">Aucune proposition pour le moment.</p> : null}
      </div>
      {revisions.length ? (
        <div className="mt-3 rounded-[16px] bg-blueSoft p-3 text-xs text-blue ring-1 ring-blue/15">
          Dernière révision: v{revisions[0].version_number} · {revisions[0].entity_type}
        </div>
      ) : null}
    </div>
  );
}

export function ContributionForm({
  initialAction,
  initialReference,
  initialTargetFicheId,
  initialCorrectionText,
}: ContributionFormProps = {}) {
  const token = useAuthStore((state) => state.token);
  const [step, setStep] = useState<WizardStep>(initialReference ? "edit" : "action");
  const [action, setAction] = useState<ActionChoice>(initialAction ?? "create_card");
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(
    initialReference
      ? {
          id: initialReference.id,
          title: initialReference.title,
          short_description: initialReference.short_description,
          city: initialReference.city,
          image: initialReference.image,
          status: "published",
          category_metadata: initialReference.category_metadata,
          tags: [],
          source: initialReference.source,
        }
      : null
  );
  const [hasSearched, setHasSearched] = useState(Boolean(initialReference));
  const [card, setCard] = useState<CardPayload>(initialCard);
  const [fiche, setFiche] = useState<FicheDraft>(initialFiche);
  const [correction, setCorrection] = useState<CorrectionDraft>({
    ...initialCorrection,
    current_text: initialCorrectionText ?? "",
  });
  const [targetFicheId, setTargetFicheId] = useState<string | null>(initialTargetFicheId ?? null);
  const [activeFicheTab, setActiveFicheTab] = useState<FicheTab>("resume");
  const [cardTagInput, setCardTagInput] = useState("");
  const [ficheTagInput, setFicheTagInput] = useState("");
  const [proposal, setProposal] = useState<ContributionProposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialReference) return;
    const raw = window.localStorage.getItem(draftStorageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        action?: ActionChoice;
        card?: CardPayload;
        fiche?: FicheDraft;
        correction?: CorrectionDraft;
      };
      if (parsed.action) setAction(parsed.action);
      if (parsed.card) setCard({ ...initialCard, ...parsed.card });
      if (parsed.fiche) setFiche({ ...initialFiche, ...parsed.fiche });
      if (parsed.correction) setCorrection({ ...initialCorrection, ...parsed.correction });
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(draftStorageKey, JSON.stringify({ action, card, fiche, correction }));
  }, [action, card, fiche, correction]);

  const currentStepIndex = stepIndex(step);
  const selectedAction = actionChoices.find((choice) => choice.id === action)!;
  const cleanCard = useMemo(() => sanitizeCard(card), [card]);
  const cleanFiche = useMemo(() => sanitizeFiche(fiche), [fiche]);
  const evaluation = proposal?.ai_review;
  const availableFichesQuery = useQuery({
    queryKey: ["contribution-target-fiches", selectedCard?.source, selectedCard?.id],
    queryFn: () => {
      if (!selectedCard) return Promise.resolve([]);
      return selectedCard.source === "card"
        ? getCardFiches(selectedCard.id, token)
        : getEditorialFiches(selectedCard.id, token);
    },
    enabled: Boolean(selectedCard && action !== "create_card"),
  });
  const availableFiches = availableFichesQuery.data ?? [];
  const selectedTargetFiche = availableFiches.find((entry) => entry.id === targetFicheId) ?? null;

  const buildPayload = (): ContributionProposalPayload => {
    const reference = cardReference(selectedCard);
    const targetCardId = selectedCard?.source === "card" ? selectedCard.id : null;
    if (action === "create_card") {
      return {
        contribution_type: "create_card",
        target_card_id: null,
        proposed_data: { card: cleanCard },
        explanation: cleanCard.why_exists,
      };
    }
    if (action === "create_fiche") {
      return {
        contribution_type: "create_fiche",
        target_card_id: targetCardId,
        proposed_data: {
          card_reference: reference,
          linked_editorial_id: selectedCard?.source === "editorial" ? selectedCard.id : null,
          fiche: cleanFiche,
        },
        explanation: cleanFiche.contributor_note,
      };
    }
    return {
      contribution_type: "correction",
      target_card_id: targetCardId,
      target_fiche_id: targetFicheId,
      proposed_data: {
        card_reference: reference,
        linked_editorial_id: selectedCard?.source === "editorial" ? selectedCard.id : null,
        correction,
      },
      previous_data_snapshot: ficheSnapshot(selectedTargetFiche) ?? reference ?? undefined,
      explanation: correction.explanation,
    };
  };

  const ensureProposal = async () => {
    if (!token) throw new Error("Connectez-vous pour contribuer.");
    const payload = buildPayload();
    const saved = proposal
      ? await updateContributionProposal(proposal.id, payload, token)
      : await createContributionProposal(payload, token);
    setProposal(saved);
    setError(null);
    return saved;
  };

  const saveMutation = useMutation({
    mutationFn: ensureProposal,
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const aiMutation = useMutation({
    mutationFn: async () => {
      const saved = await ensureProposal();
      if (!token) throw new Error("Connectez-vous pour lancer l'analyse IA.");
      return reviewContributionProposalWithAi(saved.id, token);
    },
    onSuccess: (reviewed) => {
      setProposal(reviewed);
      setStep("submit");
      setError(null);
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Connectez-vous pour soumettre.");
      if (!proposal?.ai_review) throw new Error("Lancez l'analyse IA avant la soumission.");
      return submitContributionProposal(proposal.id, token);
    },
    onSuccess: (submitted) => {
      setProposal(submitted);
      window.localStorage.removeItem(draftStorageKey);
      setError(null);
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const resumeProposal = (storedProposal: ContributionProposal) => {
    setProposal(storedProposal);
    const nextAction: ActionChoice =
      storedProposal.contribution_type === "create_fiche" ||
      storedProposal.contribution_type === "update_fiche"
        ? "create_fiche"
        : storedProposal.contribution_type === "correction"
          ? "correction"
          : "create_card";
    setAction(nextAction);
    const storedCard = storedProposal.proposed_data.card as Partial<CardPayload> | undefined;
    const storedFiche = storedProposal.proposed_data.fiche as Partial<FicheDraft> | undefined;
    const storedCorrection = storedProposal.proposed_data.correction as Partial<CorrectionDraft> | undefined;
    const reference = storedProposal.proposed_data.card_reference as Partial<CardSearchResult> | undefined;

    if (storedCard) {
      setCard({ ...initialCard, ...storedCard, tags: storedCard.tags ?? [] });
      setCardTagInput((storedCard.tags ?? []).join(", "));
    }
    if (storedFiche) {
      const mergedFiche = {
        ...initialFiche,
        ...storedFiche,
        sections: { ...initialFiche.sections, ...(storedFiche.sections ?? {}) },
        media_blocks: storedFiche.media_blocks ?? [],
        sources: storedFiche.sources ?? [],
        relations: storedFiche.relations ?? [],
        tags: storedFiche.tags ?? [],
      };
      setFiche(mergedFiche);
      setFicheTagInput(mergedFiche.tags.join(", "));
    }
    if (storedCorrection) {
      setCorrection({ ...initialCorrection, ...storedCorrection });
    }
    if (storedProposal.target_card) {
      setSelectedCard({
        id: storedProposal.target_card.id,
        title: storedProposal.target_card.title,
        short_description: storedProposal.target_card.short_description,
        city: storedProposal.target_card.city,
        image: storedProposal.target_card.main_image,
        status: storedProposal.target_card.status,
        category_metadata: storedProposal.target_card.category_metadata,
        tags: storedProposal.target_card.tags,
        source: "card",
      });
      setHasSearched(true);
    } else if (reference?.id && reference.title) {
      setSelectedCard({
        id: String(reference.id),
        title: String(reference.title),
        short_description: String(reference.short_description ?? ""),
        city: typeof reference.city === "string" ? reference.city : null,
        image: typeof reference.image === "string" ? reference.image : null,
        status: String(reference.status ?? "published"),
        category_metadata: typeof reference.category_metadata === "string" ? reference.category_metadata : null,
        tags: Array.isArray(reference.tags) ? reference.tags : [],
        source: reference.source === "card" ? "card" : "editorial",
      });
      setHasSearched(true);
    }
    setTargetFicheId(storedProposal.target_fiche_id ?? null);
    setStep("edit");
    setError(null);
  };

  const goNext = () => {
    const validation = validateStep(step, action, hasSearched, selectedCard, card, fiche, correction);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    const next = steps[currentStepIndex + 1]?.id;
    if (next) setStep(next);
  };

  if (!token) {
    return (
      <div className="rounded-[28px] bg-elevated p-5 text-sm leading-6 text-graphite shadow-soft ring-1 ring-borderSoft/10">
        Connectez-vous pour proposer une carte, une fiche ou une correction.
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-10.5rem)] min-h-[620px] overflow-hidden rounded-[34px] bg-background text-ink">
      <div className="grid h-full gap-3 lg:grid-cols-[220px_1fr_280px]">
        <aside className="hidden min-h-0 rounded-[28px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Contribution</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Carte ou fiche</h2>
          <p className="mt-2 text-sm leading-6 text-graphite">Flux collaboratif, type Wikipédia, avec modération humaine et pré-check IA local.</p>
          <div className="mt-5 rounded-[22px] bg-blueSoft p-3 text-sm text-blue ring-1 ring-blue/15">
            <p className="font-semibold">{selectedAction.title}</p>
            <p className="mt-1 leading-5">{selectedAction.description}</p>
          </div>
          <div className="mt-5">
            <ContributorDashboard token={token} onResume={resumeProposal} />
          </div>
        </aside>

        <main className="flex min-h-0 flex-col rounded-[28px] bg-white/72 p-3 shadow-card ring-1 ring-borderSoft/10 backdrop-blur-md">
          <HorizontalContributionStepper step={step} onStep={setStep} />
          {error ? (
            <div className="mt-2 flex items-center gap-2 rounded-[18px] bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-danger/15">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <section className="mt-3 min-h-0 flex-1 overflow-hidden">
            {step === "action" ? <ContributionActionSelector value={action} onChange={(value) => { setAction(value); setSelectedCard(null); setHasSearched(false); }} /> : null}
            {step === "search" ? <ExistingCardSearch action={action} selectedCard={selectedCard} onSelect={setSelectedCard} onSearched={() => setHasSearched(true)} /> : null}
            {step === "edit" && action === "create_card" ? <CardEditor card={card} onChange={(key, value) => setCard((current) => ({ ...current, [key]: value }))} tagInput={cardTagInput} setTagInput={setCardTagInput} /> : null}
            {step === "edit" && action === "create_fiche" ? <FicheEditor fiche={fiche} onChange={setFiche} activeTab={activeFicheTab} setActiveTab={setActiveFicheTab} tagInput={ficheTagInput} setTagInput={setFicheTagInput} /> : null}
            {step === "edit" && action === "correction" ? (
              <CorrectionEditor
                correction={correction}
                onChange={setCorrection}
                selectedCard={selectedCard}
                publishedFiches={availableFiches}
                targetFicheId={targetFicheId}
                onTargetFicheId={setTargetFicheId}
              />
            ) : null}
            {step === "preview" ? <ContributionPreview action={action} selectedCard={selectedCard} card={cleanCard} fiche={cleanFiche} correction={correction} /> : null}
            {step === "ai" ? (
              <div className="grid h-full gap-3 lg:grid-cols-[1fr_280px]">
                <ContributionPreview action={action} selectedCard={selectedCard} card={cleanCard} fiche={cleanFiche} correction={correction} />
                <div className="space-y-3">
                  <AIReviewPanel evaluation={evaluation} loading={aiMutation.isPending} />
                  <Button fullWidth onClick={() => aiMutation.mutate()} disabled={aiMutation.isPending}>
                    {aiMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Analyse IA
                  </Button>
                </div>
              </div>
            ) : null}
            {step === "submit" ? (
              <div className="grid h-full gap-3 lg:grid-cols-[1fr_300px]">
                <ContributionPreview action={action} selectedCard={selectedCard} card={cleanCard} fiche={cleanFiche} correction={correction} />
                <div className="space-y-3 rounded-[26px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10">
                  <AIReviewPanel evaluation={evaluation} />
                  {proposal?.status === "pending_moderation" ? (
                    <div className="rounded-[20px] bg-success/10 p-4 text-sm font-semibold text-success ring-1 ring-success/20">
                      Proposition envoyée. Elle attend une décision de modération.
                    </div>
                  ) : (
                    <Button fullWidth onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !evaluation}>
                      {submitMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Soumettre à la modération
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </section>

          <footer className="mt-3 flex shrink-0 items-center justify-between gap-2">
            <Button variant="secondary" disabled={currentStepIndex === 0} onClick={() => setStep(steps[Math.max(0, currentStepIndex - 1)].id)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Brouillon
              </Button>
              {step !== "ai" && step !== "submit" ? (
                <Button onClick={goNext}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </footer>
        </main>

        <aside className="hidden min-h-0 space-y-3 overflow-hidden lg:block">
          <div className="rounded-[28px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Aperçu vivant</p>
            <div className="mt-3 overflow-hidden rounded-[22px] bg-[linear-gradient(145deg,#202431,#7643A6)]">
              <div className="relative h-56">
                {(cleanCard.main_image || selectedCard?.image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cleanCard.main_image || selectedCard?.image || ""} alt={cleanCard.title || selectedCard?.title || "LE_LA"} className="h-full w-full object-cover" />
                ) : <Sparkles className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/50" />}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                  <p className="line-clamp-2 text-lg font-semibold">{cleanCard.title || selectedCard?.title || fiche.title || "Nouvelle proposition"}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-white/78">{cleanCard.short_description || selectedCard?.short_description || fiche.sections.resume || "Carte / fiche en préparation"}</p>
                </div>
              </div>
            </div>
          </div>
          <AIReviewPanel evaluation={evaluation} loading={aiMutation.isPending} />
        </aside>
      </div>
    </div>
  );
}
