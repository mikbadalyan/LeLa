"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  LogOut,
  MapPin,
  PenSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store";
import { approveContribution, getPendingContributions } from "@/lib/api/endpoints";
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
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (!user || !token) {
      router.replace("/login");
    }
  }, [router, token, user]);

  const moderationQuery = useQuery({
    queryKey: ["pending-contributions", Boolean(token)],
    queryFn: () => getPendingContributions(token!),
    enabled: Boolean(token) && user?.role === "moderator",
  });

  const approveMutation = useMutation({
    mutationFn: (contributionId: string) => approveContribution(contributionId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  return (
    <MobileShell activeMode="feed" activeTab="profile" className="px-4 py-5">
      <div className="space-y-4">
        <div className="space-y-4 rounded-[32px] bg-white px-5 py-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-plum text-xl font-bold text-white">
              {user?.display_name.slice(0, 2).toUpperCase() ?? "LL"}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-ink">{user?.display_name ?? "Invitee"}</h1>
              <p className="text-sm text-graphite">{user?.username}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[28px] bg-mist px-4 py-4 text-sm text-graphite">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{user?.city ?? "Strasbourg"}</span>
              </div>
            </div>
            <div className="rounded-[28px] bg-[#F8F0FF] px-4 py-4 text-sm text-plum">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>
                  Role: {user?.role === "moderator" ? "Moderateur" : "Contributeur"}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3 text-sm leading-7 text-graphite">
            <p>
              {user?.role === "moderator"
                ? "Vous pouvez moderer les contributions en attente et les publier dans le feed."
                : "Vous pouvez publier de nouvelles cartes et suivre les futures evolutions du compte ici."}
            </p>
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

        {user?.role === "moderator" ? (
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
      </div>
    </MobileShell>
  );
}
