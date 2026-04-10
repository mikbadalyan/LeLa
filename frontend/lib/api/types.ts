export type EditorialType = "place" | "person" | "event";

export type RelationType =
  | "located_at"
  | "created_by"
  | "mentions"
  | "hosts"
  | "related";

export interface Contributor {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  city?: string | null;
}

export interface RelatedEntitySummary {
  id: string;
  type: EditorialType;
  title: string;
  subtitle: string | null;
}

export interface EditorialCard {
  id: string;
  type: EditorialType;
  title: string;
  subtitle: string | null;
  description: string;
  narrative_text: string;
  media_url: string;
  created_at: string;
  contributor: Contributor;
  linked_entity: RelatedEntitySummary | null;
  like_count: number;
  is_liked: boolean;
  metadata: {
    city?: string | null;
    address?: string | null;
    opening_hours?: string | null;
    date?: string | null;
    price?: number | null;
    role?: string | null;
  };
}

export interface EditorialRelation {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: RelationType;
}

export interface EditorialDetail extends EditorialCard {
  related: EditorialCard[];
  relations: EditorialRelation[];
}

export interface FeedResponse {
  items: EditorialCard[];
  next_cursor: string | null;
  total: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  city?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: Contributor;
}

export interface ContributionPayload {
  type: "magazine" | "place" | "person" | "event";
  title: string;
  subtitle?: string;
  description: string;
  city?: string;
  address?: string;
  event_date?: string;
  media_name?: string;
  external_url?: string;
}

export interface ContributionRecord {
  id: string;
  status: "pending";
  created_at: string;
  type: ContributionPayload["type"];
  title: string;
}

export interface ChatRequestPayload {
  message: string;
  history?: ChatHistoryMessage[];
  current_path?: string;
  current_focus?: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRouteSuggestion {
  label: string;
  href: string;
  reason: string;
}

export interface ChatEditorialSuggestion {
  id: string;
  type: EditorialType;
  title: string;
  subtitle?: string | null;
  description: string;
  media_url: string;
  href: string;
}

export interface ChatResponse {
  message: string;
  response_id: string | null;
  suggested_routes: ChatRouteSuggestion[];
  suggested_editorials: ChatEditorialSuggestion[];
  follow_up_questions: string[];
}
