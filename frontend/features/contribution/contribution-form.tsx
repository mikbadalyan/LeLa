"use client";

import { useMutation } from "@tanstack/react-query";
import { ImagePlus, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { createContribution } from "@/lib/api/endpoints";
import type { ContributionPayload } from "@/lib/api/types";

const initialForm: ContributionPayload = {
  type: "magazine",
  title: "",
  subtitle: "",
  description: "",
  city: "Strasbourg",
  address: "",
  event_date: "",
  media_name: "",
  external_url: ""
};

export function ContributionForm() {
  const token = useAuthStore((state) => state.token);
  const [form, setForm] = useState<ContributionPayload>(initialForm);
  const [message, setMessage] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!token) {
      return "Connectez-vous pour envoyer une contribution.";
    }

    if (!form.title.trim()) {
      return "Ajoutez un titre.";
    }

    if (!form.description.trim()) {
      return "Ajoutez une description editoriale.";
    }

    return null;
  }, [form.description, form.title, token]);

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
    },
    onError: (error: Error) => setMessage(error.message)
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {(["magazine", "place", "person", "event"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setForm((current) => ({ ...current, type }))}
            className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
              form.type === type
                ? "bg-plum text-white shadow-float"
                : "bg-white text-ink ring-1 ring-borderSoft"
            }`}
          >
            {type === "magazine"
              ? "Magazine"
              : type === "place"
                ? "Lieu"
                : type === "person"
                  ? "Personne"
                  : "Evenement"}
          </button>
        ))}
      </div>

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
        <Input
          placeholder="Titre editorial"
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        />
        <Input
          placeholder="Sous-titre ou entite liee"
          value={form.subtitle}
          onChange={(event) =>
            setForm((current) => ({ ...current, subtitle: event.target.value }))
          }
        />
        <Textarea
          placeholder="Racontez l'histoire, le contexte et les liens dans le graphe..."
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Ville"
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          />
          <Input
            placeholder="Adresse"
            value={form.address}
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
          />
        </div>
        <Input
          type="datetime-local"
          value={form.event_date}
          onChange={(event) =>
            setForm((current) => ({ ...current, event_date: event.target.value }))
          }
        />
        <div className="rounded-[28px] border border-dashed border-borderSoft bg-white px-4 py-5">
          <div className="flex items-center gap-3 text-sm text-graphite">
            <div className="rounded-2xl bg-plum/10 p-3 text-plum">
              <ImagePlus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Upload mock media</p>
              <p>Ajoutez juste le nom du futur fichier si l'asset n'est pas encore present.</p>
            </div>
          </div>
          <Input
            className="mt-4"
            placeholder="ex: museum-cover-final.png"
            value={form.media_name}
            onChange={(event) =>
              setForm((current) => ({ ...current, media_name: event.target.value }))
            }
          />
        </div>
        <Input
          placeholder="Lien externe ou note de reference"
          value={form.external_url}
          onChange={(event) =>
            setForm((current) => ({ ...current, external_url: event.target.value }))
          }
        />
        <Button type="submit" fullWidth disabled={mutation.isPending}>
          <UploadCloud className="mr-2 h-5 w-5" />
          Soumettre pour validation
        </Button>
      </form>

      {message ? (
        <div className="rounded-[28px] bg-white px-4 py-4 text-sm text-graphite shadow-sm">
          {message}
        </div>
      ) : null}
    </div>
  );
}

