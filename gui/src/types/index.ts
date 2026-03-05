export type HardnessLevel = 'easy' | 'medium' | 'hard';
export type DraftCardStatus = 'pending' | 'approved' | 'rejected';

export interface ExampleSentence {
  sentence: string;
  translation: string;
}

export interface Chapter {
  name: string;
  start_page: number;
  end_page: number;
}

export interface PageRange {
  start: number;
  end: number;
}

// Auth
export interface UserOut {
  id: string;
  username: string;
  email: string;
  date_created: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Card
export interface Card {
  id: string;
  front: string;
  back: string;
  example_original?: string | null;
  example_translation?: string | null;
  examples?: ExampleSentence[] | null;
  synonyms?: string[] | null;
  antonyms?: string[] | null;
  part_of_speech?: string | null;
  gender?: string | null;
  plural_form?: string | null;
  pronunciation?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  hardness_level: HardnessLevel;
  date_created: string;
  last_edited: string;
  last_visited?: string | null;
  source_book_id?: string | null;
  source_page?: number | null;
}

export interface CardCreate {
  front: string;
  back: string;
  example_original?: string;
  example_translation?: string;
  examples?: ExampleSentence[];
  synonyms?: string[];
  antonyms?: string[];
  part_of_speech?: string;
  gender?: string;
  plural_form?: string;
  pronunciation?: string;
  notes?: string;
  tags?: string[];
  hardness_level?: HardnessLevel;
}

export type CardUpdate = Partial<CardCreate>;

// Deck
export interface Deck {
  id: string;
  name: string;
  description?: string | null;
  cards: Card[];
}

export interface DeckCreate {
  name: string;
  description?: string;
  card_ids?: string[];
}

export interface DeckUpdate {
  name?: string;
  description?: string;
  card_ids?: string[];
}

// Book
export interface BookResponse {
  id: string;
  title: string;
  filename: string;
  total_pages: number;
  chapters: Chapter[];
  target_language?: string | null;
  native_language?: string | null;
  date_created: string;
  last_edited: string;
}

export interface BookUpdate {
  title?: string;
  target_language?: string;
  native_language?: string;
  chapters?: Chapter[];
}

// Book Progress
export interface BookProgressResponse {
  id: string;
  book_id: string;
  current_page: number;
  current_chapter?: string | null;
  pages_processed: PageRange[];
  chapters_completed: string[];
  date_created: string;
  last_edited: string;
}

export interface BookProgressUpdate {
  current_page?: number;
  current_chapter?: string;
}

// Draft Card
export interface DraftCardResponse {
  id: string;
  front: string;
  back: string;
  examples?: ExampleSentence[] | null;
  synonyms?: string[] | null;
  antonyms?: string[] | null;
  part_of_speech?: string | null;
  gender?: string | null;
  plural_form?: string | null;
  pronunciation?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  status: DraftCardStatus;
  book_id: string;
  source_page_start?: number | null;
  source_page_end?: number | null;
  generation_batch_id?: string | null;
  date_created: string;
}

export interface DraftCardUpdate {
  front?: string;
  back?: string;
  examples?: ExampleSentence[];
  synonyms?: string[];
  antonyms?: string[];
  part_of_speech?: string;
  gender?: string;
  plural_form?: string;
  pronunciation?: string;
  notes?: string;
  tags?: string[];
}

// Generation
export interface GenerateNextBatchRequest {
  book_id: string;
  num_pages?: number;
  num_cards?: number;
}

export interface GenerateFromRangeRequest {
  book_id: string;
  start_page: number;
  end_page: number;
  num_cards?: number;
}

export interface GenerationResponse {
  batch_id: string;
  drafts: DraftCardResponse[];
  pages_processed: PageRange;
  message: string;
}

export interface BulkApproveRequest {
  draft_ids: string[];
  deck_id?: string;
}

export interface SearchResponse {
  results: Card[];
  next_cursor?: string | null;
}

// Storage
export interface StorageQuota {
  used_bytes: number;
  max_bytes: number;
  file_count: number;
  max_files: number;
  subscription_tier: string;
}

export interface StorageConfig {
  storage_type: string | null;
  is_configured: boolean;
  quota: StorageQuota;
}

export interface TelegramStorageConfig {
  bot_token: string;
  user_id: string;
}

export interface GoogleDriveAuthResponse {
  authorization_url: string;
  message: string;
}

