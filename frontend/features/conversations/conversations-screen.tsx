"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, MessageCircleMore, Search, SendHorizonal, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import {
  getConversationMessages,
  getConversations,
  searchUsers,
  sendConversationMessage,
} from "@/lib/api/endpoints";
import { formatFrenchDateTime } from "@/lib/utils/format";

export function ConversationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const deferredSearch = useDeferredValue(searchValue);

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

  useEffect(() => {
    if (!activeParticipantId && conversationsQuery.data?.length) {
      setActiveParticipantId(conversationsQuery.data[0].participant.id);
    }
  }, [activeParticipantId, conversationsQuery.data]);

  const searchQuery = useQuery({
    queryKey: ["message-user-search", deferredSearch, Boolean(token)],
    queryFn: () => searchUsers(deferredSearch, token!),
    enabled: Boolean(token) && deferredSearch.trim().length > 0,
  });

  const activeParticipant = useMemo(() => {
    const fromConversations = conversationsQuery.data?.find(
      (entry) => entry.participant.id === activeParticipantId
    )?.participant;

    if (fromConversations) {
      return fromConversations;
    }

    return searchQuery.data?.find((entry) => entry.id === activeParticipantId) ?? null;
  }, [activeParticipantId, conversationsQuery.data, searchQuery.data]);

  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", activeParticipantId],
    queryFn: () => getConversationMessages(activeParticipantId!, token!),
    enabled: Boolean(token && activeParticipantId),
    refetchInterval: activeParticipantId ? 5000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      sendConversationMessage(
        { recipient_id: activeParticipantId!, content: draftMessage.trim() },
        token!
      ),
    onSuccess: () => {
      setDraftMessage("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", activeParticipantId],
      });
    },
  });

  return (
    <MobileShell activeMode="feed" activeTab="conversations" className="space-y-4 px-4 py-5">
      <div className="rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-[#F8F0FF] p-3 text-plum">
              <MessageCircleMore className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-ink">Conversations</h1>
              <p className="mt-2 text-sm leading-6 text-graphite">
                Echangez avec vos amis ou d&apos;autres profils inscrits, et retrouvez ici les cartes partagees.
              </p>
            </div>
          </div>
          <Link
            href="/feed?focus=chat"
            className="inline-flex items-center gap-2 rounded-full bg-mist px-3 py-2 text-xs font-semibold text-plum"
          >
            <Sparkles className="h-4 w-4" />
            LE_LA Chat
          </Link>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/55" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Chercher un ami ou un profil inscrit..."
            className="pl-10"
          />
        </div>

        {searchValue.trim().length ? (
          <div className="mt-4 space-y-2">
            {searchQuery.isLoading ? (
              <div className="flex items-center justify-center py-4 text-plum">
                <LoaderCircle className="h-5 w-5 animate-spin" />
              </div>
            ) : searchQuery.data?.length ? (
              searchQuery.data.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setActiveParticipantId(entry.id);
                    setSearchValue("");
                  }}
                  className="flex w-full items-center justify-between rounded-[22px] bg-[#FCFAF8] px-4 py-3 text-left ring-1 ring-borderSoft transition hover:bg-mist"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{entry.display_name}</p>
                    <p className="text-xs text-graphite/70">
                      @{entry.username} {entry.city ? `· ${entry.city}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-plum">
                    {entry.is_friend ? "Ami" : "Message"}
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-[22px] bg-mist px-4 py-4 text-sm text-graphite">
                Aucun profil ne correspond a cette recherche.
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-plum">Boite de reception</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">Messages recents</h2>
          </div>
          <div className="rounded-full bg-mist px-3 py-2 text-sm font-semibold text-graphite">
            {conversationsQuery.data?.length ?? 0}
          </div>
        </div>

        {conversationsQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin text-plum" />
          </div>
        ) : conversationsQuery.data?.length ? (
          <div className="mt-4 space-y-3">
            {conversationsQuery.data.map((conversation) => (
              <button
                key={conversation.participant.id}
                type="button"
                onClick={() => setActiveParticipantId(conversation.participant.id)}
                className={`flex w-full items-center justify-between gap-4 rounded-[24px] px-4 py-4 text-left ring-1 transition ${
                  activeParticipantId === conversation.participant.id
                    ? "bg-[#F8F0FF] ring-plum/20"
                    : "bg-[#FCFAF8] ring-borderSoft hover:bg-mist"
                }`}
              >
                <div className="min-w-0">
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
                  <p className="mt-1 truncate text-xs text-graphite/75">
                    {conversation.last_message_preview}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-graphite/65">
                  {formatFrenchDateTime(conversation.last_message_at)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[24px] bg-mist px-4 py-5 text-sm leading-6 text-graphite">
            Aucune conversation pour le moment. Choisissez un profil pour lancer un premier message.
          </div>
        )}
      </div>

      <div className="rounded-[32px] bg-white px-5 py-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-plum">Discussion</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">
              {activeParticipant?.display_name ?? "Choisissez une personne"}
            </h2>
          </div>
          {activeParticipant ? (
            <p className="text-xs text-graphite/70">
              @{activeParticipant.username}
            </p>
          ) : null}
        </div>

        {activeParticipantId ? (
          <>
            <div className="mt-4 space-y-3 rounded-[28px] bg-[#FCFAF8] px-4 py-4 ring-1 ring-borderSoft">
              {messagesQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderCircle className="h-6 w-6 animate-spin text-plum" />
                </div>
              ) : messagesQuery.data?.length ? (
                messagesQuery.data.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] space-y-2 rounded-[24px] px-4 py-3 ${
                        message.is_mine
                          ? "bg-plum text-white"
                          : "bg-white text-ink ring-1 ring-borderSoft"
                      }`}
                    >
                      {message.content ? (
                        <p className="text-sm leading-6">{message.content}</p>
                      ) : null}
                      {message.editorial ? (
                        <Link
                          href={message.editorial.href}
                          className={`block overflow-hidden rounded-[20px] ${
                            message.is_mine ? "bg-white/12" : "bg-mist"
                          }`}
                        >
                          <div className="relative aspect-[1.2]">
                            <Image
                              src={
                                message.editorial.media_kind === "video"
                                  ? message.editorial.poster_url || "/assets/icon-play.svg"
                                  : message.editorial.media_url
                              }
                              alt={message.editorial.title}
                              fill
                              sizes="240px"
                              className="object-cover"
                            />
                          </div>
                          <div className="px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.16em] opacity-70">
                              Carte partagee
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {message.editorial.title}
                            </p>
                            {message.editorial.subtitle ? (
                              <p className="mt-1 text-xs opacity-80">
                                {message.editorial.subtitle}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                      ) : null}
                      <p className={`text-[11px] ${message.is_mine ? "text-white/70" : "text-graphite/60"}`}>
                        {message.is_mine
                          ? "Vous"
                          : message.sender.id === user?.id
                            ? "Vous"
                            : message.sender.display_name}{" "}
                        · {formatFrenchDateTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] bg-white px-4 py-5 text-sm text-graphite ring-1 ring-borderSoft">
                  Aucun message pour l&apos;instant. Lancez la conversation.
                </div>
              )}
            </div>

            <div className="mt-4 flex items-end gap-3">
              <Input
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder={`Ecrire a ${activeParticipant?.display_name ?? "cette personne"}...`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && draftMessage.trim()) {
                    event.preventDefault();
                    sendMutation.mutate();
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => sendMutation.mutate()}
                disabled={!draftMessage.trim() || sendMutation.isPending}
                className="shrink-0 rounded-full px-4"
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-[24px] bg-mist px-4 py-5 text-sm leading-6 text-graphite">
            Choisissez une conversation existante ou recherchez un profil pour commencer.
          </div>
        )}
      </div>
    </MobileShell>
  );
}
