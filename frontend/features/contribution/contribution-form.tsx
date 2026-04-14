"use client";

import { useMutation } from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Film,
  ImagePlus,
  MapPin,
  Newspaper,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { createContribution } from "@/lib/api/endpoints";
import type { ContributionPayload } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

type ContributionType = ContributionPayload["type"];

type StepId = "type" | "media" | "details" | "review";

const steps: Array<{ id: StepId; label: string; short: string }> = [
  { id: "type", label: "Type", short: "01" },
  { id: "media", label: "Media", short: "02" },
  { id: "details", label: "Details", short: "03" },
  { id: "review", label: "Review", short: "04" },
];

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
    teaser: "Une capsule editoriale, une anecdote, un angle narratif.",
    helper: "Ideal pour raconter une histoire courte reliee a une carte existante.",
    icon: Newspaper,
  },
  place: {
    label: "Lieu",
    teaser: "Un endroit a ajouter au graphe avec ses infos pratiques.",
    helper: "Parfait pour un musee, un cafe, un parc ou une adresse utile.",
    icon: MapPin,
  },
  person: {
    label: "Personne",
    teaser: "Un profil, un artiste, un acteur local, une rencontre.",
    helper: "Ajoutez un role, un contexte et les liens avec le territoire.",
    icon: UserRound,
  },
  event: {
    label: "Evenement",
    teaser: "Un rendez-vous date, situe, avec prix ou infos utiles.",
    helper: "Ajoutez la temporalite et les lieux/personnes rattaches.",
    icon: CalendarClock,
  },
};

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
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        {hint ? <p className="text-xs leading-5 text-graphite/75">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function StepPill({
  active,
  complete,
  short,
  label,
}: {
  active: boolean;
  complete: boolean;
  short: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-full px-3 py-2 text-sm transition",
        active
          ? "bg-plum text-white shadow-float"
          : complete
            ? "bg-[#E9F5EE] text-[#246B45]"
            : "bg-white text-graphite ring-1 ring-borderSoft"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
          active
            ? "bg-white/15 text-white"
            : complete
              ? "bg-[#246B45] text-white"
              : "bg-mist text-graphite"
        )}
      >
        {complete ? <Check className="h-4 w-4" /> : short}
      </span>
      <span className="truncate font-semibold">{label}</span>
    </div>
  );
}

function getStepIndex(step: StepId) {
  return steps.findIndex((entry) => entry.id === step);
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

export function ContributionForm() {
  const token = useAuthStore((state) => state.token);
  const [form, setForm] = useState<ContributionPayload>(initialForm);
  const [step, setStep] = useState<StepId>("type");
  const [message, setMessage] = useState<string | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeStepIndex = getStepIndex(step);
  const currentTypeMeta = typeMeta[form.type];

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    };
  }, [mediaPreviewUrl]);

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
      setMessage("Contribution envoyee. Elle est maintenant en attente de validation.");
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
        : "image"
    );
    setMessage(null);
  };

  const renderTypeStep = () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-plum">Etape 1</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Que voulez-vous publier ?</h2>
        <p className="mt-2 text-sm leading-6 text-graphite">
          Commencez comme sur Instagram ou TikTok: choisissez le format de votre carte, puis nous
          adaptons les champs utiles pour la suite.
        </p>
      </div>

      <div className="grid gap-3">
        {(Object.entries(typeMeta) as Array<[ContributionType, (typeof typeMeta)[ContributionType]]>).map(
          ([type, meta]) => {
            const Icon = meta.icon;
            const active = form.type === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => updateForm("type", type)}
                className={cn(
                  "rounded-[28px] border px-4 py-4 text-left transition",
                  active
                    ? "border-plum bg-plum text-white shadow-float"
                    : "border-borderSoft bg-white text-ink"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "rounded-2xl p-3",
                      active ? "bg-white/15 text-white" : "bg-plum/10 text-plum"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold">{meta.label}</p>
                    <p className={cn("mt-1 text-sm", active ? "text-white/85" : "text-graphite")}>
                      {meta.teaser}
                    </p>
                    <p className={cn("mt-2 text-xs", active ? "text-white/75" : "text-graphite/70")}>
                      {meta.helper}
                    </p>
                  </div>
                </div>
              </button>
            );
          }
        )}
      </div>
    </div>
  );

  const renderMediaPreview = () => {
    if (!mediaPreviewUrl) {
      return (
        <div className="flex aspect-[4/5] items-center justify-center rounded-[28px] border border-dashed border-borderSoft bg-[#F8F5F1] text-center">
          <div className="max-w-[16rem] space-y-3 px-6 text-graphite">
            {form.media_kind === "video" ? (
              <Film className="mx-auto h-9 w-9 text-plum" />
            ) : (
              <ImagePlus className="mx-auto h-9 w-9 text-plum" />
            )}
            <p className="font-display text-base font-semibold">Ajoutez un media pour commencer votre carte</p>
            <p className="text-xs leading-5 text-graphite/75">
              Une image ou une video donnera le ton de votre capsule.
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

    return (
      <img
        src={mediaPreviewUrl}
        alt="Preview"
        className="aspect-[4/5] w-full rounded-[28px] object-cover shadow-card"
      />
    );
  };

  const renderMediaStep = () => (
    <div className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-plum">Etape 2</p>
        <h2 className="font-display mt-2 text-[2rem] font-semibold tracking-[-0.02em] text-ink">Choisissez votre media</h2>
        <p className="mt-2 text-sm leading-6 text-graphite">
          Ajoutez d'abord le visuel principal de la carte. Vous pouvez importer un fichier ou
          simplement renseigner son nom si l'asset final sera ajoute plus tard.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
        <div>{renderMediaPreview()}</div>

        <div className="space-y-4 rounded-[28px] bg-white px-4 py-4 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            {(["image", "video"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => updateForm("media_kind", kind)}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  form.media_kind === kind
                    ? "bg-plum text-white"
                    : "bg-[#F6F2ED] text-graphite"
                )}
              >
                {kind === "image" ? "Image" : "Video"}
              </button>
            ))}
          </div>

          <div className="rounded-[24px] border border-dashed border-borderSoft bg-[#FCFAF8] px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-plum/10 p-3 text-plum">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink">Importer un media</p>
                <p className="text-xs leading-5 text-graphite/75">
                  Image ou video. Nous gardons pour l'instant le nom du fichier cote backend.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={form.media_kind === "video" ? "video/*" : "image/*,video/*"}
              className="hidden"
              onChange={(event) => handleMediaSelection(event.target.files?.[0] ?? null)}
            />

            <Button
              type="button"
              variant="secondary"
              className="mt-4 w-full rounded-3xl"
              onClick={() => fileInputRef.current?.click()}
            >
              {form.media_kind === "video" ? (
                <Film className="mr-2 h-5 w-5" />
              ) : (
                <ImagePlus className="mr-2 h-5 w-5" />
              )}
              Choisir {form.media_kind === "video" ? "une video" : "une image"}
            </Button>
          </div>

          <FieldBlock
            label="Nom de l'asset"
            hint="Utile si le media final sera remplace plus tard par votre equipe."
          >
            <Input
              placeholder="ex: wurth_capsule_finale.mp4"
              value={form.media_name}
              onChange={(event) => updateForm("media_name", event.target.value)}
            />
          </FieldBlock>
        </div>
      </div>
    </div>
  );

  const renderGraphFields = () => (
    <div className="grid gap-3 md:grid-cols-2">
      <FieldBlock
        label="Lieu lie"
        hint="Nom du lieu deja connu ou a creer."
      >
        <Input
          placeholder="ex: Musee Wurth | Erstein"
          value={form.linked_place_name}
          onChange={(event) => updateForm("linked_place_name", event.target.value)}
        />
      </FieldBlock>
      <FieldBlock
        label="Personne liee"
        hint="Artiste, habitant, contributeur, intervenant."
      >
        <Input
          placeholder="ex: Tomi Ungerer"
          value={form.linked_person_name}
          onChange={(event) => updateForm("linked_person_name", event.target.value)}
        />
      </FieldBlock>
    </div>
  );

  const renderDetailStep = () => (
    <div className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-plum">Etape 3</p>
        <h2 className="font-display mt-2 text-[2rem] font-semibold tracking-[-0.02em] text-ink">
          Ajoutez le contexte de votre {currentTypeMeta.label.toLowerCase()}
        </h2>
        <p className="mt-2 text-sm leading-6 text-graphite">
          Ecrivez comme une vraie publication: un titre, une legende, puis les infos qui donnent
          envie d'ouvrir la carte.
        </p>
      </div>

      <div className="space-y-4 rounded-[28px] bg-white px-4 py-4 shadow-sm">
        <FieldBlock
          label={form.type === "person" ? "Nom de la personne" : "Titre de la carte"}
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
          label={
            form.type === "person"
              ? "Sous-titre / posture editoriale"
              : "Accroche ou sous-titre"
          }
          hint="Optionnel mais tres utile pour donner une lecture immediate."
        >
          <Input
            placeholder={
              form.type === "person"
                ? "ex: metteuse en scene, plasticienne et pedagogue"
                : "ex: capsule urbaine, insolite, pour les enfants..."
            }
            value={form.subtitle}
            onChange={(event) => updateForm("subtitle", event.target.value)}
          />
        </FieldBlock>

        <FieldBlock
          label="Legende / caption"
          hint="Le texte principal du post. Racontez l'histoire, l'ambiance et les liens possibles."
        >
          <Textarea
            placeholder="Ecrivez le recit editorial, ce qu'il faut retenir, pourquoi cette carte merite d'exister..."
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
          />
        </FieldBlock>
      </div>

      <div className="space-y-4 rounded-[28px] bg-white px-4 py-4 shadow-sm">
        <div>
          <p className="text-base font-semibold text-ink">Infos contextuelles</p>
          <p className="text-sm text-graphite/75">
            Ces champs evoluent selon le type de carte choisi.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <FieldBlock label="Ville">
            <Input
              placeholder="ex: Strasbourg"
              value={form.city}
              onChange={(event) => updateForm("city", event.target.value)}
            />
          </FieldBlock>

          {(form.type === "place" || form.type === "event") && (
            <FieldBlock
              label="Adresse"
              hint={form.type === "event" ? "Lieu physique ou adresse du rendez-vous." : undefined}
            >
              <Input
                placeholder="ex: 1 Rue du Bain aux Plantes"
                value={form.address}
                onChange={(event) => updateForm("address", event.target.value)}
              />
            </FieldBlock>
          )}

          {form.type === "place" && (
            <>
              <FieldBlock label="Quartier / precision">
                <Input
                  placeholder="ex: pres du centre, a deux pas du tram"
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
          )}

          {form.type === "person" && (
            <FieldBlock label="Role">
              <Input
                placeholder="ex: illustrateur, commissaire, musicienne"
                value={form.role}
                onChange={(event) => updateForm("role", event.target.value)}
              />
            </FieldBlock>
          )}

          {form.type === "event" && (
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
          )}

          {form.type === "magazine" && (
            <FieldBlock label="Evenement lie">
              <Input
                placeholder="ex: Chasse aux oeufs"
                value={form.linked_event_name}
                onChange={(event) => updateForm("linked_event_name", event.target.value)}
              />
            </FieldBlock>
          )}
        </div>

        {renderGraphFields()}

        {form.type === "person" ? (
          <FieldBlock label="Evenement lie">
            <Input
              placeholder="ex: ouverture d'exposition, spectacle, rencontre"
              value={form.linked_event_name}
              onChange={(event) => updateForm("linked_event_name", event.target.value)}
            />
          </FieldBlock>
        ) : null}

        {form.type === "event" ? (
          <FieldBlock label="Personne liee">
            <Input
              placeholder="ex: compagnie invitee, intervenant, artiste"
              value={form.linked_person_name}
              onChange={(event) => updateForm("linked_person_name", event.target.value)}
            />
          </FieldBlock>
        ) : null}

        <FieldBlock
          label="Lien externe ou reference"
          hint="Billetterie, site officiel, note editoriale, source de verification."
        >
          <Input
            placeholder="https://..."
            value={form.external_url}
            onChange={(event) => updateForm("external_url", event.target.value)}
          />
        </FieldBlock>
      </div>
    </div>
  );

  const reviewRows = [
    { label: "Type", value: currentTypeMeta.label },
    { label: "Media", value: form.media_name || "Aucun media" },
    { label: "Titre", value: form.title || "A renseigner" },
    { label: "Sous-titre", value: form.subtitle || "Aucun" },
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
      <div className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-plum">Etape 4</p>
        <h2 className="font-display mt-2 text-[2rem] font-semibold tracking-[-0.02em] text-ink">Verifiez avant publication</h2>
        <p className="mt-2 text-sm leading-6 text-graphite">
          Vous etes sur l'ecran final avant envoi. La contribution partira ensuite en moderation
          avec le statut <span className="font-semibold">pending</span>.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 rounded-[28px] bg-white px-4 py-4 shadow-sm">
          {renderMediaPreview()}
          <div className="rounded-[24px] bg-[#FCFAF8] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum">
              Caption
            </p>
            <p className="mt-3 text-sm leading-7 text-graphite">
              {form.description || "Aucune legende pour le moment."}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-plum/10 p-3 text-plum">
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-ink">{form.title || currentTypeMeta.label}</p>
              <p className="text-sm text-graphite/75">{form.subtitle || currentTypeMeta.teaser}</p>
            </div>
          </div>

          <div className="grid gap-3">
            {reviewRows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 rounded-2xl bg-[#FCFAF8] px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/65">
                  {row.label}
                </p>
                <p className="text-right text-sm text-ink">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] bg-[#F8F0FF] px-4 py-4 text-sm text-graphite">
            <p className="font-semibold text-plum">Ce qui va etre cree</p>
            <ul className="mt-3 space-y-2 leading-6">
              <li>Un brouillon editorial de type {currentTypeMeta.label.toLowerCase()}</li>
              <li>Le media principal reference par son nom dans le payload</li>
              <li>Les liens de graphe saisis pour faciliter la moderation</li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {steps.map((entry, index) => (
          <StepPill
            key={entry.id}
            short={entry.short}
            label={entry.label}
            active={step === entry.id}
            complete={index < activeStepIndex}
          />
        ))}
      </div>

      <div className="rounded-[32px] bg-[#F8F5F1] px-4 py-4">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (validationError) {
              setMessage(validationError);
              return;
            }

            mutation.mutate(form);
          }}
        >
          {step === "type" ? renderTypeStep() : null}
          {step === "media" ? renderMediaStep() : null}
          {step === "details" ? renderDetailStep() : null}
          {step === "review" ? renderReviewStep() : null}

          <div className="sticky bottom-4 z-10 rounded-[28px] bg-white/94 px-4 py-4 shadow-card backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-graphite/75">
                {step !== "type" ? (
                  <Button type="button" variant="ghost" className="px-3 py-2" onClick={goBack}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Retour
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-graphite/70">
                    <Clock3 className="h-4 w-4" />
                    Parcours de publication en 4 etapes
                  </div>
                )}
              </div>

              {step !== "review" ? (
                <Button type="button" onClick={goNext}>
                  Continuer
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={mutation.isPending}>
                  <UploadCloud className="mr-2 h-5 w-5" />
                  Soumettre pour validation
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      {message ? (
        <div className="rounded-[28px] bg-white px-4 py-4 text-sm text-graphite shadow-sm">
          {message}
        </div>
      ) : null}
    </div>
  );
}
