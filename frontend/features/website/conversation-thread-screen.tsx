"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, SendHorizonal } from "lucide-react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";
import { getConversationMessages, getUserById, sendConversationMessage } from "@/lib/api/endpoints";

export function WebsiteConversationThreadScreen({ participantId }: { participantId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const { t, formatDateTime } = useI18n();
  const [draftMessage, setDraftMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/website/login");
    }
  }, [router, token]);

  const participantQuery = useQuery({
    queryKey: ["website-conversation-participant", participantId],
    queryFn: () => getUserById(participantId, token!),
    enabled: Boolean(token && participantId),
  });

  const messagesQuery = useQuery({
    queryKey: ["website-conversation-messages", participantId],
    queryFn: () => getConversationMessages(participantId, token!),
    enabled: Boolean(token && participantId),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      sendConversationMessage({ recipient_id: participantId, content: draftMessage.trim() }, token!),
    onSuccess: () => {
      setDraftMessage("");
      queryClient.invalidateQueries({ queryKey: ["website-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["website-conversation-messages", participantId] });
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
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8 lg:px-8 lg:py-12">
      <section className="overflow-hidden rounded-[36px] bg-white shadow-card ring-1 ring-black/5">
        <div className="flex items-center gap-3 border-b border-borderSoft px-5 py-4">
          <Link
            href="/website/conversations"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-mist text-ink"
            aria-label={t("conversations.direct")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {participant ? (
            <>
              <Link
                href={`/website/profile/${participant.id}`}
                className="relative h-11 w-11 overflow-hidden rounded-full bg-mist"
              >
                <Image
                  src={participant.avatar_url}
                  alt={participant.display_name}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{participant.display_name}</p>
                <p className="truncate text-xs text-graphite/65">@{participant.username}</p>
              </div>
            </>
          ) : (
            <div className="text-sm text-graphite/70">{t("conversations.direct")}</div>
          )}
        </div>

        <div className="h-[65vh] min-h-[520px] overflow-y-auto bg-[#FCFAF8] px-5 py-5">
          {messagesQuery.isLoading ? (
            <div className="flex h-full items-center justify-center text-plum">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.is_mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[72%] rounded-[28px] px-4 py-4 shadow-sm ${
                      message.is_mine ? "bg-plum text-white" : "bg-white text-ink ring-1 ring-borderSoft"
                    }`}
                  >
                    {message.editorial ? (
                      <Link
                        href={`/website/editorial/${message.editorial.id}`}
                        className={`mb-3 flex items-center gap-3 rounded-[20px] p-2 ${
                          message.is_mine ? "bg-white/10" : "bg-mist"
                        }`}
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-shell">
                          {message.editorial.media_kind === "audio" ? (
                            <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#6A2BE8_100%)]" />
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
                          <p className="truncate text-sm font-semibold">{message.editorial.title}</p>
                          {message.editorial.subtitle ? (
                            <p className="truncate text-xs opacity-80">{message.editorial.subtitle}</p>
                          ) : null}
                        </div>
                      </Link>
                    ) : null}

                    {message.content ? (
                      <p className="whitespace-pre-wrap text-[15px] leading-7">{message.content}</p>
                    ) : null}
                    <p className={`mt-2 text-[11px] ${message.is_mine ? "text-white/70" : "text-graphite/55"}`}>
                      {formatDateTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-borderSoft bg-white px-5 py-4">
          <div className="flex items-center gap-2 rounded-full bg-[#F7F1EA] px-3 py-2">
            <Input
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              placeholder={t("conversations.typeMessage")}
              className="border-0 bg-transparent px-0 py-0 shadow-none ring-0"
            />
            <button
              type="submit"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-plum text-white disabled:opacity-50"
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
      </section>
    </div>
  );
}
