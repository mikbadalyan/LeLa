"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Film,
  ImagePlus,
  MapPin,
  Mic2,
  UploadCloud,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import {
  clearContributionDraft,
  contributionStepOrder,
  initialContributionForm,
  loadContributionDraft,
  normalizeContributionType,
  saveContributionDraft,
  type ContributionStep,
} from "@/features/contribution/draft";
import { useI18n } from "@/features/shell/i18n";
import { createContribution } from "@/lib/api/endpoints";
import type {
  ComposerContributionType,
  ContributionMediaItem,
  ContributionMediaKind,
  ContributionPayload,
  ContributionPrimaryKind,
} from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

type MediaPreviewMap = Partial<Record<ContributionMediaKind, string>>;

const COMPOSER_TYPES: ComposerContributionType[] = [
  "multi_media",
  "single_media",
  "event",
];

const MEDIA_KINDS: ContributionMediaKind[] = ["image", "video", "audio"];

function getStepIndex(step: ContributionStep) {
  return contributionStepOrder.indexOf(step);
}

function countContentPieces(form: ContributionPayload) {
  return form.media_items.length + (form.text_content?.trim() ? 1 : 0);
}

function getMediaItem(
  items: ContributionMediaItem[],
  kind: ContributionMediaKind
) {
  return items.find((item) => item.kind === kind) ?? null;
}

function replaceMediaItem(
  items: ContributionMediaItem[],
  nextItem: ContributionMediaItem
) {
  return [...items.filter((item) => item.kind !== nextItem.kind), nextItem];
}

function removeMediaItem(
  items: ContributionMediaItem[],
  kind: ContributionMediaKind
) {
  return items.filter((item) => item.kind !== kind);
}

function inferPrimaryKind(form: ContributionPayload): ContributionPrimaryKind {
  if (
    form.primary_media_kind &&
    (form.primary_media_kind === "text" ||
      form.media_items.some((item) => item.kind === form.primary_media_kind))
  ) {
    return form.primary_media_kind;
  }

  if (form.media_items[0]?.kind) {
    return form.media_items[0].kind;
  }

  if (form.text_content?.trim()) {
    return "text";
  }

  return "image";
}

function deriveValidationError(
  form: ContributionPayload,
  token: string | null,
  t: (key: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string
) {
  if (!token) {
    return t("contribute.validation.login");
  }

  if (!form.title.trim()) {
    return t("contribute.validation.title");
  }

  if (!form.description.trim()) {
    return t("contribute.validation.caption");
  }

  const contentPieces = countContentPieces(form);

  if (form.type === "multi_media") {
    if (contentPieces < 2) {
      return t("contribute.validation.multiMedia");
    }
  }

  if (form.type === "single_media") {
    if (contentPieces !== 1) {
      return t("contribute.validation.singleMedia");
    }
  }

  if (form.type === "event") {
    if (!form.event_date?.trim()) {
      return t("contribute.validation.eventDate");
    }

    if (!form.address?.trim() && !form.linked_place_name?.trim()) {
      return t("contribute.validation.eventLocation");
    }
  }

  return null;
}

function ContributionSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-card bg-elevated px-4 py-4 shadow-card ring-1 ring-borderSoft/10", className)}>
      {children}
    </div>
  );
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {hint ? <p className="text-xs leading-5 text-graphite/72">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function StepDots({
  step,
  labels,
}: {
  step: ContributionStep;
  labels: Array<{ id: ContributionStep; label: string }>;
}) {
  const activeIndex = getStepIndex(step);

  return (
    <div className="flex items-center gap-2">
      {labels.map((entry, index) => (
        <div
          key={entry.id}
          className={cn(
            "h-2.5 rounded-full transition-all",
            index === activeIndex ? "w-10 bg-plum" : "w-2.5",
            index < activeIndex ? "bg-blue/45" : index === activeIndex ? "" : "bg-borderSoft/16"
          )}
          aria-label={entry.label}
        />
      ))}
    </div>
  );
}

function TypeCard({
  title,
  description,
  active,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  icon: typeof ImagePlus;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[178px] flex-col justify-between rounded-[24px] border px-4 py-4 text-left transition",
        active
          ? "border-blue bg-[linear-gradient(160deg,#7643A6_0%,#3365C8_100%)] text-white shadow-blue"
          : "border-borderSoft/10 bg-surface text-ink"
      )}
    >
      <div
        className={cn(
          "w-fit rounded-2xl p-3",
          active ? "bg-white/15 text-white" : "bg-blueSoft text-blue"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-base font-semibold">{title}</p>
        <p className={cn("mt-2 text-xs leading-5", active ? "text-white/80" : "text-graphite/72")}>
          {description}
        </p>
      </div>
    </button>
  );
}

function MediaPreview({
  kind,
  previewUrl,
  fallbackLabel,
}: {
  kind: ContributionPrimaryKind;
  previewUrl?: string | null;
  fallbackLabel: string;
}) {
  if (kind === "video" && previewUrl) {
    return (
      <video
        src={previewUrl}
        controls
        className="aspect-[4/5] w-full rounded-[28px] object-cover shadow-card"
      />
    );
  }

  if (kind === "audio" && previewUrl) {
    return (
      <div className="overflow-hidden rounded-card bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)] px-5 py-8 text-white shadow-card">
        <div className="flex aspect-[4/5] flex-col justify-between">
          <div className="rounded-full bg-white/15 p-3 w-fit">
            <Mic2 className="h-6 w-6" />
          </div>
          <div className="space-y-5">
            <div className="flex items-end justify-between gap-2 opacity-35">
              {[36, 54, 28, 42, 60, 32, 48, 24].map((height, index) => (
                <span
                  key={`preview-audio-${index}`}
                  className="w-2 rounded-full bg-white"
                  style={{ height }}
                />
              ))}
            </div>
            <audio src={previewUrl} controls className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (kind === "image" && previewUrl) {
    return (
      <img
        src={previewUrl}
        alt={fallbackLabel}
        className="aspect-[4/5] w-full rounded-[28px] object-cover shadow-card"
      />
    );
  }

  return (
    <div className="flex aspect-[4/5] items-center justify-center rounded-card bg-[linear-gradient(180deg,rgb(var(--surface-rgb))_0%,rgb(var(--mist-rgb))_100%)] text-center ring-1 ring-borderSoft/10">
      <div className="max-w-[16rem] space-y-3 px-6 text-graphite">
        {kind === "video" ? (
          <Film className="mx-auto h-10 w-10 text-plum" />
        ) : kind === "audio" ? (
          <Mic2 className="mx-auto h-10 w-10 text-plum" />
        ) : kind === "text" ? (
          <FileText className="mx-auto h-10 w-10 text-plum" />
        ) : (
          <ImagePlus className="mx-auto h-10 w-10 text-plum" />
        )}
        <p className="text-base font-semibold text-ink">{fallbackLabel}</p>
      </div>
    </div>
  );
}

function MediaPicker({
  kind,
  label,
  selected,
  previewUrl,
  emptyLabel,
  replaceLabel,
  chooseLabel,
  onPick,
  onRemove,
}: {
  kind: ContributionMediaKind;
  label: string;
  selected: ContributionMediaItem | null;
  previewUrl?: string | null;
  emptyLabel: string;
  replaceLabel: string;
  chooseLabel: string;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[22px] bg-surface px-4 py-4 ring-1 ring-borderSoft/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="mt-1 text-xs text-graphite/72">
            {selected?.name ?? emptyLabel}
          </p>
        </div>
        {selected ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full bg-elevated p-2 text-graphite ring-1 ring-borderSoft/10"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        {previewUrl ? (
          <div className="relative overflow-hidden rounded-[20px] bg-mist">
            {kind === "video" ? (
              <video src={previewUrl} className="aspect-[16/10] w-full object-cover" muted playsInline />
            ) : kind === "audio" ? (
              <div className="flex aspect-[16/10] items-center justify-center bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)] text-white">
                <Mic2 className="h-8 w-8" />
              </div>
            ) : (
              <img src={previewUrl} alt={label} className="aspect-[16/10] w-full object-cover" />
            )}
          </div>
        ) : null}
      </div>

      <Button type="button" className="mt-4 w-full" onClick={onPick}>
        <UploadCloud className="mr-2 h-4 w-4" />
        {selected ? replaceLabel : chooseLabel}
      </Button>
    </div>
  );
}

function ContributionPreviewCard({
  form,
  previewUrl,
  contributor,
  fallbackTitle,
}: {
  form: ContributionPayload;
  previewUrl?: string | null;
  contributor: { name: string; avatarUrl?: string | null };
  fallbackTitle: string;
}) {
  const locationText = form.address || form.city || form.linked_place_name || form.subtitle;

  return (
    <div className="relative aspect-[0.82] overflow-hidden rounded-card bg-editorial text-white shadow-card ring-1 ring-borderSoft/10">
      {form.primary_media_kind === "text" ? (
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
      ) : previewUrl ? (
        form.primary_media_kind === "video" ? (
          <video src={previewUrl} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
        ) : form.primary_media_kind === "audio" ? (
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
        ) : (
          <img src={previewUrl} alt={form.title} className="absolute inset-0 h-full w-full object-cover" />
        )
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#7643A6_0%,#1D2230_72%,#3365C8_100%)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0" />

      <div className="absolute left-4 top-4 z-10 max-w-[70%]">
        <div className="flex items-center gap-2 rounded-full bg-black/28 px-2.5 py-1.5 text-xs text-white/92 backdrop-blur-md">
          {contributor.avatarUrl ? (
            <Image
              src={contributor.avatarUrl}
              alt={contributor.name}
              width={28}
              height={28}
              className="rounded-full border border-white/50"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold">
              {contributor.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="truncate">{contributor.name}</span>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2.5">
        {["heart", "share", "rotate"].map((key) => (
          <span
            key={key}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/18 shadow-sm ring-1 ring-white/20 backdrop-blur-md"
          />
        ))}
      </div>

      <div className="absolute inset-x-4 bottom-4 z-10">
        <h2 className="max-w-[14ch] text-[1.72rem] font-semibold leading-[0.96] tracking-[-0.035em]">
          {form.title || fallbackTitle}
        </h2>
        {locationText ? (
          <span className="mt-3 inline-flex max-w-[92%] items-center gap-2 rounded-full bg-black/28 px-3 py-2 text-sm text-white/92 backdrop-blur-md">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{locationText}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ContributionForm() {
  const { locale, t } = useI18n();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState<ContributionPayload>(initialContributionForm);
  const [step, setStep] = useState<ContributionStep>("type");
  const [message, setMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [restoredFromDraft, setRestoredFromDraft] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<MediaPreviewMap>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRefs = useRef<Record<ContributionMediaKind, HTMLInputElement | null>>({
    image: null,
    video: null,
    audio: null,
  });

  const steps: Array<{ id: ContributionStep; label: string }> = [
    { id: "type", label: t("contribute.stepType") },
    { id: "content", label: t("contribute.stepContent") },
    { id: "review", label: t("contribute.stepPreview") },
  ];

  const activeStepIndex = getStepIndex(step);

  useEffect(() => {
    const savedDraft = loadContributionDraft();
    if (!savedDraft) {
      return;
    }

    setForm(savedDraft.form);
    setStep(savedDraft.step);
    setLastSavedAt(savedDraft.lastSavedAt);
    setRestoredFromDraft(true);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  useEffect(() => {
    const isPristine =
      JSON.stringify(form) === JSON.stringify(initialContributionForm) &&
      step === "type";

    if (isPristine) {
      clearContributionDraft();
      setLastSavedAt(null);
      return;
    }

    const savedAt = new Date().toISOString();
    saveContributionDraft({
      form,
      step,
      lastSavedAt: savedAt,
    });
    setLastSavedAt(savedAt);
  }, [form, step]);

  const updateForm = <K extends keyof ContributionPayload>(
    key: K,
    value: ContributionPayload[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validationError = useMemo(
    () => deriveValidationError(form, token, t),
    [form, t, token]
  );

  const mutation = useMutation({
    mutationFn: (payload: ContributionPayload) => {
      if (!token) {
        throw new Error(t("contribute.validation.login"));
      }

      return createContribution(payload, token);
    },
    onSuccess: () => {
      setMessage(t("contribute.sent"));
      clearDraftState();
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const clearDraftState = () => {
    clearContributionDraft();
    setForm(initialContributionForm);
    setStep("type");
    setLastSavedAt(null);
    setRestoredFromDraft(false);
    setPreviewUrls((current) => {
      Object.values(current).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      return {};
    });
    Object.values(fileInputRefs.current).forEach((input) => {
      if (input) {
        input.value = "";
      }
    });
  };

  const primaryKind = inferPrimaryKind(form);
  const primaryPreviewUrl =
    primaryKind === "text"
      ? undefined
      : previewUrls[primaryKind] ??
        previewUrls[form.media_items[0]?.kind as ContributionMediaKind | undefined ?? "image"];

  const applyComposerType = (nextType: ComposerContributionType) => {
    setMessage(null);
    setForm((current) => {
      if (nextType === "multi_media") {
        return {
          ...current,
          type: nextType,
          primary_media_kind:
            current.primary_media_kind === "text"
              ? "image"
              : current.primary_media_kind ?? "image",
        };
      }

      if (nextType === "single_media") {
        const firstMedia = current.media_items[0];
        const nextPrimary = current.primary_media_kind === "text"
          ? "text"
          : firstMedia?.kind ?? "image";
        return {
          ...current,
          type: nextType,
          media_items: firstMedia ? [firstMedia] : [],
          primary_media_kind: nextPrimary,
          text_content:
            nextPrimary === "text" ? current.text_content : current.text_content,
          event_date: "",
          end_date: "",
          price: "",
          address: "",
        };
      }

      const eventMedia = current.media_items[0];
      return {
        ...current,
        type: nextType,
        media_items: eventMedia ? [eventMedia] : [],
        primary_media_kind:
          current.primary_media_kind === "text"
            ? "text"
            : eventMedia?.kind ?? "image",
      };
    });
  };

  const handleMediaSelection = (
    kind: ContributionMediaKind,
    file: File | null
  ) => {
    if (!file) {
      return;
    }

    setPreviewUrls((current) => {
      if (current[kind]) {
        URL.revokeObjectURL(current[kind]!);
      }
      return {
        ...current,
        [kind]: URL.createObjectURL(file),
      };
    });

    setForm((current) => {
      const nextItems =
        current.type === "multi_media"
          ? replaceMediaItem(current.media_items, { kind, name: file.name })
          : [{ kind, name: file.name }];

      const nextPrimary =
        current.type === "multi_media"
          ? current.primary_media_kind === "text"
            ? kind
            : current.primary_media_kind ?? kind
          : kind;

      return {
        ...current,
        media_items: nextItems,
        primary_media_kind: nextPrimary,
      };
    });

    setMessage(null);
  };

  const clearMedia = (kind: ContributionMediaKind) => {
    setPreviewUrls((current) => {
      if (current[kind]) {
        URL.revokeObjectURL(current[kind]!);
      }
      const next = { ...current };
      delete next[kind];
      return next;
    });

    if (fileInputRefs.current[kind]) {
      fileInputRefs.current[kind]!.value = "";
    }

    setForm((current) => {
      const nextItems = removeMediaItem(current.media_items, kind);
      const nextPrimary =
        current.primary_media_kind === kind
          ? inferPrimaryKind({
              ...current,
              media_items: nextItems,
              primary_media_kind: undefined,
            })
          : current.primary_media_kind;

      return {
        ...current,
        media_items: nextItems,
        primary_media_kind: nextPrimary,
      };
    });
  };

  const handleSingleModePrimaryChange = (kind: ContributionPrimaryKind) => {
    setForm((current) => {
      if (kind === "text") {
        return {
          ...current,
          primary_media_kind: "text",
          media_items: [],
        };
      }

      const existing = getMediaItem(current.media_items, kind);
      return {
        ...current,
        primary_media_kind: kind,
        media_items: existing ? [existing] : [],
      };
    });
    setMessage(null);
  };

  const goNext = () => {
    if (step === "type") {
      setStep("content");
      setMessage(null);
      return;
    }

    if (step === "content") {
      if (validationError) {
        setMessage(validationError);
        return;
      }
      setMessage(null);
      setStep("review");
    }
  };

  const goBack = () => {
    if (step === "review") {
      setStep("content");
      return;
    }

    if (step === "content") {
      setStep("type");
    }
  };

  const reviewRows = [
    { label: t("contribute.summary.type"), value: t(`contribute.type.${form.type}` as never) },
    { label: t("contribute.summary.title"), value: form.title || t("contribute.summary.missing") },
    { label: t("contribute.summary.city"), value: form.city || t("contribute.summary.none") },
    { label: t("contribute.summary.address"), value: form.address || t("contribute.summary.none") },
    { label: t("contribute.summary.eventDate"), value: form.event_date || t("contribute.summary.none") },
    {
      label: t("contribute.summary.media"),
      value:
        form.media_items.length > 0
          ? form.media_items.map((item) => `${t(`contribute.media.${item.kind}` as never)} · ${item.name}`).join(" / ")
          : form.text_content?.trim()
            ? t("contribute.media.text")
            : t("contribute.summary.none"),
    },
  ];

  return (
    <div ref={containerRef} className="space-y-4">
      <ContributionSurface className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-plum">
              {t("contribute.studio")}
            </p>
            <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-ink">
              {step === "type"
                ? t("contribute.chooseTitle")
                : step === "content"
                  ? t("contribute.contentTitle")
                  : t("contribute.reviewTitle")}
            </h2>
          </div>
          <div className="rounded-full bg-blueSoft px-3 py-2 text-xs font-semibold text-blue">
            {activeStepIndex + 1}/{steps.length}
          </div>
        </div>

        <StepDots step={step} labels={steps} />

        <div className="flex items-center justify-between gap-3 text-xs text-graphite/72">
          <div>
            {restoredFromDraft
              ? t("contribute.draftRestored")
              : t("contribute.draftSaved")}
            {lastSavedAt
              ? ` ${new Intl.DateTimeFormat(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(lastSavedAt))}`
              : ""}
          </div>

          <button
            type="button"
            onClick={() => {
              clearDraftState();
              setMessage(null);
            }}
            className="font-semibold text-plum"
          >
            {t("contribute.clear")}
          </button>
        </div>
      </ContributionSurface>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (step !== "review") {
            return;
          }

          if (validationError) {
            setMessage(validationError);
            return;
          }

          mutation.mutate({
            ...form,
            primary_media_kind: inferPrimaryKind(form),
          });
        }}
      >
        {message ? (
          <ContributionSurface className="text-sm leading-6 text-graphite">
            {message}
          </ContributionSurface>
        ) : null}

        {step === "type" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TypeCard
              title={t("contribute.type.multi_media")}
              description={t("contribute.type.multi_media_desc")}
              active={form.type === "multi_media"}
              icon={ImagePlus}
              onClick={() => applyComposerType("multi_media")}
            />
            <TypeCard
              title={t("contribute.type.single_media")}
              description={t("contribute.type.single_media_desc")}
              active={form.type === "single_media"}
              icon={FileText}
              onClick={() => applyComposerType("single_media")}
            />
            <TypeCard
              title={t("contribute.type.event")}
              description={t("contribute.type.event_desc")}
              active={form.type === "event"}
              icon={CalendarClock}
              onClick={() => applyComposerType("event")}
            />
          </div>
        ) : null}

        {step === "content" ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <MediaPreview
                kind={primaryKind}
                previewUrl={primaryPreviewUrl}
                fallbackLabel={t("contribute.previewPlaceholder")}
              />

              <ContributionSurface className="space-y-4 bg-surface shadow-none">
                <FieldBlock
                  label={t("contribute.field.title")}
                  hint={t("contribute.field.title_hint")}
                >
                  <Input
                    placeholder={t("contribute.placeholder.title")}
                    value={form.title}
                    onChange={(event) => updateForm("title", event.target.value)}
                  />
                </FieldBlock>

                <FieldBlock
                  label={t("contribute.field.subtitle")}
                  hint={t("contribute.field.subtitle_hint")}
                >
                  <Input
                    placeholder={t("contribute.placeholder.subtitle")}
                    value={form.subtitle}
                    onChange={(event) => updateForm("subtitle", event.target.value)}
                  />
                </FieldBlock>

                <FieldBlock
                  label={t("contribute.field.caption")}
                  hint={t("contribute.field.caption_hint")}
                >
                  <Textarea
                    placeholder={t("contribute.placeholder.caption")}
                    value={form.description}
                    onChange={(event) => updateForm("description", event.target.value)}
                    className="min-h-36"
                  />
                </FieldBlock>
              </ContributionSurface>
            </div>

            <ContributionSurface className="space-y-4 bg-surface shadow-none">
              <div>
                <p className="text-base font-semibold text-ink">{t("contribute.mediaSection")}</p>
                <p className="mt-1 text-sm text-graphite/75">{t("contribute.mediaSectionHint")}</p>
              </div>

              {form.type === "multi_media" ? (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    {MEDIA_KINDS.map((kind) => (
                      <div key={kind}>
                        <MediaPicker
                          kind={kind}
                          label={t(`contribute.media.${kind}` as never)}
                          selected={getMediaItem(form.media_items, kind)}
                          previewUrl={previewUrls[kind]}
                          emptyLabel={t("contribute.media.noneSelected")}
                          replaceLabel={t("contribute.action.replace")}
                          chooseLabel={t("contribute.action.choose")}
                          onPick={() => fileInputRefs.current[kind]?.click()}
                          onRemove={() => clearMedia(kind)}
                        />
                        <input
                          ref={(node) => {
                            fileInputRefs.current[kind] = node;
                          }}
                          type="file"
                          accept={
                            kind === "image"
                              ? "image/*"
                              : kind === "video"
                                ? "video/*"
                                : "audio/*"
                          }
                          className="hidden"
                          onChange={(event) =>
                            handleMediaSelection(kind, event.target.files?.[0] ?? null)
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <FieldBlock
                    label={t("contribute.field.textContent")}
                    hint={t("contribute.field.textContent_hint")}
                  >
                    <Textarea
                      placeholder={t("contribute.placeholder.textContent")}
                      value={form.text_content}
                      onChange={(event) => updateForm("text_content", event.target.value)}
                    />
                  </FieldBlock>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {(["image", "video", "audio", "text"] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => handleSingleModePrimaryChange(kind)}
                        className={cn(
                          "rounded-full px-4 py-3 text-sm font-semibold transition",
                          primaryKind === kind
                            ? "bg-plum text-white"
                            : "bg-elevated text-ink ring-1 ring-borderSoft/10"
                        )}
                      >
                        {t(`contribute.media.${kind}` as never)}
                      </button>
                    ))}
                  </div>

                  {primaryKind === "text" ? (
                    <FieldBlock
                      label={t("contribute.field.textContent")}
                      hint={t("contribute.field.singleText_hint")}
                    >
                      <Textarea
                        placeholder={t("contribute.placeholder.textContent")}
                        value={form.text_content}
                        onChange={(event) => updateForm("text_content", event.target.value)}
                      />
                    </FieldBlock>
                  ) : (
                    <>
                      <MediaPicker
                        kind={primaryKind as ContributionMediaKind}
                        label={t(`contribute.media.${primaryKind}` as never)}
                        selected={getMediaItem(form.media_items, primaryKind as ContributionMediaKind)}
                        previewUrl={previewUrls[primaryKind as ContributionMediaKind]}
                        emptyLabel={t("contribute.media.noneSelected")}
                        replaceLabel={t("contribute.action.replace")}
                        chooseLabel={t("contribute.action.choose")}
                        onPick={() =>
                          fileInputRefs.current[primaryKind as ContributionMediaKind]?.click()
                        }
                        onRemove={() => clearMedia(primaryKind as ContributionMediaKind)}
                      />
                      <input
                        ref={(node) => {
                          fileInputRefs.current[primaryKind as ContributionMediaKind] = node;
                        }}
                        type="file"
                        accept={
                          primaryKind === "image"
                            ? "image/*"
                            : primaryKind === "video"
                              ? "video/*"
                              : "audio/*"
                        }
                        className="hidden"
                        onChange={(event) =>
                          handleMediaSelection(
                            primaryKind as ContributionMediaKind,
                            event.target.files?.[0] ?? null
                          )
                        }
                      />
                    </>
                  )}
                </>
              )}
            </ContributionSurface>

            <ContributionSurface className="space-y-4 bg-surface shadow-none">
              <div>
                <p className="text-base font-semibold text-ink">{t("contribute.contextSection")}</p>
                <p className="mt-1 text-sm text-graphite/75">{t("contribute.contextSectionHint")}</p>
              </div>

              <FieldBlock label={t("contribute.field.city")}>
                <Input
                  placeholder={t("contribute.placeholder.city")}
                  value={form.city}
                  onChange={(event) => updateForm("city", event.target.value)}
                />
              </FieldBlock>

              <FieldBlock label={t("contribute.field.address")}>
                <Input
                  placeholder={t("contribute.placeholder.address")}
                  value={form.address}
                  onChange={(event) => updateForm("address", event.target.value)}
                />
              </FieldBlock>

              <FieldBlock label={t("contribute.field.linkedPlace")}>
                <Input
                  placeholder={t("contribute.placeholder.linkedPlace")}
                  value={form.linked_place_name}
                  onChange={(event) => updateForm("linked_place_name", event.target.value)}
                />
              </FieldBlock>

              <FieldBlock label={t("contribute.field.linkedPerson")}>
                <Input
                  placeholder={t("contribute.placeholder.linkedPerson")}
                  value={form.linked_person_name}
                  onChange={(event) => updateForm("linked_person_name", event.target.value)}
                />
              </FieldBlock>

              <FieldBlock label={t("contribute.field.externalUrl")}>
                <Input
                  placeholder="https://"
                  value={form.external_url}
                  onChange={(event) => updateForm("external_url", event.target.value)}
                />
              </FieldBlock>

              {form.type === "event" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldBlock label={t("contribute.field.eventDate")}>
                    <Input
                      type="datetime-local"
                      value={form.event_date}
                      onChange={(event) => updateForm("event_date", event.target.value)}
                    />
                  </FieldBlock>

                  <FieldBlock label={t("contribute.field.endDate")}>
                    <Input
                      type="datetime-local"
                      value={form.end_date}
                      onChange={(event) => updateForm("end_date", event.target.value)}
                    />
                  </FieldBlock>

                  <FieldBlock label={t("contribute.field.price")}>
                    <Input
                      placeholder={t("contribute.placeholder.price")}
                      value={form.price}
                      onChange={(event) => updateForm("price", event.target.value)}
                    />
                  </FieldBlock>

                  <FieldBlock label={t("contribute.field.linkedEvent")}>
                    <Input
                      placeholder={t("contribute.placeholder.linkedEvent")}
                      value={form.linked_event_name}
                      onChange={(event) => updateForm("linked_event_name", event.target.value)}
                    />
                  </FieldBlock>
                </div>
              ) : null}
            </ContributionSurface>
          </div>
        ) : null}

        {step === "review" ? (
          <div className="space-y-4">
            <ContributionPreviewCard
              form={{ ...form, primary_media_kind: primaryKind }}
              previewUrl={primaryPreviewUrl}
              contributor={{
                name: user?.display_name ?? user?.username ?? t("contribute.fallback.you"),
                avatarUrl: user?.avatar_url ?? null,
              }}
              fallbackTitle={t("contribute.fallback.title")}
            />

            <ContributionSurface className="space-y-4 bg-surface shadow-none">
              <div className="rounded-[22px] bg-elevated px-4 py-4 ring-1 ring-borderSoft/10">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">
                  {t("contribute.reviewCaption")}
                </p>
                <p className="mt-3 text-sm leading-7 text-graphite">
                  {form.description || t("contribute.summary.missing")}
                </p>
              </div>

              {form.text_content?.trim() ? (
                <div className="rounded-[22px] bg-elevated px-4 py-4 ring-1 ring-borderSoft/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">
                    {t("contribute.field.textContent")}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-graphite">{form.text_content}</p>
                </div>
              ) : null}

              <div className="space-y-2">
                {reviewRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 rounded-[20px] bg-elevated px-4 py-3 ring-1 ring-borderSoft/10"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/65">
                      {row.label}
                    </p>
                    <p className="max-w-[60%] text-right text-sm text-ink">{row.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[22px] bg-blueSoft px-4 py-4 text-sm text-graphite">
                <p className="font-semibold text-plum">{t("contribute.reviewModerationTitle")}</p>
                <p className="mt-2 leading-6">{t("contribute.reviewModerationHint")}</p>
              </div>
            </ContributionSurface>
          </div>
        ) : null}

        <div className="sticky bottom-0 z-20 bg-[linear-gradient(180deg,rgba(233,233,233,0)_0%,rgba(233,233,233,0.92)_26%,rgba(233,233,233,1)_100%)] pt-6">
          <div className="rounded-[26px] bg-elevated/96 px-4 py-4 shadow-card ring-1 ring-borderSoft/10 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-xs text-graphite/70">
                {step !== "type" ? (
                  <Button type="button" variant="ghost" className="px-3 py-2" onClick={goBack}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {t("contribute.back")}
                  </Button>
                ) : (
                  <span>{t("contribute.flowCount")}</span>
                )}
              </div>

              {step !== "review" ? (
                <Button type="button" onClick={goNext}>
                  {t("contribute.next")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={mutation.isPending}>
                  <UploadCloud className="mr-2 h-5 w-5" />
                  {t("contribute.submit")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
