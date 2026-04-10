import { apiRequest } from "@/lib/api/client";
import type {
  AuthResponse,
  ChatRequestPayload,
  ChatResponse,
  ContributionPayload,
  ContributionRecord,
  EditorialDetail,
  FeedResponse,
  LoginPayload,
  RegisterPayload
} from "@/lib/api/types";

export function getFeed(params: {
  type?: string;
  cursor?: string | null;
  limit?: number;
  token?: string | null;
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

export function sendChatMessage(payload: ChatRequestPayload, token?: string | null) {
  return apiRequest<ChatResponse>("/api/chat/respond", {
    method: "POST",
    body: payload,
    token
  });
}
