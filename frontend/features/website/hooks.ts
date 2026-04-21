"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store";
import { getFeed, getMapMarkers } from "@/lib/api/endpoints";
import type { FeedResponse } from "@/lib/api/types";

export function useWebsiteFeed(
  filter: string,
  city?: string | null,
  date?: string | null,
  limit = 9
) {
  const token = useAuthStore((state) => state.token);

  return useInfiniteQuery({
    queryKey: ["website-feed", filter, city ?? "", date ?? "", limit, Boolean(token)],
    queryFn: ({ pageParam }) =>
      getFeed({
        type: filter === "all" ? undefined : filter,
        cursor: pageParam,
        limit,
        token,
        city,
        date,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: FeedResponse) => lastPage.next_cursor,
  });
}

export function useWebsiteHighlights(city?: string | null, date?: string | null, limit = 12) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["website-highlights", city ?? "", date ?? "", limit, Boolean(token)],
    queryFn: () =>
      getFeed({
        limit,
        token,
        city,
        date,
      }),
  });
}

export function useWebsiteMapMarkers(city?: string | null, date?: string | null) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["website-map-markers", city ?? "", date ?? "", Boolean(token)],
    queryFn: () => getMapMarkers({ city, date }, token),
  });
}
