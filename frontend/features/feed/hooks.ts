"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store";
import { getFeed, toggleLike } from "@/lib/api/endpoints";
import type { FeedResponse } from "@/lib/api/types";

export function useFeed(filter: string) {
  const token = useAuthStore((state) => state.token);

  return useInfiniteQuery({
    queryKey: ["feed", filter, Boolean(token)],
    queryFn: ({ pageParam }) =>
      getFeed({
        type: filter === "all" ? undefined : filter,
        cursor: pageParam,
        limit: 5,
        token
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: FeedResponse) => lastPage.next_cursor
  });
}

export function useToggleLike(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!token) {
        throw new Error("Veuillez vous connecter pour aimer une carte.");
      }

      return toggleLike(id, token);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["editorial", id] });
    }
  });
}
