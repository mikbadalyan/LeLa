export type EditorialType = "magazine" | "place" | "person" | "event";
export type UserRole = "contributor" | "moderator";
export type ThemePreference = "system" | "light" | "dark";
export type InterfaceLanguage = "fr" | "hy" | "en" | "de";
export type ContributionMediaKind = "image" | "video" | "audio";
export type ContributionPrimaryKind = ContributionMediaKind | "text";
export type ComposerContributionType = "multi_media" | "single_media" | "event";
export type ContributionType =
  | ComposerContributionType
  | "magazine"
  | "place"
  | "person";
export type ContributionStatus =
  | "draft"
  | "pending"
  | "approved"
  | "changes_requested"
  | "rejected";
export type ContributionModerationAction =
  | "approved"
  | "changes_requested"
  | "rejected";
export type ContributionFicheType = "lieu" | "personne" | "evenement" | "autre";
export type ContributionFicheStatus =
  | "draft"
  | "submitted"
  | "ai_reviewed"
  | "pending_moderation"
  | "approved"
  | "rejected"
  | "needs_changes";
export type CardCategoryMetadata = "lieu" | "personne" | "evenement" | "objet" | "theme" | "autre";
export type PublishedEntityStatus = "draft" | "pending" | "published" | "rejected" | "archived";
export type ContributionProposalType =
  | "create_card"
  | "create_fiche"
  | "update_card"
  | "update_fiche"
  | "correction";
export type ContributionProposalStatus =
  | "draft"
  | "ai_reviewed"
  | "pending_moderation"
  | "approved"
  | "rejected"
  | "needs_changes";

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

export interface ContributionMediaItem {
  kind: ContributionMediaKind;
  name: string;
}

export interface ContributionStoredPayload {
  city?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  opening_hours?: string | null;
  role?: string | null;
  event_date?: string | null;
  end_date?: string | null;
  price?: string | null;
  external_url?: string | null;
  linked_place_name?: string | null;
  linked_person_name?: string | null;
  linked_event_name?: string | null;
  primary_media_kind?: ContributionPrimaryKind | null;
  media_items?: ContributionMediaItem[];
  text_content?: string | null;
  legacy_media_kind?: "image" | "video" | "audio" | null;
}

export interface ContributionPayload {
  type: ComposerContributionType;
  title: string;
  subtitle?: string;
  description: string;
  city?: string;
  address?: string;
  event_date?: string;
  end_date?: string;
  price?: string;
  external_url?: string;
  linked_place_name?: string;
  linked_person_name?: string;
  linked_event_name?: string;
  primary_media_kind?: ContributionPrimaryKind;
  media_items: ContributionMediaItem[];
  text_content?: string;
}

export interface ContributionRecord {
  id: string;
  status: ContributionStatus;
  created_at: string;
  type: ContributionType;
  title: string;
  moderation_note?: string | null;
  reviewed_at?: string | null;
}

export interface ModerationHistoryEvent {
  id: string;
  action: ContributionModerationAction;
  note?: string | null;
  created_at: string;
  moderator: Contributor;
}

export interface ModerationContribution {
  id: string;
  status: ContributionStatus;
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
  type: ContributionType;
  title: string;
  subtitle?: string | null;
  description: string;
  media_name?: string | null;
  media_url?: string | null;
  payload: ContributionStoredPayload;
  submitter: Contributor;
  moderation_note?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: Contributor | null;
  history: ModerationHistoryEvent[];
}

export interface ModerateContributionPayload {
  action: ContributionModerationAction;
  note?: string;
}

export interface FicheMediaBlock {
  kind: "image" | "video" | "audio" | "text";
  name?: string | null;
  url?: string | null;
  text?: string | null;
  caption?: string | null;
}

export interface FicheAiEvaluation {
  global_score: number;
  grammar_score: number;
  clarity_score: number;
  completeness_score: number;
  editorial_value_score: number;
  relevance_score: number;
  duplicate_risk_score: number;
  source_quality_score: number;
  risk_score: number;
  content_type_recommendation: "new_card" | "existing_card_fiche" | "correction" | "manual_review";
  summary: string;
  strengths: string[];
  weaknesses: string[];
  grammar_suggestions: string[];
  content_suggestions: string[];
  missing_information: string[];
  duplicate_warnings: string[];
  suggested_existing_cards: string[];
  moderator_recommendation: "approve" | "needs_changes" | "reject" | "manual_review";
}

export interface ContributionFichePayload {
  type: ContributionFicheType;
  title: string;
  short_description: string;
  long_description: string;
  city?: string | null;
  location?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  tags: string[];
  historical_context?: string | null;
  media_blocks: FicheMediaBlock[];
  source_reference?: string | null;
}

export interface ContributionFiche extends ContributionFichePayload {
  id: string;
  status: ContributionFicheStatus;
  author: Contributor;
  moderator_notes?: string | null;
  ai_evaluation_result?: FicheAiEvaluation | null;
  editorial_object_id?: string | null;
  reviewed_by?: Contributor | null;
  reviewed_at?: string | null;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FicheModerationPayload {
  moderator_notes?: string | null;
}

export interface CardPayload {
  title: string;
  short_description: string;
  category_metadata: CardCategoryMetadata;
  city?: string | null;
  location?: string | null;
  main_image?: string | null;
  tags: string[];
  relations: Array<Record<string, unknown>>;
  why_exists?: string | null;
  source_reference?: string | null;
}

export interface PublicCard extends CardPayload {
  id: string;
  slug: string;
  status: PublishedEntityStatus;
  created_by: string;
  editorial_object_id?: string | null;
  current_published_version_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardSearchResult {
  id: string;
  title: string;
  short_description: string;
  city?: string | null;
  image?: string | null;
  status: string;
  category_metadata?: string | null;
  tags: string[];
  source: "card" | "editorial";
}

export interface PublishedFiche {
  id: string;
  card_id: string;
  title: string;
  sections: Record<string, unknown>;
  media_blocks: FicheMediaBlock[];
  sources: Array<Record<string, unknown>>;
  relations: Array<Record<string, unknown>>;
  tags: string[];
  status: PublishedEntityStatus;
  created_by: string;
  current_published_version_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContributionProposalPayload {
  contribution_type: ContributionProposalType;
  target_card_id?: string | null;
  target_fiche_id?: string | null;
  proposed_data: Record<string, unknown>;
  previous_data_snapshot?: Record<string, unknown> | null;
  explanation?: string | null;
}

export interface ContributionProposal extends ContributionProposalPayload {
  id: string;
  contributor: Contributor;
  ai_review?: FicheAiEvaluation | null;
  status: ContributionProposalStatus;
  moderator?: Contributor | null;
  moderator_notes?: string | null;
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  target_card?: PublicCard | null;
  target_fiche?: PublishedFiche | null;
}

export interface ProposalModerationPayload {
  moderator_notes?: string | null;
}

export interface RevisionHistoryRecord {
  id: string;
  entity_type: "card" | "fiche";
  entity_id: string;
  version_number: number;
  data_snapshot: Record<string, unknown>;
  contributor_id?: string | null;
  approved_by?: string | null;
  created_at: string;
}

export interface FriendRecord extends Contributor {
  friendship_created_at?: string | null;
}

export interface FriendGraphNode extends Contributor {
  depth: number;
  is_self: boolean;
  is_direct_friend: boolean;
  mutual_count: number;
  connection_count: number;
  path_parent_id?: string | null;
}

export interface FriendGraphEdge {
  source_id: string;
  target_id: string;
  weight: number;
}

export interface FriendGraph {
  nodes: FriendGraphNode[];
  edges: FriendGraphEdge[];
  total_nodes: number;
  truncated: boolean;
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
  mode: "assistant" | "fallback";
  availability_message?: string | null;
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
