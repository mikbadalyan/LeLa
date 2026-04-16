import { apiRequest } from "@/lib/api/client";
import type {
  AuthResponse,
  ChatFeedbackPayload,
  ChatFeedbackResponse,
  ChatRequestPayload,
  ChatResponse,
  ContributionPayload,
  ContributionRecord,
  ConversationSummary,
  EditorialCard,
  EditorialDetail,
  FeedQueryFilters,
  FeedResponse,
  FriendRecord,
  LoginPayload,
  MapMarker,
  MessagePayload,
  MessageRecord,
  ModerationContribution,
  RegisterPayload,
  SharePayload,
  ShareRecord,
  UserUpdatePayload,
  UserSearchResult
} from "@/lib/api/types";

export function getFeed(params: {
  type?: string;
  cursor?: string | null;
  limit?: number;
  token?: string | null;
  city?: string | null;
  date?: string | null;
  media?: "all" | "video" | null;
}) {
  const search = new URLSearchParams();

  if (params.type) {
    search.set("type", params.type);
  }

  if (params.cursor) {
    search.set("cursor", params.cursor);
  }

  if (params.limit) {
    search.set("limit", String(params.limit));
  }

  if (params.city) {
    search.set("city", params.city);
  }

  if (params.date) {
    search.set("date", params.date);
  }

  if (params.media && params.media !== "all") {
    search.set("media", params.media);
  }

  return apiRequest<FeedResponse>(`/api/feed?${search.toString()}`, {
    token: params.token
  });
}

export function getEditorial(id: string, token?: string | null) {
  return apiRequest<EditorialDetail>(`/api/editorial/${id}`, {
    token
  });
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: payload
  });
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: payload
  });
}

export function getCurrentUser(token: string) {
  return apiRequest<AuthResponse["user"]>("/api/auth/me", {
    token
  });
}

export function updateCurrentUser(payload: UserUpdatePayload, token: string) {
  return apiRequest<AuthResponse["user"]>("/api/auth/me", {
    method: "PATCH",
    body: payload,
    token
  });
}

export function createContribution(payload: ContributionPayload, token: string) {
  return apiRequest<ContributionRecord>("/api/contributions", {
    method: "POST",
    body: payload,
    token
  });
}

export function toggleLike(id: string, token: string) {
  return apiRequest<{ liked: boolean; like_count: number }>(
    `/api/editorial/${id}/like`,
    {
      method: "POST",
      token
    }
  );
}

export function getLikedEditorials(filters: FeedQueryFilters, token: string) {
  const search = new URLSearchParams();

  if (filters.city) {
    search.set("city", filters.city);
  }

  if (filters.date) {
    search.set("date", filters.date);
  }

  return apiRequest<EditorialCard[]>(`/api/editorial/liked?${search.toString()}`, {
    token
  });
}

export function sendChatMessage(payload: ChatRequestPayload, token?: string | null) {
  return apiRequest<ChatResponse>("/api/chat/respond", {
    method: "POST",
    body: payload,
    token
  });
}

export function getPendingContributions(token: string) {
  return apiRequest<ModerationContribution[]>("/api/contributions?status=pending", {
    token
  });
}

export function approveContribution(id: string, token: string) {
  return apiRequest<ContributionRecord>(`/api/contributions/${id}/approve`, {
    method: "POST",
    token
  });
}

export function getMyContributions(token: string) {
  return apiRequest<ModerationContribution[]>("/api/contributions/mine", {
    token
  });
}

export function getFriends(token: string) {
  return apiRequest<FriendRecord[]>("/api/social/friends", {
    token
  });
}

export function searchUsers(query: string, token: string) {
  const search = new URLSearchParams();
  search.set("q", query);

  return apiRequest<UserSearchResult[]>(`/api/social/users/search?${search.toString()}`, {
    token
  });
}

export function addFriend(friendId: string, token: string) {
  return apiRequest<FriendRecord>(`/api/social/friends/${friendId}`, {
    method: "POST",
    token
  });
}

export function removeFriend(friendId: string, token: string) {
  return apiRequest<void>(`/api/social/friends/${friendId}`, {
    method: "DELETE",
    token
  });
}

export function shareEditorial(payload: SharePayload, token: string) {
  return apiRequest<ShareRecord>("/api/social/shares", {
    method: "POST",
    body: payload,
    token
  });
}

export function getMapMarkers(filters: FeedQueryFilters, token?: string | null) {
  const search = new URLSearchParams();

  if (filters.city) {
    search.set("city", filters.city);
  }

  if (filters.date) {
    search.set("date", filters.date);
  }

  return apiRequest<MapMarker[]>(`/api/editorial/map-markers?${search.toString()}`, {
    token
  });
}

export function getMyEditorials(token: string) {
  return apiRequest<EditorialCard[]>("/api/editorial/mine", {
    token
  });
}

export function submitChatFeedback(payload: ChatFeedbackPayload, token?: string | null) {
  return apiRequest<ChatFeedbackResponse>("/api/chat/feedback", {
    method: "POST",
    body: payload,
    token
  });
}

export function getConversations(token: string) {
  return apiRequest<ConversationSummary[]>("/api/messages/conversations", {
    token
  });
}

export function getConversationMessages(participantId: string, token: string) {
  return apiRequest<MessageRecord[]>(`/api/messages/conversations/${participantId}`, {
    token
  });
}

export function sendConversationMessage(payload: MessagePayload, token: string) {
  return apiRequest<MessageRecord>("/api/messages", {
    method: "POST",
    body: payload,
    token
  });
}
