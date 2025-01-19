import { Context as TelegrafContext } from 'telegraf';
import { Message, Update } from 'telegraf/types';

export interface Context extends TelegrafContext {
  message: Update.New & {
    text?: string;
  };
  session: SessionData;
}

export interface Note {
  id: number;
  user_id: string;
  title: string | null;
  content: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
}

export interface SessionData {
  currentPage: number;
  searchType?: 'tags' | 'content';
  searchQuery?: string;
  searchResults?: Note[];
  lastSearchType?: 'tags' | 'content';
  lastSearchQuery?: string;
  noteData?: {
    title?: string;
    content?: string;
    tags?: string[];
  };
}

export interface BotConfig {
  botToken: string;
  supabase: {
    url: string;
    key: string;
  };
  webhook: {
    url: string;
    port: number;
  };
  defaultSettings: {
    notesPerPage: number;
    maxTitleLength: number;
    maxContentLength: number;
    maxTags: number;
  };
}