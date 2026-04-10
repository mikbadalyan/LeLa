"use client";

import { useEffect } from "react";
import { LogOut, MapPin, PenSquare } from "lucide-react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  return (
    <MobileShell activeMode="feed" activeTab="profile" className="px-4 py-5">
      <div className="space-y-4 rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-plum text-xl font-bold text-white">
            {user?.display_name.slice(0, 2).toUpperCase() ?? "LL"}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink">{user?.display_name ?? "Invitée"}</h1>
            <p className="text-sm text-graphite">{user?.username}</p>
          </div>
        </div>
        <div className="rounded-[28px] bg-mist px-4 py-4 text-sm text-graphite">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{user?.city ?? "Strasbourg"}</span>
          </div>
        </div>
        <div className="space-y-3 text-sm leading-7 text-graphite">
          <p>Likes, conversations et amis avancés restent en placeholder dans ce MVP.</p>
          <p>Le compte est deja pret pour la persistance de session JWT.</p>
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
    </MobileShell>
  );
}

