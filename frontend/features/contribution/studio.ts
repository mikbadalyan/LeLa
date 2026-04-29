import type {
  CardCategoryMetadata,
  CardPayload,
  CardSearchResult,
  ContributionProposal,
  ContributionProposalPayload,
  ContributionProposalType,
  FicheMediaBlock,
  PublishedFiche,
} from "@/lib/api/types";

export type ActionChoice = "create_card" | "create_fiche" | "correction";
export type WizardStep = "action" | "search" | "edit" | "preview" | "ai" | "submit";
export type CardEditorTab = "infos" | "description" | "medias" | "relations" | "sources";
export type FicheTab = "resume" | "description" | "contexte" | "medias" | "sources" | "relations";

export interface FicheDraft {
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

export interface CorrectionDraft {
  section: string;
  current_text: string;
  proposed_text: string;
  explanation: string;
}

export interface ContributionInitialReference {
  id: string;
  source: "card" | "editorial";
  title: string;
  short_description: string;
  city?: string | null;
  image?: string | null;
  category_metadata?: string | null;
}

export interface ContributionFormProps {
  initialAction?: ActionChoice;
  initialReference?: ContributionInitialReference | null;
  initialTargetFicheId?: string | null;
  initialCorrectionText?: string | null;
}

export interface ContributionStudioSnapshot {
  action: ActionChoice;
  step: WizardStep;
  selectedCard: CardSearchResult | null;
  targetFicheId: string | null;
  card: CardPayload;
  fiche: FicheDraft;
  correction: CorrectionDraft;
  cardEditorTab: CardEditorTab;
  ficheEditorTab: FicheTab;
}

export const draftStorageKey = "lela.contribution.studio.v2";

export const steps: Array<{
  id: WizardStep;
  label: string;
  shortLabel: string;
  hint: string;
}> = [
  { id: "action", label: "Action", shortLabel: "01", hint: "Choisir une intention" },
  { id: "search", label: "Recherche", shortLabel: "02", hint: "Éviter les doublons" },
  { id: "edit", label: "Édition", shortLabel: "03", hint: "Composer le contenu" },
  { id: "preview", label: "Aperçu", shortLabel: "04", hint: "Vérifier le rendu" },
  { id: "ai", label: "Analyse IA", shortLabel: "05", hint: "Lire les signaux qualité" },
  { id: "submit", label: "Soumission", shortLabel: "06", hint: "Envoyer à la modération" },
];

export const actionChoices: Array<{
  id: ActionChoice;
  title: string;
  subtitle: string;
  accent: string;
  proposalType: ContributionProposalType;
}> = [
  {
    id: "create_card",
    title: "Créer une carte",
    subtitle: "Nouvelle entrée publique",
    accent: "#7643A6",
    proposalType: "create_card",
  },
  {
    id: "create_fiche",
    title: "Ajouter une fiche",
    subtitle: "Compléter une carte existante",
    accent: "#3365C8",
    proposalType: "create_fiche",
  },
  {
    id: "correction",
    title: "Proposer une correction",
    subtitle: "Améliorer l’existant",
    accent: "#1F9D66",
    proposalType: "correction",
  },
];

export const categories: Array<{ value: CardCategoryMetadata; label: string }> = [
  { value: "lieu", label: "Lieu" },
  { value: "personne", label: "Personne" },
  { value: "evenement", label: "Événement" },
  { value: "objet", label: "Objet" },
  { value: "theme", label: "Thème" },
  { value: "autre", label: "Autre" },
];

export const cardEditorTabs: Array<{ id: CardEditorTab; label: string }> = [
  { id: "infos", label: "Infos" },
  { id: "description", label: "Description" },
  { id: "medias", label: "Médias" },
  { id: "relations", label: "Relations" },
  { id: "sources", label: "Sources" },
];

export const ficheTabs: Array<{ id: FicheTab; label: string }> = [
  { id: "resume", label: "Résumé" },
  { id: "description", label: "Description" },
  { id: "contexte", label: "Contexte" },
  { id: "medias", label: "Médias" },
  { id: "sources", label: "Sources" },
  { id: "relations", label: "Relations" },
];

export const initialCard: CardPayload = {
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

export const initialFiche: FicheDraft = {
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

export const initialCorrection: CorrectionDraft = {
  section: "Résumé",
  current_text: "",
  proposed_text: "",
  explanation: "",
};

export function stepIndex(step: WizardStep) {
  return steps.findIndex((entry) => entry.id === step);
}

export function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function cardReference(card: CardSearchResult | null): Record<string, unknown> | null {
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

export function sanitizeCard(card: CardPayload): CardPayload {
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

export function sanitizeFiche(fiche: FicheDraft): FicheDraft {
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

export function sectionText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function fichePrimaryText(fiche: PublishedFiche) {
  const sections = fiche.sections ?? {};
  return (
    sectionText(sections.resume) ||
    sectionText(sections.description) ||
    sectionText(sections.contexte) ||
    sectionText(sections.pratique) ||
    ""
  );
}

export function ficheSnapshot(fiche: PublishedFiche | null | undefined): Record<string, unknown> | null {
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

export function validateStep(
  step: WizardStep,
  action: ActionChoice,
  hasSearched: boolean,
  selectedCard: CardSearchResult | null,
  card: CardPayload,
  fiche: FicheDraft,
  correction: CorrectionDraft,
  aiReady: boolean
) {
  const cleanCard = sanitizeCard(card);
  const cleanFiche = sanitizeFiche(fiche);

  if (step === "action") return null;

  if (step === "search") {
    if (!hasSearched) return "Cherchez d’abord une carte existante.";
    if (action !== "create_card" && !selectedCard) return "Sélectionnez une carte existante.";
  }

  if (step === "edit" && action === "create_card") {
    if (cleanCard.title.length < 2) return "Ajoutez un titre de carte.";
    if (cleanCard.short_description.length < 10) return "Ajoutez une description courte.";
    if (!cleanCard.why_exists || cleanCard.why_exists.length < 10) {
      return "Expliquez pourquoi cette carte mérite d’exister.";
    }
  }

  if (step === "edit" && action === "create_fiche") {
    if (!selectedCard) return "Choisissez une carte liée.";
    if (cleanFiche.title.length < 2) return "Ajoutez un titre de fiche.";
    if (cleanFiche.sections.resume.length < 10) return "Ajoutez un résumé clair.";
    if (cleanFiche.sections.description.length < 20) return "Ajoutez une description détaillée.";
  }

  if (step === "edit" && action === "correction") {
    if (!selectedCard) return "Choisissez une carte ou une fiche à corriger.";
    if (correction.proposed_text.trim().length < 5) return "Ajoutez votre correction.";
    if (correction.explanation.trim().length < 8) return "Expliquez la raison de la modification.";
  }

  if (step === "ai" && !aiReady) {
    return "Lancez l’analyse IA avant de continuer.";
  }

  return null;
}

export function proposalTitle(proposal: ContributionProposal) {
  const card = proposal.proposed_data.card as { title?: string } | undefined;
  const fiche = proposal.proposed_data.fiche as { title?: string } | undefined;
  const reference = proposal.proposed_data.card_reference as { title?: string } | undefined;
  const correction = proposal.proposed_data.correction as { section?: string } | undefined;
  return card?.title ?? fiche?.title ?? reference?.title ?? correction?.section ?? "Proposition";
}

export function stepMeta(step: WizardStep, action: ActionChoice) {
  if (step === "action") {
    return {
      title: "Choisir une trajectoire",
      hint: "Commencez par l’intention éditoriale la plus juste.",
    };
  }

  if (step === "search") {
    return {
      title: "Rechercher avant d’écrire",
      hint:
        action === "create_card"
          ? "Vérifiez d’abord si le sujet existe déjà."
          : "Sélectionnez la carte qui recevra votre contribution.",
    };
  }

  if (step === "edit") {
    return {
      title:
        action === "create_card"
          ? "Composer la carte"
          : action === "create_fiche"
            ? "Rédiger la fiche"
            : "Préparer la correction",
      hint: "Travaillez une section à la fois pour garder le flux simple.",
    };
  }

  if (step === "preview") {
    return {
      title: "Voir le rendu public",
      hint: "Relisez comme si vous étiez déjà dans le feed LE_LA.",
    };
  }

  if (step === "ai") {
    return {
      title: "Lire le pré-contrôle IA",
      hint: "Le score n’approuve rien seul, il guide votre relecture.",
    };
  }

  return {
    title: "Soumettre à la modération",
    hint: "Dernière vérification avant l’envoi à l’équipe éditoriale.",
  };
}

export function buildProposalPayload(params: {
  action: ActionChoice;
  selectedCard: CardSearchResult | null;
  targetFicheId: string | null;
  cleanCard: CardPayload;
  cleanFiche: FicheDraft;
  correction: CorrectionDraft;
  selectedTargetFiche: PublishedFiche | null;
}): ContributionProposalPayload {
  const reference = cardReference(params.selectedCard);
  const targetCardId = params.selectedCard?.source === "card" ? params.selectedCard.id : null;

  if (params.action === "create_card") {
    return {
      contribution_type: "create_card",
      target_card_id: null,
      proposed_data: { card: params.cleanCard },
      explanation: params.cleanCard.why_exists,
    };
  }

  if (params.action === "create_fiche") {
    return {
      contribution_type: "create_fiche",
      target_card_id: targetCardId,
      proposed_data: {
        card_reference: reference,
        linked_editorial_id: params.selectedCard?.source === "editorial" ? params.selectedCard.id : null,
        fiche: params.cleanFiche,
      },
      explanation: params.cleanFiche.contributor_note,
    };
  }

  return {
    contribution_type: "correction",
    target_card_id: targetCardId,
    target_fiche_id: params.targetFicheId,
    proposed_data: {
      card_reference: reference,
      linked_editorial_id: params.selectedCard?.source === "editorial" ? params.selectedCard.id : null,
      correction: params.correction,
    },
    previous_data_snapshot: ficheSnapshot(params.selectedTargetFiche) ?? reference ?? undefined,
    explanation: params.correction.explanation,
  };
}
