"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Clock3, Edit3, History, LoaderCircle, MessageSquarePlus, Mic, SendHorizontal, Star, X } from "lucide-react";

import { IconAsset } from "@/components/ui/lela-icons";
import {
  type ChatConversation,
  type ChatMessage,
  useChatStore,
} from "@/features/chat/store";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";
import { sendChatMessage, submitChatFeedback } from "@/lib/api/endpoints";
import type {
  ChatEditorialSuggestion,
  ChatHistoryMessage,
  ChatRouteSuggestion,
} from "@/lib/api/types";

function RouteChips({ routes }: { routes: ChatRouteSuggestion[] }) {
  if (!routes.length) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {routes.map((route) => (
        <Link
          key={`${route.href}-${route.label}`}
          href={route.href}
          className="interactive-action rounded-full bg-blueSoft px-3 py-2 text-xs font-semibold text-blue ring-1 ring-blue/15"
        >
          {route.label}
        </Link>
      ))}
    </div>
  );
}

function EditorialSuggestions({ items }: { items: ChatEditorialSuggestion[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="card-enter interactive-surface flex items-center gap-3 rounded-[22px] bg-elevated/92 p-3 ring-1 ring-borderSoft/10"
        >
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
            {item.media_kind === "audio" ? (
              <div className="absolute inset-0 bg-[linear-gradient(160deg,#1D2230_0%,#7643A6_58%,#3365C8_100%)]" />
            ) : (
              <Image
                src={item.media_kind === "video" ? item.poster_url || "/assets/icon-play.svg" : item.media_url}
                alt={item.title}
                fill
                sizes="64px"
                className="interactive-media object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">
              {item.type}
            </p>
            <p className="truncate text-base font-semibold text-ink">{item.title}</p>
            {item.subtitle ? (
              <p className="truncate text-sm text-graphite">{item.subtitle}</p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

function HistoryPanel({
  open,
  conversations,
  activeConversationId,
  onClose,
  onSelect,
  title,
  emptyLabel,
  closeLabel,
  emptyConversationLabel,
  messagesLabel,
  locale,
}: {
  open: boolean;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onClose: () => void;
  onSelect: (conversationId: string) => void;
  title: string;
  emptyLabel: string;
  closeLabel: string;
  emptyConversationLabel: string;
  messagesLabel: string;
  locale: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/35 px-4 pb-24 pt-24 backdrop-blur-[2px]">
      <div className="w-full max-w-[360px] overflow-hidden rounded-card bg-elevated px-5 py-5 shadow-card ring-1 ring-borderSoft/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-ink">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-graphite"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 max-h-[52vh] space-y-3 overflow-y-auto pb-2">
          {conversations.length ? (
            conversations.map((conversation) => {
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              const isActive = conversation.id === activeConversationId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={`block w-full rounded-[24px] px-4 py-4 text-left ring-1 transition ${
                    isActive
                      ? "bg-blueSoft ring-blue/20"
                      : "bg-surface ring-borderSoft/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-base font-semibold text-ink">
                      {conversation.title}
                    </p>
                    <span className="shrink-0 text-xs text-graphite/65">
                      {new Intl.DateTimeFormat(locale, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(conversation.updatedAt))}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-graphite/80">
                    {lastMessage?.content ?? emptyConversationLabel}
                  </p>
                  <p className="mt-2 text-xs font-medium text-blue">
                    {conversation.messages.length} {messagesLabel}
                  </p>
                </button>
              );
            })
          ) : (
            <div className="rounded-[24px] bg-surface px-4 py-5 text-sm text-graphite/80 ring-1 ring-borderSoft/10">
              {emptyLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageRating({
  conversationId,
  message,
  onRate,
  isSaving,
  label,
}: {
  conversationId: string;
  message: ChatMessage;
  onRate: (rating: number) => void;
  isSaving: boolean;
  label: string;
}) {
  if (message.role !== "assistant") {
    return null;
  }

  return (
    <div className="mt-4 rounded-[20px] bg-surface px-3 py-3 ring-1 ring-borderSoft/10">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-graphite">
          {label}
        </p>
        {message.rating ? (
          <span className="text-xs text-graphite">{message.rating}/5</span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={`${conversationId}-${message.id}-${star}`}
            type="button"
            onClick={() => onRate(star)}
            disabled={isSaving}
            className="rounded-full p-1 text-warning transition hover:scale-105 disabled:opacity-60"
            aria-label={`Noter ${star} etoile${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= (message.rating ?? 0)
                  ? "fill-current text-warning"
                  : "text-graphite/35"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatScreen() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = useAuthStore((state) => state.token);
  const draft = useChatStore((state) => state.draft);
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const setDraft = useChatStore((state) => state.setDraft);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const startNewConversation = useChatStore((state) => state.startNewConversation);
  const pushUserMessage = useChatStore((state) => state.pushUserMessage);
  const pushAssistantMessage = useChatStore((state) => state.pushAssistantMessage);
  const rateAssistantMessage = useChatStore((state) => state.rateAssistantMessage);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentPath = searchParams?.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  const starterQuestions = useMemo(
    () => [
      t("chat.starter.museums"),
      t("chat.starter.sundayShops"),
      t("chat.starter.restaurants"),
      t("chat.starter.eventsToday"),
    ],
    [t]
  );

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt)
      ),
    [conversations]
  );

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const toHistory = (entries: ChatMessage[]): ChatHistoryMessage[] =>
    entries.map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));

  const respondMutation = useMutation({
    mutationFn: ({
      message,
      history,
      conversationId,
    }: {
      message: string;
      history: ChatHistoryMessage[];
      conversationId: string;
    }) =>
      sendChatMessage(
        {
          message,
          history,
          conversation_id: conversationId,
          current_path: currentPath,
          current_focus: "chat",
        },
        token
      ),
    onSuccess: (response) => {
      pushAssistantMessage({
        message: response.message,
        assistantMode: response.mode,
        availabilityMessage: response.availability_message ?? null,
        suggestedRoutes: response.suggested_routes,
        suggestedEditorials: response.suggested_editorials,
        followUpQuestions: response.follow_up_questions,
      });
    },
    onError: (error: Error) => {
      pushAssistantMessage({
        message: error.message || t("chat.unavailable"),
        assistantMode: "fallback",
        availabilityMessage: t("chat.fallbackBanner"),
      });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({
      conversationId,
      messageId,
      rating,
      responseText,
    }: {
      conversationId: string;
      messageId: string;
      rating: number;
      responseText: string;
    }) =>
      submitChatFeedback(
        {
          conversation_id: conversationId,
          message_id: messageId,
          rating,
          response_text: responseText,
        },
        token
      ),
    onSuccess: (response) => {
      rateAssistantMessage(response.message_id, response.rating, response.id);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, respondMutation.isPending]);

  const submitMessage = (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || respondMutation.isPending) {
      return;
    }

    const history = toHistory(messages);
    const { conversationId } = pushUserMessage(message);
    setDraft("");
    respondMutation.mutate({ message, history, conversationId });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitMessage(draft);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage(draft);
    }
  };

  const handleRateMessage = (
    conversationId: string,
    message: ChatMessage,
    rating: number
  ) => {
    feedbackMutation.mutate({
      conversationId,
      messageId: message.id,
      rating,
      responseText: message.content,
    });
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#EAD9C4]">
      <HistoryPanel
        open={historyOpen}
        conversations={sortedConversations}
        activeConversationId={activeConversationId}
        title={t("chat.history")}
        emptyLabel={t("chat.emptyHistory")}
        closeLabel={t("chat.closeHistory")}
        emptyConversationLabel={t("chat.emptyConversation")}
        messagesLabel={t("chat.messages")}
        locale={locale}
        onClose={() => setHistoryOpen(false)}
        onSelect={(conversationId) => {
          setActiveConversation(conversationId);
          setHistoryOpen(false);
        }}
      />

      <div className="shrink-0 bg-[var(--pwa-orange)] px-6 py-7 text-center text-[23px] italic leading-[1.42] tracking-[0.01em] text-white">
        Le_La Chat se met<br />à 4 pattes pour vous aider&nbsp;!
        <div className="sr-only">
          <button type="button" onClick={() => setHistoryOpen(true)} aria-label={t("chat.history")}>
            <History />
          </button>
          <button type="button" onClick={startNewConversation} aria-label={t("chat.new")}>
            <MessageSquarePlus />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[22px] py-4 pb-[calc(var(--pwa-card-gap)+8px)]">
        <section>
          <h1 className="text-[14px] leading-tight text-[#454A55]">Questions les plus posées à Strasbourg</h1>
          <div className="mt-3 space-y-2.5">
            {starterQuestions.slice(0, 4).map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => submitMessage(question)}
                className="block w-full text-left text-[13px] leading-[1.45] text-[#D98122] underline underline-offset-2"
              >
                {question}
              </button>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-7">
          <div
            className={`relative h-[230px] rounded-[10px] bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition ${
              composerFocused ? "ring-2 ring-[#FE9833]/55" : ""
            }`}
          >
            <textarea
              id="lela-chat-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              placeholder="Quelle est votre question ?"
              className="h-[112px] w-full resize-none bg-transparent text-[14px] leading-6 text-[#454A55] outline-none placeholder:text-[#454A55]"
            />
            <button
              type="button"
              onClick={() => submitMessage(draft)}
              className="absolute right-9 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#BFC1C5] transition enabled:hover:text-[#FE9833] disabled:opacity-55"
              disabled={!draft.trim() || respondMutation.isPending}
              aria-label={t("conversations.send")}
            >
              {respondMutation.isPending ? (
                <LoaderCircle className="h-6 w-6 animate-spin" />
              ) : (
                <SendHorizontal className="h-7 w-7 fill-current" strokeWidth={0} />
              )}
            </button>
            <div className="absolute bottom-9 left-5 flex items-center gap-5 text-[#FE9833]">
              <Edit3 className="h-7 w-7" strokeWidth={2.35} />
              <Mic className="h-7 w-7" strokeWidth={2.35} />
            </div>
            <IconAsset
              src="/icon/chat.svg"
              className="absolute bottom-8 right-6 h-[44px] w-[44px] text-[#BFC1C5] opacity-55"
            />
          </div>
        </form>

        {messages.length ? (
          <div className="mt-5 space-y-3">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`rounded-[16px] px-4 py-3 text-[14px] leading-6 shadow-sm ${
                  message.role === "user" ? "ml-8 bg-[#7B3FB2] text-white" : "mr-3 bg-white text-[#454A55]"
                }`}
                style={{ animationDelay: `${Math.min(index * 24, 180)}ms` }}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.role === "assistant" ? (
                  <>
                    {message.assistantMode === "fallback" ? (
                      <div className="mt-3 rounded-[12px] bg-[#E9EEF9] px-3 py-2 text-xs font-medium text-[#3365C8]">
                        {message.availabilityMessage ?? t("chat.fallbackBanner")}
                      </div>
                    ) : null}
                    <RouteChips routes={message.suggestedRoutes} />
                    <EditorialSuggestions items={message.suggestedEditorials} />
                    {activeConversationId ? (
                      <MessageRating
                        conversationId={activeConversationId}
                        message={message}
                        onRate={(rating) => handleRateMessage(activeConversationId, message, rating)}
                        label={t("chat.rateResponse")}
                        isSaving={feedbackMutation.isPending && feedbackMutation.variables?.messageId === message.id}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            ))}
            {respondMutation.isPending ? (
              <div className="mr-3 rounded-[16px] bg-white px-4 py-3 text-[#454A55] shadow-sm">
                <p className="flex items-center gap-2 text-[14px]">
                  <span className="typing-dot h-2.5 w-2.5 rounded-full bg-[#3365C8]" />
                  <span className="typing-dot h-2.5 w-2.5 rounded-full bg-[#3365C8]" />
                  <span className="typing-dot h-2.5 w-2.5 rounded-full bg-[#3365C8]" />
                  <span>{t("chat.thinking")}</span>
                </p>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        ) : null}

        <section className="mt-7 pb-3">
          <h2 className="flex items-center gap-5 text-[14px] text-[#454A55]">
            <Clock3 className="h-6 w-6" strokeWidth={2.2} />
            Dernières requêtes
          </h2>
          <div className="mt-5 space-y-2.5">
            {starterQuestions.slice(1, 4).map((question) => (
              <button
                key={`recent-${question}`}
                type="button"
                onClick={() => submitMessage(question)}
                className="block w-full text-left text-[13px] leading-[1.45] text-[#D98122] underline underline-offset-2"
              >
                {question}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
