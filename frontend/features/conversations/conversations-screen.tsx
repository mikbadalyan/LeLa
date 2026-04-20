"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";
import { getConversations, searchUsers } from "@/lib/api/endpoints";

function ConversationAvatar({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-mist">
      <Image src={src} alt={alt} fill sizes="56px" className="object-cover" />
    </div>
  );
}

export function ConversationsScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [draftSearch, setDraftSearch] = useState("");
  const deferredSearch = useDeferredValue(draftSearch);
  const { t, formatDateTime } = useI18n();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  const conversationsQuery = useQuery({
    queryKey: ["conversations", Boolean(token)],
    queryFn: () => getConversations(token!),
    enabled: Boolean(token),
    refetchInterval: 8000,
  });

  const searchQuery = useQuery({
    queryKey: ["message-user-search", deferredSearch, Boolean(token)],
    queryFn: () => searchUsers(deferredSearch, token!),
    enabled: Boolean(token) && deferredSearch.trim().length > 0,
  });

  const isSearching = deferredSearch.trim().length > 0;

  return (
    <MobileShell activeMode="feed" activeTab="conversations" className="bg-[#F6F1EB] px-3 py-3">
      <div className="space-y-3">
        <div className="rounded-[24px] bg-white px-4 py-3 shadow-card">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/55" />
            <Input
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder={t("conversations.search")}
              className="border-0 bg-[#F7F1EA] pl-10 shadow-none ring-0"
            />
          </div>
        </div>

        <div className="rounded-[28px] bg-white shadow-card">
          {isSearching ? (
            searchQuery.isLoading ? (
              <div className="flex items-center justify-center px-4 py-8 text-plum">
                <LoaderCircle className="h-5 w-5 animate-spin" />
              </div>
            ) : searchQuery.data?.filter((entry) => entry.id !== currentUserId).length ? (
              <div className="divide-y divide-borderSoft/80">
                {searchQuery.data
                  ?.filter((entry) => entry.id !== currentUserId)
                  .map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/conversations/${entry.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition active:bg-mist"
                  >
                    <ConversationAvatar src={entry.avatar_url} alt={entry.display_name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{entry.display_name}</p>
                      <p className="truncate text-xs text-graphite/70">@{entry.username}</p>
                    </div>
                    <span className="text-xs font-semibold text-plum">
                      {t("conversations.newMessage")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-graphite/70">
                {t("conversations.noResults")}
              </div>
            )
          ) : conversationsQuery.isLoading ? (
            <div className="flex items-center justify-center px-4 py-8 text-plum">
              <LoaderCircle className="h-5 w-5 animate-spin" />
            </div>
          ) : conversationsQuery.data?.length ? (
            <div className="divide-y divide-borderSoft/80">
              {conversationsQuery.data.map((conversation) => (
                <Link
                  key={conversation.participant.id}
                  href={`/conversations/${conversation.participant.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition active:bg-mist"
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
                        <span className="rounded-full bg-plum px-2 py-0.5 text-[10px] font-semibold text-white">
                          {conversation.unread_count}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-graphite/70">
                      {conversation.last_message_preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-graphite/55">
                    {formatDateTime(conversation.last_message_at)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-graphite/70">
              {t("conversations.empty")}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
