"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, LogOut, Mail, MapPin, PenSquare, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import {
  getCurrentUser,
  getMyContributions,
  getMyEditorials,
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

  const profileUser = profileQuery.data ?? user;
  const published = myEditorialsQuery.data ?? [];
  const pending = (myContributionsQuery.data ?? []).filter((item) => item.status !== "approved");

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-5 py-8 lg:px-8 lg:py-12">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[40px] bg-white px-6 py-6 shadow-card ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6A2BE8_0%,#9B6CF6_100%)] text-2xl font-bold text-white shadow-float">
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
                className="rounded-full bg-mist p-3 text-plum transition hover:bg-plum hover:text-white"
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
            <div className="rounded-[24px] bg-mist px-4 py-4 text-center">
              <p className="text-xl font-semibold text-ink">{published.length}</p>
              <p className="text-xs text-graphite/70">Publications</p>
            </div>
            <div className="rounded-[24px] bg-mist px-4 py-4 text-center">
              <p className="text-xl font-semibold text-ink">{pending.length}</p>
              <p className="text-xs text-graphite/70">En attente</p>
            </div>
            <div className="rounded-[24px] bg-[#F8F0FF] px-4 py-4 text-center">
              <p className="text-sm font-semibold text-plum">{profileUser?.role ?? "contributor"}</p>
              <p className="text-xs text-plum/70">Role</p>
            </div>
          </div>

          <div className="mt-6 space-y-2 rounded-[24px] bg-[#FAF5EF] px-4 py-4 text-sm leading-7 text-graphite">
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

        <div className="rounded-[40px] bg-white px-6 py-6 shadow-card ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum">Edition</p>
              <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-ink">
                {editing ? "Modifier votre profil" : "Informations du compte"}
              </h2>
            </div>
            <Link
              href="/website/relations"
              className="rounded-full bg-mist px-4 py-2 text-sm font-semibold text-ink"
            >
              Relations
            </Link>
            <Link
              href="/website/settings"
              className="rounded-full bg-[#F8F0FF] px-4 py-2 text-sm font-semibold text-plum"
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
            <div className="mt-6 rounded-[28px] bg-[#FAF5EF] px-5 py-5 text-sm leading-7 text-graphite">
              Retrouvez ici vos informations, vos publications et vos propositions en attente, sans quitter la version website.
            </div>
          )}

          {message ? (
            <div className="mt-4 rounded-[24px] bg-[#F8F0FF] px-4 py-3 text-sm text-plum">
              {message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[40px] bg-white px-6 py-6 shadow-card ring-1 ring-black/5">
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
                galleryTab === tab.key ? "bg-plum text-white" : "bg-mist text-ink"
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
                      <div className="absolute inset-0 bg-[linear-gradient(160deg,#6A2BE8_0%,#1D2230_100%)]" />
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
                <div key={item.id} className="rounded-[28px] bg-[#FAF5EF] px-5 py-5 ring-1 ring-black/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">{item.type}</p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-graphite">{item.description}</p>
                </div>
              ))}
        </div>

        {(galleryTab === "published" ? !published.length : !pending.length) ? (
          <div className="mt-6 rounded-[28px] bg-[#FAF5EF] px-5 py-5 text-sm text-graphite">
            Aucun contenu pour ce filtre.
          </div>
        ) : null}
      </section>
    </div>
  );
}
