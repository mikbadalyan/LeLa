"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  PanelTop,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store";
import {
  createContributionProposal,
  getCardFiches,
  getEditorialFiches,
  getMyContributionProposals,
  reviewContributionProposalWithAi,
  searchCards,
  submitContributionProposal,
  updateContributionProposal,
} from "@/lib/api/endpoints";
import type { CardPayload, CardSearchResult, ContributionProposal } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

import { ActionSelector } from "./components/action-selector";
import { AIReviewPanel } from "./components/ai-review-panel";
import { CardEditorTabs } from "./components/card-editor-tabs";
import { CardSearchPanel } from "./components/card-search-panel";
import { ContributionSummary } from "./components/contribution-summary";
import { ContributionStepper } from "./components/contribution-stepper";
import { CorrectionEditor } from "./components/correction-editor";
import { FicheEditorTabs } from "./components/fiche-editor-tabs";
import { LivePreviewPanel } from "./components/live-preview-panel";
import {
  buildProposalPayload,
  draftStorageKey,
  initialCard,
  initialCorrection,
  initialFiche,
  proposalTitle,
  sanitizeCard,
  sanitizeFiche,
  stepIndex,
  stepMeta,
  steps,
  validateStep,
} from "./studio";
import type {
  ActionChoice,
  CardEditorTab,
  ContributionFormProps,
  ContributionStudioSnapshot,
  FicheTab,
  WizardStep,
} from "./studio";

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

function DraftQueue({
  proposals,
  loading,
  onResume,
}: {
  proposals: ContributionProposal[];
  loading: boolean;
  onResume: (proposal: ContributionProposal) => void;
}) {
  const resumable = useMemo(
    () =>
      proposals.filter((proposal) =>
        ["draft", "needs_changes", "pending_moderation"].includes(proposal.status)
      ),
    [proposals]
  );

  return (
    <div className="mt-4 rounded-[24px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">Reprendre</p>
          <p className="mt-1 text-sm font-semibold text-[#1F2430]">Brouillons & retours</p>
        </div>
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-[#3365C8]" /> : null}
      </div>
      <div className="mt-3 space-y-2">
        {resumable.slice(0, 4).map((proposal) => (
          <button
            key={proposal.id}
            type="button"
            onClick={() => onResume(proposal)}
            className="w-full rounded-[18px] bg-white px-4 py-3 text-left ring-1 ring-black/6 transition hover:bg-[#FBFBFB]"
          >
            <p className="line-clamp-1 text-sm font-semibold text-[#1F2430]">{proposalTitle(proposal)}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{proposal.status}</p>
          </button>
        ))}
        {!loading && !resumable.length ? (
          <div className="rounded-[18px] bg-white px-4 py-4 text-sm text-[#6B7280] ring-1 ring-black/6">
            Aucun brouillon serveur.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MobileResumeStrip({
  proposals,
  loading,
  onResume,
}: {
  proposals: ContributionProposal[];
  loading: boolean;
  onResume: (proposal: ContributionProposal) => void;
}) {
  const resumable = proposals.filter((proposal) =>
    ["draft", "needs_changes", "pending_moderation"].includes(proposal.status)
  );

  return (
    <div className="mt-3 rounded-[24px] bg-white p-3 shadow-[0_18px_40px_rgba(30,34,40,0.06)] ring-1 ring-black/6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[#3365C8]" />
          <p className="text-sm font-semibold text-[#1F2430]">Reprendre</p>
        </div>
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-[#3365C8]" /> : null}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {resumable.slice(0, 4).map((proposal) => (
          <button
            key={proposal.id}
            type="button"
            onClick={() => onResume(proposal)}
            className="min-w-[180px] rounded-[18px] bg-[#F7F7F7] px-3 py-3 text-left ring-1 ring-black/6 transition"
          >
            <p className="line-clamp-1 text-sm font-semibold text-[#1F2430]">{proposalTitle(proposal)}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{proposal.status}</p>
          </button>
        ))}
        {!loading && !resumable.length ? (
          <div className="rounded-[18px] bg-[#F7F7F7] px-3 py-3 text-sm text-[#6B7280] ring-1 ring-black/6">
            Aucun brouillon.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MobileContributionContext({
  action,
  step,
  selectedCard,
  selectedFicheTitle,
  proposalStatus,
  localSavedAt,
}: {
  action: ActionChoice;
  step: WizardStep;
  selectedCard: CardSearchResult | null;
  selectedFicheTitle?: string | null;
  proposalStatus?: string | null;
  localSavedAt?: string | null;
}) {
  const meta = stepMeta(step, action);

  return (
    <div className="rounded-[26px] bg-white px-4 py-4 shadow-[0_18px_40px_rgba(30,34,40,0.06)] ring-1 ring-black/6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">
            Étape {stepIndex(step) + 1}
          </p>
          <h1 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.06em] text-[#1F2430]">
            {meta.title}
          </h1>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">{meta.hint}</p>
        </div>
        <div className="rounded-[18px] bg-[#F7F7F7] px-3 py-2 text-right ring-1 ring-black/6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">Brouillon</p>
          <p className="mt-1 text-xs font-semibold text-[#1F2430]">{localSavedAt ? "Actif" : "Neuf"}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3365C8]">
          {action === "create_card" ? "Carte" : action === "create_fiche" ? "Fiche" : "Correction"}
        </span>
        {proposalStatus ? (
          <span className="rounded-full bg-[#F5F5F5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
            {proposalStatus}
          </span>
        ) : null}
      </div>

      {(selectedCard || selectedFicheTitle) ? (
        <div className="mt-4 rounded-[20px] bg-[#F7F7F7] px-3 py-3 ring-1 ring-black/6">
          <div className="flex items-start gap-2">
            <PanelTop className="mt-0.5 h-4 w-4 text-[#7643A6]" />
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold text-[#1F2430]">
                {selectedFicheTitle ?? selectedCard?.title ?? "Carte cible"}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6B7280]">
                {selectedCard?.short_description ?? "Le contenu lié apparaîtra ici."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function hydrateProposal(
  proposal: ContributionProposal,
  setters: {
    setAction: (value: ActionChoice) => void;
    setSelectedCard: (value: CardSearchResult | null) => void;
    setHasSearched: (value: boolean) => void;
    setTargetFicheId: (value: string | null) => void;
    setCard: (value: CardPayload) => void;
    setFiche: (value: ReturnType<typeof sanitizeFiche>) => void;
    setCorrection: (value: typeof initialCorrection) => void;
    setCardTagInput: (value: string) => void;
    setFicheTagInput: (value: string) => void;
    setProposal: (value: ContributionProposal) => void;
    setStep: (value: WizardStep) => void;
  }
) {
  const nextAction: ActionChoice =
    proposal.contribution_type === "create_fiche" || proposal.contribution_type === "update_fiche"
      ? "create_fiche"
      : proposal.contribution_type === "correction"
        ? "correction"
        : "create_card";

  setters.setAction(nextAction);
  setters.setProposal(proposal);

  const storedCard = proposal.proposed_data.card as Partial<CardPayload> | undefined;
  const storedFiche = proposal.proposed_data.fiche as Partial<ReturnType<typeof sanitizeFiche>> | undefined;
  const storedCorrection = proposal.proposed_data.correction as Partial<typeof initialCorrection> | undefined;
  const reference = proposal.proposed_data.card_reference as Partial<CardSearchResult> | undefined;

  if (storedCard) {
    const mergedCard = { ...initialCard, ...storedCard, tags: storedCard.tags ?? [] };
    setters.setCard(mergedCard);
    setters.setCardTagInput((storedCard.tags ?? []).join(", "));
  }

  if (storedFiche) {
    const mergedFiche = sanitizeFiche({
      ...initialFiche,
      ...storedFiche,
      sections: { ...initialFiche.sections, ...(storedFiche.sections ?? {}) },
      media_blocks: storedFiche.media_blocks ?? [],
      sources: storedFiche.sources ?? [],
      relations: storedFiche.relations ?? [],
      tags: storedFiche.tags ?? [],
    });
    setters.setFiche(mergedFiche);
    setters.setFicheTagInput(mergedFiche.tags.join(", "));
  }

  if (storedCorrection) {
    setters.setCorrection({ ...initialCorrection, ...storedCorrection });
  }

  if (proposal.target_card) {
    setters.setSelectedCard({
      id: proposal.target_card.id,
      title: proposal.target_card.title,
      short_description: proposal.target_card.short_description,
      city: proposal.target_card.city,
      image: proposal.target_card.main_image,
      status: proposal.target_card.status,
      category_metadata: proposal.target_card.category_metadata,
      tags: proposal.target_card.tags,
      source: "card",
    });
    setters.setHasSearched(true);
  } else if (reference?.id && reference.title) {
    setters.setSelectedCard({
      id: String(reference.id),
      title: String(reference.title),
      short_description: String(reference.short_description ?? ""),
      city: typeof reference.city === "string" ? reference.city : null,
      image: typeof reference.image === "string" ? reference.image : null,
      status: String(reference.status ?? "published"),
      category_metadata:
        typeof reference.category_metadata === "string" ? reference.category_metadata : null,
      tags: Array.isArray(reference.tags) ? reference.tags : [],
      source: reference.source === "card" ? "card" : "editorial",
    });
    setters.setHasSearched(true);
  } else {
    setters.setSelectedCard(null);
    setters.setHasSearched(nextAction === "create_card");
  }

  setters.setTargetFicheId(proposal.target_fiche_id ?? null);
  setters.setStep("edit");
}

export function ContributionForm({
  initialAction,
  initialReference,
  initialTargetFicheId,
  initialCorrectionText,
}: ContributionFormProps = {}) {
  const token = useAuthStore((state) => state.token);
  const selectedInitialCard = useMemo(
    () => selectedCardFromInitialReference(initialReference),
    [initialReference]
  );

  const [step, setStep] = useState<WizardStep>(initialReference ? "edit" : "action");
  const [action, setAction] = useState<ActionChoice>(initialAction ?? "create_card");
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(selectedInitialCard);
  const [hasSearched, setHasSearched] = useState(Boolean(initialReference));
  const [targetFicheId, setTargetFicheId] = useState<string | null>(initialTargetFicheId ?? null);
  const [card, setCard] = useState<CardPayload>(initialCard);
  const [fiche, setFiche] = useState(initialFiche);
  const [correction, setCorrection] = useState({
    ...initialCorrection,
    current_text: initialCorrectionText ?? "",
  });
  const [cardEditorTab, setCardEditorTab] = useState<CardEditorTab>("infos");
  const [ficheEditorTab, setFicheEditorTab] = useState<FicheTab>("resume");
  const [cardTagInput, setCardTagInput] = useState("");
  const [ficheTagInput, setFicheTagInput] = useState("");
  const [proposal, setProposal] = useState<ContributionProposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState({
    query: initialReference?.title ?? "",
    city: initialReference?.city ?? "Strasbourg",
    tags: "",
    category: initialReference?.category_metadata ?? "",
  });
  const [localSavedAt, setLocalSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (initialReference) return;
    const raw = window.localStorage.getItem(draftStorageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<ContributionStudioSnapshot>;
      if (parsed.action) setAction(parsed.action);
      if (parsed.step) setStep(parsed.step);
      if (parsed.selectedCard) setSelectedCard(parsed.selectedCard);
      if (typeof parsed.targetFicheId === "string" || parsed.targetFicheId === null) {
        setTargetFicheId(parsed.targetFicheId ?? null);
      }
      if (parsed.card) {
        setCard({ ...initialCard, ...parsed.card, tags: parsed.card.tags ?? [] });
        setCardTagInput((parsed.card.tags ?? []).join(", "));
      }
      if (parsed.fiche) {
        const mergedFiche = {
          ...initialFiche,
          ...parsed.fiche,
          sections: { ...initialFiche.sections, ...(parsed.fiche.sections ?? {}) },
          media_blocks: parsed.fiche.media_blocks ?? [],
          sources: parsed.fiche.sources ?? [],
          relations: parsed.fiche.relations ?? [],
          tags: parsed.fiche.tags ?? [],
        };
        setFiche(mergedFiche);
        setFicheTagInput((parsed.fiche.tags ?? []).join(", "));
      }
      if (parsed.correction) setCorrection({ ...initialCorrection, ...parsed.correction });
      if (parsed.cardEditorTab) setCardEditorTab(parsed.cardEditorTab);
      if (parsed.ficheEditorTab) setFicheEditorTab(parsed.ficheEditorTab);
      if (parsed.selectedCard) setHasSearched(true);
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, [initialReference]);

  useEffect(() => {
    const snapshot: ContributionStudioSnapshot = {
      action,
      step,
      selectedCard,
      targetFicheId,
      card,
      fiche,
      correction,
      cardEditorTab,
      ficheEditorTab,
    };
    window.localStorage.setItem(draftStorageKey, JSON.stringify(snapshot));
    setLocalSavedAt(new Date().toISOString());
  }, [action, step, selectedCard, targetFicheId, card, fiche, correction, cardEditorTab, ficheEditorTab]);

  const deferredSearch = useDeferredValue(search);
  const shouldSearch =
    step === "search" &&
    Boolean(
      deferredSearch.query.trim() ||
        deferredSearch.city.trim() ||
        deferredSearch.tags.trim() ||
        deferredSearch.category.trim()
    );

  const searchQuery = useQuery({
    queryKey: [
      "contribution-card-search",
      deferredSearch.query,
      deferredSearch.city,
      deferredSearch.tags,
      deferredSearch.category,
    ],
    queryFn: () =>
      searchCards({
        q: deferredSearch.query,
        city: deferredSearch.city,
        tags: deferredSearch.tags,
        category: deferredSearch.category,
        limit: 12,
      }),
    enabled: shouldSearch,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (searchQuery.isFetched) {
      setHasSearched(true);
    }
  }, [searchQuery.isFetched, searchQuery.dataUpdatedAt]);

  const availableFichesQuery = useQuery({
    queryKey: ["contribution-target-fiches", selectedCard?.source, selectedCard?.id, token],
    queryFn: () => {
      if (!selectedCard) return Promise.resolve([]);
      return selectedCard.source === "card"
        ? getCardFiches(selectedCard.id, token)
        : getEditorialFiches(selectedCard.id, token);
    },
    enabled: Boolean(token && selectedCard && action !== "create_card"),
  });

  const availableFiches = availableFichesQuery.data ?? [];
  const proposalsQuery = useQuery({
    queryKey: ["contribution-studio-proposals", token],
    queryFn: () => getMyContributionProposals(token!),
    enabled: Boolean(token),
    staleTime: 20_000,
  });
  const resumableProposals = proposalsQuery.data ?? [];
  const selectedTargetFiche = availableFiches.find((entry) => entry.id === targetFicheId) ?? null;
  const cleanCard = useMemo(() => sanitizeCard(card), [card]);
  const cleanFiche = useMemo(() => sanitizeFiche(fiche), [fiche]);
  const currentIndex = stepIndex(step);
  const evaluation = proposal?.ai_review ?? null;
  const meta = stepMeta(step, action);

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

  const saveMutation = useMutation({
    mutationFn: ensureProposal,
    onSuccess: () => setError(null),
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const aiMutation = useMutation({
    mutationFn: async () => {
      const saved = await ensureProposal();
      if (!token) throw new Error("Connectez-vous pour lancer l’analyse IA.");
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
      if (!saved.ai_review) throw new Error("Lancez l’analyse IA avant la soumission.");
      return submitContributionProposal(saved.id, token);
    },
    onSuccess: (submitted) => {
      setProposal(submitted);
      window.localStorage.removeItem(draftStorageKey);
      setError(null);
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const startFlow = (nextAction: ActionChoice) => {
    setAction(nextAction);
    setProposal(null);
    setSelectedCard(null);
    setHasSearched(false);
    setTargetFicheId(null);
    setStep("search");
    setError(null);
  };

  const useExistingCard = (cardResult: CardSearchResult, nextAction?: ActionChoice) => {
    setSelectedCard(cardResult);
    setTargetFicheId(null);
    setHasSearched(true);
    setProposal(null);
    if (nextAction) {
      setAction(nextAction);
    }
    setStep("edit");
    setError(null);
  };

  const createNewCard = () => {
    setSelectedCard(null);
    setTargetFicheId(null);
    setProposal(null);
    setAction("create_card");
    setStep("edit");
    setError(null);
  };

  const resumeProposal = (storedProposal: ContributionProposal) => {
    hydrateProposal(storedProposal, {
      setAction,
      setSelectedCard,
      setHasSearched,
      setTargetFicheId,
      setCard,
      setFiche,
      setCorrection,
      setCardTagInput,
      setFicheTagInput,
      setProposal,
      setStep,
    });
    setError(null);
  };

  const goNext = () => {
    const validation = validateStep(
      step,
      action,
      hasSearched,
      selectedCard,
      card,
      fiche,
      correction,
      Boolean(evaluation)
    );

    if (validation) {
      setError(validation);
      return;
    }

    const nextStep = steps[currentIndex + 1]?.id;
    if (nextStep) {
      setStep(nextStep);
      setError(null);
    }
  };

  const goBack = () => {
    const previousStep = steps[Math.max(0, currentIndex - 1)]?.id;
    setStep(previousStep);
    setError(null);
  };

  if (!token) {
    return (
      <div className="rounded-[28px] bg-white p-6 text-sm leading-6 text-[#5F6674] shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
        Connectez-vous pour proposer une carte, une fiche ou une correction.
      </div>
    );
  }

  const renderStepContent = () => {
    if (step === "action") {
      return <ActionSelector value={action} onChange={startFlow} />;
    }

    if (step === "search") {
      return (
        <CardSearchPanel
          action={action}
          search={search}
          results={searchQuery.data ?? []}
          selectedCard={selectedCard}
          loading={searchQuery.isFetching}
          hasSearched={hasSearched}
          onSearchChange={(patch) => setSearch((current) => ({ ...current, ...patch }))}
          onUseCard={useExistingCard}
          onCreateNew={createNewCard}
        />
      );
    }

    if (step === "edit" && action === "create_card") {
      return (
        <CardEditorTabs
          card={card}
          activeTab={cardEditorTab}
          onTabChange={setCardEditorTab}
          onChange={(key, value) => setCard((current) => ({ ...current, [key]: value }))}
          tagInput={cardTagInput}
          onTagInputChange={setCardTagInput}
        />
      );
    }

    if (step === "edit" && action === "create_fiche") {
      return (
        <FicheEditorTabs
          fiche={fiche}
          activeTab={ficheEditorTab}
          onTabChange={setFicheEditorTab}
          onChange={setFiche}
          tagInput={ficheTagInput}
          onTagInputChange={setFicheTagInput}
        />
      );
    }

    if (step === "edit" && action === "correction") {
      return (
        <CorrectionEditor
          correction={correction}
          onChange={setCorrection}
          selectedCard={selectedCard}
          publishedFiches={availableFiches}
          targetFicheId={targetFicheId}
          onTargetFicheId={setTargetFicheId}
        />
      );
    }

    if (step === "preview") {
      return (
        <LivePreviewPanel
          action={action}
          selectedCard={selectedCard}
          card={cleanCard}
          fiche={cleanFiche}
          correction={correction}
          selectedFiche={selectedTargetFiche}
          evaluation={evaluation}
          variant="full"
        />
      );
    }

    if (step === "ai") {
      return (
        <AIReviewPanel
          evaluation={evaluation}
          loading={aiMutation.isPending}
          onRun={() => aiMutation.mutate()}
          disabled={aiMutation.isPending}
        />
      );
    }

    return (
      <ContributionSummary
        action={action}
        selectedCard={selectedCard}
        selectedFiche={selectedTargetFiche}
        card={cleanCard}
        fiche={cleanFiche}
        correction={correction}
        evaluation={evaluation}
        proposalStatus={proposal?.status ?? null}
        submitting={submitMutation.isPending}
        onSubmit={() => submitMutation.mutate()}
      />
    );
  };

  return (
    <div className="h-[calc(100dvh-11.35rem)] min-h-0 bg-[#E9E9E9] lg:h-[calc(100dvh-10.9rem)] xl:h-[calc(100dvh-5.5rem)] xl:rounded-[38px] xl:p-3 xl:shadow-[0_32px_80px_rgba(30,34,40,0.12)] xl:ring-1 xl:ring-black/6">
      <div className="hidden h-full min-h-0 gap-3 xl:grid xl:grid-cols-[240px_minmax(0,1fr)_340px]">
        <aside className="hidden min-h-0 xl:block">
          <div className="flex h-full min-h-0 flex-col">
            <ContributionStepper
              step={step}
              action={action}
              proposalStatus={proposal?.status ?? null}
              onStep={setStep}
            />
            <DraftQueue
              proposals={resumableProposals}
              loading={proposalsQuery.isLoading}
              onResume={resumeProposal}
            />
          </div>
        </aside>

        <section className="flex min-h-0 flex-col rounded-[34px] bg-[rgba(255,255,255,0.76)] p-3 shadow-[0_28px_70px_rgba(30,34,40,0.1)] ring-1 ring-white/60 backdrop-blur-xl">
          <div className="xl:hidden">
            <ContributionStepper
              step={step}
              action={action}
              proposalStatus={proposal?.status ?? null}
              onStep={setStep}
              layout="horizontal"
            />
          </div>

          <div className="mt-3 rounded-[28px] bg-white px-5 py-4 shadow-[0_18px_40px_rgba(30,34,40,0.06)] ring-1 ring-black/6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">
                  Étape {currentIndex + 1}
                </p>
                <h1 className="mt-2 text-[1.95rem] font-semibold tracking-[-0.06em] text-[#1F2430]">
                  {meta.title}
                </h1>
                <p className="mt-1 text-sm leading-6 text-[#6B7280]">{meta.hint}</p>
              </div>
              <div className="rounded-[18px] bg-[#F7F7F7] px-4 py-3 text-right ring-1 ring-black/6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                  Auto-sauvegarde
                </p>
                <p className="mt-1 text-sm font-semibold text-[#1F2430]">
                  {localSavedAt ? "Locale active" : "En attente"}
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-3 flex items-center gap-2 rounded-[20px] bg-[#FCE8E8] px-4 py-3 text-sm text-[#B64141] ring-1 ring-[#E85C5C]/16">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="mt-3 min-h-0 flex-1 overflow-hidden">{renderStepContent()}</div>

          <footer className="mt-3 flex shrink-0 items-center justify-between gap-3 rounded-[26px] bg-white px-3 py-3 shadow-[0_18px_40px_rgba(30,34,40,0.1)] ring-1 ring-black/6">
            <Button variant="secondary" onClick={goBack} disabled={currentIndex === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Brouillon
              </Button>

              {step === "action" ? null : step !== "submit" ? (
                <Button onClick={goNext}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : proposal?.status === "pending_moderation" ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF6EF] px-4 py-2 text-sm font-semibold text-[#1F9D66]">
                  <CheckCircle2 className="h-4 w-4" />
                  Envoyé
                </div>
              ) : null}
            </div>
          </footer>
        </section>

        <aside className="hidden min-h-0 lg:block">
          <div className="flex h-full min-h-0 flex-col gap-3">
            <LivePreviewPanel
              action={action}
              selectedCard={selectedCard}
              card={cleanCard}
              fiche={cleanFiche}
              correction={correction}
              selectedFiche={selectedTargetFiche}
              evaluation={evaluation}
            />
            <AIReviewPanel evaluation={evaluation} loading={aiMutation.isPending} compact />
          </div>
        </aside>
      </div>

      <div className="flex h-full min-h-0 flex-col px-3 pb-0 xl:hidden">
        <div className="shrink-0">
          <MobileContributionContext
            action={action}
            step={step}
            selectedCard={selectedCard}
            selectedFicheTitle={selectedTargetFiche?.title ?? null}
            proposalStatus={proposal?.status ?? null}
            localSavedAt={localSavedAt}
          />
          <div className="mt-3">
            <ContributionStepper
              step={step}
              action={action}
              proposalStatus={proposal?.status ?? null}
              onStep={setStep}
              layout="horizontal"
            />
          </div>
          <MobileResumeStrip
            proposals={resumableProposals}
            loading={proposalsQuery.isLoading}
            onResume={resumeProposal}
          />
        </div>

        {error ? (
          <div className="mt-3 flex items-center gap-2 rounded-[20px] bg-[#FCE8E8] px-4 py-3 text-sm text-[#B64141] ring-1 ring-[#E85C5C]/16">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-[30px] bg-[rgba(255,255,255,0.76)] p-2 shadow-[0_24px_56px_rgba(30,34,40,0.1)] ring-1 ring-white/60 backdrop-blur-xl">
          <div className="h-full min-h-0 overflow-y-auto pr-1">{renderStepContent()}</div>
        </div>

        <footer className="sticky bottom-4 z-20 mt-3 shrink-0 rounded-[24px] bg-white/96 px-3 py-3 shadow-[0_18px_40px_rgba(30,34,40,0.14)] ring-1 ring-black/6 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <Button variant="secondary" className="min-w-[104px]" onClick={goBack} disabled={currentIndex === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button
              variant="secondary"
              className="min-w-[110px]"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Brouillon
            </Button>
            {step === "action" ? null : step !== "submit" ? (
              <Button className="min-w-[108px]" onClick={goNext}>
                Suite
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : proposal?.status === "pending_moderation" ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF6EF] px-4 py-2 text-sm font-semibold text-[#1F9D66]">
                <CheckCircle2 className="h-4 w-4" />
                Envoyé
              </div>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
