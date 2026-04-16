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
import { sendChatMessage, submitChatFeedback } from "@/lib/api/endpoints";
import type {
  ChatEditorialSuggestion,
  ChatHistoryMessage,
  ChatRouteSuggestion,
} from "@/lib/api/types";

const STARTER_QUESTIONS = [
  "Quels musees faut-il absolument visiter a Strasbourg ?",
  "Quels sont les magasins ouverts le dimanche apres 14h00 ?",
  "Quels restaurants typiques faut-il absolument tester a Strasbourg ?",
  "Quels evenements puis-je voir aujourd'hui sur LE_LA ?",
];

function formatConversationDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

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
          className="rounded-full bg-[#F8F0FF] px-3 py-2 text-xs font-semibold text-plum ring-1 ring-plum/20"
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
          className="flex items-center gap-3 rounded-[22px] bg-white/90 p-3 ring-1 ring-[#E7D8C8]"
        >
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
            <Image
              src={item.media_kind === "video" ? item.poster_url || "/assets/icon-play.svg" : item.media_url}
              alt={item.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B06A2C]">
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
}: {
  open: boolean;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onClose: () => void;
  onSelect: (conversationId: string) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]">
      <div className="absolute inset-x-0 bottom-0 max-h-[75vh] rounded-t-[32px] bg-white px-5 py-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-ink">Historique des chats</p>
            <p className="text-sm text-graphite/70">
              Reprenez une conversation precedente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-graphite"
            aria-label="Fermer l'historique"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3 overflow-y-auto pb-2">
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
                      ? "bg-[#F8F0FF] ring-plum/25"
                      : "bg-[#FFF9F1] ring-[#E7D8C8]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-base font-semibold text-ink">
                      {conversation.title}
                    </p>
                    <span className="shrink-0 text-xs text-graphite/65">
                      {formatConversationDate(conversation.updatedAt)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-graphite/80">
                    {lastMessage?.content ?? "Discussion vide"}
                  </p>
                  <p className="mt-2 text-xs font-medium text-[#A9652B]">
                    {conversation.messages.length} messages
                  </p>
                </button>
              );
            })
          ) : (
            <div className="rounded-[24px] bg-[#FFF9F1] px-4 py-5 text-sm text-graphite/80 ring-1 ring-[#E7D8C8]">
              Aucune conversation enregistree pour le moment.
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
}: {
  conversationId: string;
  message: ChatMessage;
  onRate: (rating: number) => void;
  isSaving: boolean;
}) {
  if (message.role !== "assistant") {
    return null;
  }

  return (
    <div className="mt-4 rounded-[20px] bg-[#F9EFE3] px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#8C633A]">
          Notez cette reponse
        </p>
        {message.rating ? (
          <span className="text-xs text-[#8C633A]">{message.rating}/5</span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={`${conversationId}-${message.id}-${star}`}
            type="button"
            onClick={() => onRate(star)}
            disabled={isSaving}
            className="rounded-full p-1 text-[#C4864B] transition hover:scale-105 disabled:opacity-60"
            aria-label={`Noter ${star} etoile${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= (message.rating ?? 0)
                  ? "fill-current text-[#F59A3D]"
                  : "text-[#D3B08A]"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatScreen() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
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
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentPath = searchParams?.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

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

  const recentRequests = useMemo(() => {
    const latestUserMessages = messages
      .filter((message) => message.role === "user")
      .slice(-3)
      .reverse()
      .map((message) => message.content);

    return latestUserMessages.length ? latestUserMessages : STARTER_QUESTIONS.slice(1, 4);
  }, [messages]);

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
        suggestedRoutes: response.suggested_routes,
        suggestedEditorials: response.suggested_editorials,
        followUpQuestions: response.follow_up_questions,
      });
    },
    onError: (error: Error) => {
      pushAssistantMessage({
        message:
          error.message ||
          "LE_LA Chat est indisponible pour le moment. Verifiez la configuration du backend puis reessayez.",
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
    <div className="flex min-h-full flex-col bg-[#F4E0C9]">
      <HistoryPanel
        open={historyOpen}
        conversations={sortedConversations}
        activeConversationId={activeConversationId}
        onClose={() => setHistoryOpen(false)}
        onSelect={(conversationId) => {
          setActiveConversation(conversationId);
          setHistoryOpen(false);
        }}
      />

      <div className="bg-[#F59A3D] px-6 py-8 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-medium italic leading-tight">
              Le_La Chat se met
              <br />a 4 pattes pour vous aider !
            </p>
            <p className="mt-3 text-sm text-white/85">
              {user ? `Bonjour ${user.display_name}, ` : ""}
              posez une question sur la navigation ou sur les cartes LE_LA.
            </p>
            {activeConversation ? (
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                Discussion: {activeConversation.title}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-11 px-3 text-xs"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="mr-2 h-4 w-4" />
              Historique
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-11 px-3 text-xs"
              onClick={startNewConversation}
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Nouvelle
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 px-5 py-6 pb-40">
        {!messages.length ? (
          <div>
            <h2 className="text-lg font-semibold text-[#7C5332]">
              Questions les plus posees a Strasbourg
            </h2>
            <div className="mt-4 space-y-3">
              {STARTER_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => submitMessage(question)}
                  className="block text-left text-base text-[#B06A2C] underline decoration-1 underline-offset-4"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-[28px] px-4 py-4 shadow-sm ${
                  message.role === "user"
                    ? "ml-8 bg-plum text-white"
                    : "mr-3 bg-[#FFF9F1] text-ink"
                }`}
              >
                <p className="whitespace-pre-wrap text-[15px] leading-7">{message.content}</p>
                {message.role === "assistant" ? (
                  <>
                    <RouteChips routes={message.suggestedRoutes} />
                    <EditorialSuggestions items={message.suggestedEditorials} />
                    {activeConversationId ? (
                      <MessageRating
                        conversationId={activeConversationId}
                        message={message}
                        onRate={(rating) =>
                          handleRateMessage(activeConversationId, message, rating)
                        }
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
                            className="rounded-full bg-[#FBE7D3] px-3 py-2 text-xs font-semibold text-[#A9652B]"
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
              <div className="mr-3 rounded-[28px] bg-[#FFF9F1] px-4 py-4 text-ink shadow-sm">
                <p className="flex items-center gap-2 text-[15px]">
                  <LoaderCircle className="h-4 w-4 animate-spin text-plum" />
                  LE_LA Chat reflechit a la meilleure reponse...
                </p>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-[#7C5332]">Dernieres requetes</h3>
          <div className="mt-4 space-y-3">
            {recentRequests.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => submitMessage(question)}
                className="block text-left text-base text-[#D08B46] underline decoration-1 underline-offset-4"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 mt-auto border-t border-[#E6D4C0] bg-[#F4E0C9]/95 px-4 py-4 backdrop-blur"
      >
        <div className="rounded-[28px] bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="lela-chat-input"
              className="block text-base font-semibold text-graphite"
            >
              Ecrivez votre message
            </label>
            {sortedConversations.length ? (
              <span className="text-xs font-medium text-[#8C633A]">
                {sortedConversations.length} chat{sortedConversations.length > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
          <div className="mt-3 rounded-[24px] border border-borderSoft bg-[#FCFAF8] p-4">
            <textarea
              id="lela-chat-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Ex: Montre-moi les capsules liees au Musee Wurth"
              className="min-h-24 w-full resize-none bg-transparent text-base text-ink outline-none placeholder:text-[#BFAF9E]"
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-[#9B7A5C]">
                <Image
                  src="/assets/icon-compose.svg"
                  alt="Compose"
                  width={27}
                  height={27}
                  className="h-5 w-auto"
                />
                <span>Entree pour envoyer, maj + entree pour un saut de ligne</span>
              </div>
              <Button
                type="submit"
                className="h-12 gap-2 rounded-full px-4 py-0"
                disabled={!draft.trim() || respondMutation.isPending}
                aria-label="Envoyer le message"
              >
                {respondMutation.isPending ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Image
                    src="/assets/icon-chat-send.svg"
                    alt="Envoyer"
                    width={26}
                    height={22}
                    className="h-5 w-auto"
                  />
                )}
                <span>Envoyer</span>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
