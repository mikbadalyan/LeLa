"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Search, UserPlus, UserRoundCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { addFriend, getFriends, removeFriend, searchUsers } from "@/lib/api/endpoints";

export function RelationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const [searchValue, setSearchValue] = useState("");
  const deferredSearch = useDeferredValue(searchValue);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  const friendsQuery = useQuery({
    queryKey: ["friends", Boolean(token)],
    queryFn: () => getFriends(token!),
    enabled: Boolean(token),
  });

  const usersQuery = useQuery({
    queryKey: ["friend-search", deferredSearch, Boolean(token)],
    queryFn: () => searchUsers(deferredSearch, token!),
    enabled: Boolean(token),
  });

  const addFriendMutation = useMutation({
    mutationFn: (friendId: string) => addFriend(friendId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-search"] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendId: string) => removeFriend(friendId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-search"] });
    },
  });

  return (
    <MobileShell activeMode="feed" activeTab="relations" className="space-y-4 px-4 py-5">
      <div className="rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[#F8F0FF] p-3 text-plum">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Relations</h1>
            <p className="mt-2 text-sm leading-6 text-graphite">
              Recherchez des personnes inscrites par nom, pseudo ou ville, puis ajoutez-les a votre cercle.
            </p>
          </div>
        </div>

        <div className="mt-5 relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/55" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Rechercher un profil, un pseudo, une ville..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-plum">Vos amis</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">Liste d&apos;amis</h2>
          </div>
          <div className="rounded-full bg-mist px-3 py-2 text-sm font-semibold text-graphite">
            {friendsQuery.data?.length ?? 0}
          </div>
        </div>

        {friendsQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin text-plum" />
          </div>
        ) : friendsQuery.data?.length ? (
          <div className="mt-4 space-y-3">
            {friendsQuery.data.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between gap-3 rounded-[24px] bg-[#FCFAF8] px-4 py-4 ring-1 ring-borderSoft"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{friend.display_name}</p>
                  <p className="text-xs text-graphite/70">
                    @{friend.username} {friend.city ? `· ${friend.city}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => removeFriendMutation.mutate(friend.id)}
                >
                  Retirer
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[24px] bg-mist px-4 py-5 text-sm leading-6 text-graphite">
            Vous n&apos;avez pas encore d&apos;amis ajoutes.
          </div>
        )}
      </div>

      <div className="rounded-[32px] bg-white px-5 py-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.18em] text-plum">Recherche</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">Profils inscrits</h2>

        {usersQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin text-plum" />
          </div>
        ) : usersQuery.data?.length ? (
          <div className="mt-4 space-y-3">
            {usersQuery.data.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-[24px] bg-[#FCFAF8] px-4 py-4 ring-1 ring-borderSoft"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{user.display_name}</p>
                  <p className="text-xs text-graphite/70">
                    @{user.username} {user.city ? `· ${user.city}` : ""}
                  </p>
                </div>
                {user.is_friend ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => removeFriendMutation.mutate(user.id)}
                  >
                    <UserRoundCheck className="mr-2 h-4 w-4" />
                    Ami
                  </Button>
                ) : (
                  <Button type="button" onClick={() => addFriendMutation.mutate(user.id)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[24px] bg-mist px-4 py-5 text-sm leading-6 text-graphite">
            Aucun profil ne correspond a cette recherche.
          </div>
        )}
      </div>
    </MobileShell>
  );
}
