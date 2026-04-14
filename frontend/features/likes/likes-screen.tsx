"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { EditorialFeedCard } from "@/components/cards/editorial-feed-card";
import { MobileShell } from "@/components/layout/mobile-shell";
import { useAuthStore } from "@/features/auth/store";
import { useToggleLike } from "@/features/feed/hooks";
import { useShellStore } from "@/features/shell/store";
import { getLikedEditorials } from "@/lib/api/endpoints";
import { formatFrenchDate } from "@/lib/utils/format";

export function LikesScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const likeMutation = useToggleLike(token);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  const likedQuery = useQuery({
    queryKey: ["liked-editorials", city, selectedDate, Boolean(token)],
    queryFn: () => getLikedEditorials({ city, date: selectedDate }, token!),
    enabled: Boolean(token),
  });

  return (
    <MobileShell activeMode="feed" activeTab="likes" className="space-y-4 px-3 py-4">
      <div className="rounded-[28px] bg-white px-4 py-5 shadow-sm ring-1 ring-borderSoft">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#F8F0FF] p-3 text-plum">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Cartes aimees</h1>
            <p className="text-sm leading-6 text-graphite">
              {city} · {formatFrenchDate(selectedDate)}
            </p>
          </div>
        </div>
      </div>

      {likedQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-7 w-7 animate-spin text-plum" />
        </div>
      ) : likedQuery.data?.length ? (
        likedQuery.data.map((item) => (
          <EditorialFeedCard
            key={item.id}
            item={item}
            onLike={(id) => likeMutation.mutate(id)}
          />
        ))
      ) : (
        <div className="rounded-[28px] bg-white px-4 py-6 text-sm leading-6 text-graphite shadow-sm ring-1 ring-borderSoft">
          Il n&apos;y a aucune carte aimee pour le moment.
        </div>
      )}
    </MobileShell>
  );
}
