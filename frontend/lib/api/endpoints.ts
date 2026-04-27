import { apiRequest } from "@/lib/api/client";
import type {
  AuthResponse,
  ChatFeedbackPayload,
  ChatFeedbackResponse,
  ChatRequestPayload,
  ChatResponse,
  CardPayload,
  CardSearchResult,
  ContributionPayload,
  ContributionProposal,
  ContributionProposalPayload,
  ContributionRecord,
  ConversationSummary,
  ContributionFiche,
  ContributionFichePayload,
  EditorialCard,
  EditorialDetail,
  FeedQueryFilters,
  FeedResponse,
  FicheModerationPayload,
  FriendRecord,
  LoginPayload,
  MapMarker,
  MessagePayload,
  MessageRecord,
  ModerateContributionPayload,
  ModerationContribution,
  PasswordChangePayload,
  PasswordChangeResponse,
  ProposalModerationPayload,
  PublicCard,
  PublishedFiche,
  RegisterPayload,
  RevisionHistoryRecord,
  SharePayload,
  ShareRecord,
  UserSettings,
  UserSettingsUpdatePayload,
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

export function getUserById(userId: string, token?: string | null) {
  return apiRequest<AuthResponse["user"]>(`/api/auth/users/${userId}`, {
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

export function getCurrentSettings(token: string) {
  return apiRequest<UserSettings>("/api/auth/settings", {
    token
  });
}

export function updateCurrentSettings(payload: UserSettingsUpdatePayload, token: string) {
  return apiRequest<UserSettings>("/api/auth/settings", {
    method: "PATCH",
    body: payload,
    token
  });
}

export function changePassword(payload: PasswordChangePayload, token: string) {
  return apiRequest<PasswordChangeResponse>("/api/auth/password", {
    method: "POST",
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

export function createContributionFiche(payload: ContributionFichePayload, token: string) {
  return apiRequest<ContributionFiche>("/api/contributions/fiches", {
    method: "POST",
    body: payload,
    token
  });
}

export function updateContributionFiche(
  id: string,
  payload: Partial<ContributionFichePayload> & { moderator_notes?: string | null },
  token: string
) {
  return apiRequest<ContributionFiche>(`/api/contributions/fiches/${id}`, {
    method: "PUT",
    body: payload,
    token
  });
}

export function getContributionFiches(
  token: string,
  filters: { status?: string; type?: string; city?: string } = {}
) {
  const search = new URLSearchParams();
  if (filters.status) search.set("status", filters.status);
  if (filters.type) search.set("type", filters.type);
  if (filters.city) search.set("city", filters.city);
  const query = search.toString();
  return apiRequest<ContributionFiche[]>(
    `/api/contributions/fiches${query ? `?${query}` : ""}`,
    { token }
  );
}

export function getContributionFiche(id: string, token: string) {
  return apiRequest<ContributionFiche>(`/api/contributions/fiches/${id}`, {
    token
  });
}

export function reviewContributionFicheWithAi(id: string, token: string) {
  return apiRequest<ContributionFiche>(`/api/contributions/fiches/${id}/ai-review`, {
    method: "POST",
    token
  });
}

export function submitContributionFiche(id: string, token: string) {
  return apiRequest<ContributionFiche>(`/api/contributions/fiches/${id}/submit`, {
    method: "POST",
    token
  });
}

export function moderateContributionFiche(
  id: string,
  action: "approve" | "reject" | "needs-changes",
  payload: FicheModerationPayload,
  token: string
) {
  return apiRequest<ContributionFiche>(`/api/moderation/fiches/${id}/${action}`, {
    method: "POST",
    body: payload,
    token
  });
}

export function searchCards(
  filters: { q?: string; city?: string; tags?: string; category?: string; limit?: number } = {}
) {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.city) search.set("city", filters.city);
  if (filters.tags) search.set("tags", filters.tags);
  if (filters.category) search.set("category", filters.category);
  if (filters.limit) search.set("limit", String(filters.limit));
  const query = search.toString();
  return apiRequest<CardSearchResult[]>(`/api/cards/search${query ? `?${query}` : ""}`);
}

export function createCard(payload: CardPayload, token: string) {
  return apiRequest<PublicCard>("/api/cards", {
    method: "POST",
    body: payload,
    token
  });
}

export function getCard(id: string, token?: string | null) {
  return apiRequest<PublicCard>(`/api/cards/${id}`, {
    token
  });
}

export function getCardByEditorial(editorialId: string, token?: string | null) {
  return apiRequest<PublicCard>(`/api/cards/by-editorial/${editorialId}`, {
    token
  });
}

export function getCardFiches(id: string, token?: string | null) {
  return apiRequest<PublishedFiche[]>(`/api/cards/${id}/fiches`, {
    token
  });
}

export function getEditorialFiches(editorialId: string, token?: string | null) {
  return apiRequest<PublishedFiche[]>(`/api/cards/by-editorial/${editorialId}/fiches`, {
    token
  });
}

export function createContributionProposal(payload: ContributionProposalPayload, token: string) {
  return apiRequest<ContributionProposal>("/api/contributions/proposals", {
    method: "POST",
    body: payload,
    token
  });
}

export function getMyContributionProposals(token: string) {
  return apiRequest<ContributionProposal[]>("/api/contributions/proposals/my", {
    token
  });
}

export function getMyRevisionHistory(token: string) {
  return apiRequest<RevisionHistoryRecord[]>("/api/contributions/revisions/my", {
    token
  });
}

export function getContributionProposal(id: string, token: string) {
  return apiRequest<ContributionProposal>(`/api/contributions/proposals/${id}`, {
    token
  });
}

export function updateContributionProposal(
  id: string,
  payload: Partial<ContributionProposalPayload>,
  token: string
) {
  return apiRequest<ContributionProposal>(`/api/contributions/proposals/${id}`, {
    method: "PUT",
    body: payload,
    token
  });
}

export function reviewContributionProposalWithAi(id: string, token: string) {
  return apiRequest<ContributionProposal>(`/api/contributions/proposals/${id}/ai-review`, {
    method: "POST",
    token
  });
}

export function submitContributionProposal(id: string, token: string) {
  return apiRequest<ContributionProposal>(`/api/contributions/proposals/${id}/submit`, {
    method: "POST",
    token
  });
}

export function getModerationProposals(
  token: string,
  filters: {
    status?: string;
    type?: string;
    city?: string;
    min_score?: number;
    duplicate_risk?: number;
    category?: string;
    contributor?: string;
    date?: string;
  } = {}
) {
  const search = new URLSearchParams();
  if (filters.status) search.set("status", filters.status);
  if (filters.type) search.set("type", filters.type);
  if (filters.city) search.set("city", filters.city);
  if (filters.min_score !== undefined) search.set("min_score", String(filters.min_score));
  if (filters.duplicate_risk !== undefined) search.set("duplicate_risk", String(filters.duplicate_risk));
  if (filters.category) search.set("category", filters.category);
  if (filters.contributor) search.set("contributor", filters.contributor);
  if (filters.date) search.set("date", filters.date);
  const query = search.toString();
  return apiRequest<ContributionProposal[]>(
    `/api/moderation/proposals${query ? `?${query}` : ""}`,
    { token }
  );
}

export function moderateContributionProposal(
  id: string,
  action: "approve" | "reject" | "needs-changes",
  payload: ProposalModerationPayload,
  token: string
) {
  return apiRequest<ContributionProposal>(`/api/moderation/proposals/${id}/${action}`, {
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

export function moderateContribution(
  id: string,
  payload: ModerateContributionPayload,
  token: string
) {
  return apiRequest<ContributionRecord>(`/api/contributions/${id}/moderate`, {
    method: "POST",
    body: payload,
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

export function getUserEditorials(userId: string, token?: string | null) {
  return apiRequest<EditorialCard[]>(`/api/editorial/users/${userId}`, {
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
