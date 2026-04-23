"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { useParams } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { useAuthStore } from "@/features/auth/store";
import { getUserById, getUserEditorials } from "@/lib/api/endpoints";

export default function VisitorProfilePage() {
  const params = useParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const profileId = params.id;

  const profileQuery = useQuery({
    queryKey: ["public-user", profileId, Boolean(token)],
    queryFn: () => getUserById(profileId, token),
    enabled: Boolean(profileId),
  });

  const editorialsQuery = useQuery({
    queryKey: ["public-user-editorials", profileId, Boolean(token)],
    queryFn: () => getUserEditorials(profileId, token),
    enabled: Boolean(profileId),
  });

  const profile = profileQuery.data;
  const editorials = editorialsQuery.data ?? [];
  const isSelf = currentUser?.id === profileId;

  return (
    <MobileShell activeMode="feed" activeTab="profile" className="space-y-4 bg-background px-4 py-4">
      <div className="space-y-4 rounded-card bg-elevated px-4 py-5 shadow-card ring-1 ring-borderSoft/10">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-mist">
            {profile ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-ink">
              {profile?.display_name ?? "Chargement..."}
            </h1>
            <p className="mt-1 text-sm text-graphite">@{profile?.username ?? "..."}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue">
              {isSelf ? "Votre profil" : "Profil visiteur"}
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-[22px] bg-surface px-4 py-4 text-sm leading-6 text-graphite ring-1 ring-borderSoft/10">
          {profile?.city ? (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              {profile.city}
            </p>
          ) : null}
          {profile?.email ? (
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              {profile.email}
            </p>
          ) : null}
          <p>{profile?.bio || "Aucune bio pour le moment."}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-[22px] bg-surface px-3 py-4 ring-1 ring-borderSoft/10">
            <p className="text-lg font-semibold text-ink">{editorials.length}</p>
            <p className="text-xs text-graphite/70">Publications</p>
          </div>
          <div className="rounded-[22px] bg-blueSoft px-3 py-4 ring-1 ring-blue/15">
            <p className="text-sm font-semibold text-blue">{profile?.role ?? "contributor"}</p>
            <p className="text-xs text-blue/70">Role</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-card bg-elevated px-4 py-5 shadow-card ring-1 ring-borderSoft/10">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-blue">Galerie</p>
          <h2 className="mt-2 text-[1.25rem] font-semibold text-ink">Publications</h2>
        </div>

        {editorialsQuery.isLoading ? (
          <div className="rounded-[22px] bg-mist px-4 py-5 text-sm text-graphite">
            Chargement des publications...
          </div>
        ) : editorials.length ? (
          <div className="grid grid-cols-3 gap-3">
            {editorials.map((item) => (
              <Link
                key={item.id}
                href={`/editorial/${item.id}`}
                className="group relative block overflow-hidden rounded-[20px] bg-mist"
              >
                <div className="relative aspect-square">
                  {item.media_kind === "audio" ? (
                    <div className="absolute inset-0 bg-[linear-gradient(160deg,#7643A6_0%,#1D2230_72%,#3365C8_100%)]" />
                  ) : (
                    <Image
                      src={
                        item.media_kind === "video"
                          ? item.poster_url || "/assets/icon-play.svg"
                          : item.media_url
                      }
                      alt={item.title}
                      fill
                      sizes="120px"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-2 bottom-2">
                    <p className="line-clamp-2 text-xs font-semibold leading-4 text-white">
                      {item.title}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] bg-mist px-4 py-5 text-sm text-graphite">
            Aucune publication visible pour le moment.
          </div>
        )}
      </div>
    </MobileShell>
  );
}
