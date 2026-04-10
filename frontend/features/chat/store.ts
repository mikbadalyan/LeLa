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
  suggestedRoutes: ChatRouteSuggestion[];
  suggestedEditorials: ChatEditorialSuggestion[];
  followUpQuestions: string[];
}

interface ChatState {
  draft: string;
  messages: ChatMessage[];
  setDraft: (draft: string) => void;
  pushUserMessage: (content: string) => void;
  pushAssistantMessage: (payload: {
    message: string;
    suggestedRoutes?: ChatRouteSuggestion[];
    suggestedEditorials?: ChatEditorialSuggestion[];
    followUpQuestions?: string[];
  }) => void;
  clearConversation: () => void;
}

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      draft: "",
      messages: [],
      setDraft: (draft) => set({ draft }),
      pushUserMessage: (content) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: createMessageId(),
              role: "user",
              content,
              createdAt: new Date().toISOString(),
              suggestedRoutes: [],
              suggestedEditorials: [],
              followUpQuestions: [],
            },
          ],
        })),
      pushAssistantMessage: (payload) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: createMessageId(),
              role: "assistant",
              content: payload.message,
              createdAt: new Date().toISOString(),
              suggestedRoutes: payload.suggestedRoutes ?? [],
              suggestedEditorials: payload.suggestedEditorials ?? [],
              followUpQuestions: payload.followUpQuestions ?? [],
            },
          ],
        })),
      clearConversation: () =>
        set({
          draft: "",
          messages: [],
        }),
    }),
    {
      name: "lela-chat",
    }
  )
);
