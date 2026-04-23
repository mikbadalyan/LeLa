"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { WebsiteEditorialCard } from "@/components/cards/website-editorial-card";
import { useAuthStore } from "@/features/auth/store";
import { useToggleLike } from "@/features/feed/hooks";
import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
import { getLikedEditorials } from "@/lib/api/endpoints";

export function WebsiteLikesScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const { t, formatDate } = useI18n();
  const likeMutation = useToggleLike(token);

  useEffect(() => {
    if (!token) {
      router.replace("/website/login");
    }
  }, [router, token]);

  const likedQuery = useQuery({
    queryKey: ["website-liked-editorials", city, selectedDate, Boolean(token)],
    queryFn: () => getLikedEditorials({ city, date: selectedDate }, token!),
    enabled: Boolean(token),
  });

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-5 py-8 lg:px-8 lg:py-12">
      <section className="rounded-card bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10">
        <div className="flex items-center gap-4">
          <div className="rounded-[24px] bg-blueSoft p-4 text-blue">
            <Heart className="h-6 w-6 fill-current" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue">
              {t("tabs.likes")}
            </p>
            <h1 className="mt-2 text-[2.2rem] font-semibold tracking-[-0.05em] text-ink">
              {t("tabs.likes")}
            </h1>
            <p className="mt-2 text-sm leading-7 text-graphite">
              {city} · {formatDate(selectedDate)}
            </p>
          </div>
        </div>
      </section>

      {likedQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue" />
        </div>
      ) : likedQuery.data?.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {likedQuery.data.map((item) => (
            <WebsiteEditorialCard
              key={item.id}
              item={item}
              onLike={(id) => likeMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-card bg-elevated px-6 py-8 text-sm text-graphite shadow-card ring-1 ring-borderSoft/10">
          Il n&apos;y a aucune carte aimee pour le moment.
        </div>
      )}
    </div>
  );
}
