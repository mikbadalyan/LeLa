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
  Sparkles,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import {
  approveContribution,
  getConversationMessages,
  getConversations,
  getCurrentUser,
  getMyContributions,
  getMyEditorials,
  getPendingContributions,
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
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#6A2BE8_0%,#1D2230_100%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-plum">
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
    city: "",
    bio: "",
  });
  const [message, setMessage] = useState<string | null>(null);

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

  const approveMutation = useMutation({
    mutationFn: (contributionId: string) => approveContribution(contributionId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-editorials"] });
      queryClient.invalidateQueries({ queryKey: ["my-contributions"] });
    },
  });

  const approvedCount = myEditorialsQuery.data?.length ?? 0;
  const pendingItems =
    myContributionsQuery.data?.filter((item) => item.status !== "approved") ?? [];
  const taggedCount = taggedQuery.data?.length ?? 0;

  return (
    <MobileShell activeMode="feed" activeTab="profile" className="space-y-4 px-4 py-5">
      <div className="space-y-5 rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6A2BE8_0%,#9B6CF6_100%)] text-xl font-bold text-white shadow-float">
              {profileUser?.display_name.slice(0, 2).toUpperCase() ?? "LL"}
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
            className="rounded-full bg-mist p-3 text-plum transition hover:bg-plum hover:text-white"
            aria-label="Modifier le profil"
          >
            {showEditor ? <X className="h-4 w-4" /> : <PenSquare className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-[24px] bg-mist px-3 py-4">
            <p className="text-lg font-semibold text-ink">{approvedCount}</p>
            <p className="text-xs text-graphite/70">Vos publications</p>
          </div>
          <div className="rounded-[24px] bg-mist px-3 py-4">
            <p className="text-lg font-semibold text-ink">{taggedCount}</p>
            <p className="text-xs text-graphite/70">Tagged</p>
          </div>
          <div className="rounded-[24px] bg-[#F8F0FF] px-3 py-4">
            <p className="text-lg font-semibold text-plum">{pendingItems.length}</p>
            <p className="text-xs text-plum/70">En attente</p>
          </div>
        </div>

        <div className="space-y-2 rounded-[24px] bg-[#FCFAF8] px-4 py-4 text-sm leading-7 text-graphite ring-1 ring-borderSoft">
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
          <div className="space-y-4 rounded-[28px] bg-[#FCFAF8] px-4 py-4 ring-1 ring-borderSoft">
            <div className="grid gap-3">
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
          <div className="rounded-[24px] bg-[#F8F0FF] px-4 py-3 text-sm text-plum">
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

      <div className="space-y-4 rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-plum">Galerie</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">Vos capsules</h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-[24px] bg-mist p-1.5">
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
                  ? "bg-white text-ink shadow-sm"
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
              <LoaderCircle className="h-6 w-6 animate-spin text-plum" />
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
            <div className="rounded-[24px] bg-mist px-4 py-5 text-sm text-graphite">
              Aucune publication visible pour le moment.
            </div>
          )
        ) : null}

        {galleryTab === "tagged" ? (
          taggedQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="h-6 w-6 animate-spin text-plum" />
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
            <div className="rounded-[24px] bg-mist px-4 py-5 text-sm text-graphite">
              Aucune carte partagee pour le moment.
            </div>
          )
        ) : null}

        {galleryTab === "pending" ? (
          myContributionsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="h-6 w-6 animate-spin text-plum" />
            </div>
          ) : pendingItems.length ? (
            <div className="grid grid-cols-3 gap-3">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-square overflow-hidden rounded-[22px] bg-[linear-gradient(160deg,#2A2F3B_0%,#7340D8_100%)] shadow-card"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-plum">
                    En attente
                  </span>
                  <div className="absolute inset-x-3 bottom-3">
                    <p className="line-clamp-2 text-sm font-semibold leading-5 text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/75">
                      {formatContributionMeta(item)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] bg-mist px-4 py-5 text-sm text-graphite">
              Aucune proposition en attente.
            </div>
          )
        ) : null}
      </div>

      {profileUser?.role === "moderator" ? (
        <div className="space-y-4 rounded-[32px] bg-white px-5 py-6 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-plum">Moderation</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">
                Contributions en attente
              </h2>
              <p className="mt-2 text-sm leading-6 text-graphite">
                Acceptez une proposition pour la publier directement dans le feed.
              </p>
            </div>
            <div className="rounded-full bg-[#F8F0FF] px-3 py-2 text-sm font-semibold text-plum">
              {moderationQuery.data?.length ?? 0} en attente
            </div>
          </div>

          {moderationQuery.isLoading ? (
            <div className="rounded-[28px] bg-mist px-4 py-5 text-sm text-graphite">
              Chargement des contributions...
            </div>
          ) : moderationQuery.data?.length ? (
            <div className="space-y-4">
              {moderationQuery.data.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[28px] bg-[#FCFAF8] px-4 py-4 ring-1 ring-borderSoft"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-plum">
                        <Sparkles className="h-4 w-4" />
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
                    <Button
                      type="button"
                      onClick={() => approveMutation.mutate(item.id)}
                      disabled={approveMutation.isPending}
                      className="shrink-0"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Accepter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] bg-mist px-4 py-5 text-sm text-graphite">
              Aucune contribution en attente pour le moment.
            </div>
          )}
        </div>
      ) : null}
    </MobileShell>
  );
}
