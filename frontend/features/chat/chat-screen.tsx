"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store";
import { type ChatMessage, useChatStore } from "@/features/chat/store";
import { sendChatMessage } from "@/lib/api/endpoints";
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

function RouteChips({ routes }: { routes: ChatRouteSuggestion[] }) {
  if (!routes.length) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {routes.map((route) => (
        <Link
          key={route.href}
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
            <Image src={item.media_url} alt={item.title} fill sizes="64px" className="object-cover" />
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

export function ChatScreen() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const draft = useChatStore((state) => state.draft);
  const messages = useChatStore((state) => state.messages);
  const setDraft = useChatStore((state) => state.setDraft);
  const pushUserMessage = useChatStore((state) => state.pushUserMessage);
  const pushAssistantMessage = useChatStore((state) => state.pushAssistantMessage);
  const clearConversation = useChatStore((state) => state.clearConversation);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentPath = searchParams?.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  const recentRequests = useMemo(() => {
    const latestUserMessages = messages
      .filter((message) => message.role === "user")
      .slice(-3)
      .reverse()
      .map((message) => message.content);

    return latestUserMessages.length ? latestUserMessages : STARTER_QUESTIONS.slice(1, 4);
  }, [messages]);

  const toHistory = (entries: ChatMessage[]): ChatHistoryMessage[] =>
    entries.slice(-8).map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));

  const mutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: ChatHistoryMessage[] }) =>
      sendChatMessage(
        {
          message,
          history,
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, mutation.isPending]);

  const submitMessage = (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || mutation.isPending) {
      return;
    }

    const history = toHistory(messages);
    pushUserMessage(message);
    setDraft("");
    mutation.mutate({ message, history });
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

  return (
    <div className="flex min-h-full flex-col bg-[#F4E0C9]">
      <div className="bg-[#F59A3D] px-6 py-8 text-center text-white">
        <p className="text-3xl font-medium italic leading-tight">
          Le_La Chat se met
          <br />a 4 pattes pour vous aider !
        </p>
        <p className="mt-3 text-sm text-white/85">
          {user ? `Bonjour ${user.display_name}, ` : ""}
          posez une question sur la navigation ou sur les cartes LE_LA.
        </p>
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

            {mutation.isPending ? (
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
            <label htmlFor="lela-chat-input" className="block text-base font-semibold text-graphite">
              Ecrivez votre message
            </label>
            {messages.length ? (
              <Button
                type="button"
                variant="ghost"
                className="px-0 py-0 text-sm text-[#B06A2C]"
                onClick={clearConversation}
              >
                Reinitialiser
              </Button>
            ) : null}
          </div>
          <div className="mt-3 rounded-[24px] border border-borderSoft bg-[#FCFAF8] p-4">
            <textarea
              id="lela-chat-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Ex: Montre-moi les lieux autour du Musee Wurth"
              className="min-h-24 w-full resize-none bg-transparent text-base text-ink outline-none placeholder:text-[#BFAF9E]"
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-[#9B7A5C]">
                <Image src="/assets/icon-compose.svg" alt="Compose" width={27} height={27} className="h-5 w-auto" />
                <span>Entree pour envoyer, maj + entree pour un saut de ligne</span>
              </div>
              <Button
                type="submit"
                className="h-12 gap-2 rounded-full px-4 py-0"
                disabled={!draft.trim() || mutation.isPending}
                aria-label="Envoyer le message"
              >
                {mutation.isPending ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Image src="/assets/icon-chat-send.svg" alt="Envoyer" width={26} height={22} className="h-5 w-auto" />
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
