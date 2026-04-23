"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";
import { getConversations, searchUsers } from "@/lib/api/endpoints";

function ConversationAvatar({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-mist">
      <Image src={src} alt={alt} fill sizes="56px" className="object-cover" />
    </div>
  );
}

export function WebsiteConversationsScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const messageNotifications = useAuthStore((state) => state.user?.settings?.message_notifications);
  const [draftSearch, setDraftSearch] = useState("");
  const deferredSearch = useDeferredValue(draftSearch);
  const { t, formatDateTime } = useI18n();

  useEffect(() => {
    if (!token) {
      router.replace("/website/login");
    }
  }, [router, token]);

  const conversationsQuery = useQuery({
    queryKey: ["website-conversations", Boolean(token)],
    queryFn: () => getConversations(token!),
    enabled: Boolean(token),
    refetchInterval: messageNotifications === false ? false : 8000,
  });

  const searchQuery = useQuery({
    queryKey: ["website-message-user-search", deferredSearch, Boolean(token)],
    queryFn: () => searchUsers(deferredSearch, token!),
    enabled: Boolean(token) && deferredSearch.trim().length > 0,
  });

  const searchedUsers = useMemo(
    () => (searchQuery.data ?? []).filter((entry) => entry.id !== currentUserId),
    [currentUserId, searchQuery.data]
  );

  const isSearching = deferredSearch.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-8 px-5 py-8 lg:px-8 lg:py-12">
      <section className="rounded-card bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/55" />
          <Input
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder={t("conversations.search")}
            className="border-0 bg-surface pl-11 shadow-none ring-0"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-card bg-elevated shadow-card ring-1 ring-borderSoft/10">
        {isSearching ? (
          searchQuery.isLoading ? (
            <div className="flex items-center justify-center px-4 py-12 text-blue">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
          ) : searchedUsers.length ? (
            <div className="divide-y divide-borderSoft/80">
              {searchedUsers.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/website/conversations/${entry.id}`}
                  className="flex items-center gap-3 px-5 py-4 transition hover:bg-mist"
                >
                  <ConversationAvatar src={entry.avatar_url} alt={entry.display_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{entry.display_name}</p>
                    <p className="truncate text-xs text-graphite/70">@{entry.username}</p>
                  </div>
                  <span className="text-xs font-semibold text-blue">{t("conversations.newMessage")}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-graphite/70">
              {t("conversations.noResults")}
            </div>
          )
        ) : conversationsQuery.isLoading ? (
          <div className="flex items-center justify-center px-4 py-12 text-blue">
            <LoaderCircle className="h-6 w-6 animate-spin" />
          </div>
        ) : conversationsQuery.data?.length ? (
          <div className="divide-y divide-borderSoft/80">
            {conversationsQuery.data.map((conversation) => (
              <Link
                key={conversation.participant.id}
                href={`/website/conversations/${conversation.participant.id}`}
                className="flex items-center gap-3 px-5 py-4 transition hover:bg-mist"
              >
                <ConversationAvatar
                  src={conversation.participant.avatar_url}
                  alt={conversation.participant.display_name}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {conversation.participant.display_name}
                    </p>
                    {conversation.unread_count ? (
                      <span className="rounded-full bg-blue px-2 py-0.5 text-[10px] font-semibold text-white">
                        {conversation.unread_count}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-graphite/70">{conversation.last_message_preview}</p>
                </div>
                <span className="shrink-0 text-[11px] text-graphite/55">
                  {formatDateTime(conversation.last_message_at)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-graphite/70">{t("conversations.empty")}</div>
        )}
      </section>
    </div>
  );
}
