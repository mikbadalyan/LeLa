"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash2,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  PenSquare,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ContributionStatusBadge } from "@/components/ui/contribution-status-badge";
import { Input, Textarea } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import {
  clearContributionDraft,
  contributionPayloadFromModeration,
  saveContributionDraft,
} from "@/features/contribution/draft";
import {
  getCurrentUser,
  getMyContributions,
  getMyEditorials,
  getPendingContributions,
  moderateContribution,
  updateCurrentUser,
} from "@/lib/api/endpoints";

type GalleryTab = "published" | "pending";

export function WebsiteProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [editing, setEditing] = useState(false);
  const [galleryTab, setGalleryTab] = useState<GalleryTab>("published");
  const [message, setMessage] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    username: "",
    email: "",
    city: "",
    bio: "",
  });

  useEffect(() => {
    if (!token || !user) {
      router.replace("/website/login");
    }
  }, [router, token, user]);

  const profileQuery = useQuery({
    queryKey: ["website-current-user", Boolean(token)],
    queryFn: () => getCurrentUser(token!),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (profileQuery.data) {
      setUser(profileQuery.data);
      setForm({
        username: profileQuery.data.username,
        email: profileQuery.data.email ?? "",
        city: profileQuery.data.city ?? "",
        bio: profileQuery.data.bio ?? "",
      });
    }
  }, [profileQuery.data, setUser]);

  const myEditorialsQuery = useQuery({
    queryKey: ["website-my-editorials", Boolean(token)],
    queryFn: () => getMyEditorials(token!),
    enabled: Boolean(token),
  });

  const myContributionsQuery = useQuery({
    queryKey: ["website-my-contributions", Boolean(token)],
    queryFn: () => getMyContributions(token!),
    enabled: Boolean(token),
  });

  const profileUser = profileQuery.data ?? user;

  const moderationQuery = useQuery({
    queryKey: ["website-pending-contributions", Boolean(token)],
    queryFn: () => getPendingContributions(token!),
    enabled: Boolean(token) && profileUser?.role === "moderator",
  });

  const updateMutation = useMutation({
    mutationFn: () => updateCurrentUser(form, token!),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setMessage("Profil mis a jour.");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["website-current-user"] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const moderationMutation = useMutation({
    mutationFn: ({
      contributionId,
      action,
      note,
    }: {
      contributionId: string;
      action: "approved" | "changes_requested" | "rejected";
      note?: string;
    }) =>
      moderateContribution(
        contributionId,
        {
          action,
          note,
        },
        token!
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["website-pending-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["website-my-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["website-my-editorials"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setReviewNotes({});
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const published = myEditorialsQuery.data ?? [];
  const pending = (myContributionsQuery.data ?? []).filter((item) => item.status !== "approved");

  const resumeContribution = (contribution: (typeof pending)[number]) => {
    clearContributionDraft();
    saveContributionDraft({
      form: contributionPayloadFromModeration(contribution),
      step: "content",
      lastSavedAt: new Date().toISOString(),
      sourceContributionId: contribution.id,
    });
    router.push("/website/contribute");
  };

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-5 py-8 lg:px-8 lg:py-12">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-card bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7643A6_0%,#3365C8_100%)] text-2xl font-bold text-white shadow-float">
                {profileUser?.display_name.slice(0, 2).toUpperCase() ?? "LL"}
              </div>
              <div>
                <h1 className="text-[2.1rem] font-semibold tracking-[-0.04em] text-ink">
                  {profileUser?.display_name ?? "Compte"}
                </h1>
                <p className="mt-1 text-sm text-graphite">@{profileUser?.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing((current) => !current);
                  setMessage(null);
                }}
                className="rounded-full bg-blueSoft p-3 text-blue transition hover:bg-blue hover:text-white"
              >
                {editing ? <X className="h-4 w-4" /> : <PenSquare className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  router.push("/website/login");
                }}
                className="rounded-full bg-mist p-3 text-graphite transition hover:bg-ink hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-[24px] bg-surface px-4 py-4 text-center ring-1 ring-borderSoft/10">
              <p className="text-xl font-semibold text-ink">{published.length}</p>
              <p className="text-xs text-graphite/70">Publications</p>
            </div>
            <div className="rounded-[24px] bg-surface px-4 py-4 text-center ring-1 ring-borderSoft/10">
              <p className="text-xl font-semibold text-ink">{pending.length}</p>
              <p className="text-xs text-graphite/70">En attente</p>
            </div>
            <div className="rounded-[24px] bg-blueSoft px-4 py-4 text-center ring-1 ring-blue/15">
              <p className="text-sm font-semibold text-blue">{profileUser?.role ?? "contributor"}</p>
              <p className="text-xs text-blue/70">Role</p>
            </div>
          </div>

          <div className="mt-6 space-y-2 rounded-[24px] bg-surface px-4 py-4 text-sm leading-7 text-graphite ring-1 ring-borderSoft/10">
            {profileUser?.city ? (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {profileUser.city}
              </p>
            ) : null}
            {profileUser?.email ? (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {profileUser.email}
              </p>
            ) : null}
            <p>{profileUser?.bio || "Aucune bio pour le moment."}</p>
          </div>
        </div>

        <div className="rounded-card bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue">Edition</p>
              <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-ink">
                {editing ? "Modifier votre profil" : "Informations du compte"}
              </h2>
            </div>
            <Link
              href="/website/relations"
              className="rounded-full bg-surface px-4 py-2 text-sm font-semibold text-ink ring-1 ring-borderSoft/10"
            >
              Relations
            </Link>
            <Link
              href="/website/settings"
              className="rounded-full bg-blueSoft px-4 py-2 text-sm font-semibold text-blue ring-1 ring-blue/15"
            >
              Parametres
            </Link>
          </div>

          {editing ? (
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(null);
                updateMutation.mutate();
              }}
            >
              <Input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="Nom d'utilisateur"
              />
              <Input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email"
              />
              <Input
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                placeholder="Ville"
              />
              <Textarea
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                placeholder="Bio"
                className="min-h-32"
              />
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </Button>
            </form>
          ) : (
            <div className="mt-6 rounded-[28px] bg-surface px-5 py-5 text-sm leading-7 text-graphite ring-1 ring-borderSoft/10">
              Retrouvez ici vos informations, vos publications et vos propositions en attente, sans quitter la version website.
            </div>
          )}

          {message ? (
            <div className="mt-4 rounded-[24px] bg-blueSoft px-4 py-3 text-sm text-blue ring-1 ring-blue/15">
              {message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-card bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10">
        <div className="flex items-center gap-2">
          {([
            { key: "published", label: "Vos publications" },
            { key: "pending", label: "En attente" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setGalleryTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                galleryTab === tab.key ? "bg-blue text-white shadow-blue" : "bg-surface text-ink ring-1 ring-borderSoft/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {galleryTab === "published"
            ? published.map((item) => (
                <Link
                  key={item.id}
                  href={`/website/editorial/${item.id}`}
                  className="group overflow-hidden rounded-[28px] bg-mist"
                >
                  <div className="relative aspect-square">
                    {item.media_kind === "audio" ? (
                      <div className="absolute inset-0 bg-[linear-gradient(160deg,#7643A6_0%,#1D2230_72%,#3365C8_100%)]" />
                    ) : (
                      <Image
                        src={item.media_kind === "video" ? item.poster_url || item.media_url : item.media_url}
                        alt={item.title}
                        fill
                        sizes="280px"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/72 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4">
                      <p className="line-clamp-2 text-sm font-semibold text-white">{item.title}</p>
                    </div>
                  </div>
                </Link>
              ))
            : pending.map((item) => (
                <div key={item.id} className="rounded-[28px] bg-surface px-5 py-5 ring-1 ring-borderSoft/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <ContributionStatusBadge status={item.status} />
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue">
                        {item.type}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-ink">{item.title}</h3>
                    </div>
                    {(item.status === "changes_requested" || item.status === "rejected") ? (
                      <button
                        type="button"
                        onClick={() => resumeContribution(item)}
                        className="inline-flex items-center gap-1 rounded-full bg-blueSoft px-3 py-2 text-xs font-semibold text-blue ring-1 ring-blue/15"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reprendre
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-graphite">{item.description}</p>
                  {item.moderation_note ? (
                    <div className="mt-4 rounded-[20px] bg-elevated px-4 py-3 text-sm leading-6 text-graphite ring-1 ring-borderSoft/10">
                      <p className="font-semibold text-ink">Note de moderation</p>
                      <p className="mt-1">{item.moderation_note}</p>
                    </div>
                  ) : null}
                </div>
              ))}
        </div>

        {(galleryTab === "published" ? !published.length : !pending.length) ? (
          <div className="mt-6 rounded-[28px] bg-surface px-5 py-5 text-sm text-graphite ring-1 ring-borderSoft/10">
            Aucun contenu pour ce filtre.
          </div>
        ) : null}
      </section>

      {profileUser?.role === "moderator" ? (
        <section className="rounded-card bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue">
                Moderation
              </p>
              <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-ink">
                File editoriale
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-graphite">
                Analysez les propositions, ajoutez une note pour guider le contributeur,
                puis publiez, demandez une revision ou refusez.
              </p>
            </div>
            <div className="rounded-full bg-blueSoft px-4 py-2 text-sm font-semibold text-blue ring-1 ring-blue/15">
              {moderationQuery.data?.length ?? 0} en attente
            </div>
          </div>

          {moderationQuery.isLoading ? (
            <div className="mt-6 rounded-[28px] bg-surface px-5 py-5 text-sm text-graphite ring-1 ring-borderSoft/10">
              Chargement des contributions...
            </div>
          ) : moderationQuery.data?.length ? (
            <div className="mt-6 space-y-5">
              {moderationQuery.data.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[30px] bg-surface px-5 py-5 ring-1 ring-borderSoft/10"
                >
                  <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <ContributionStatusBadge status={item.status} />
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">
                          {item.type}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-ink">{item.title}</h3>
                        {item.subtitle ? (
                          <p className="mt-1 text-sm text-graphite">{item.subtitle}</p>
                        ) : null}
                      </div>
                      <p className="text-sm leading-7 text-graphite">{item.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-graphite/70">
                        <span>Par {item.submitter.display_name}</span>
                        <span>{item.payload.city || item.payload.address || "Sans contexte geographique"}</span>
                        {item.media_name ? <span>Media: {item.media_name}</span> : null}
                      </div>

                      {item.history.length ? (
                        <div className="rounded-[22px] bg-elevated px-4 py-4 text-sm text-graphite ring-1 ring-borderSoft/10">
                          <p className="font-semibold text-ink">Historique recent</p>
                          <div className="mt-3 space-y-3">
                            {item.history.slice(0, 3).map((event) => (
                              <div key={event.id}>
                                <p className="font-medium text-ink">
                                  {event.moderator.display_name} · {new Date(event.created_at).toLocaleString("fr-FR")}
                                </p>
                                <p className="capitalize">{event.action.replaceAll("_", " ")}</p>
                                {event.note ? (
                                  <p className="text-graphite/75">{event.note}</p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4">
                      <Textarea
                        value={reviewNotes[item.id] ?? item.moderation_note ?? ""}
                        onChange={(event) =>
                          setReviewNotes((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder="Note de moderation"
                        className="min-h-36"
                      />
                      <div className="grid gap-2">
                        <Button
                          type="button"
                          onClick={() =>
                            moderationMutation.mutate({
                              contributionId: item.id,
                              action: "approved",
                              note: reviewNotes[item.id],
                            })
                          }
                          disabled={moderationMutation.isPending}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Publier
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            moderationMutation.mutate({
                              contributionId: item.id,
                              action: "changes_requested",
                              note: reviewNotes[item.id],
                            })
                          }
                          disabled={moderationMutation.isPending}
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Demander une revision
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            moderationMutation.mutate({
                              contributionId: item.id,
                              action: "rejected",
                              note: reviewNotes[item.id],
                            })
                          }
                          disabled={moderationMutation.isPending}
                        >
                          <CircleSlash2 className="mr-2 h-4 w-4" />
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[28px] bg-surface px-5 py-5 text-sm text-graphite ring-1 ring-borderSoft/10">
              Aucune contribution en attente pour le moment.
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
