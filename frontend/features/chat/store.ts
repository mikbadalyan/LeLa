"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  ChatEditorialSuggestion,
  ChatRouteSuggestion,
} from "@/lib/api/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  assistantMode: "assistant" | "fallback";
  availabilityMessage: string | null;
  suggestedRoutes: ChatRouteSuggestion[];
  suggestedEditorials: ChatEditorialSuggestion[];
  followUpQuestions: string[];
  rating: number | null;
  feedbackId: string | null;
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface ChatState {
  draft: string;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  setDraft: (draft: string) => void;
  setActiveConversation: (conversationId: string) => void;
  startNewConversation: () => void;
  pushUserMessage: (content: string) => { conversationId: string; messageId: string };
  pushAssistantMessage: (payload: {
    message: string;
    assistantMode?: "assistant" | "fallback";
    availabilityMessage?: string | null;
    suggestedRoutes?: ChatRouteSuggestion[];
    suggestedEditorials?: ChatEditorialSuggestion[];
    followUpQuestions?: string[];
  }) => { conversationId: string | null; messageId: string | null };
  rateAssistantMessage: (messageId: string, rating: number, feedbackId?: string | null) => void;
  clearAllConversations: () => void;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMessageId() {
  return createId("chat-message");
}

function createConversationId() {
  return createId("chat-conversation");
}

function deriveConversationTitle(message: string) {
  const trimmed = message.trim();
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}...` : trimmed;
}

function createConversation(seedTitle?: string): ChatConversation {
  const timestamp = new Date().toISOString();
  return {
    id: createConversationId(),
    title: seedTitle?.trim() || "Nouvelle discussion",
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [],
  };
}

function updateConversationList(
  conversations: ChatConversation[],
  conversationId: string,
  updater: (conversation: ChatConversation) => ChatConversation
) {
  return conversations.map((conversation) =>
    conversation.id === conversationId ? updater(conversation) : conversation
  );
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      draft: "",
      conversations: [],
      activeConversationId: null,
      setDraft: (draft) => set({ draft }),
      setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),
      startNewConversation: () => set({ activeConversationId: null, draft: "" }),
      pushUserMessage: (content) => {
        const messageId = createMessageId();
        let conversationId = get().activeConversationId;

        set((state) => {
          let conversations = state.conversations;

          if (!conversationId) {
            const newConversation = createConversation(deriveConversationTitle(content));
            conversationId = newConversation.id;
            conversations = [newConversation, ...conversations];
          }

          const timestamp = new Date().toISOString();
          const message: ChatMessage = {
            id: messageId,
            role: "user",
            content,
            createdAt: timestamp,
            assistantMode: "assistant",
            availabilityMessage: null,
            suggestedRoutes: [],
            suggestedEditorials: [],
            followUpQuestions: [],
            rating: null,
            feedbackId: null,
          };

          return {
            activeConversationId: conversationId,
            conversations: updateConversationList(conversations, conversationId, (conversation) => ({
              ...conversation,
              title:
                conversation.messages.length === 0
                  ? deriveConversationTitle(content)
                  : conversation.title,
              updatedAt: timestamp,
              messages: [...conversation.messages, message],
            })),
          };
        });

        return { conversationId: conversationId!, messageId };
      },
      pushAssistantMessage: (payload) => {
        let activeConversationId: string | null = null;
        const messageId = createMessageId();

        set((state) => {
          activeConversationId = state.activeConversationId;
          if (!activeConversationId) {
            return state;
          }

          const timestamp = new Date().toISOString();
          const message: ChatMessage = {
            id: messageId,
            role: "assistant",
            content: payload.message,
            createdAt: timestamp,
            assistantMode: payload.assistantMode ?? "assistant",
            availabilityMessage: payload.availabilityMessage ?? null,
            suggestedRoutes: payload.suggestedRoutes ?? [],
            suggestedEditorials: payload.suggestedEditorials ?? [],
            followUpQuestions: payload.followUpQuestions ?? [],
            rating: null,
            feedbackId: null,
          };

          return {
            conversations: updateConversationList(
              state.conversations,
              activeConversationId,
              (conversation) => ({
                ...conversation,
                updatedAt: timestamp,
                messages: [...conversation.messages, message],
              })
            ),
          };
        });

        return { conversationId: activeConversationId, messageId: activeConversationId ? messageId : null };
      },
      rateAssistantMessage: (messageId, rating, feedbackId) =>
        set((state) => ({
          conversations: state.conversations.map((conversation) => ({
            ...conversation,
            messages: conversation.messages.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    rating,
                    feedbackId: feedbackId ?? message.feedbackId,
                  }
                : message
            ),
          })),
        })),
      clearAllConversations: () =>
        set({
          draft: "",
          conversations: [],
          activeConversationId: null,
        }),
    }),
    {
      name: "lela-chat",
      version: 3,
      migrate: (persistedState, version) => {
        const state = persistedState as {
          draft?: string;
          messages?: ChatMessage[];
          conversations?: ChatConversation[];
          activeConversationId?: string | null;
        };

        if (version < 2 && Array.isArray(state.messages)) {
          if (!state.messages.length) {
            return {
              draft: state.draft ?? "",
              conversations: [],
              activeConversationId: null,
            };
          }

          const conversation = createConversation(
            deriveConversationTitle(
              state.messages.find((message) => message.role === "user")?.content ?? "Discussion"
            )
          );
          const updatedConversation: ChatConversation = {
            ...conversation,
            createdAt: state.messages[0]?.createdAt ?? conversation.createdAt,
            updatedAt:
              state.messages[state.messages.length - 1]?.createdAt ?? conversation.updatedAt,
            messages: state.messages.map((message) => ({
              ...message,
              assistantMode: message.assistantMode ?? "assistant",
              availabilityMessage: message.availabilityMessage ?? null,
              rating: message.rating ?? null,
              feedbackId: message.feedbackId ?? null,
            })),
          };

          return {
            draft: state.draft ?? "",
            conversations: [updatedConversation],
            activeConversationId: updatedConversation.id,
          };
        }

        return {
          draft: state.draft ?? "",
          conversations:
            state.conversations?.map((conversation) => ({
              ...conversation,
              messages: conversation.messages.map((message) => ({
                ...message,
                assistantMode: message.assistantMode ?? "assistant",
                availabilityMessage: message.availabilityMessage ?? null,
                rating: message.rating ?? null,
                feedbackId: message.feedbackId ?? null,
              })),
            })) ?? [],
          activeConversationId: state.activeConversationId ?? null,
        };
      },
    }
  )
);
