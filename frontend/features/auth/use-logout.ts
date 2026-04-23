"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/features/auth/store";
import { useChatStore } from "@/features/chat/store";

export function useLogout(redirectTo = "/login") {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearAllConversations = useChatStore((state) => state.clearAllConversations);

  return () => {
    clearSession();
    clearAllConversations();
    queryClient.clear();
    router.push(redirectTo);
  };
}
