"use client";

import { useMutation } from "@tanstack/react-query";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Film,
  ImagePlus,
  MapPin,
  Newspaper,
  Mic2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";
import { createContribution } from "@/lib/api/endpoints";
import type { ContributionPayload } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

type ContributionType = ContributionPayload["type"];
type StepId = "type" | "media" | "details" | "review";
const stepOrder: StepId[] = ["type", "media", "details", "review"];

const initialForm: ContributionPayload = {
  type: "magazine",
  title: "",
  subtitle: "",
  description: "",
  city: "Strasbourg",
  address: "",
  neighborhood: "",
  opening_hours: "",
  role: "",
  event_date: "",
  end_date: "",
  price: "",
  media_name: "",
  media_kind: "image",
  external_url: "",
  linked_place_name: "",
  linked_person_name: "",
  linked_event_name: "",
};

const typeMeta: Record<
  ContributionType,
  {
    label: string;
    teaser: string;
    helper: string;
    icon: typeof Newspaper;
  }
> = {
  magazine: {
    label: "Magazine",
    teaser: "Une capsule editoriale courte, comme un post inspire.",
    helper: "Ideal pour un angle, une anecdote ou une recommandation.",
    icon: Newspaper,
  },
  place: {
    label: "Lieu",
    teaser: "Un endroit utile ou remarquable a ajouter au graphe.",
    helper: "Adresse, ambiance et infos pratiques en un seul post.",
    icon: MapPin,
  },
  person: {
    label: "Personne",
    teaser: "Un profil, un artiste, une rencontre ou une personnalite.",
    helper: "Ajoutez son role et ce qui le relie au territoire.",
    icon: UserRound,
  },
  event: {
    label: "Evenement",
    teaser: "Un rendez-vous date avec son lieu et ses details.",
    helper: "Parfait pour un spectacle, une expo ou une sortie.",
    icon: CalendarClock,
  },
};

const stepCopy: Record<
  StepId,
  { eyebrow: string; title: string; description: string }
> = {
  type: {
    eyebrow: "Nouvelle publication",
    title: "Choisissez le format",
    description: "Comme sur Instagram, on commence par le type de publication.",
  },
  media: {
    eyebrow: "Nouvelle publication",
    title: "Ajoutez votre visuel",
    description: "Selectionnez l'image ou la video principale de la carte.",
  },
  details: {
    eyebrow: "Nouvelle publication",
    title: "Ecrivez la legende",
    description: "Ajoutez le texte, le lieu et les champs utiles a votre carte.",
  },
  review: {
    eyebrow: "Nouvelle publication",
    title: "Verifier avant d'envoyer",
    description: "Votre proposition partira ensuite en attente de validation.",
  },
};

function getStepIndex(step: StepId) {
  return stepOrder.indexOf(step);
}

function deriveTypeSpecificError(form: ContributionPayload) {
  if (!form.title.trim()) {
    return "Ajoutez un titre ou un nom pour cette carte.";
  }

  if (!form.description.trim()) {
    return "Ajoutez une legende ou un texte editorial.";
  }

  switch (form.type) {
    case "place":
      if (!form.address?.trim()) {
        return "Ajoutez l'adresse du lieu.";
      }
      return null;
    case "person":
      if (!form.role?.trim()) {
        return "Ajoutez le role de cette personne.";
      }
      return null;
    case "event":
      if (!form.event_date?.trim()) {
        return "Ajoutez la date de l'evenement.";
      }
      if (!form.address?.trim() && !form.linked_place_name?.trim()) {
        return "Ajoutez un lieu ou une adresse pour l'evenement.";
      }
      return null;
    default:
      return null;
  }
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
        {hint ? <p className="text-xs leading-5 text-graphite/75">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[26px] bg-white px-4 py-4 shadow-card", className)}>
      {children}
    </div>
  );
}

function StepDots({
  step,
  labels,
}: {
  step: StepId;
  labels: Array<{ id: StepId; label: string }>;
}) {
  const activeIndex = getStepIndex(step);

  return (
    <div className="flex items-center gap-2">
      {labels.map((entry, index) => {
        const active = entry.id === step;
        const complete = index < activeIndex;

        return (
          <div
            key={entry.id}
            className={cn(
              "h-2.5 rounded-full transition-all",
              active ? "w-10 bg-plum" : "w-2.5",
              complete ? "bg-plum/55" : active ? "" : "bg-borderSoft"
            )}
            aria-label={entry.label}
          />
        );
      })}
    </div>
  );
}

function TypeCard({
  active,
  label,
  teaser,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  teaser: string;
  icon: typeof Newspaper;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex aspect-square flex-col items-start justify-between rounded-[24px] border px-4 py-4 text-left transition",
        active
          ? "border-plum bg-[linear-gradient(160deg,#6A2BE8_0%,#8F61F5_100%)] text-white shadow-float"
          : "border-borderSoft bg-[#FCFAF8] text-ink"
      )}
    >
      <div
        className={cn(
          "rounded-2xl p-3",
          active ? "bg-white/15 text-white" : "bg-plum/10 text-plum"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-base font-semibold">{label}</p>
        <p className={cn("mt-2 text-xs leading-5", active ? "text-white/80" : "text-graphite/75")}>
          {teaser}
        </p>
      </div>
    </button>
  );
}

export function ContributionForm() {
  const { t } = useI18n();
  const token = useAuthStore((state) => state.token);
  const [form, setForm] = useState<ContributionPayload>(initialForm);
  const [step, setStep] = useState<StepId>("type");
  const [message, setMessage] = useState<string | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeStepIndex = getStepIndex(step);
  const currentTypeMeta = typeMeta[form.type];
  const currentStepCopy = stepCopy[step];
  const steps: Array<{ id: StepId; label: string }> = [
    { id: "type", label: t("contribute.stepType") },
    { id: "media", label: t("contribute.stepMedia") },
    { id: "details", label: t("contribute.stepDetails") },
    { id: "review", label: t("contribute.stepPreview") },
  ];

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    };
  }, [mediaPreviewUrl]);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const updateForm = <K extends keyof ContributionPayload>(
    key: K,
    value: ContributionPayload[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validationError = useMemo(() => {
    if (!token) {
      return "Connectez-vous pour envoyer une contribution.";
    }

    if (!form.media_name?.trim()) {
      return "Ajoutez un media pour cette contribution.";
    }

    return deriveTypeSpecificError(form);
  }, [form, token]);

  const mutation = useMutation({
    mutationFn: (payload: ContributionPayload) => {
      if (!token) {
        throw new Error("Authentification requise.");
      }

      return createContribution(payload, token);
    },
    onSuccess: () => {
      setMessage(t("contribute.sent"));
      setForm(initialForm);
      setStep("type");
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
      setMediaPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const goNext = () => {
    if (step === "type") {
      setMessage(null);
      setStep("media");
      return;
    }

    if (step === "media") {
      if (!form.media_name?.trim()) {
        setMessage("Ajoutez d'abord une image, une video ou au moins un nom d'asset.");
        return;
      }
      setMessage(null);
      setStep("details");
      return;
    }

    if (step === "details") {
      const detailError = deriveTypeSpecificError(form);
      if (detailError) {
        setMessage(detailError);
        return;
      }
      setMessage(null);
      setStep("review");
    }
  };

  const goBack = () => {
    if (step === "media") {
      setStep("type");
      return;
    }

    if (step === "details") {
      setStep("media");
      return;
    }

    if (step === "review") {
      setStep("details");
    }
  };

  const handleMediaSelection = (file: File | null) => {
    if (!file) {
      return;
    }

    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(nextPreviewUrl);
    updateForm("media_name", file.name);
    updateForm(
      "media_kind",
      file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
          ? "audio"
          : "image"
    );
    setMessage(null);
  };

  const clearMedia = () => {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaPreviewUrl(null);
    updateForm("media_name", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderMediaPreview = () => {
    if (!mediaPreviewUrl) {
      return (
        <div className="flex aspect-[4/5] items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,#FBF6F1_0%,#EFE5DA_100%)] text-center ring-1 ring-borderSoft">
          <div className="max-w-[16rem] space-y-3 px-6 text-graphite">
            {form.media_kind === "video" ? (
              <Film className="mx-auto h-10 w-10 text-plum" />
            ) : form.media_kind === "audio" ? (
              <Mic2 className="mx-auto h-10 w-10 text-plum" />
            ) : (
              <ImagePlus className="mx-auto h-10 w-10 text-plum" />
            )}
            <p className="text-base font-semibold text-ink">
              Votre couverture apparaitra ici
            </p>
            <p className="text-xs leading-5 text-graphite/75">
              Ajoutez un visuel principal avant de continuer.
            </p>
          </div>
        </div>
      );
    }

    if (form.media_kind === "video") {
      return (
        <video
          src={mediaPreviewUrl}
          controls
          className="aspect-[4/5] w-full rounded-[28px] object-cover shadow-card"
        />
      );
    }

    if (form.media_kind === "audio") {
      return (
        <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#1D2230_0%,#6A2BE8_100%)] px-5 py-8 text-white shadow-card">
          <div className="flex aspect-[4/5] flex-col justify-between">
            <div className="rounded-full bg-white/15 p-3 text-white w-fit">
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
              <audio src={mediaPreviewUrl} controls className="w-full" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <img
        src={mediaPreviewUrl}
        alt="Preview"
        className="aspect-[4/5] w-full rounded-[28px] object-cover shadow-card"
      />
    );
  };

  const renderTypeStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(typeMeta) as Array<[ContributionType, (typeof typeMeta)[ContributionType]]>).map(
          ([type, meta]) => (
            <TypeCard
              key={type}
              active={form.type === type}
              label={meta.label}
              teaser={meta.teaser}
              icon={meta.icon}
              onClick={() => updateForm("type", type)}
            />
          )
        )}
      </div>

      <Surface className="bg-[#FCFAF8] shadow-none ring-1 ring-borderSoft">
        <p className="text-sm font-semibold text-ink">{currentTypeMeta.label}</p>
        <p className="mt-2 text-sm leading-6 text-graphite">{currentTypeMeta.helper}</p>
      </Surface>
    </div>
  );

  const renderMediaStep = () => (
    <div className="space-y-4">
      {renderMediaPreview()}

      <Surface className="space-y-4 bg-[#FCFAF8] shadow-none ring-1 ring-borderSoft">
        <div className="grid grid-cols-2 gap-2">
          {(["image", "video", "audio"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => updateForm("media_kind", kind)}
              className={cn(
                "rounded-full px-4 py-3 text-sm font-semibold transition",
                form.media_kind === kind
                  ? "bg-plum text-white"
                  : "bg-white text-graphite ring-1 ring-borderSoft"
              )}
            >
              {kind === "image" ? "Image" : kind === "video" ? "Video" : "Audio"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            {form.media_kind === "video" ? (
              <Film className="mr-2 h-5 w-5" />
            ) : form.media_kind === "audio" ? (
              <Mic2 className="mr-2 h-5 w-5" />
            ) : (
              <ImagePlus className="mr-2 h-5 w-5" />
            )}
            Choisir{" "}
            {form.media_kind === "video"
              ? "une video"
              : form.media_kind === "audio"
                ? "un audio"
                : "une image"}
          </Button>

          {form.media_name ? (
            <Button type="button" variant="secondary" className="w-full shadow-none" onClick={clearMedia}>
              <X className="mr-2 h-4 w-4" />
              Retirer le media
            </Button>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept={
              form.media_kind === "video"
                ? "video/*"
                : form.media_kind === "audio"
                  ? "audio/*"
                  : "image/*,video/*,audio/*"
            }
            className="hidden"
            onChange={(event) => handleMediaSelection(event.target.files?.[0] ?? null)}
          />
        </div>

        <FieldBlock
          label="Nom du fichier"
          hint="Gardez ce champ si l'asset definitif sera remplace plus tard."
        >
          <Input
            placeholder="ex: capsule_musee_wurth.mp4"
            value={form.media_name}
            onChange={(event) => updateForm("media_name", event.target.value)}
          />
        </FieldBlock>
      </Surface>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-4">
      <Surface className="space-y-4 bg-[#FCFAF8] shadow-none ring-1 ring-borderSoft">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-[20px] bg-mist">
            {mediaPreviewUrl ? (
              form.media_kind === "video" ? (
                <video
                  src={mediaPreviewUrl}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <img src={mediaPreviewUrl} alt="Preview" className="h-full w-full object-cover" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#EFE5DA] text-plum">
                {form.media_kind === "video" ? (
                  <Film className="h-5 w-5" />
                ) : form.media_kind === "audio" ? (
                  <Mic2 className="h-5 w-5" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">
              {currentTypeMeta.label}
            </p>
            <p className="truncate text-base font-semibold text-ink">
              {form.title || "Titre de la publication"}
            </p>
            <p className="truncate text-sm text-graphite/70">
              {form.subtitle || "Ajoutez une accroche ou un sous-titre"}
            </p>
          </div>
        </div>

        <FieldBlock
          label={form.type === "person" ? "Nom de la personne" : "Titre"}
          hint="Le titre principal visible dans le feed."
        >
          <Input
            placeholder={
              form.type === "place"
                ? "ex: Piscine du Wacken"
                : form.type === "person"
                  ? "ex: Juliette Steiner"
                  : form.type === "event"
                    ? "ex: Demolition Day"
                    : "ex: Merci mon lapin !"
            }
            value={form.title}
            onChange={(event) => updateForm("title", event.target.value)}
          />
        </FieldBlock>

        <FieldBlock
          label="Sous-titre"
          hint="Optionnel, pour donner tout de suite la bonne lecture."
        >
          <Input
            placeholder="ex: pour les enfants, expo, capsule urbaine..."
            value={form.subtitle}
            onChange={(event) => updateForm("subtitle", event.target.value)}
          />
        </FieldBlock>

        <FieldBlock
          label="Legende"
          hint="Ecrivez ici comme une vraie publication mobile."
        >
          <Textarea
            placeholder="Racontez l'histoire, l'ambiance, ce qu'il faut retenir..."
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            className="min-h-40"
          />
        </FieldBlock>
      </Surface>

      <Surface className="space-y-4 bg-[#FCFAF8] shadow-none ring-1 ring-borderSoft">
        <div>
          <p className="text-base font-semibold text-ink">Lieu et graphe</p>
          <p className="mt-1 text-sm text-graphite/75">
            Ajoutez seulement les liens utiles a cette carte.
          </p>
        </div>

        <FieldBlock label="Ville">
          <Input
            placeholder="ex: Strasbourg"
            value={form.city}
            onChange={(event) => updateForm("city", event.target.value)}
          />
        </FieldBlock>

        {(form.type === "place" || form.type === "event") ? (
          <FieldBlock label="Adresse">
            <Input
              placeholder="ex: 1 Rue du Bain aux Plantes"
              value={form.address}
              onChange={(event) => updateForm("address", event.target.value)}
            />
          </FieldBlock>
        ) : null}

        <FieldBlock label="Lieu lie">
          <Input
            placeholder="ex: Musee Wurth | Erstein"
            value={form.linked_place_name}
            onChange={(event) => updateForm("linked_place_name", event.target.value)}
          />
        </FieldBlock>

        <FieldBlock label="Personne liee">
          <Input
            placeholder="ex: Tomi Ungerer"
            value={form.linked_person_name}
            onChange={(event) => updateForm("linked_person_name", event.target.value)}
          />
        </FieldBlock>

        {(form.type === "magazine" || form.type === "person") ? (
          <FieldBlock label="Evenement lie">
            <Input
              placeholder="ex: ouverture, spectacle, rencontre"
              value={form.linked_event_name}
              onChange={(event) => updateForm("linked_event_name", event.target.value)}
            />
          </FieldBlock>
        ) : null}
      </Surface>

      <Surface className="space-y-4 bg-[#FCFAF8] shadow-none ring-1 ring-borderSoft">
        <div>
          <p className="text-base font-semibold text-ink">Details supplementaires</p>
          <p className="mt-1 text-sm text-graphite/75">
            Ces champs s'adaptent au type de publication.
          </p>
        </div>

        {form.type === "place" ? (
          <>
            <FieldBlock label="Quartier / precision">
              <Input
                placeholder="ex: pres du tram, entree cour laterale"
                value={form.neighborhood}
                onChange={(event) => updateForm("neighborhood", event.target.value)}
              />
            </FieldBlock>
            <FieldBlock label="Horaires">
              <Input
                placeholder="ex: mar-dim 10h-18h"
                value={form.opening_hours}
                onChange={(event) => updateForm("opening_hours", event.target.value)}
              />
            </FieldBlock>
          </>
        ) : null}

        {form.type === "person" ? (
          <FieldBlock label="Role">
            <Input
              placeholder="ex: illustrateur, commissaire, musicienne"
              value={form.role}
              onChange={(event) => updateForm("role", event.target.value)}
            />
          </FieldBlock>
        ) : null}

        {form.type === "event" ? (
          <>
            <FieldBlock label="Date et heure de debut">
              <Input
                type="datetime-local"
                value={form.event_date}
                onChange={(event) => updateForm("event_date", event.target.value)}
              />
            </FieldBlock>
            <FieldBlock label="Date de fin">
              <Input
                type="datetime-local"
                value={form.end_date}
                onChange={(event) => updateForm("end_date", event.target.value)}
              />
            </FieldBlock>
            <FieldBlock label="Prix">
              <Input
                placeholder="ex: 12 EUR / gratuit"
                value={form.price}
                onChange={(event) => updateForm("price", event.target.value)}
              />
            </FieldBlock>
          </>
        ) : null}

        <FieldBlock
          label="Lien externe"
          hint="Billetterie, site officiel, note editoriale ou reference."
        >
          <Input
            placeholder="https://..."
            value={form.external_url}
            onChange={(event) => updateForm("external_url", event.target.value)}
          />
        </FieldBlock>
      </Surface>
    </div>
  );

  const reviewRows = [
    { label: "Type", value: currentTypeMeta.label },
    { label: "Titre", value: form.title || "A renseigner" },
    { label: "Ville", value: form.city || "Aucune" },
    { label: "Adresse", value: form.address || "Aucune" },
    { label: "Role", value: form.role || "Aucun" },
    { label: "Date", value: form.event_date || "Aucune" },
    { label: "Prix", value: form.price || "Aucun" },
    { label: "Lieu lie", value: form.linked_place_name || "Aucun" },
    { label: "Personne liee", value: form.linked_person_name || "Aucune" },
    { label: "Evenement lie", value: form.linked_event_name || "Aucun" },
  ].filter((row) => row.value !== "Aucune" && row.value !== "Aucun");

  const renderReviewStep = () => {
    const TypeIcon = currentTypeMeta.icon;

    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[28px] bg-editorial text-white shadow-card">
          <div className="relative aspect-[4/5]">
            {mediaPreviewUrl ? (
              form.media_kind === "video" ? (
                <video
                  src={mediaPreviewUrl}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
              ) : form.media_kind === "audio" ? (
                <div className="flex h-full w-full flex-col justify-between bg-[linear-gradient(160deg,#1D2230_0%,#6A2BE8_100%)] px-5 py-5">
                  <div className="rounded-full bg-white/15 p-3 text-white w-fit">
                    <Mic2 className="h-6 w-6" />
                  </div>
                  <audio src={mediaPreviewUrl} controls className="w-full" />
                </div>
              ) : (
                <img src={mediaPreviewUrl} alt="Preview" className="h-full w-full object-cover" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(160deg,#6A2BE8_0%,#1D2230_100%)]">
                <TypeIcon className="h-10 w-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute left-4 top-4 rounded-full bg-black/25 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-md">
              {currentTypeMeta.label}
            </div>
            <div className="absolute inset-x-4 bottom-4">
              <p className="text-[1.7rem] font-semibold leading-[0.95] tracking-[-0.03em]">
                {form.title || currentTypeMeta.label}
              </p>
              {form.subtitle ? (
                <p className="mt-2 text-sm text-white/85">{form.subtitle}</p>
              ) : null}
              {form.city ? (
                <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/28 px-3 py-2 text-sm text-white/92 backdrop-blur-md">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {form.city}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <Surface className="space-y-4 bg-[#FCFAF8] shadow-none ring-1 ring-borderSoft">
          <div className="rounded-[22px] bg-white px-4 py-4 ring-1 ring-borderSoft">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">
              Legende
            </p>
            <p className="mt-3 text-sm leading-7 text-graphite">
              {form.description || "Aucune legende pour le moment."}
            </p>
          </div>

          <div className="space-y-2">
            {reviewRows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 rounded-[20px] bg-white px-4 py-3 ring-1 ring-borderSoft"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/65">
                  {row.label}
                </p>
                <p className="max-w-[60%] text-right text-sm text-ink">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[22px] bg-[#F8F0FF] px-4 py-4 text-sm text-graphite">
            <p className="font-semibold text-plum">Moderation</p>
            <p className="mt-2 leading-6">
              Une fois envoyee, votre publication restera en attente jusqu'a validation.
            </p>
          </div>
        </Surface>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="space-y-4">
      <Surface className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-plum">
              {t("contribute.studio")}
            </p>
            <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-ink">
              {currentStepCopy.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-graphite">
              {currentStepCopy.description}
            </p>
          </div>
          <div className="rounded-full bg-[#F8F0FF] px-3 py-2 text-xs font-semibold text-plum">
            {activeStepIndex + 1}/{steps.length}
          </div>
        </div>
        <StepDots step={step} labels={steps} />
      </Surface>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (validationError) {
            setMessage(validationError);
            return;
          }

          mutation.mutate(form);
        }}
      >
        {message ? (
          <Surface className="text-sm leading-6 text-graphite">{message}</Surface>
        ) : null}

        {step === "type" ? renderTypeStep() : null}
        {step === "media" ? renderMediaStep() : null}
        {step === "details" ? renderDetailsStep() : null}
        {step === "review" ? renderReviewStep() : null}

        <div className="sticky bottom-4 z-10 rounded-[26px] bg-white/96 px-4 py-4 shadow-card backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-graphite/70">
              {step !== "type" ? (
                <Button type="button" variant="ghost" className="px-3 py-2" onClick={goBack}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t("contribute.back")}
                </Button>
              ) : (
                <>
                  <Clock3 className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-2">{t("contribute.path")}</span>
                </>
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
      </form>
    </div>
  );
}
