export type EditorialType = "magazine" | "place" | "person" | "event";
export type UserRole = "contributor" | "moderator";
export type ThemePreference = "system" | "light" | "dark";
export type InterfaceLanguage = "fr" | "hy" | "en" | "de";

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
  email?: string | null;
  avatar_url: string;
  city?: string | null;
  bio?: string | null;
  role: UserRole;
  settings?: UserSettings | null;
}

export interface UserSettings {
  interface_language: InterfaceLanguage;
  theme_preference: ThemePreference;
  compact_mode: boolean;
  autoplay_previews: boolean;
  reduce_motion: boolean;
  large_text: boolean;
  high_contrast: boolean;
  sound_effects: boolean;
  data_saver: boolean;
  profile_visibility: "public" | "private";
  show_email: boolean;
  show_city: boolean;
  show_activity_status: boolean;
  searchable_by_email: boolean;
  allow_friend_requests: boolean;
  allow_direct_messages: "everyone" | "friends" | "none";
  allow_tagging: boolean;
  profile_indexing_enabled: boolean;
  two_factor_enabled: boolean;
  login_alerts: boolean;
  security_reminders: boolean;
  marketing_emails: boolean;
  product_updates: boolean;
  weekly_digest: boolean;
  message_notifications: boolean;
  friend_request_notifications: boolean;
  moderation_notifications: boolean;
  last_password_changed_at?: string | null;
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
  media_kind: "image" | "video" | "audio";
  poster_url?: string | null;
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

export interface FeedQueryFilters {
  city?: string | null;
  date?: string | null;
  media?: "all" | "video" | null;
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
  role: UserRole;
}

export interface UserUpdatePayload {
  username?: string;
  email?: string;
  city?: string;
  bio?: string;
}

export interface UserSettingsUpdatePayload {
  interface_language?: InterfaceLanguage;
  theme_preference?: ThemePreference;
  compact_mode?: boolean;
  autoplay_previews?: boolean;
  reduce_motion?: boolean;
  large_text?: boolean;
  high_contrast?: boolean;
  sound_effects?: boolean;
  data_saver?: boolean;
  profile_visibility?: "public" | "private";
  show_email?: boolean;
  show_city?: boolean;
  show_activity_status?: boolean;
  searchable_by_email?: boolean;
  allow_friend_requests?: boolean;
  allow_direct_messages?: "everyone" | "friends" | "none";
  allow_tagging?: boolean;
  profile_indexing_enabled?: boolean;
  two_factor_enabled?: boolean;
  login_alerts?: boolean;
  security_reminders?: boolean;
  marketing_emails?: boolean;
  product_updates?: boolean;
  weekly_digest?: boolean;
  message_notifications?: boolean;
  friend_request_notifications?: boolean;
  moderation_notifications?: boolean;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
}

export interface PasswordChangeResponse {
  message: string;
  last_password_changed_at: string;
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
  neighborhood?: string;
  opening_hours?: string;
  role?: string;
  event_date?: string;
  end_date?: string;
  price?: string;
  media_name?: string;
  media_kind?: "image" | "video" | "audio";
  external_url?: string;
  linked_place_name?: string;
  linked_person_name?: string;
  linked_event_name?: string;
}

export interface ContributionRecord {
  id: string;
  status: "pending" | "approved";
  created_at: string;
  type: ContributionPayload["type"];
  title: string;
}

export interface ModerationContribution {
  id: string;
  status: "pending" | "approved";
  created_at: string;
  type: ContributionPayload["type"];
  title: string;
  subtitle?: string | null;
  description: string;
  media_name?: string | null;
  payload: Record<string, string | null | undefined>;
  submitter: Contributor;
}

export interface FriendRecord extends Contributor {
  friendship_created_at?: string | null;
}

export interface UserSearchResult extends Contributor {
  is_friend: boolean;
}

export interface SharePayload {
  editorial_id: string;
  recipient_id: string;
}

export interface ShareRecord {
  id: string;
  editorial_id: string;
  recipient: Contributor;
  created_at: string;
}

export interface ConversationSummary {
  participant: Contributor;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
  last_message_kind: "text" | "editorial";
}

export interface MessageEditorialAttachment {
  id: string;
  title: string;
  subtitle?: string | null;
  media_url: string;
  media_kind: "image" | "video" | "audio";
  poster_url?: string | null;
  href: string;
}

export interface MessageRecord {
  id: string;
  content?: string | null;
  created_at: string;
  is_mine: boolean;
  sender: Contributor;
  recipient: Contributor;
  editorial?: MessageEditorialAttachment | null;
}

export interface MessagePayload {
  recipient_id: string;
  content: string;
}

export interface MapMarker {
  editorial_id: string;
  type: "place" | "event";
  title: string;
  subtitle?: string | null;
  latitude: number;
  longitude: number;
  href: string;
  city?: string | null;
  date?: string | null;
}

export interface ChatRequestPayload {
  message: string;
  history?: ChatHistoryMessage[];
  conversation_id?: string;
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
  media_kind: "image" | "video" | "audio";
  poster_url?: string | null;
  href: string;
}

export interface ChatResponse {
  message: string;
  response_id: string | null;
  suggested_routes: ChatRouteSuggestion[];
  suggested_editorials: ChatEditorialSuggestion[];
  follow_up_questions: string[];
}

export interface ChatFeedbackPayload {
  conversation_id: string;
  message_id: string;
  rating: number;
  response_text: string;
}

export interface ChatFeedbackResponse {
  id: string;
  conversation_id: string;
  message_id: string;
  rating: number;
}
