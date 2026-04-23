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
import { History, LoaderCircle, MessageSquarePlus, Star, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  type ChatConversation,
  type ChatMessage,
  useChatStore,
} from "@/features/chat/store";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";
import { useShellStore } from "@/features/shell/store";
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
  const compactMode = useShellStore((state) => state.compactMode);
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
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
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

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-borderSoft/10 bg-elevated/92 px-4 py-3 shadow-soft backdrop-blur-md">
        <div className="flex w-full items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-10 w-10 rounded-full p-0 shadow-none"
            onClick={() => setHistoryOpen(true)}
            aria-label={t("chat.history")}
          >
            <History className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 w-10 rounded-full p-0 shadow-none"
            onClick={startNewConversation}
            aria-label={t("chat.new")}
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-32">
        <div className="space-y-4">
        {!messages.length ? (
          <div className="space-y-3">
              {starterQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => submitMessage(question)}
                  className="card-enter interactive-action block w-full rounded-[22px] bg-elevated px-4 py-3 text-left text-sm font-medium text-blue shadow-soft ring-1 ring-borderSoft/10"
                >
                  {question}
                </button>
              ))}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`card-enter rounded-[28px] px-4 py-4 shadow-sm ring-1 ${
                  message.role === "user"
                    ? "ml-8 border-transparent bg-plum text-white"
                    : "mr-3 border-borderSoft/10 bg-elevated text-ink"
                }`}
                style={{ animationDelay: `${Math.min(index * 24, 180)}ms` }}
              >
                <p className="whitespace-pre-wrap text-[15px] leading-7">{message.content}</p>
                {message.role === "assistant" ? (
                  <>
	                    {message.assistantMode === "fallback" ? (
	                      <div className="mb-3 rounded-[18px] bg-blueSoft px-3 py-3 text-xs font-medium leading-5 text-blue">
	                        {message.availabilityMessage ??
	                          t("chat.fallbackBanner")}
	                      </div>
	                    ) : null}
                    <RouteChips routes={message.suggestedRoutes} />
                    <EditorialSuggestions items={message.suggestedEditorials} />
                    {activeConversationId ? (
                      <MessageRating
                        conversationId={activeConversationId}
                        message={message}
	                        onRate={(rating) =>
	                          handleRateMessage(activeConversationId, message, rating)
	                        }
	                        label={t("chat.rateResponse")}
	                        isSaving={
                          feedbackMutation.isPending &&
                          feedbackMutation.variables?.messageId === message.id
                        }
                      />
                    ) : null}
                    {message.followUpQuestions.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {message.followUpQuestions.map((question) => (
                          <button
                            key={question}
                            type="button"
                            onClick={() => submitMessage(question)}
                            className="interactive-action rounded-full bg-blueSoft px-3 py-2 text-xs font-semibold text-blue"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            ))}

            {respondMutation.isPending ? (
              <div className="card-enter mr-3 rounded-[28px] border border-borderSoft/10 bg-elevated px-4 py-4 text-ink shadow-soft">
                <p className="flex items-center gap-2 text-[15px]">
                  <span className="typing-dot h-2.5 w-2.5 rounded-full bg-blue" />
                  <span className="typing-dot h-2.5 w-2.5 rounded-full bg-blue" />
                  <span className="typing-dot h-2.5 w-2.5 rounded-full bg-blue" />
                  <span className="ml-1 text-graphite/80">{t("chat.thinking")}</span>
                </p>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="fixed left-1/2 z-[60] w-full max-w-[430px] -translate-x-1/2 border-t border-borderSoft/10 bg-background/96 px-3 py-2 backdrop-blur-md"
        style={{
          bottom: compactMode
            ? "calc(4.9rem + env(safe-area-inset-bottom))"
            : "calc(5.2rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className={`rounded-full bg-elevated px-3 py-1.5 shadow-card ring-1 ring-borderSoft/10 transition ${composerFocused ? "shadow-blue ring-blue/20" : ""}`}>
          <div className={`flex items-center gap-2 rounded-full border border-borderSoft/10 bg-surface px-3 py-1.5 transition ${composerFocused ? "border-blue/35 bg-white/92" : ""}`}>
            <textarea
              id="lela-chat-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              placeholder={t("chat.placeholder")}
              className="h-9 min-h-9 max-h-24 w-full resize-none bg-transparent pt-2 text-[15px] text-ink outline-none placeholder:text-graphite/45"
            />
            <Button
              type="button"
              onClick={() => submitMessage(draft)}
              className="h-9 w-9 shrink-0 rounded-full p-0"
              disabled={!draft.trim() || respondMutation.isPending}
              aria-label={t("conversations.send")}
            >
              {respondMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Image
                  src="/assets/icon-chat-send.svg"
                  alt={t("conversations.send")}
                  width={22}
                  height={18}
                  className="h-4 w-auto"
                />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
