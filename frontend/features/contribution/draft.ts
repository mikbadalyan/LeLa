import type {
  ComposerContributionType,
  ContributionMediaKind,
  ContributionMediaItem,
  ContributionPayload,
  ModerationContribution,
} from "@/lib/api/types";

export type ContributionStep = "type" | "content" | "review";

export const contributionStepOrder: ContributionStep[] = [
  "type",
  "content",
  "review",
];

export const contributionDraftStorageKey = "lela.contribution.draft.v3";

export const initialContributionForm: ContributionPayload = {
  type: "multi_media",
  title: "",
  subtitle: "",
  description: "",
  city: "Strasbourg",
  address: "",
  event_date: "",
  end_date: "",
  price: "",
  external_url: "",
  linked_place_name: "",
  linked_person_name: "",
  linked_event_name: "",
  primary_media_kind: "image",
  media_items: [],
  text_content: "",
};

export interface ContributionDraftSnapshot {
  form: ContributionPayload;
  step: ContributionStep;
  lastSavedAt: string;
  sourceContributionId?: string | null;
}

export function saveContributionDraft(snapshot: ContributionDraftSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    contributionDraftStorageKey,
    JSON.stringify(snapshot)
  );
}

export function loadContributionDraft(): ContributionDraftSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(contributionDraftStorageKey);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<ContributionDraftSnapshot>;
    if (!parsed.form || !parsed.step) {
      return null;
    }

    return {
      form: { ...initialContributionForm, ...parsed.form },
      step: contributionStepOrder.includes(parsed.step)
        ? parsed.step
        : "type",
      lastSavedAt:
        typeof parsed.lastSavedAt === "string"
          ? parsed.lastSavedAt
          : new Date().toISOString(),
      sourceContributionId:
        typeof parsed.sourceContributionId === "string"
          ? parsed.sourceContributionId
          : null,
    };
  } catch {
    return null;
  }
}

export function clearContributionDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(contributionDraftStorageKey);
}

export function contributionPayloadFromModeration(
  contribution: ModerationContribution
): ContributionPayload {
  const payload = contribution.payload ?? {};
  const mediaItems = Array.isArray(payload.media_items)
    ? payload.media_items.filter(
        (entry): entry is ContributionMediaItem =>
          Boolean(
            entry &&
              typeof entry === "object" &&
              "kind" in entry &&
              "name" in entry &&
              isContributionMediaKind((entry as { kind?: unknown }).kind) &&
              typeof (entry as ContributionMediaItem).name === "string"
          )
      )
    : contribution.media_name
      ? [
          {
            kind:
              payload.legacy_media_kind === "video" ||
              payload.legacy_media_kind === "audio"
                ? payload.legacy_media_kind
                : "image",
            name: contribution.media_name,
          },
        ]
      : [];

  const normalizedType = normalizeContributionType(contribution.type, mediaItems, payload.text_content);

  return {
    ...initialContributionForm,
    type: normalizedType,
    title: contribution.title,
    subtitle: contribution.subtitle ?? "",
    description: contribution.description,
    city: payload.city ?? initialContributionForm.city,
    address: payload.address ?? "",
    event_date: payload.event_date ?? "",
    end_date: payload.end_date ?? "",
    price: payload.price ?? "",
    external_url: payload.external_url ?? "",
    linked_place_name: payload.linked_place_name ?? "",
    linked_person_name: payload.linked_person_name ?? "",
    linked_event_name: payload.linked_event_name ?? "",
    primary_media_kind: payload.primary_media_kind ?? inferPrimaryKind(mediaItems, payload.text_content),
    media_items: mediaItems,
    text_content: payload.text_content ?? contribution.description,
  };
}

function inferPrimaryKind(
  mediaItems: ContributionMediaItem[],
  textContent?: string | null
) {
  if (mediaItems[0]?.kind) {
    return mediaItems[0].kind;
  }
  if (textContent?.trim()) {
    return "text" as const;
  }
  return "image" as const;
}

function isContributionMediaKind(value: unknown): value is ContributionMediaKind {
  return value === "image" || value === "video" || value === "audio";
}

export function normalizeContributionType(
  input: ModerationContribution["type"] | ComposerContributionType,
  mediaItems: ContributionMediaItem[] = [],
  textContent?: string | null
): ComposerContributionType {
  if (input === "event") {
    return "event";
  }

  if (input === "multi_media" || input === "single_media") {
    return input;
  }

  const contentCount = mediaItems.length + (textContent?.trim() ? 1 : 0);
  return contentCount > 1 ? "multi_media" : "single_media";
}
