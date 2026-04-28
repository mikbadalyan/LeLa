"use client";

import { type ReactNode, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { FriendNetworkExplorer } from "@/components/social/friend-network-explorer";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";
import { addFriend, getFriendGraph, getFriends, removeFriend, searchUsers } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils/cn";

function UserRow({
  avatar,
  name,
  username,
  city,
  action,
  href,
}: {
  avatar: string;
  name: string;
  username: string;
  city?: string | null;
  action: ReactNode;
  href: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Link href={href} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-mist">
        <Image src={avatar} alt={name} fill sizes="56px" className="object-cover" />
      </Link>
      <Link href={href} className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
        <p className="truncate text-xs text-graphite/70">
          @{username}
          {city ? ` · ${city}` : ""}
        </p>
      </Link>
      {action}
    </div>
  );
}

export function RelationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [searchValue, setSearchValue] = useState("");
  const [panelMode, setPanelMode] = useState<"graph" | "lists">("graph");
  const deferredSearch = useDeferredValue(searchValue);
  const { t } = useI18n();

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

  const graphQuery = useQuery({
    queryKey: ["friend-graph", Boolean(token)],
    queryFn: () => getFriendGraph(token!, { depth: 3, limit: 160 }),
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
      queryClient.invalidateQueries({ queryKey: ["friend-graph"] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendId: string) => removeFriend(friendId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-search"] });
      queryClient.invalidateQueries({ queryKey: ["friend-graph"] });
    },
  });

  const query = deferredSearch.trim().toLowerCase();

  const filteredFriends = useMemo(() => {
    const items = friendsQuery.data ?? [];
    if (!query) {
      return items;
    }
    return items.filter((friend) =>
      [friend.display_name, friend.username, friend.city ?? ""].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [friendsQuery.data, query]);

  const suggestedAccounts = useMemo(() => {
    const items = usersQuery.data ?? [];
    return items.filter((entry) => !entry.is_friend && entry.id !== currentUserId);
  }, [currentUserId, usersQuery.data]);

  return (
    <MobileShell activeMode="feed" activeTab="relations" className="bg-background px-3 py-3">
      <div className="space-y-3">
        <div className="rounded-[24px] bg-elevated px-4 py-3 shadow-card ring-1 ring-borderSoft/10">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/55" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={t("relations.search")}
              className="border-0 bg-surface pl-10 shadow-none ring-0"
            />
          </div>
        </div>

        <div className="rounded-[24px] bg-elevated p-1 shadow-card ring-1 ring-borderSoft/10">
          <div className="flex items-center gap-1">
            {(["graph", "lists"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPanelMode(mode)}
                className={cn(
                  "flex-1 rounded-[18px] px-4 py-3 text-sm font-semibold transition",
                  panelMode === mode ? "bg-blue text-white shadow-blue" : "text-graphite hover:bg-surface"
                )}
              >
                {mode === "graph" ? t("relations.showGraph") : t("relations.showLists")}
              </button>
            ))}
          </div>
        </div>

        {panelMode === "graph" ? (
          <FriendNetworkExplorer
            graph={graphQuery.data}
            isLoading={graphQuery.isLoading}
            profileBasePath="/profile"
            variant="mobile"
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-[28px] bg-elevated shadow-card ring-1 ring-borderSoft/10">
              <div className="border-b border-borderSoft/10 px-4 py-3">
                <p className="text-sm font-semibold text-ink">{t("relations.friends")}</p>
              </div>
              {friendsQuery.isLoading ? (
                <div className="flex items-center justify-center px-4 py-8 text-blue">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                </div>
              ) : filteredFriends.length ? (
                <div className="divide-y divide-borderSoft/80">
                  {filteredFriends.map((friend) => (
                    <UserRow
                      key={friend.id}
                      avatar={friend.avatar_url}
                      name={friend.display_name}
                      username={friend.username}
                      city={friend.city}
                      href={friend.id === currentUserId ? "/profile" : `/profile/${friend.id}`}
                      action={
                        <button
                          type="button"
                          onClick={() => removeFriendMutation.mutate(friend.id)}
                          className="rounded-full bg-surface px-3 py-2 text-xs font-semibold text-ink ring-1 ring-borderSoft/10"
                        >
                          {t("relations.friend")}
                        </button>
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-sm text-graphite/70">{t("relations.emptyFriends")}</div>
              )}
            </div>

            <div className="overflow-hidden rounded-[28px] bg-elevated shadow-card ring-1 ring-borderSoft/10">
              <div className="border-b border-borderSoft/10 px-4 py-3">
                <p className="text-sm font-semibold text-ink">{t("relations.suggested")}</p>
              </div>
              {usersQuery.isLoading ? (
                <div className="flex items-center justify-center px-4 py-8 text-blue">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                </div>
              ) : suggestedAccounts.length ? (
                <div className="divide-y divide-borderSoft/80">
                  {suggestedAccounts.map((user) => (
                    <UserRow
                      key={user.id}
                      avatar={user.avatar_url}
                      name={user.display_name}
                      username={user.username}
                      city={user.city}
                      href={user.id === currentUserId ? "/profile" : `/profile/${user.id}`}
                      action={
                        <button
                          type="button"
                          onClick={() => addFriendMutation.mutate(user.id)}
                          className="rounded-full bg-plum px-3 py-2 text-xs font-semibold text-white shadow-float"
                        >
                          {t("relations.add")}
                        </button>
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-sm text-graphite/70">
                  {t("relations.emptySuggested")}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MobileShell>
  );
}
