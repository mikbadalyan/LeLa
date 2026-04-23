"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, SendHorizonal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";
import {
  getConversationMessages,
  getUserById,
  sendConversationMessage,
} from "@/lib/api/endpoints";

export function ConversationThreadScreen({
  participantId,
}: {
  participantId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const { t, formatDateTime } = useI18n();
  const [draftMessage, setDraftMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const draftAppliedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (draftAppliedRef.current) {
      return;
    }
    const incomingDraft = searchParams.get("draft");
    if (incomingDraft?.trim()) {
      setDraftMessage(incomingDraft.trim());
    }
    draftAppliedRef.current = true;
  }, [searchParams]);

  const participantQuery = useQuery({
    queryKey: ["conversation-participant", participantId],
    queryFn: () => getUserById(participantId, token!),
    enabled: Boolean(token && participantId),
  });

  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", participantId],
    queryFn: () => getConversationMessages(participantId, token!),
    enabled: Boolean(token && participantId),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      sendConversationMessage(
        { recipient_id: participantId, content: draftMessage.trim() },
        token!
      ),
    onSuccess: () => {
      setDraftMessage("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", participantId] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messagesQuery.data, sendMutation.isPending]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draftMessage.trim() || sendMutation.isPending) {
      return;
    }
    sendMutation.mutate();
  };

  const participant = participantQuery.data;
  const messages = messagesQuery.data ?? [];

  return (
    <MobileShell activeMode="feed" activeTab="conversations" className="overflow-hidden bg-background p-0">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-3 border-b border-borderSoft/10 bg-elevated px-4 py-3 shadow-soft">
          <Link
            href="/conversations"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink ring-1 ring-borderSoft/10"
            aria-label={t("conversations.direct")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {participant ? (
            <>
              <div className="relative h-11 w-11 overflow-hidden rounded-full bg-mist">
                <Image
                  src={participant.avatar_url}
                  alt={participant.display_name}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{participant.display_name}</p>
                <p className="truncate text-xs text-graphite/65">@{participant.username}</p>
              </div>
            </>
          ) : (
            <div className="text-sm text-graphite/70">{t("conversations.direct")}</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {messagesQuery.isLoading ? (
            <div className="flex h-full items-center justify-center text-blue">
              <LoaderCircle className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[83%] rounded-[24px] px-4 py-3 shadow-sm ${
                      message.is_mine
                        ? "bg-plum text-white"
                        : "bg-elevated text-ink ring-1 ring-borderSoft/10"
                    }`}
                  >
                    {message.editorial ? (
                      <Link
                        href={message.editorial.href}
                        className={`mb-3 flex items-center gap-3 rounded-[20px] p-2 ${
                          message.is_mine ? "bg-white/10" : "bg-mist"
                        }`}
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-shell">
                          {message.editorial.media_kind === "audio" ? (
                            <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
                          ) : (
                            <Image
                              src={
                                message.editorial.media_kind === "video"
                                  ? message.editorial.poster_url || message.editorial.media_url
                                  : message.editorial.media_url
                              }
                              alt={message.editorial.title}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {message.editorial.title}
                          </p>
                          {message.editorial.subtitle ? (
                            <p className="truncate text-xs opacity-80">
                              {message.editorial.subtitle}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    ) : null}

                    {message.content ? (
                      <p className="whitespace-pre-wrap text-[15px] leading-6">{message.content}</p>
                    ) : null}
                    <p
                      className={`mt-2 text-[11px] ${
                        message.is_mine ? "text-white/70" : "text-graphite/55"
                      }`}
                    >
                      {formatDateTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-borderSoft/10 bg-background/96 px-3 py-3 backdrop-blur-md"
        >
          <div className="flex items-center gap-2 rounded-full bg-elevated px-3 py-2 shadow-card ring-1 ring-borderSoft/10">
            <Input
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              placeholder={t("conversations.typeMessage")}
              className="border-0 bg-transparent px-0 py-0 shadow-none ring-0"
            />
            <button
              type="submit"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum text-white disabled:opacity-50"
              disabled={!draftMessage.trim() || sendMutation.isPending}
              aria-label={t("conversations.send")}
            >
              {sendMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </MobileShell>
  );
}
