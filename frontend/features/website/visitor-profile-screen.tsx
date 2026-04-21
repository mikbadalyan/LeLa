"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

import { useAuthStore } from "@/features/auth/store";
import { getUserById, getUserEditorials } from "@/lib/api/endpoints";

export function WebsiteVisitorProfileScreen({ profileId }: { profileId: string }) {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  const profileQuery = useQuery({
    queryKey: ["website-public-user", profileId, Boolean(token)],
    queryFn: () => getUserById(profileId, token),
    enabled: Boolean(profileId),
  });

  const editorialsQuery = useQuery({
    queryKey: ["website-public-user-editorials", profileId, Boolean(token)],
    queryFn: () => getUserEditorials(profileId, token),
    enabled: Boolean(profileId),
  });

  const profile = profileQuery.data;
  const editorials = editorialsQuery.data ?? [];
  const isSelf = currentUser?.id === profileId;

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-5 py-8 lg:px-8 lg:py-12">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[40px] bg-white px-6 py-6 shadow-card ring-1 ring-black/5">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-mist">
              {profile ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div>
              <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-ink">
                {profile?.display_name ?? "Chargement..."}
              </h1>
              <p className="mt-1 text-sm text-graphite">@{profile?.username ?? "..."}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-plum">
                {isSelf ? "Votre profil" : "Profil visiteur"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2 rounded-[24px] bg-[#FAF5EF] px-4 py-4 text-sm leading-7 text-graphite">
            {profile?.city ? (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {profile.city}
              </p>
            ) : null}
            {profile?.email ? (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {profile.email}
              </p>
            ) : null}
            <p>{profile?.bio || "Aucune bio pour le moment."}</p>
          </div>
        </div>

        <div className="rounded-[40px] bg-white px-6 py-6 shadow-card ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum">Galerie</p>
          <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-ink">Publications</h2>

          {editorials.length ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {editorials.map((item) => (
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
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[28px] bg-[#FAF5EF] px-5 py-5 text-sm text-graphite">
              Aucune publication visible pour le moment.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
