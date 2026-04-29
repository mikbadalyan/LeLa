"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  PenSquare,
  RotateCcw,
  Save,
  X,
  AlertTriangle,
  CircleSlash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
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
  getConversationMessages,
  getConversations,
  getCurrentUser,
  getMyContributions,
  getMyEditorials,
  getPendingContributions,
  moderateContribution,
  updateCurrentUser,
} from "@/lib/api/endpoints";
import type { ModerationContribution } from "@/lib/api/types";

type GalleryTab = "published" | "tagged" | "pending";

function formatContributionMeta(item: ModerationContribution) {
  if (item.type === "event") {
    return item.payload.event_date || item.payload.address || "Evenement en attente";
  }

  if (item.type === "person") {
    return item.payload.role || item.subtitle || "Profil en attente";
  }

  if (item.type === "place") {
    return item.payload.address || item.payload.city || "Lieu en attente";
  }

  return item.payload.linked_place_name || item.payload.linked_event_name || "Capsule editoriale";
}

function getContributionPreviewKind(item: ModerationContribution) {
  const payload = item.payload ?? {};
  return (
    payload.primary_media_kind ??
    payload.media_items?.[0]?.kind ??
    payload.legacy_media_kind ??
    "image"
  );
}

function isProfileImageSrc(value: string) {
  return value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");
}

function GalleryTile({
  href,
  image,
  title,
  subtitle,
  badge,
}: {
  href: string;
  image?: string | null;
  title: string;
  subtitle?: string | null;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-[22px] bg-mist"
    >
      <div className="relative aspect-square">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="140px"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#7643A6_0%,#1D2230_72%,#3365C8_100%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-elevated/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue backdrop-blur">
            {badge}
          </span>
        ) : null}
        <div className="absolute inset-x-3 bottom-3">
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-white">{title}</p>
          {subtitle ? (
            <p className="mt-1 line-clamp-1 text-xs text-white/75">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [showEditor, setShowEditor] = useState(false);
  const [galleryTab, setGalleryTab] = useState<GalleryTab>("published");
  const [form, setForm] = useState({
    username: "",
    email: "",
    avatar_url: "",
    city: "",
    bio: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || !token) {
      router.replace("/login");
    }
  }, [router, token, user]);

  const profileQuery = useQuery({
    queryKey: ["current-user", Boolean(token)],
    queryFn: () => getCurrentUser(token!),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (profileQuery.data) {
      setUser(profileQuery.data);
      setForm({
        username: profileQuery.data.username,
        email: profileQuery.data.email ?? "",
        avatar_url: profileQuery.data.avatar_url,
        city: profileQuery.data.city ?? "",
        bio: profileQuery.data.bio ?? "",
      });
    }
  }, [profileQuery.data, setUser]);

  const profileUser = profileQuery.data ?? user;

  const myEditorialsQuery = useQuery({
    queryKey: ["my-editorials", Boolean(token)],
    queryFn: () => getMyEditorials(token!),
    enabled: Boolean(token),
  });

  const myContributionsQuery = useQuery({
    queryKey: ["my-contributions", Boolean(token)],
    queryFn: () => getMyContributions(token!),
    enabled: Boolean(token),
  });

  const taggedQuery = useQuery({
    queryKey: ["tagged-gallery", Boolean(token)],
    queryFn: async () => {
      const conversations = await getConversations(token!);
      const threads = await Promise.all(
        conversations.map((conversation) =>
          getConversationMessages(conversation.participant.id, token!)
        )
      );

      const tagged = threads
        .flat()
        .filter((entry) => !entry.is_mine && entry.editorial)
        .map((entry) => entry.editorial!);

      return Array.from(new Map(tagged.map((entry) => [entry.id, entry])).values());
    },
    enabled: Boolean(token) && galleryTab === "tagged",
  });

  const moderationQuery = useQuery({
    queryKey: ["pending-contributions", Boolean(token)],
    queryFn: () => getPendingContributions(token!),
    enabled: Boolean(token) && profileUser?.role === "moderator",
  });

  const updateMutation = useMutation({
    mutationFn: () => updateCurrentUser(form, token!),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setMessage("Profil mis a jour.");
      setShowEditor(false);
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["message-user-search"] });
    },
    onError: (error: Error) => {
      setMessage(error.message);
    },
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
      queryClient.invalidateQueries({ queryKey: ["pending-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-editorials"] });
      queryClient.invalidateQueries({ queryKey: ["my-contributions"] });
      setReviewNotes({});
    },
    onError: (error: Error) => {
      setMessage(error.message);
    },
  });

  const approvedCount = myEditorialsQuery.data?.length ?? 0;
  const pendingItems =
    myContributionsQuery.data?.filter((item) => item.status !== "approved") ?? [];
  const taggedCount = taggedQuery.data?.length ?? 0;

  const resumeContribution = (item: ModerationContribution) => {
    clearContributionDraft();
    saveContributionDraft({
      form: contributionPayloadFromModeration(item),
      step: "content",
      lastSavedAt: new Date().toISOString(),
      sourceContributionId: item.id,
    });
    router.push("/contribute");
  };

  return (
    <MobileShell activeMode="feed" activeTab="profile" className="space-y-4 px-4 py-5">
      <div className="space-y-5 rounded-card bg-elevated px-5 py-6 shadow-card ring-1 ring-borderSoft/10">
          <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#7643A6_0%,#3365C8_100%)] text-xl text-white shadow-float">
              {profileUser?.avatar_url && isProfileImageSrc(profileUser.avatar_url) ? (
                <Image
                  src={profileUser.avatar_url}
                  alt={profileUser.display_name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                profileUser?.display_name.slice(0, 2).toUpperCase() ?? "LL"
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold text-ink">
                {profileUser?.display_name ?? "Invitee"}
              </h1>
              <p className="mt-1 text-sm text-graphite">@{profileUser?.username}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowEditor((current) => !current);
              setMessage(null);
            }}
            className="rounded-full bg-blueSoft p-3 text-blue transition hover:bg-blue hover:text-white"
            aria-label="Modifier le profil"
          >
            {showEditor ? <X className="h-4 w-4" /> : <PenSquare className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-[24px] bg-surface px-3 py-4 ring-1 ring-borderSoft/10">
            <p className="text-lg font-semibold text-ink">{approvedCount}</p>
            <p className="text-xs text-graphite/70">Vos publications</p>
          </div>
          <div className="rounded-[24px] bg-surface px-3 py-4 ring-1 ring-borderSoft/10">
            <p className="text-lg font-semibold text-ink">{taggedCount}</p>
            <p className="text-xs text-graphite/70">Tagged</p>
          </div>
          <div className="rounded-[24px] bg-blueSoft px-3 py-4 ring-1 ring-blue/15">
            <p className="text-lg font-semibold text-blue">{pendingItems.length}</p>
            <p className="text-xs text-blue/70">En attente</p>
          </div>
        </div>

        <div className="space-y-2 rounded-[24px] bg-surface px-4 py-4 text-sm leading-7 text-graphite ring-1 ring-borderSoft/10">
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
          {profileUser?.bio ? (
            <p>{profileUser.bio}</p>
          ) : (
            <p className="text-graphite/65">
              Ajoutez une bio pour presenter votre regard editorial.
            </p>
          )}
        </div>

        {showEditor ? (
          <div className="space-y-4 rounded-[28px] bg-surface px-4 py-4 ring-1 ring-borderSoft/10">
            <div className="grid gap-3">
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Photo de profil</p>
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full bg-mist ring-1 ring-borderSoft/10">
                    {form.avatar_url && isProfileImageSrc(form.avatar_url) ? (
                      <Image
                        src={form.avatar_url}
                        alt="Apercu de la photo de profil"
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <Input
                    value={form.avatar_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, avatar_url: event.target.value }))
                    }
                    placeholder="/static/mock/avatar-charles.svg ou https://..."
                  />
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Pseudo</p>
                <Input
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, username: event.target.value }))
                  }
                  placeholder="Nom d'utilisateur"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Email</p>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="Email"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Ville</p>
                <Input
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, city: event.target.value }))
                  }
                  placeholder="Ville"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Bio</p>
                <Textarea
                  value={form.bio}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, bio: event.target.value }))
                  }
                  placeholder="Votre regard, vos lieux preferes, vos themes..."
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        ) : null}

        {message ? (
          <div className="rounded-[24px] bg-blueSoft px-4 py-3 text-sm text-blue ring-1 ring-blue/15">
            {message}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => router.push("/contribute")}>
            <PenSquare className="mr-2 h-4 w-4" />
            Contribuer
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Deconnexion
          </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-card bg-elevated px-5 py-6 shadow-card ring-1 ring-borderSoft/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue">Galerie</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">Vos capsules</h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-[24px] bg-surface p-1.5 ring-1 ring-borderSoft/10">
          {[
            { key: "published", label: "Vos publications" },
            { key: "tagged", label: "Tagged" },
            { key: "pending", label: "En attente" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setGalleryTab(tab.key as GalleryTab)}
              className={`rounded-[20px] px-3 py-3 text-xs font-semibold transition ${
                galleryTab === tab.key
                  ? "bg-elevated text-ink shadow-sm"
                  : "text-graphite/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {galleryTab === "published" ? (
          myEditorialsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="h-6 w-6 animate-spin text-blue" />
            </div>
          ) : myEditorialsQuery.data?.length ? (
            <div className="grid grid-cols-3 gap-3">
              {myEditorialsQuery.data.map((item) => (
                <GalleryTile
                  key={item.id}
                  href={`/editorial/${item.id}`}
                  image={
                    item.media_kind === "video"
                      ? item.poster_url || "/assets/icon-play.svg"
                      : item.media_url
                  }
                  title={item.title}
                  subtitle={item.subtitle}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] bg-surface px-4 py-5 text-sm text-graphite ring-1 ring-borderSoft/10">
              Aucune publication visible pour le moment.
            </div>
          )
        ) : null}

        {galleryTab === "tagged" ? (
          taggedQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="h-6 w-6 animate-spin text-blue" />
            </div>
          ) : taggedQuery.data?.length ? (
            <div className="grid grid-cols-3 gap-3">
              {taggedQuery.data.map((item) => (
                <GalleryTile
                  key={`${item.id}-tagged`}
                  href={item.href}
                  image={
                    item.media_kind === "video"
                      ? item.poster_url || "/assets/icon-play.svg"
                      : item.media_url
                  }
                  title={item.title}
                  subtitle={item.subtitle}
                  badge="Tag"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] bg-surface px-4 py-5 text-sm text-graphite ring-1 ring-borderSoft/10">
              Aucune carte partagee pour le moment.
            </div>
          )
        ) : null}

        {galleryTab === "pending" ? (
          myContributionsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="h-6 w-6 animate-spin text-blue" />
            </div>
          ) : pendingItems.length ? (
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] bg-surface px-4 py-4 ring-1 ring-borderSoft/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <ContributionStatusBadge status={item.status} />
                      <p className="text-sm font-semibold leading-5 text-ink">
                        {item.title}
                      </p>
                      <p className="text-xs text-graphite/72">
                        {formatContributionMeta(item)}
                      </p>
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
                  {item.moderation_note ? (
                    <div className="mt-3 rounded-[18px] bg-elevated px-3 py-3 text-xs leading-6 text-graphite ring-1 ring-borderSoft/10">
                      <p className="font-semibold text-ink">Note de moderation</p>
                      <p className="mt-1">{item.moderation_note}</p>
                    </div>
                  ) : null}
                  {item.reviewed_at ? (
                    <p className="mt-3 text-[11px] text-graphite/60">
                      Derniere mise a jour: {new Date(item.reviewed_at).toLocaleString("fr-FR")}
                    </p>
                  ) : null}
                  <div className="mt-3 text-xs text-graphite/70">
                    <p>
                      Soumis le {new Date(item.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    {item.media_name ? (
                      <p className="mt-1">Media: {item.media_name}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] bg-surface px-4 py-5 text-sm text-graphite ring-1 ring-borderSoft/10">
              Aucune proposition en attente.
            </div>
          )
        ) : null}
      </div>

      {profileUser?.role === "moderator" ? (
        <div className="space-y-4 rounded-card bg-elevated px-5 py-6 shadow-card ring-1 ring-borderSoft/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-blue">Moderation</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">
                Contributions en attente
              </h2>
              <p className="mt-2 text-sm leading-6 text-graphite">
                Revoyez les propositions, ajoutez une note si besoin, puis publiez, demandez des corrections ou refusez.
              </p>
            </div>
            <div className="rounded-full bg-blueSoft px-3 py-2 text-sm font-semibold text-blue ring-1 ring-blue/15">
              {moderationQuery.data?.length ?? 0} en attente
            </div>
          </div>

          {moderationQuery.isLoading ? (
            <div className="rounded-[28px] bg-surface px-4 py-5 text-sm text-graphite ring-1 ring-borderSoft/10">
              Chargement des contributions...
            </div>
          ) : moderationQuery.data?.length ? (
            <div className="space-y-4">
              {moderationQuery.data.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[28px] bg-surface px-4 py-4 ring-1 ring-borderSoft/10"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue">
                          <ContributionStatusBadge status={item.status} />
                          <span>{item.type}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
                        {item.subtitle ? (
                          <p className="text-sm text-graphite">{item.subtitle}</p>
                        ) : null}
                        <p className="text-sm leading-7 text-graphite/90">{item.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-graphite/70">
                          <span>Par {item.submitter.display_name}</span>
                          <span>{formatContributionMeta(item)}</span>
                          {item.media_name ? <span>Media: {item.media_name}</span> : null}
                        </div>
                      </div>
                      {item.media_url ? (
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-mist">
                          {getContributionPreviewKind(item) === "audio" ? (
                            <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
                          ) : getContributionPreviewKind(item) === "video" ? (
                            <div className="absolute inset-0 bg-[linear-gradient(160deg,#2E2D35_0%,#7643A6_58%,#3365C8_100%)]" />
                          ) : (
                            <Image
                              src={item.media_url}
                              alt={item.title}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          )}
                        </div>
                      ) : null}
                    </div>

                    <Textarea
                      value={reviewNotes[item.id] ?? item.moderation_note ?? ""}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Ajoutez une note pour expliquer la decision de moderation."
                      className="min-h-28"
                    />

                    <div className="grid grid-cols-3 gap-2">
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
                        className="min-w-0"
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
                        className="min-w-0"
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        A revoir
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
                        className="min-w-0"
                      >
                        <CircleSlash2 className="mr-2 h-4 w-4" />
                        Refuser
                      </Button>
                    </div>

                    {item.history.length ? (
                      <div className="rounded-[20px] bg-elevated px-3 py-3 text-xs leading-6 text-graphite ring-1 ring-borderSoft/10">
                        <p className="font-semibold text-ink">Historique</p>
                        <div className="mt-2 space-y-2">
                          {item.history.slice(0, 3).map((event) => (
                            <div key={event.id}>
                              <p className="font-medium text-ink">
                                {event.moderator.display_name} · {new Date(event.created_at).toLocaleString("fr-FR")}
                              </p>
                              <p>{event.action.replaceAll("_", " ")}</p>
                              {event.note ? <p className="text-graphite/75">{event.note}</p> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] bg-surface px-4 py-5 text-sm text-graphite ring-1 ring-borderSoft/10">
              Aucune contribution en attente pour le moment.
            </div>
          )}
        </div>
      ) : null}
    </MobileShell>
  );
}
