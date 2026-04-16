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
  ShieldCheck,
  Sparkles,
  UserRound,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import {
  approveContribution,
  getCurrentUser,
  getMyContributions,
  getMyEditorials,
  getPendingContributions,
  updateCurrentUser,
} from "@/lib/api/endpoints";
import type { ModerationContribution } from "@/lib/api/types";

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

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
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

  const approvedCount = useMemo(
    () => myEditorialsQuery.data?.length ?? 0,
    [myEditorialsQuery.data]
  );

  return (
    <MobileShell activeMode="feed" activeTab="profile" className="space-y-4 px-4 py-5">
      <div className="space-y-4 rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-plum text-xl font-bold text-white">
            {profileUser?.display_name.slice(0, 2).toUpperCase() ?? "LL"}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-ink">
              {profileUser?.display_name ?? "Invitee"}
            </h1>
            <p className="text-sm text-graphite">@{profileUser?.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-[24px] bg-mist px-3 py-4">
            <p className="text-lg font-semibold text-ink">{approvedCount}</p>
            <p className="text-xs text-graphite/70">Posts</p>
          </div>
          <div className="rounded-[24px] bg-mist px-3 py-4">
            <p className="text-lg font-semibold text-ink">
              {myContributionsQuery.data?.length ?? 0}
            </p>
            <p className="text-xs text-graphite/70">Propositions</p>
          </div>
          <div className="rounded-[24px] bg-[#F8F0FF] px-3 py-4">
            <p className="text-sm font-semibold text-plum">
              {profileUser?.role === "moderator" ? "Moderateur" : "Contributeur"}
            </p>
            <p className="text-xs text-plum/70">Role</p>
          </div>
        </div>

        <div className="space-y-2 text-sm leading-7 text-graphite">
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
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-plum">Edition</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">Modifier le compte</h2>
        </div>

        <div className="grid gap-3">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Pseudo</p>
            <Input
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              placeholder="Nom d'utilisateur"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Email</p>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Ville</p>
            <Input
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              placeholder="Ville"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Bio</p>
            <Textarea
              value={form.bio}
              onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
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

        {message ? (
          <div className="rounded-[24px] bg-[#F8F0FF] px-4 py-3 text-sm text-plum">
            {message}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-plum">Galerie</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">Vos publications</h2>
          </div>
          <div className="rounded-full bg-mist px-3 py-2 text-sm font-semibold text-graphite">
            {approvedCount}
          </div>
        </div>

        {myEditorialsQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin text-plum" />
          </div>
        ) : myEditorialsQuery.data?.length ? (
          <div className="grid grid-cols-3 gap-3">
            {myEditorialsQuery.data.map((item) => (
              <Link
                key={item.id}
                href={`/editorial/${item.id}`}
                className="relative block overflow-hidden rounded-[20px] bg-mist"
              >
                <div className="relative aspect-square">
                  <Image
                    src={item.media_kind === "video" ? item.poster_url || "/assets/icon-play.svg" : item.media_url}
                    alt={item.title}
                    fill
                    sizes="140px"
                    className="object-cover"
                  />
                  {item.media_kind === "video" ? (
                    <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                      Video
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] bg-mist px-4 py-5 text-sm text-graphite">
            Aucune publication visible pour le moment.
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-plum">Pipeline</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">Vos soumissions</h2>
          </div>
          <div className="rounded-full bg-mist px-3 py-2 text-sm font-semibold text-graphite">
            {myContributionsQuery.data?.length ?? 0}
          </div>
        </div>

        {myContributionsQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin text-plum" />
          </div>
        ) : myContributionsQuery.data?.length ? (
          <div className="space-y-3">
            {myContributionsQuery.data.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] bg-[#FCFAF8] px-4 py-4 ring-1 ring-borderSoft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-xs text-graphite/70">{formatContributionMeta(item)}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "approved"
                        ? "bg-[#E9F8EE] text-[#1D7B43]"
                        : "bg-[#FFF3E2] text-[#A9652B]"
                    }`}
                  >
                    {item.status === "approved" ? "Publiee" : "En attente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] bg-mist px-4 py-5 text-sm text-graphite">
            Aucune soumission pour le moment.
          </div>
        )}
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
