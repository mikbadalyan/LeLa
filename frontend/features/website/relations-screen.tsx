"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { addFriend, getFriends, removeFriend, searchUsers } from "@/lib/api/endpoints";

export function WebsiteRelationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [searchValue, setSearchValue] = useState("");
  const deferredSearch = useDeferredValue(searchValue);

  useEffect(() => {
    if (!token) {
      router.replace("/website/login");
    }
  }, [router, token]);

  const friendsQuery = useQuery({
    queryKey: ["website-friends", Boolean(token)],
    queryFn: () => getFriends(token!),
    enabled: Boolean(token),
  });

  const usersQuery = useQuery({
    queryKey: ["website-user-search", deferredSearch, Boolean(token)],
    queryFn: () => searchUsers(deferredSearch, token!),
    enabled: Boolean(token),
  });

  const addFriendMutation = useMutation({
    mutationFn: (friendId: string) => addFriend(friendId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["website-friends"] });
      queryClient.invalidateQueries({ queryKey: ["website-user-search"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendId: string) => removeFriend(friendId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["website-friends"] });
      queryClient.invalidateQueries({ queryKey: ["website-user-search"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const suggestedAccounts = useMemo(
    () => (usersQuery.data ?? []).filter((entry) => !entry.is_friend && entry.id !== currentUserId),
    [currentUserId, usersQuery.data]
  );

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-5 py-8 lg:px-8 lg:py-12">
      <section className="rounded-card bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/55" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Rechercher un profil"
            className="border-0 bg-surface pl-11 shadow-none ring-0"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-card bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10">
          <h2 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-ink">Vos amis</h2>
          {friendsQuery.isLoading ? (
            <div className="mt-6 flex items-center justify-center py-8 text-blue">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {(friendsQuery.data ?? []).map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 rounded-[24px] bg-surface px-4 py-4 ring-1 ring-borderSoft/10">
                  <Link
                    href={friend.id === currentUserId ? "/website/profile" : `/website/profile/${friend.id}`}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-mist"
                  >
                    <Image src={friend.avatar_url} alt={friend.display_name} fill sizes="56px" className="object-cover" />
                  </Link>
                  <Link
                    href={friend.id === currentUserId ? "/website/profile" : `/website/profile/${friend.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-sm font-semibold text-ink">{friend.display_name}</p>
                    <p className="truncate text-xs text-graphite/70">@{friend.username}</p>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFriendMutation.mutate(friend.id)}
                    className="rounded-full bg-elevated px-3 py-2 text-xs font-semibold text-ink ring-1 ring-borderSoft/10"
                  >
                    Ami
                  </button>
                </div>
              ))}
              {!friendsQuery.data?.length ? (
                <div className="rounded-[24px] bg-surface px-4 py-5 text-sm text-graphite ring-1 ring-borderSoft/10">
                  Aucun ami pour le moment.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-card bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10">
          <h2 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-ink">Comptes suggeres</h2>
          {usersQuery.isLoading ? (
            <div className="mt-6 flex items-center justify-center py-8 text-blue">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {suggestedAccounts.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-[24px] bg-surface px-4 py-4 ring-1 ring-borderSoft/10">
                  <Link
                    href={`/website/profile/${entry.id}`}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-mist"
                  >
                    <Image src={entry.avatar_url} alt={entry.display_name} fill sizes="56px" className="object-cover" />
                  </Link>
                  <Link href={`/website/profile/${entry.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{entry.display_name}</p>
                    <p className="truncate text-xs text-graphite/70">@{entry.username}</p>
                  </Link>
                  <button
                    type="button"
                    onClick={() => addFriendMutation.mutate(entry.id)}
                    className="rounded-full bg-plum px-3 py-2 text-xs font-semibold text-white"
                  >
                    Ajouter
                  </button>
                </div>
              ))}
              {!suggestedAccounts.length ? (
                <div className="rounded-[24px] bg-surface px-4 py-5 text-sm text-graphite ring-1 ring-borderSoft/10">
                  Aucun compte suggere.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
